import { spawn, ChildProcess, execSync, exec } from 'child_process'
import { EventEmitter } from 'events'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import https from 'https'
import tls from 'tls'
import { IRAN_IP_CIDRS } from './iran-ips'

export interface VpnProfile {
    id: string
    name: string
    serverAddress: string
    protocol: 'openconnect' | 'sstp' | 'softether'
    port: number
    username: string
    password: string
    authType: 'password' | 'certificate' | 'both'
    certificatePath?: string
    caCertificatePath?: string
    skipCertificateVerification: boolean
    disableDtls: boolean
    mtu?: number
    dtlsCiphers?: string
    preferWintun: boolean
    bypassIranRoutes?: boolean  // Route Iranian IPs directly (bypass VPN tunnel)
    bypassPrivateIps?: boolean
    bypassDomains?: string[]
    bypassIps?: string[]
}

export interface VpnStats {
    uploadSpeed: number
    downloadSpeed: number
    totalUploaded: number
    totalDownloaded: number
    connectedTime: number
    privateIp: string
    publicIp: string
    transportProtocol?: 'TCP' | 'UDP/DTLS'
    countryCode?: string
    countryName?: string
    vpnGateway?: string
}

export interface VpnConnectionResult {
    success: boolean
    error?: string
}

type VpnStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error'

export class VpnService extends EventEmitter {
    private vpnProcess: ChildProcess | null = null
    private status: VpnStatus = 'disconnected'
    private currentProfile: VpnProfile | null = null
    private stats: VpnStats = this.createEmptyStats()
    private statsInterval: NodeJS.Timeout | null = null
    private lastBytesReceived: number = 0
    private lastBytesSent: number = 0
    private lastStatsTime: number = 0
    private vpnInterfaceName: string = ''
    private vpnGateway: string = ''
    private originalGateway: string = ''
    private serverIp: string = ''
    private routesConfigured: boolean = false
    private vpnMtu: number = 1200 // Default fallback - safe for DTLS
    private lastServerFingerprint: string = ''
    private lastServerFingerprintRetried: boolean = false
    private excludeRoutes: { network: string, mask: string }[] = []
    private includeRoutes: { network: string, mask: string }[] = []
    private originalIfIndex: number | null = null
    private vpnInterfaceIndex: number | null = null  // Parsed from OpenConnect stdout for instant routing
    private connectTime: number = 0  // Time when connection was established

    constructor() {
        super()
    }

    /**
     * Convert CIDR notation (e.g., "5.52.0.0/16") to network and mask.
     * Used to add Iran IP exclusion routes.
     */
    private cidrToNetworkMask(cidr: string): { network: string, mask: string } | null {
        const parts = cidr.split('/')
        if (parts.length !== 2) return null
        const network = parts[0]
        const prefix = parseInt(parts[1], 10)
        if (isNaN(prefix) || prefix < 0 || prefix > 32) return null

        // Convert prefix length to subnet mask
        const maskNum = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
        const mask = [
            (maskNum >>> 24) & 255,
            (maskNum >>> 16) & 255,
            (maskNum >>> 8) & 255,
            maskNum & 255
        ].join('.')

        return { network, mask }
    }

    private createEmptyStats(): VpnStats {
        return {
            uploadSpeed: 0,
            downloadSpeed: 0,
            totalUploaded: 0,
            totalDownloaded: 0,
            connectedTime: 0,
            privateIp: '',
            publicIp: '',
            transportProtocol: 'TCP'
        }
    }

    getStatus(): VpnStatus {
        return this.status
    }

    getStats(): VpnStats {
        return { ...this.stats }
    }

    getCurrentProfile(): VpnProfile | null {
        return this.currentProfile
    }

    private emitStateChange() {
        this.emit('stateChanged', {
            status: this.status,
            profile: this.currentProfile,
            stats: this.stats
        })
    }

    private log(level: 'info' | 'warning' | 'error' | 'debug', message: string) {
        this.emit('log', { level, message, timestamp: Date.now() })
        console.log(`[VPN ${level.toUpperCase()}] ${message}`)
    }

    private getOpenConnectPath(): string {
        // Check for bundled OpenConnect first
        const bundledPath = app.isPackaged
            ? path.join(process.resourcesPath, 'openconnect', 'openconnect.exe')
            : path.join(__dirname, '..', 'resources', 'openconnect', 'openconnect.exe')

        this.log('debug', `Looking for OpenConnect at: ${bundledPath}`)

        if (fs.existsSync(bundledPath)) {
            this.log('info', `Found OpenConnect at: ${bundledPath}`)

            // If running from UNC path (like \\tsclient), copy to local folder
            if (bundledPath.startsWith('\\\\')) {
                const localDir = path.join(app.getPath('userData'), 'openconnect')
                const localExe = path.join(localDir, 'openconnect.exe')
                const bundledDir = path.dirname(bundledPath)

                try {
                    // Create local directory
                    if (!fs.existsSync(localDir)) {
                        fs.mkdirSync(localDir, { recursive: true })
                    }

                    // Copy ALL files from bundled openconnect directory (exe + all DLLs)
                    const files = fs.readdirSync(bundledDir)
                    for (const file of files) {
                        const srcFile = path.join(bundledDir, file)
                        const dstFile = path.join(localDir, file)

                        // Skip directories and non-essential files
                        if (fs.statSync(srcFile).isDirectory()) continue
                        if (file.endsWith('.md')) continue // Skip readme

                        // Copy if not exists or newer
                        if (!fs.existsSync(dstFile) || fs.statSync(srcFile).mtime > fs.statSync(dstFile).mtime) {
                            fs.copyFileSync(srcFile, dstFile)
                            this.log('info', `Copied ${file} to local`)
                        }
                    }

                    // Return local path
                    return localExe
                } catch (err) {
                    this.log('error', `Failed to copy OpenConnect to local: ${err}`)
                }
            }

            return bundledPath
        }

        // Check common installation paths
        const commonPaths = [
            'C:\\Program Files\\OpenConnect\\openconnect.exe',
            'C:\\Program Files (x86)\\OpenConnect\\openconnect.exe',
            path.join(os.homedir(), 'AppData', 'Local', 'OpenConnect', 'openconnect.exe'),
        ]

        for (const p of commonPaths) {
            if (fs.existsSync(p)) {
                return p
            }
        }

        // Try to find in PATH
        try {
            const result = execSync('where openconnect', { encoding: 'utf8' })
            const firstPath = result.trim().split('\n')[0]
            if (firstPath && fs.existsSync(firstPath)) {
                return firstPath
            }
        } catch {
            // Not in PATH
        }

        throw new Error('OpenConnect executable not found. Please install OpenConnect for Windows or place openconnect.exe in the resources folder.')
    }

    private getVpncScriptPath(): string {
        const userDataPath = app.getPath('userData')
        // Use .js instead of .bat to avoid spawning errors with spaces
        // OpenConnect for Windows can execute JScript if named properly
        const jsFileName = 'vpnc-script-win.js'
        const jsPath = path.join(userDataPath, jsFileName)

        try {
            // Create a DUMMY JScript that does NOTHING.
            // format: WScript.Quit(0);
            const jsContent = 'WScript.Quit(0);'
            fs.writeFileSync(jsPath, jsContent)
            this.log('info', `Created dummy script wrapper: ${jsPath}`)
            return jsPath
        } catch (err) {
            this.log('error', `Failed to create dummy script: ${err}`)
            return jsPath
        }
    }

    private async manualNetshConfig(ip: string, mask: string, dns: string, mtu: string, interfaceName: string): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                this.log('info', `Manual Config Starting for interface "${interfaceName}"...`)

                // Use a sequence of netsh commands
                // 1. Set IP and Mask
                const setIpCmd = `netsh interface ipv4 set address name="${interfaceName}" static ${ip} ${mask} store=active`

                // 2. Set DNS (if provided)
                const setDnsCmd = dns ? `netsh interface ipv4 set dnsservers name="${interfaceName}" static ${dns} validate=no` : null

                // 3. Set MTU (if provided)
                const setMtuCmd = mtu ? `netsh interface ipv4 set subinterface "${interfaceName}" mtu=${mtu} store=active` : null

                this.log('debug', `Running: ${setIpCmd}`)

                // We use execSync for blocking execution of network commands
                try {
                    execSync(setIpCmd, { stdio: 'ignore' })
                    if (setDnsCmd) {
                        this.log('debug', `Running: ${setDnsCmd}`)
                        execSync(setDnsCmd, { stdio: 'ignore' })
                    }
                    if (setMtuCmd) {
                        this.log('debug', `Running: ${setMtuCmd}`)
                        execSync(setMtuCmd, { stdio: 'ignore' })
                    }

                    this.log('info', 'Manual interface configuration completed successfully')
                    resolve(true)
                } catch (err) {
                    this.log('error', `Netsh command failed: ${err}`)
                    resolve(false)
                }
            } catch (err) {
                this.log('error', `Manual config exception: ${err}`)
                resolve(false)
            }
        })
    }

    private checkTapDriver(): boolean {
        try {
            // Check if TAP-Windows adapter exists
            const output = execSync('netsh interface show interface', { encoding: 'utf8' })
            return output.toLowerCase().includes('tap') || output.toLowerCase().includes('tun') || output.toLowerCase().includes('securevpn')
        } catch {
            return false
        }
    }

    private getServerCertFingerprint(host: string, port: number): Promise<string | null> {
        // Delegate directly to OpenConnect to probe the exact fingerprint OpenConnect expects.
        // Node.js TLS getPeerCertificate returns the full X.509 DER hash which does NOT match
        // OpenConnect's GnuTLS pin-sha256 (which hashes the Subject Public Key Info SPKI).
        return this.probeWithOpenConnect(host, port)
    }

    private probeWithOpenConnect(host: string, port: number): Promise<string | null> {
        return new Promise((resolve) => {
            try {
                const openconnectPath = this.getOpenConnectPath()
                const args = [
                    '--protocol=anyconnect',
                    `--server=${host}:${port}`,
                    '--authenticate',
                    '--non-inter'  // Non-interactive - fails fast showing cert info
                ]

                this.log('info', `Probing fingerprint with OpenConnect...`)

                const proc = spawn(openconnectPath, args, {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    windowsHide: true
                })

                let output = ''
                proc.stdout?.on('data', (d) => output += d.toString())
                proc.stderr?.on('data', (d) => output += d.toString())

                // Send empty password to make it fail quickly if prompted
                setTimeout(() => {
                    try {
                        proc.stdin?.write('\n')
                        proc.stdin?.end()
                    } catch { }
                }, 300)

                proc.on('exit', () => {
                    // Extract fingerprint from output - try multiple patterns
                    // OpenConnect outputs: "--servercert pin-sha256:XXXX" or "server's certificate: pin-sha256:XXXX"
                    const match = output.match(/--servercert\s+(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                        output.match(/server's certificate:\s*(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                        output.match(/SHA256\s+fingerprint[:\s]*(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                        output.match(/(pin-sha256:[A-Za-z0-9+/=]+)/i)  // Last resort - find any pin-sha256
                    if (match) {
                        this.log('info', `Probed fingerprint: ${match[1]}`)
                        resolve(match[1])
                    } else {
                        this.log('info', 'Server certificate is trusted or no fingerprint needed')
                        resolve(null)
                    }
                })

                // Timeout after 6 seconds
                setTimeout(() => {
                    try { proc.kill() } catch { }
                    resolve(null)
                }, 6000)
            } catch (err) {
                this.log('warning', `Fingerprint probe error: ${err}`)
                resolve(null)
            }
        })
    }


    async connect(profile: VpnProfile): Promise<VpnConnectionResult> {
        if (this.status === 'connected' || this.status === 'connecting') {
            return { success: false, error: 'Already connected or connecting' }
        }

        // Reset fingerprint for new connection - each server may have different cert
        this.lastServerFingerprint = ''
        this.lastServerFingerprintRetried = false // Allow retry for new connection

        this.currentProfile = profile
        this.status = 'connecting'
        this.emitStateChange()

        // Clean up any stale routes from previous connections to prevent routing conflicts
        if (this.routesConfigured || this.excludeRoutes.length > 0 || this.includeRoutes.length > 0) {
            this.log('info', 'Cleaning up stale routes from previous connection...')
            await this.removeRoutes()
        }

        // Reset interface index - will be populated from OpenConnect stdout
        this.vpnInterfaceIndex = null
        this.excludeRoutes = []
        this.includeRoutes = []

        // Set MTU from profile (or default to 1200 for DTLS stability)
        this.vpnMtu = profile.mtu || 1200

        try {
            // Save original gateway BEFORE connection
            this.originalGateway = this.getOriginalGateway()
            if (!this.originalGateway) {
                this.log('warning', 'Could not determine original gateway - routing may fail')
            }

            // Resolve server IP (for routing exclusion)
            this.serverIp = await this.resolveServerIp(profile.serverAddress)
            this.log('info', `Server IP: ${this.serverIp}`)

            // Validate prerequisites
            const openconnectPath = this.getOpenConnectPath()
            this.log('info', `Using OpenConnect at: ${openconnectPath}`)

            if (!this.checkTapDriver()) {
                this.log('warning', 'TAP driver not detected. Connection may fail.')
            }

            // Pre-fetch server fingerprint for skip cert verification
            // Pre-fetch server fingerprint for skip cert verification if needed
            if (profile.skipCertificateVerification && !this.lastServerFingerprint) {
                this.log('info', 'Skip cert: probing server fingerprint with OpenConnect...')
                const fingerprint = await this.getServerCertFingerprint(
                    profile.serverAddress,
                    profile.port
                )
                if (fingerprint) {
                    this.lastServerFingerprint = fingerprint
                    this.log('info', `Pre-fetched fingerprint: ${fingerprint}`)
                } else {
                    this.log('info', 'Server certificate is trusted or no pre-fetch fingerprint needed')
                }
            }

            // Build command arguments
            const args = this.buildOpenConnectArgs(profile)
            this.log('info', `Connecting to ${profile.serverAddress}:${profile.port}...`)

            return await this.spawnOpenConnect(openconnectPath, args, profile)
        } catch (error) {
            this.status = 'error'
            this.emitStateChange()
            const errorMsg = error instanceof Error ? error.message : String(error)
            this.log('error', `Connection failed: ${errorMsg}`)
            return { success: false, error: errorMsg }
        }
    }

    private buildOpenConnectArgs(profile: VpnProfile): string[] {
        const args: string[] = []

        // Protocol
        args.push('--protocol=anyconnect')

        // Server
        args.push(`--server=${profile.serverAddress}:${profile.port}`)

        // Username
        if (profile.username) {
            args.push(`--user=${profile.username}`)
        }

        // Certificate options
        if (profile.skipCertificateVerification) {
            // --no-cert-check was removed from modern OpenConnect
            // Use fingerprint-based retry approach:
            // 1. First attempt: if we have probed/cached fingerprint, use it
            // 2. On cert failure, OpenConnect outputs the server's fingerprint
            // 3. We capture that and retry with --servercert=<fingerprint>
            if (this.lastServerFingerprint) {
                args.push(`--servercert=${this.lastServerFingerprint}`)
                this.log('info', `Skip cert: using fingerprint: ${this.lastServerFingerprint}`)
            } else {
                this.log('info', 'Skip cert: first attempt, will retry with fingerprint if needed')
            }
        }

        if (profile.caCertificatePath) {
            args.push(`--cafile=${profile.caCertificatePath}`)
        }

        if (profile.certificatePath) {
            args.push(`--certificate=${profile.certificatePath}`)
        }

        // Script for routing - using a dummy script to avoid OpenConnect errors
        // We handle actual configuration manually in TypeScript
        const scriptPath = this.getVpncScriptPath()
        args.push('--script', scriptPath)

        // Force a fixed interface name - RAHAVPN adapter is created during install
        args.push('--interface=RAHAVPN')

        // DTLS
        if (profile.disableDtls) {
            args.push('--no-dtls')
        } else {
            // Force safe MTU for DTLS to prevent packet drops
            args.push(`--base-mtu=${profile.mtu || 1200}`)
        }


        if (profile.dtlsCiphers) {
            args.push(`--dtls-ciphers=${profile.dtlsCiphers}`)
        }

        // Password via stdin
        args.push('--passwd-on-stdin')

        // Verbose for debugging
        args.push('-v')

        return args
    }

    private spawnOpenConnect(execPath: string, args: string[], profile: VpnProfile): Promise<VpnConnectionResult> {
        return new Promise((resolve) => {
            this.log('debug', `Spawning: ${execPath} ${args.join(' ')}`)

            this.vpnProcess = spawn(execPath, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true,
                shell: false, // Avoid CMD.exe parsing issues with UNC paths and spaces
                cwd: 'C:\\Windows\\System32' // Use local path as fallback
            })

            let outputBuffer = ''
            let errorBuffer = ''
            let connectionEstablished = false
            let resolved = false

            // Track connection parameters for manual configuration
            let vpnIp = ''
            let vpnNetmask = ''
            let vpnDns = ''
            let vpnMtu = ''
            let activeInterface = 'RAHAVPN' // Default - persistent adapter

            const resolveOnce = (result: VpnConnectionResult) => {
                if (!resolved) {
                    resolved = true
                    resolve(result)
                }
            }

            // Send password when prompted
            if (this.vpnProcess.stdin && profile.password) {
                // OpenConnect may prompt for password, send it
                // We send it slightly earlier to catch the prompt reliably
                setTimeout(() => {
                    if (this.vpnProcess?.stdin) {
                        this.vpnProcess.stdin.write(profile.password + '\r\n')
                    }
                }, 300)
            }

            this.vpnProcess.stdout?.on('data', (data: Buffer) => {
                const text = data.toString()
                outputBuffer += text
                // Aggressive filtering of OpenConnect stdout to prevent log spam and UI freeze
                // Only log truly important messages
                const trimmedText = text.trim()
                const shouldLog = trimmedText.length > 0 &&
                    !trimmedText.includes('X-CSTP-Split-') &&  // Hundreds of route lines
                    !trimmedText.includes('X-DTLS-') &&        // DTLS config noise
                    !trimmedText.includes('Set-Cookie') &&     // Cookie spam
                    !trimmedText.includes('HTTP body length') &&
                    !trimmedText.includes('Content-Type') &&
                    !trimmedText.includes('Content-Length') &&
                    !trimmedText.includes('X-Transcend-Version') &&
                    !trimmedText.includes('Connection: Keep-Alive') &&
                    !trimmedText.includes('SO_SNDBUF') &&
                    !trimmedText.includes('POST https://') &&  // HTTP request lines
                    !trimmedText.includes('Got HTTP response:') // HTTP response headers

                if (shouldLog) {
                    this.log('info', `[OC] ${trimmedText}`)
                }

                // Parse connection info - tighten check to avoid matching "Connected to IP:PORT"
                // Valid success indicators: "DTLS connection established", "CSTP connected", "Session established"
                // "Connected as 192..."
                if (text.includes('CSTP connected') ||
                    text.includes('Established DTLS') ||
                    text.includes('Session established') ||
                    text.includes('Connected as')) {
                    connectionEstablished = true
                    this.log('info', 'Tunnel basic connection established, waiting for gateway/config...')
                }

                // Extract assigned IP - more patterns for OpenConnect output
                const ipMatch = text.match(/Got IP address ([\d.]+)/i) ||
                    text.match(/Internal IP: ([\d.]+)/i) ||
                    text.match(/IPv4 address: ([\d.]+)/i) ||
                    text.match(/X-CSTP-Address: ([\d.]+)/i) ||
                    text.match(/Configured as ([\d.]+)/i)
                if (ipMatch) {
                    this.stats.privateIp = ipMatch[1]
                    this.log('info', `Assigned VPN IP detected: ${this.stats.privateIp}`)
                }

                // Extract VPN gateway - more patterns for OpenConnect output
                const gwMatch = text.match(/Gateway: ([\d.]+)/i) ||
                    text.match(/Next hop: ([\d.]+)/i) ||
                    text.match(/Route gateway: ([\d.]+)/i) ||
                    text.match(/netmask \d+\.\d+\.\d+\.\d+.*gw ([\d.]+)/i) ||
                    text.match(/INTERNAL_IP4_DNS1:([\d.]+)/i)
                if (gwMatch) {
                    this.vpnGateway = gwMatch[1]
                    this.log('info', `VPN Gateway detected: ${this.vpnGateway}`)
                }

                // Extract server MTU and use MIN of profile MTU and server MTU
                // This prevents oversized packet drops when profile MTU > server MTU
                // Patterns: "X-CSTP-MTU: 1426", "max=1426)", "was 1426)"
                const mtuMatch = text.match(/X-CSTP-MTU:\s*(\d+)/i) ||
                    text.match(/max=(\d+)\)/i) ||
                    text.match(/was\s*(\d+)\)/i)
                if (mtuMatch) {
                    const serverMtu = parseInt(mtuMatch[1])
                    if (serverMtu > 0 && serverMtu < this.vpnMtu) {
                        // Use server's lower MTU to prevent packet drops
                        const profileMtu = this.vpnMtu
                        this.vpnMtu = serverMtu
                        this.log('info', `MTU: profile=${profileMtu}, server=${serverMtu} → using ${this.vpnMtu}`)
                    }
                }

                // DTLS Detection - just log, don't override profile MTU
                // MTU is already set from profile.mtu in connect() and passed via --base-mtu
                if (text.includes('Established DTLS')) {
                    this.stats.transportProtocol = 'UDP/DTLS'
                    this.log('info', `DTLS connection confirmed. Using MTU ${this.vpnMtu}`)
                }

                // Extract Netmask
                const maskMatch = text.match(/Netmask: ([\d.]+)/i) || text.match(/X-CSTP-Netmask: ([\d.]+)/i)
                if (maskMatch) {
                    this.log('info', `VPN Netmask detected: ${maskMatch[1]}`)
                }

                // Extract Split Routes (Include/Exclude)
                // Format: X-CSTP-Split-Exclude: 217.171.145.0/255.255.255.0
                const splitExcludeMatch = text.match(/X-CSTP-Split-Exclude:\s*([\d.]+)\/([\d.]+)/i)
                if (splitExcludeMatch) {
                    this.excludeRoutes.push({ network: splitExcludeMatch[1], mask: splitExcludeMatch[2] })
                    // Excessive logging here freezes the UI with hundreds of routes
                    // this.log('debug', `Parsed exclusion route: ${splitExcludeMatch[1]}/${splitExcludeMatch[2]}`)
                }
                const splitIncludeMatch = text.match(/X-CSTP-Split-Include:\s*([\d.]+)\/([\d.]+)/i)
                if (splitIncludeMatch) {
                    this.includeRoutes.push({ network: splitIncludeMatch[1], mask: splitIncludeMatch[2] })
                    // Excessive logging here freezes the UI
                    // this.log('debug', `Parsed inclusion route: ${splitIncludeMatch[1]}/${splitIncludeMatch[2]}`)
                }

                // If we have BOTH base connection AND gateway (or IP), resolve!
                if (connectionEstablished && (this.vpnGateway || this.stats.privateIp)) {
                    if (!resolved) {
                        this.log('info', 'VPN connection and gateway confirmed.')
                        // DON'T set status to 'connected' yet - wait for routing to complete!
                        // The tunnel isn't usable until routing is configured
                        this.stats.connectedTime = Date.now()

                        // Update protocol display if DTLS was established
                        if (outputBuffer.includes('Established DTLS') || text.includes('Established DTLS')) {
                            this.stats.transportProtocol = 'UDP/DTLS'
                        } else {
                            this.stats.transportProtocol = 'TCP'
                        }

                        this.startStatsMonitoring()
                        // configureRoutingAndFetchInfo will set status to 'connected' when done
                        this.configureRoutingAndFetchInfo()
                        this.emitStateChange()
                        resolveOnce({ success: true })
                    }
                }

                // Also update protocol if DTLS established later (common)
                if (text.includes('Established DTLS')) {
                    this.stats.transportProtocol = 'UDP/DTLS'
                    this.emitStateChange()
                }

                // Extract interface name - more patterns
                const ifMatch = text.match(/Using ([\w]+) as default route/i) ||
                    text.match(/Interface: ([\w]+)/i) ||
                    text.match(/TUNDEV=([\w]+)/i) ||
                    text.match(/Using TAP adapter '([^']+)'/i)
                if (ifMatch) {
                    this.vpnInterfaceName = ifMatch[1]
                    this.log('info', `VPN Interface: ${this.vpnInterfaceName}`)
                }

                // OPTIMIZATION: Extract Wintun interface index directly from OpenConnect's log
                // This eliminates the 14s polling delay! 
                // Pattern: "Using Wintun device 'RAHAVPN', index 70" or similar
                // Fixed regex patterns to properly handle single quotes in OpenConnect output
                const wintunIndexMatch = text.match(/Using Wintun device\s+['"]?RAHAVPN['"]?,?\s*index\s+(\d+)/i) ||
                    text.match(/Wintun device[^,]*RAHAVPN[^,]*,?\s*index\s+(\d+)/i) ||
                    text.match(/Using Wintun.*index\s+(\d+)/i)
                if (wintunIndexMatch && !this.vpnInterfaceIndex) {
                    this.vpnInterfaceIndex = parseInt(wintunIndexMatch[1], 10)
                    this.vpnInterfaceName = 'RAHAVPN'
                    this.log('info', `*** Wintun interface detected from stdout: IF ${this.vpnInterfaceIndex} ***`)
                }
            })

            this.vpnProcess.stderr?.on('data', (data: Buffer) => {
                const text = data.toString()
                errorBuffer += text
                // Log all stderr output as 'info' for visibility in UI
                this.log('info', `[OC] ${text.trim()}`)

                // Extract server certificate fingerprint for retry
                // Multiple patterns OpenConnect might output:
                // "server's certificate: pin-sha256:XXXX="
                // "SHA256 fingerprint: XXXX"
                // "servercert pin-sha256:XXXX"
                const fingerprintMatch = text.match(/server's certificate:\s*(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                    text.match(/--servercert\s+(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                    text.match(/servercert\s+(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                    text.match(/(pin-sha256:[A-Za-z0-9+/=]+)/i)
                if (fingerprintMatch) {
                    if (this.lastServerFingerprint !== fingerprintMatch[1]) {
                        this.lastServerFingerprint = fingerprintMatch[1]
                        this.log('info', `Fingerprint captured: ${this.lastServerFingerprint}`)
                    }
                }

                // OpenConnect outputs progress to stderr
                if (text.includes('CSTP connected') ||
                    text.includes('Established DTLS') ||
                    text.includes('Session established') ||
                    text.includes('Connected as')) {
                    connectionEstablished = true

                    if (!resolved) {
                        this.status = 'connected'
                        this.stats.connectedTime = Date.now()
                        this.startStatsMonitoring()
                        this.configureRoutingAndFetchInfo()
                        this.emitStateChange()
                        resolveOnce({ success: true })
                    }
                }

                // Check for authentication success
                if (text.includes('Got CONNECT response: 200')) {
                    this.log('info', 'Authentication successful')
                }

                // Extract IP from stderr too
                const ipMatch = text.match(/Got IP address ([\d.]+)/i) ||
                    text.match(/Internal IP: ([\d.]+)/i)
                if (ipMatch) {
                    this.stats.privateIp = ipMatch[1]
                }

                if (text.includes('Established DTLS') || text.includes('ESP session established') || text.includes('UDP session established')) {
                    this.stats.transportProtocol = 'UDP/DTLS'
                    this.log('info', 'Real DTLS Activation: UDP Tunnel Established')
                    this.emitStateChange()
                }

                // CRITICAL FIX: OpenConnect outputs Wintun device info to STDERR, not stdout!
                // Pattern: "Using Wintun device 'RAHAVPN', index 70"
                const wintunStderrMatch = text.match(/Using Wintun device\s+['"]?RAHAVPN['"]?,?\s*index\s+(\d+)/i) ||
                    text.match(/Wintun device[^,]*RAHAVPN[^,]*,?\s*index\s+(\d+)/i) ||
                    text.match(/Using Wintun.*index\s+(\d+)/i)
                if (wintunStderrMatch && !this.vpnInterfaceIndex) {
                    this.vpnInterfaceIndex = parseInt(wintunStderrMatch[1], 10)
                    this.vpnInterfaceName = 'RAHAVPN'
                    this.log('info', `*** Wintun interface detected from stderr: IF ${this.vpnInterfaceIndex} ***`)
                }
            })

            this.vpnProcess.on('error', (error) => {
                this.log('error', `Process error: ${error.message}`)
                this.status = 'error'
                this.emitStateChange()
                resolveOnce({ success: false, error: error.message })
            })

            this.vpnProcess.on('exit', async (code) => {
                this.log('info', `OpenConnect exited with code: ${code}`)

                // If process exits, it's a disconnect or failure.
                // If we were already connected (resolved=true), it's a disconnect.
                // If we were connecting (resolved=false), it's a failure (regardless of code, as we expect daemon-like behavior).

                if (connectionEstablished && resolved) {
                    this.status = 'disconnected'
                    this.emitStateChange()
                    // We don't need to resolve, it's already resolved.
                } else if (!resolved) {
                    // Check if we should retry with fingerprint (certificate errors)
                    const hasCertError = errorBuffer.includes('certificate') ||
                        errorBuffer.includes('verify failed') ||
                        errorBuffer.includes('fingerprint')

                    if (profile.skipCertificateVerification &&
                        this.lastServerFingerprint &&
                        hasCertError &&
                        !this.lastServerFingerprintRetried) {
                        this.lastServerFingerprintRetried = true // prevent infinite loop
                        this.log('info', `Retrying with fingerprint: ${this.lastServerFingerprint}`)
                        // Retry connection with the fingerprint
                        const retryResult = await this.spawnOpenConnect(execPath, this.buildOpenConnectArgs(profile), profile)
                        resolveOnce(retryResult)
                        return
                    }

                    this.status = 'error'
                    this.emitStateChange()
                    resolveOnce({
                        success: false,
                        error: errorBuffer || outputBuffer || `OpenConnect exited with code ${code}`
                    })
                }
            })

            // Timeout for connection
            setTimeout(() => {
                if (!resolved) {
                    if (connectionEstablished || this.stats.privateIp) {
                        // Fallback: if we matched connection but missed the event?
                        this.status = 'connected'
                        this.stats.connectedTime = Date.now()
                        this.startStatsMonitoring()
                        this.fetchPublicIp()
                        this.emitStateChange()
                        resolveOnce({ success: true })
                    } else {
                        this.log('error', 'Connection timeout')
                        // Kill process if timeout
                        if (this.vpnProcess && !this.vpnProcess.killed) {
                            this.vpnProcess.kill()
                        }
                        this.disconnect()
                        resolveOnce({ success: false, error: 'Connection timeout' })
                    }
                }
            }, 30000) // 30 second timeout
        })
    }

    private async fetchPublicIp(): Promise<void> {
        try {
            // First priority: api.ip.sb/geoip
            try {
                const response = await fetch('https://api.ip.sb/geoip', {
                    signal: AbortSignal.timeout(5000)
                })
                if (response.ok) {
                    const data = await response.json()
                    if (data && data.ip) {
                        this.stats.publicIp = data.ip
                        this.stats.countryCode = data.country_code
                        this.stats.countryName = data.country
                        this.log('info', `Public IP: ${data.ip} (${data.country_code})`)
                        this.emitStateChange()
                        return
                    }
                }
            } catch (e) {
                // Ignore and fallback
            }

            const services = [
                'https://api.ipify.org?format=text',
                'https://ifconfig.me/ip',
                'https://icanhazip.com'
            ]

            for (const service of services) {
                try {
                    const response = await fetch(service, {
                        signal: AbortSignal.timeout(5000)
                    })
                    if (response.ok) {
                        const ip = (await response.text()).trim()
                        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
                            this.stats.publicIp = ip
                            this.log('info', `Public IP: ${ip}`)
                            this.emitStateChange()
                            await this.fetchCountryFromIp()
                            return
                        }
                    }
                } catch {
                    continue
                }
            }
        } catch (error) {
            this.log('warning', `Could not fetch public IP: ${error}`)
        }
    }

    private async fetchCountryFromIp(): Promise<void> {
        if (!this.stats.publicIp) return

        try {
            const response = await fetch(`http://ip-api.com/json/${this.stats.publicIp}?fields=status,country,countryCode`, {
                signal: AbortSignal.timeout(5000)
            })

            if (response.ok) {
                const data = await response.json()
                if (data.status === 'success') {
                    this.stats.countryCode = data.countryCode
                    this.stats.countryName = data.country
                    this.log('info', `VPN Location: ${data.country} (${data.countryCode})`)
                    this.emitStateChange()
                }
            }
        } catch (error) {
            this.log('warning', `Could not fetch country info: ${error}`)
        }
    }

    private async configureRoutingAndFetchInfo(): Promise<void> {
        // If VPN gateway not parsed from output, use private IP as gateway (common for TAP adapters)
        if (!this.vpnGateway && this.stats.privateIp) {
            // For TAP adapters, the gateway is often the first IP in the subnet
            const ipParts = this.stats.privateIp.split('.')
            if (ipParts.length === 4) {
                this.vpnGateway = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.1`
                this.log('info', `Estimated VPN Gateway: ${this.vpnGateway}`)
            }
        }

        // Configure routing
        if (this.vpnGateway && this.originalGateway) {
            const routingSuccess = await this.configureRouting()
            if (routingSuccess) {
                // NOW we're truly connected - routing is configured!
                this.connectTime = Date.now()
                this.status = 'connected'
                this.emitStateChange()
                this.log('info', '*** VPN fully connected - routing configured ***')
            } else {
                this.log('warning', 'Routing configuration failed - traffic may not go through VPN')
                // Still mark as connected but with warning - user can see in logs
                this.connectTime = Date.now()
                this.status = 'connected'
                this.emitStateChange()
            }
        } else {
            this.log('warning', 'No VPN gateway detected - skipping routing configuration')
            // Mark as connected anyway - some VPNs don't need local routing
            this.connectTime = Date.now()
            this.status = 'connected'
            this.emitStateChange()
        }

        // Fetch IP/Country in background with delay (wait for async routing to settle)
        setTimeout(() => {
            this.fetchPublicIp()
        }, 5000)
    }

    private getOriginalGateway(): string {
        try {
            // Use 'route print' which is MUCH faster than PowerShell (instant vs 2-3s startup)
            const output = execSync('route print 0.0.0.0', { encoding: 'utf8', timeout: 3000 })

            // Parse output to find default gateway (0.0.0.0 route)
            // Format: Network Destination   Netmask          Gateway       Interface  Metric
            // Example: 0.0.0.0            0.0.0.0       192.168.1.1     192.168.1.100     25
            const lines = output.split('\n')
            let bestGateway = ''
            let bestMetric = 999999

            for (const line of lines) {
                const trimmed = line.trim()
                // Look for default route (0.0.0.0 with 0.0.0.0 netmask)
                if (trimmed.startsWith('0.0.0.0')) {
                    const parts = trimmed.split(/\s+/)
                    // parts[0] = 0.0.0.0 (destination)
                    // parts[1] = 0.0.0.0 (netmask)  
                    // parts[2] = gateway IP
                    // parts[3] = interface IP
                    // parts[4] = metric
                    if (parts.length >= 5 && parts[2] && parts[2] !== '0.0.0.0') {
                        const gateway = parts[2]
                        const metric = parseInt(parts[4], 10) || 999999

                        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(gateway) && metric < bestMetric) {
                            bestGateway = gateway
                            bestMetric = metric
                        }
                    }
                }
            }

            if (bestGateway) {
                this.log('info', `Original gateway: ${bestGateway} (metric: ${bestMetric})`)
            }

            // Also get interface index using netsh - CRITICAL for exclusion routes
            try {
                const netshOutput = execSync('netsh interface ipv4 show route | findstr /C:"0.0.0.0/0"', { encoding: 'utf8', timeout: 3000 })
                // Parse netsh output for interface index
                // Format typically: No  Manual  35   0.0.0.0/0              192.168.1.1       Wi-Fi
                const netshLines = netshOutput.split('\n')
                for (const line of netshLines) {
                    const parts = line.trim().split(/\s+/)
                    // Looking for metric/interface index in the output
                    if (parts.length >= 4) {
                        // Try to parse interface index (usually 3rd column after "No" and "Manual" etc)
                        for (let i = 0; i < parts.length; i++) {
                            const num = parseInt(parts[i], 10)
                            if (!isNaN(num) && num > 0 && num < 1000) {
                                this.originalIfIndex = num
                                this.log('info', `Original physical interface index: ${this.originalIfIndex}`)
                                break
                            }
                        }
                        if (this.originalIfIndex) break
                    }
                }
            } catch {
                // Ignore netsh errors
            }

            // Fallback: Use PowerShell if netsh didn't get interface index
            if (!this.originalIfIndex && bestGateway) {
                try {
                    const psOutput = execSync(
                        `powershell -NoProfile -Command "(Get-NetRoute -DestinationPrefix 0.0.0.0/0 | Where-Object {$_.NextHop -eq '${bestGateway}'} | Select-Object -First 1).InterfaceIndex"`,
                        { encoding: 'utf8', timeout: 5000 }
                    )
                    const ifIndex = parseInt(psOutput.trim(), 10)
                    if (!isNaN(ifIndex) && ifIndex > 0) {
                        this.originalIfIndex = ifIndex
                        this.log('info', `Original interface index (via PS): ${this.originalIfIndex}`)
                    }
                } catch {
                    // Ignore PS errors
                }
            }

            return bestGateway
        } catch (error) {
            this.log('warning', `Could not get original gateway: ${error}`)
        }
        return ''
    }

    private async resolveServerIp(hostname: string): Promise<string> {
        try {
            // Check if already an IP
            if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
                return hostname
            }

            // Use nslookup instead of PowerShell (instant vs 2-3s startup)
            const output = execSync(
                `nslookup ${hostname}`,
                { encoding: 'utf8', timeout: 5000 }
            )
            // Parse nslookup output - look for "Address:" lines after the server info
            const lines = output.split('\n')
            let foundAnswer = false
            for (const line of lines) {
                // Skip the first "Address:" which is the DNS server
                if (line.includes('Address:') || line.includes('Addresses:')) {
                    if (foundAnswer) {
                        const match = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
                        if (match) {
                            this.log('info', `Resolved ${hostname} to ${match[1]}`)
                            return match[1]
                        }
                    }
                    foundAnswer = true // Next Address line is the answer
                }
            }
        } catch (error) {
            this.log('warning', `Could not resolve ${hostname}: ${error}`)
        }
        return hostname
    }

    private async getVpnInterfaceIndex(): Promise<number | null> {
        const benchStart = Date.now()


        // Try multiple times with delays since Wintun can take 10-15 seconds to register
        for (let attempt = 0; attempt < 30; attempt++) {
            try {
                // Use netsh for instant interface listing (PowerShell takes 2-3s startup time per call!)
                // Command: netsh interface ipv4 show interfaces
                // Output format:
                // Idx     Met         MTU          State                Name
                // ---  ----------  ----------  ------------  ---------------------------
                // 46           5        1200  connected     RAHAVPN

                const output = execSync('netsh interface ipv4 show interfaces', { encoding: 'utf8', timeout: 2000 })
                const lines = output.split('\n')

                // 1. Look for exact "RAHAVPN" match first
                for (const line of lines) {
                    if (line.includes('RAHAVPN')) {
                        const parts = line.trim().split(/\s+/)
                        const index = parseInt(parts[0], 10)
                        if (!isNaN(index) && index > 0) {
                            this.log('info', `Found RAHAVPN interface index: ${index} (attempt ${attempt + 1}) in ${Date.now() - benchStart}ms`)
                            this.vpnInterfaceName = 'RAHAVPN'
                            return index
                        }
                    }
                }

                // 2. Fallback: Look for "TAP" or "Wintun" if RAHAVPN not named yet
                for (const line of lines) {
                    if (line.includes('TAP') || line.includes('Wintun')) {
                        const match = line.trim().match(/^(\d+)\s+/)
                        if (match && match[1]) {
                            const index = parseInt(match[1], 10)
                            // Double check it's not the "VPN - VPN Client" which is our physical adapter
                            if (!line.includes('VPN - VPN Client')) {
                                this.log('info', `Found generic VPN interface index: ${index} (attempt ${attempt + 1}) in ${Date.now() - benchStart}ms`)
                                return index
                            }
                        }
                    }
                }

                // Wait before retry - use proper async sleep to keep UI responsive
                if (attempt < 29) {
                    // Only log every 5th attempt to reduce spam
                    if (attempt % 5 === 0) {
                        this.log('debug', `RAHAVPN interface not found yet, retrying... (attempt ${attempt + 1}/30)`)
                    }
                    await new Promise(resolve => setTimeout(resolve, 500))
                }
            } catch (error) {
                this.log('warning', `Interface detection attempt ${attempt + 1} failed: ${error}`)
            }
        }

        this.log('error', 'Could not find VPN interface after all attempts')
        return null
    }

    private async configureRouting(): Promise<boolean> {
        // For Windows Wintun/TAP interfaces, we need to use interface index for routing

        try {
            // OPTIMIZATION: Wait for interface index from OpenConnect stdout parsing
            // OpenConnect logs "Using Wintun device 'RAHAVPN', index XX" which we parse
            // This is much faster than polling netsh (14s -> instant once OpenConnect creates adapter)

            let vpnIfIndex: number | null = null
            const maxWaitTime = 20000 // 20 seconds max wait
            const pollInterval = 500 // Check every 500ms
            const startTime = Date.now()

            this.log('info', 'Waiting for Wintun interface from OpenConnect stdout...')

            // Wait for vpnInterfaceIndex to be populated from stdout parsing
            while (Date.now() - startTime < maxWaitTime) {
                if (this.vpnInterfaceIndex) {
                    vpnIfIndex = this.vpnInterfaceIndex
                    this.log('info', `Interface index parsed from OpenConnect stdout: ${vpnIfIndex} (in ${Date.now() - startTime}ms)`)
                    break
                }
                await new Promise(resolve => setTimeout(resolve, pollInterval))
            }

            // Fallback to netsh polling if stdout parsing didn't work
            if (!vpnIfIndex) {
                this.log('info', 'Interface not detected from stdout, falling back to netsh polling...')
                vpnIfIndex = await this.getVpnInterfaceIndex()
            }

            if (!vpnIfIndex) {
                this.log('error', 'Could not find VPN interface index - routing will fail')
                return false
            }

            // Step 0: Manually assign the VPN IP to the interface
            // This is NECESSARY because the batch script fails, leaving the interface without an IP
            if (this.stats.privateIp) {
                try {
                    this.log('info', `Manually assigning IP ${this.stats.privateIp} to interface IF ${vpnIfIndex}`)
                    // Use netsh to set the address. We assume 255.255.255.0 if not detected
                    execSync(`netsh interface ipv4 set address name="${vpnIfIndex}" static ${this.stats.privateIp} 255.255.255.0`, {
                        encoding: 'utf8', timeout: 5000
                    })
                } catch (error) {
                    this.log('warning', `Manual IP assignment failed (might already be set): ${error}`)
                }
            }

            // Manual MTU setting removed as requested
            // try {
            //     this.log('info', `Setting MTU ${this.vpnMtu} on interface IF ${vpnIfIndex}`)
            //     execSync(`netsh interface ipv4 set subinterface "${vpnIfIndex}" mtu=${this.vpnMtu} store=active`, {
            //         encoding: 'utf8', timeout: 5000
            //     })
            // } catch (error) {
            //     this.log('warning', `Failed to set MTU via netsh: ${error}`)
            // }

            // CRITICAL: Configure DNS and MTU through VPN tunnel
            try {
                this.log('info', 'Applying interface settings (MTU & DNS)...')

                // 1. Set MTU if detected to prevent packet drops (Fix for "Drop oversized packet")
                if (this.vpnMtu) {
                    this.log('info', `Configuring MTU ${this.vpnMtu} on RAHAVPN...`)
                    exec(`netsh interface ipv4 set subinterface "RAHAVPN" mtu=${this.vpnMtu} store=active`, (err) => {
                        if (err) this.log('warning', `Failed to set MTU: ${err.message}`)
                        else this.log('info', `MTU ${this.vpnMtu} applied successfully`)
                    })
                }

                // 2. Set DNS servers (using public DNS that works through VPN)
                // We use exec here to keep it async
                exec(`netsh interface ipv4 set dnsservers name="RAHAVPN" static 8.8.8.8 primary validate=no`, (err) => {
                    if (err) this.log('warning', `DNS config failed: ${err.message}`)
                })
                exec(`netsh interface ipv4 add dnsservers name="RAHAVPN" 1.1.1.1 index=2 validate=no`, (err) => {
                    if (err) this.log('warning', `Secondary DNS failed: ${err.message}`)
                })

                // 3. Flush DNS cache
                exec('ipconfig /flushdns')

                this.log('info', 'DNS configuration scheduled')
            } catch (error) {
                this.log('warning', `Interface configuration scheduler error: ${error}`)
            }

            // IMPORTANT: For interface-based routing on Windows (Wintun/TAP), 
            // the gateway MUST be 0.0.0.0 (on-link). Using the VPN IP as gateway 
            // often causes "General failure" or "Transmit failed".
            let routeGateway = '0.0.0.0'

            this.log('info', `Configuring routes using interface IF ${vpnIfIndex}, gateway ${routeGateway}`)
            this.log('info', `Original Gateway: ${this.originalGateway}, Server IP: ${this.serverIp}`)

            // Step 1: Add exclusion route for VPN server (must go through original gateway, NOT the VPN)
            if (this.serverIp && this.originalGateway) {
                // Use exec for async route addition
                const ifCmd = this.originalIfIndex ? `IF ${this.originalIfIndex}` : ''
                exec(`route delete ${this.serverIp}`, () => {
                    exec(`route add ${this.serverIp} mask 255.255.255.255 ${this.originalGateway} ${ifCmd} metric 1`, (err) => {
                        if (err) this.log('warning', `Exclusion route failed: ${err.message}`)
                        else this.log('info', `Exclusion route for server ${this.serverIp} added.`)
                    })
                })
            }

            // Step 2: Clean up any existing split routes
            try {
                execSync(`route delete 0.0.0.0 mask 128.0.0.0`, { encoding: 'utf8', timeout: 5000, stdio: 'pipe' })
                execSync(`route delete 128.0.0.0 mask 128.0.0.0`, { encoding: 'utf8', timeout: 5000, stdio: 'pipe' })
            } catch {
                // Routes might not exist
            }

            // Step 3: Add split routes with LOW priority (metric 500)
            // This ensures ANY local or exclusion route (usually metric 1-50) will override the tunnel.
            // Metric 500 is high enough that it won't conflict with physical interface default routes.
            setImmediate(() => {
                const addCmds = [
                    `route add 0.0.0.0 mask 128.0.0.0 ${routeGateway} IF ${vpnIfIndex} metric 500`,
                    `route add 128.0.0.0 mask 128.0.0.0 ${routeGateway} IF ${vpnIfIndex} metric 500`
                ]

                // Use a helper chain or just exec multiple times
                exec(`route delete 0.0.0.0 mask 128.0.0.0`, () => {
                    exec(addCmds[0], (err) => {
                        if (err) this.log('warning', `Tunnel route 1 failed: ${err.message}. Trying netsh fallback...`)
                        // Fallback to netsh if primary fails
                        if (err) exec(`netsh interface ipv4 add route 0.0.0.0/1 interface="${vpnIfIndex}" nexthop=${routeGateway} metric=500 store=active`)
                    })
                })

                exec(`route delete 128.0.0.0 mask 128.0.0.0`, () => {
                    exec(addCmds[1], (err) => {
                        if (err) this.log('warning', `Tunnel route 2 failed: ${err.message}. Trying netsh fallback...`)
                        // Fallback to netsh if primary fails
                        if (err) exec(`netsh interface ipv4 add route 128.0.0.0/1 interface="${vpnIfIndex}" nexthop=${routeGateway} metric=500 store=active`)
                    })
                })

                this.log('info', 'Tunnel default routes scheduled (High Metric)')
            })

            // Step 4: Add Private IP, Custom IP/Domain, and Iran IP exclusion routes
            const privateCidrs = [
                '10.0.0.0/8',
                '172.16.0.0/12',
                '192.168.0.0/16',
                '127.0.0.0/8',
                '169.254.0.0/16',
                '100.64.0.0/10'
            ]

            if (this.currentProfile?.bypassPrivateIps !== false) {
                for (const cidr of privateCidrs) {
                    const route = this.cidrToNetworkMask(cidr)
                    if (route) this.excludeRoutes.push(route)
                }
                this.log('info', `Added ${privateCidrs.length} Private IP exclusion routes`)
            }

            if (this.currentProfile?.bypassIps && this.currentProfile.bypassIps.length > 0) {
                for (const rawIp of this.currentProfile.bypassIps) {
                    const cidr = rawIp.includes('/') ? rawIp : `${rawIp}/32`
                    const route = this.cidrToNetworkMask(cidr)
                    if (route) this.excludeRoutes.push(route)
                }
                this.log('info', `Added ${this.currentProfile.bypassIps.length} custom IP exclusion routes`)
            }

            if (this.currentProfile?.bypassDomains && this.currentProfile.bypassDomains.length > 0) {
                for (const rawDomain of this.currentProfile.bypassDomains) {
                    const domain = rawDomain.trim().replace(/^\./, '')
                    if (domain) {
                        try {
                            const resolvedIp = await this.resolveServerIp(domain)
                            if (resolvedIp && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(resolvedIp)) {
                                this.excludeRoutes.push({ network: resolvedIp, mask: '255.255.255.255' })
                                this.log('info', `Bypass domain ${domain} resolved to ${resolvedIp} and added to exclusions`)
                            }
                        } catch (e) {
                            this.log('warning', `Could not resolve bypass domain ${domain}: ${e}`)
                        }
                    }
                }
            }

            // Only add if the profile has bypassIranRoutes enabled
            // Server-pushed routes (X-CSTP-Split-Exclude) are ALWAYS applied regardless of this setting
            if (this.currentProfile?.bypassIranRoutes) {
                const iranRouteStartCount = this.excludeRoutes.length
                for (const cidr of IRAN_IP_CIDRS) {
                    const route = this.cidrToNetworkMask(cidr)
                    if (route) {
                        this.excludeRoutes.push(route)
                    }
                }
                this.log('info', `Added ${this.excludeRoutes.length - iranRouteStartCount} Iran IP exclusion routes`)
            }

            // Step 5: Apply server-pushed split routes + Iran routes IN BACKGROUND to avoid UI freeze
            if (this.includeRoutes.length > 0 || this.excludeRoutes.length > 0) {
                this.log('info', `Scheduling split routes (${this.includeRoutes.length} include, ${this.excludeRoutes.length} exclude) in background via batch script...`)

                // Run in background
                setImmediate(() => {
                    this.applySplitRoutesBatch(vpnIfIndex)
                })
            }

            this.routesConfigured = true
            this.stats.vpnGateway = routeGateway
            this.log('info', 'Routing orchestration completed (Async)')
            return true
        } catch (error) {
            this.log('error', `Failed to orchestrate routing: ${error}`)
            return false
        }
    }

    private applySplitRoutesBatch(vpnIfIndex: number): void {
        const benchStart = Date.now()
        const batchLines: string[] = ['@echo off']

        this.log('info', `Preparing batch file for ${this.includeRoutes.length + this.excludeRoutes.length} routes...`)
        this.log('debug', `Original Gateway: ${this.originalGateway}, Original IF: ${this.originalIfIndex}`)

        // Inclusion routes (into tunnel)
        for (const r of this.includeRoutes) {
            // Delete first to avoid "The route addition failed: The object already exists" errors
            batchLines.push(`route delete ${r.network} mask ${r.mask} > nul 2>&1`)
            batchLines.push(`route add ${r.network} mask ${r.mask} 0.0.0.0 IF ${vpnIfIndex} metric 1`)
        }

        // Exclusion routes (stay on physical) - CRITICAL: Add these with very low metric
        if (this.originalGateway) {
            const ifPart = this.originalIfIndex ? `IF ${this.originalIfIndex}` : ''
            this.log('info', `Applying ${this.excludeRoutes.length} exclusion routes via ${this.originalGateway} ${ifPart}`)

            for (const r of this.excludeRoutes) {
                // Delete first to avoid conflicts
                batchLines.push(`route delete ${r.network} mask ${r.mask} > nul 2>&1`)
                // Add with metric 1 (higher priority than tunnel routes with metric 500)
                batchLines.push(`route add ${r.network} mask ${r.mask} ${this.originalGateway} ${ifPart} metric 1`)
            }
        } else {
            this.log('warning', 'Cannot apply exclusion routes - originalGateway is empty!')
        }

        if (batchLines.length <= 1) return

        try {
            const tempBatchFile = path.join(os.tmpdir(), `vpn_routes_${Date.now()}.bat`)
            fs.writeFileSync(tempBatchFile, batchLines.join('\r\n'))

            this.log('info', `Executing batch routing script (Async): ${tempBatchFile}`)

            // Execute the batch file asynchronously to prevent UI freeze
            exec(`"${tempBatchFile}"`, { timeout: 60000 }, (error, stdout, stderr) => {
                // Cleanup file regardless of outcome
                try { fs.unlinkSync(tempBatchFile) } catch { }

                if (error) {
                    this.log('error', `Batch routing failed: ${error.message}`)
                    if (stderr) this.log('debug', `Stderr: ${stderr}`)
                    return
                }

                const duration = Date.now() - benchStart
                this.log('info', `Batch routing completed in ${duration}ms. ${this.excludeRoutes.length} exclusion routes applied.`)
            })
        } catch (error) {
            this.log('error', `Batch routing setup failed: ${error}`)
        }
    }

    private async removeSplitRoutesBatch(): Promise<void> {
        const batchLines: string[] = ['@echo off']

        this.log('info', `Preparing cleanup batch for ${this.includeRoutes.length + this.excludeRoutes.length} routes...`)

        for (const r of this.includeRoutes) {
            batchLines.push(`route delete ${r.network}`)
        }

        for (const r of this.excludeRoutes) {
            batchLines.push(`route delete ${r.network}`)
        }

        if (batchLines.length <= 1) return

        try {
            const tempBatchFile = path.join(os.tmpdir(), `vpn_routes_cleanup_${Date.now()}.bat`)
            fs.writeFileSync(tempBatchFile, batchLines.join('\r\n'))

            return new Promise((resolve) => {
                exec(`\"${tempBatchFile}\"`, { timeout: 60000 }, (error) => {
                    try { fs.unlinkSync(tempBatchFile) } catch { }
                    if (error) {
                        this.log('warning', `Cleanup batch failed partially: ${error.message}`)
                    } else {
                        this.log('info', 'Split routes cleanup completed.')
                    }
                    // Always clear arrays
                    this.includeRoutes = []
                    this.excludeRoutes = []
                    resolve()
                })
            })
        } catch (error) {
            this.log('error', `Batch cleanup setup failed: ${error}`)
            this.includeRoutes = []
            this.excludeRoutes = []
        }
    }

    private async removeRoutes(): Promise<void> {
        if (!this.routesConfigured) return

        try {
            this.log('info', 'Initiating full route cleanup...')

            // 1. Remove split routes (batch)
            if (this.includeRoutes.length > 0 || this.excludeRoutes.length > 0) {
                await this.removeSplitRoutesBatch()
            }

            // 2. Remove default override routes
            try {
                execSync(`route delete 0.0.0.0 mask 128.0.0.0`, { encoding: 'utf8', timeout: 5000, stdio: 'pipe' })
                execSync(`route delete 128.0.0.0 mask 128.0.0.0`, { encoding: 'utf8', timeout: 5000, stdio: 'pipe' })
            } catch {
                // Routes might not exist
            }

            // 3. Remove exclusion route for server (Explicitly)
            if (this.serverIp) {
                try {
                    execSync(`route delete ${this.serverIp}`, { encoding: 'utf8', timeout: 5000, stdio: 'ignore' })
                } catch {
                    // Route might not exist
                }
            }

            this.routesConfigured = false
            this.log('info', 'VPN routes cleanup finished')
        } catch (error) {
            this.log('warning', `Error during route removal: ${error}`)
        }
    }

    private startStatsMonitoring(): void {
        if (this.statsInterval) {
            clearInterval(this.statsInterval)
        }

        this.lastStatsTime = Date.now()
        this.lastBytesReceived = 0
        this.lastBytesSent = 0

        this.statsInterval = setInterval(() => {
            this.updateStats()
        }, 1000) // 1 second for real-time speed display like other VPN apps
    }

    private updateStats(): void {
        if (this.status !== 'connected') return
        if (!this.vpnInterfaceName) return

        // Use 'netsh interface ipv4 show subinterfaces' which shows per-interface Bytes In/Out
        // Output format:
        //    MTU  MediaSenseState   Bytes In  Bytes Out  Interface
        // ------  ---------------  ---------  ---------  -------------
        //   1200                1   12345678   12345678  RAHAVPN
        exec('netsh interface ipv4 show subinterfaces', { encoding: 'utf8', timeout: 3000 }, (error, stdout, stderr) => {
            if (error) {
                this.log('warning', `Stats command failed: ${error.message}`)
                return
            }

            try {
                const lines = stdout.split('\n')
                for (const line of lines) {
                    // Look for our interface name in the line
                    if (line.includes(this.vpnInterfaceName) || line.includes('RAHAVPN')) {
                        // Parse the columns: MTU, MediaSenseState, Bytes In, Bytes Out, Interface
                        // Example: "   1200                1   12345678   12345678  RAHAVPN"
                        const parts = line.trim().split(/\s+/)

                        // Find the bytes columns (should be 3rd and 4th numeric values)
                        // Format: MTU[0], MediaSenseState[1], BytesIn[2], BytesOut[3], Interface[4+]
                        if (parts.length >= 5) {
                            const bytesIn = parseInt(parts[2]) || 0
                            const bytesOut = parseInt(parts[3]) || 0

                            const now = Date.now()
                            const timeDiff = (now - this.lastStatsTime) / 1000

                            if (this.lastBytesReceived > 0 && timeDiff > 0) {
                                this.stats.downloadSpeed = Math.max(0, (bytesIn - this.lastBytesReceived) / timeDiff)
                                this.stats.uploadSpeed = Math.max(0, (bytesOut - this.lastBytesSent) / timeDiff)
                            }

                            this.stats.totalDownloaded = bytesIn
                            this.stats.totalUploaded = bytesOut
                            this.lastBytesReceived = bytesIn
                            this.lastBytesSent = bytesOut
                            this.lastStatsTime = now

                            // Calculate connected time
                            if (this.connectTime > 0) {
                                this.stats.connectedTime = Date.now() - this.connectTime
                            }

                            this.emitStateChange()
                            return
                        }
                    }
                }
                // Interface not found in subinterfaces list
                this.log('debug', 'VPN interface not found in subinterfaces list')
            } catch (err) {
                this.log('warning', `Stats parsing error: ${err}`)
            }
        })
    }


    async disconnect(): Promise<VpnConnectionResult> {
        if (this.status === 'disconnected') {
            return { success: true }
        }

        this.status = 'disconnecting'
        this.emitStateChange()
        this.log('info', 'Disconnecting...')

        try {
            // Reset RAHAVPN interface to DHCP (clears static IP and DNS)
            try {
                this.log('info', 'Resetting RAHAVPN interface...')
                execSync('netsh interface ipv4 set address name="RAHAVPN" dhcp', { stdio: 'ignore' })
                execSync('netsh interface ipv4 set dnsservers name="RAHAVPN" dhcp', { stdio: 'ignore' })
            } catch (err) {
                this.log('debug', `Interface reset error (likely already DHCP): ${err}`)
            }

            // Remove VPN routes
            await this.removeRoutes()

            // Stop stats monitoring
            if (this.statsInterval) {
                clearInterval(this.statsInterval)
                this.statsInterval = null
            }

            // Kill the VPN process
            if (this.vpnProcess) {
                this.vpnProcess.kill('SIGTERM')
                this.vpnProcess = null
            }

            // Also try to kill any running openconnect processes
            try {
                execSync('taskkill /F /IM openconnect.exe', { stdio: 'ignore' })
            } catch {
                // Process might not exist
            }

            // Read and kill by PID file
            const pidFile = path.join(os.tmpdir(), 'openconnect.pid')
            if (fs.existsSync(pidFile)) {
                try {
                    const pid = fs.readFileSync(pidFile, 'utf8').trim()
                    execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
                    fs.unlinkSync(pidFile)
                } catch {
                    // Ignore
                }
            }

            // Reset state
            this.status = 'disconnected'
            this.currentProfile = null
            this.stats = this.createEmptyStats()
            this.vpnGateway = ''
            this.originalGateway = ''
            this.serverIp = ''
            this.vpnInterfaceIndex = null  // Clear cached interface index for next connection
            this.vpnInterfaceName = ''
            this.originalIfIndex = null  // Clear original interface index
            this.routesConfigured = false  // Reset routing status
            this.excludeRoutes = []  // Clear exclude routes for fresh reconnect
            this.includeRoutes = []  // Clear include routes for fresh reconnect
            this.vpnMtu = 1200  // Reset MTU to default
            this.lastBytesReceived = 0  // Reset stats counters
            this.lastBytesSent = 0
            this.lastStatsTime = 0
            this.connectTime = 0  // Reset connection time
            this.emitStateChange()

            this.log('info', 'Disconnected successfully')
            return { success: true }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            this.log('error', `Disconnect error: ${errorMsg}`)

            // Force disconnect anyway
            this.status = 'disconnected'
            this.currentProfile = null
            this.stats = this.createEmptyStats()
            this.emitStateChange()

            return { success: true }
        }
    }

    isElevated(): boolean {
        try {
            // Try to access a protected registry key or run a privileged command
            execSync('net session', { stdio: 'ignore' })
            return true
        } catch {
            return false
        }
    }

    getState() {
        return {
            status: this.status,
            profile: this.currentProfile,
            stats: this.stats
        }
    }
}

// Singleton instance
export const vpnService = new VpnService()
