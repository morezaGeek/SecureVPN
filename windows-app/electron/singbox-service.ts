// sing-box Service for V2Ray/Xray protocols (VLESS, VMess, Trojan, Shadowsocks)
// Handles process management, config generation, and TUN mode routing

import { spawn, ChildProcess, execSync } from 'child_process'
import { EventEmitter } from 'events'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'
import { promises as dns } from 'dns'
import * as net from 'net'
import { IRAN_IP_CIDRS } from './iran-ips'

export interface SingboxProfile {
    uuid: string
    address: string
    port: number
    encryption?: string
    transport: 'tcp' | 'ws' | 'grpc' | 'httpupgrade' | 'xhttp'
    security: 'none' | 'tls' | 'reality'
    sni?: string
    fingerprint?: string
    alpn?: string[]
    allowInsecure?: boolean
    path?: string
    host?: string
    serviceName?: string
    mode?: string
    method?: string
    publicKey?: string
    shortId?: string

    // Iran IP bypass - routes Iranian IPs directly (not through tunnel)
    bypassIranRoutes?: boolean

    // Network settings (passed from app settings)
    mtu?: number  // MTU size for TUN interface (default: 1400)
    tunStack?: 'mixed' | 'gvisor' | 'system'
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
    countryCode?: string
    countryName?: string
}

type VpnStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error'
type VpnProtocol = 'vless' | 'vmess' | 'trojan' | 'shadowsocks'

export class SingboxService extends EventEmitter {
    private singboxProcess: ChildProcess | null = null
    private status: VpnStatus = 'disconnected'
    private stats: VpnStats = this.createEmptyStats()
    private configPath: string
    private appDataPath: string
    private statsInterval: NodeJS.Timeout | null = null
    private connectTime: number = 0
    private originalGateway: string = ''
    private originalIfIndex: number | null = null
    private originalIfName: string = ''
    private serverIp: string = ''

    // Traffic stats tracking for speed calculation
    private lastBytesReceived: number = 0
    private lastBytesSent: number = 0
    private lastStatsTime: number = 0

    // Clash API port for stats
    private clashApiPort: number = 9090

    // Iranian IP exclusion routes (same as vpn-service.ts)
    private excludeRoutes: { network: string, mask: string }[] = []

    constructor() {
        super()
        this.appDataPath = path.join(app.getPath('userData'))
        this.configPath = path.join(this.appDataPath, 'singbox-config.json')
    }

    private createEmptyStats(): VpnStats {
        return {
            uploadSpeed: 0,
            downloadSpeed: 0,
            totalUploaded: 0,
            totalDownloaded: 0,
            connectedTime: 0,
            privateIp: '',
            publicIp: ''
        }
    }

    getStatus(): VpnStatus {
        return this.status
    }

    getStats(): VpnStats {
        return { ...this.stats }
    }

    private emitStateChange() {
        this.emit('stateChange', {
            status: this.status,
            stats: this.stats
        })
    }

    private log(level: 'info' | 'warning' | 'error' | 'debug', message: string) {
        const lowerMsg = message.toLowerCase()
        // Skip noisy connection logs to clean up UI logs screen
        if (lowerMsg.includes('connection:') || 
            lowerMsg.includes('raw-read') || 
            lowerMsg.includes('raw-write') || 
            lowerMsg.includes('dial tcp') || 
            lowerMsg.includes('connection download') ||
            lowerMsg.includes('connection upload') ||
            lowerMsg.includes('open connection to') ||
            lowerMsg.includes('inbound dns packet') ||
            lowerMsg.includes('dns: cached') ||
            lowerMsg.includes('dns: exchange')) {
            return
        }
        this.emit('log', { level, message: `[SB] ${message}` })
    }

    /**
     * Get path to sing-box executable
     */
    private getSingboxPath(): string {
        const possiblePaths = [
            // Production: installed app
            path.join(process.resourcesPath, 'singbox', 'sing-box.exe'),
            // Development
            path.join(__dirname, '..', 'resources', 'singbox', 'sing-box.exe'),
            path.join(app.getAppPath(), 'resources', 'singbox', 'sing-box.exe')
        ]

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                this.log('info', `Found sing-box at: ${p}`)
                return p
            }
        }

        // Fallback to PATH
        return 'sing-box.exe'
    }

    /**
     * Get original gateway before VPN connection
     */
    /**
     * Get original gateway and interface index, excluding the VPN interface
     */
    private getOriginalGateway(): string {
        try {
            // Powershell command to:
            // 1. Get Tun Interface Index (if exists)
            // 2. Get Default Routes (0.0.0.0/0)
            // 3. Filter out Tun Interface
            // 4. Pick best metric
            const psCommand = `
                $tunIndex = (Get-NetAdapter -Name "SecureVPN-SB" -ErrorAction SilentlyContinue).InterfaceIndex;
                $route = Get-NetRoute -DestinationPrefix 0.0.0.0/0 | Where-Object { $_.InterfaceIndex -ne $tunIndex } | Sort-Object RouteMetric | Select-Object -First 1;
                if ($route) { Write-Output ($route.NextHop + '|' + $route.InterfaceIndex) }
            `
            const output = execSync(`powershell -Command "${psCommand.replace(/\n/g, ' ')}"`, { encoding: 'utf8', timeout: 5000 }).trim()

            if (output) {
                const parts = output.split('|')
                const gateway = parts[0]
                const ifIndex = parseInt(parts[1], 10)

                if (gateway && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(gateway)) {
                    this.log('info', `Original gateway: ${gateway}, IfIndex: ${ifIndex}`)
                    if (!isNaN(ifIndex) && ifIndex > 0) {
                        this.originalIfIndex = ifIndex
                        // Get the interface name from the index
                        try {
                            const nameCmd = `powershell -Command "(Get-NetAdapter | Where-Object { $_.InterfaceIndex -eq ${ifIndex} }).Name"`
                            const ifName = execSync(nameCmd, { encoding: 'utf8', timeout: 3000 }).trim()
                            if (ifName) {
                                this.originalIfName = ifName
                                this.log('info', `Original interface name: ${ifName}`)
                            }
                        } catch { /* ignore */ }
                    }
                    return gateway
                }
            }
        } catch (error) {
            this.log('warning', `Could not get original gateway: ${error}`)
        }
        return ''
    }

    /**
     * Resolve hostname to IP using PowerShell
     */
    /**
     * Resolve hostname to the best reachable IP (Happy Eyeballs-ish for Cloudflare)
     */
    private async resolveServerIp(hostname: string, port: number): Promise<string> {
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
            return hostname
        }

        this.log('info', `Resolving ${hostname}...`)
        try {
            // 1. Resolve all IPv4 addresses
            const addresses = await dns.resolve4(hostname).catch(() => [])

            if (addresses.length === 0) {
                // Fallback to Powershell
                const psOutput = execSync(
                    `powershell -Command "(Resolve-DnsName -Name '${hostname}' -Type A -ErrorAction Stop | Select-Object -First 1).IPAddress"`,
                    { encoding: 'utf8', timeout: 5000 }
                ).trim()
                if (psOutput) return psOutput
                return hostname
            }

            this.log('info', `DNS returned IPs: ${addresses.join(', ')}`)

            // 2. Test connectivity to find a working IP
            // We race them (or check sequentially with short timeout)
            for (const ip of addresses) {
                const isReachable = await this.checkTcpConnectivity(ip, port)
                if (isReachable) {
                    this.log('info', `Selected best server IP: ${ip} (reachable)`)
                    return ip
                }
            }

            // If none conform to check, return the first one as fallback
            this.log('warning', `No IPs were reachable via TCP ping. Defaulting to ${addresses[0]}`)
            return addresses[0]

        } catch (error) {
            this.log('warning', `DNS resolution failed: ${error}`)
        }

        // Fallback: return hostname and let sing-box resolve it
        return hostname
    }

    /**
     * Helper: Check TCP connectivity with short timeout
     */
    private checkTcpConnectivity(host: string, port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const socket = new net.Socket()
            socket.setTimeout(2000) // 2s timeout

            socket.on('connect', () => {
                socket.destroy()
                resolve(true)
            })

            socket.on('timeout', () => {
                socket.destroy()
                resolve(false)
            })

            socket.on('error', () => {
                socket.destroy()
                resolve(false)
            })

            socket.connect(port, host)
        })
    }

    /**
     * Generate sing-box configuration JSON
     */
    private generateConfig(protocol: VpnProtocol, config: SingboxProfile): object {
        // Use resolved IP if available to ensure routing match, otherwise fallback to address
        // This is CRITICAL for Cloudflare to prevent routing loops where sing-box passes
        // traffic to a different IP than the one we added a route exception for.
        const serverAddress = this.serverIp || config.address

        // Build outbound based on protocol
        let outbound: object

        switch (protocol) {
            case 'vless': {
                outbound = {
                    type: 'vless',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    uuid: config.uuid,
                    ...(config.transport !== 'ws' && config.transport !== 'httpupgrade' && config.transport !== 'xhttp' ? { packet_encoding: 'xudp' } : {}),
                    tls: this.buildTlsConfig(config),
                    transport: this.buildTransport(config)
                }
                break
            }

            case 'vmess': {
                outbound = {
                    type: 'vmess',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    uuid: config.uuid,
                    security: config.encryption || 'auto',
                    alter_id: 0,
                    ...(config.transport !== 'ws' && config.transport !== 'httpupgrade' && config.transport !== 'xhttp' ? { packet_encoding: 'xudp' } : {}),
                    tls: this.buildTlsConfig(config),
                    transport: this.buildTransport(config)
                }
                break
            }

            case 'trojan': {
                outbound = {
                    type: 'trojan',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    password: config.uuid,
                    tls: this.buildTlsConfig(config),
                    transport: this.buildTransport(config)
                }
                break
            }

            case 'shadowsocks':
                outbound = {
                    type: 'shadowsocks',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    password: config.uuid,
                    method: config.method || 'aes-256-gcm'
                }
                break

            default:
                throw new Error(`Unsupported protocol: ${protocol}`)
        }

        // Prepare custom bypass domains and IPs
        const customDomains = (config.bypassDomains || [])
            .map(d => d.trim().toLowerCase())
            .filter(d => d.length > 0)

        const customDomainExact = customDomains.filter(d => !d.startsWith('.'))
        const customDomainSuffix = customDomains.map(d => d.startsWith('.') ? d.substring(1) : d)

        const customIps = (config.bypassIps || [])
            .map(ip => ip.trim())
            .filter(ip => ip.length > 0)
            .map(ip => ip.includes('/') ? ip : `${ip}/32`)

        const privateCidrs = [
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
            '127.0.0.0/8',
            '169.254.0.0/16',
            '100.64.0.0/10',
            'fc00::/7',
            'fe80::/10'
        ]

        // Build complete config (sing-box 1.12+ format)
        return {
            log: {
                level: 'warn', // Use 'warn' to minimize log overhead; connection detection uses Clash API polling
                timestamp: true
            },
            dns: {
                independent_cache: true, // Required for FakeIP record persistence
                servers: [
                    {
                        type: 'fakeip',
                        tag: 'fakeip',
                        inet4_range: '198.18.0.0/15'
                    },
                    {
                        // Real DNS through proxy - for non-A/AAAA queries and bypass domains
                        type: 'udp',
                        tag: 'proxy-dns',
                        server: '8.8.8.8',
                        detour: 'proxy'
                    },
                    {
                        // Direct DNS for local network and bypass domains
                        type: 'local',
                        tag: 'direct-dns'
                    }
                ],
                rules: [
                    // Iranian domains need real IPs (for direct routing)
                    ...(config.bypassIranRoutes ? [{
                        domain_suffix: ['.ir'],
                        server: 'direct-dns'
                    }] : []),
                    // Custom bypass domains need real IPs
                    ...(customDomains.length > 0 ? [{
                        domain: customDomainExact,
                        domain_suffix: customDomainSuffix,
                        server: 'direct-dns'
                    }] : []),
                    // All A/AAAA queries get FakeIP (instant, zero latency)
                    {
                        query_type: ['A', 'AAAA'],
                        server: 'fakeip'
                    }
                ],
                final: 'proxy-dns',
                strategy: 'ipv4_only'
            },
            inbounds: [
                {
                    type: 'tun',
                    tag: 'tun-in',
                    interface_name: 'SecureVPN-SB',
                    address: ['172.19.0.1/30'],
                    mtu: config.mtu || 1400,
                    auto_route: true,
                    strict_route: true,
                    stack: 'system',
                    endpoint_independent_nat: true,
                    ...(config.bypassPrivateIps !== false ? {
                        route_exclude_address: [
                            ...privateCidrs,
                            ...customIps
                        ]
                    } : {})
                },
                {
                    type: 'mixed',
                    tag: 'mixed-in',
                    listen: '127.0.0.1',
                    listen_port: 2080
                }
            ],
            outbounds: [
                outbound,
                {
                    type: 'direct',
                    tag: 'direct'
                },
                {
                    type: 'block',
                    tag: 'block'
                }
            ],
            route: {
                // Required by sing-box 1.12+ for domain resolution in routing/dialing
                default_domain_resolver: 'proxy-dns',
                rules: [
                    {
                        // Sniff domain from TLS SNI / HTTP Host (critical for FakeIP domain recovery)
                        action: 'sniff'
                    },
                    {
                        // Intercept all DNS queries
                        protocol: 'dns',
                        action: 'hijack-dns'
                    },
                    // Custom domain bypass
                    ...(customDomains.length > 0 ? [{
                        domain: customDomainExact,
                        domain_suffix: customDomainSuffix,
                        outbound: 'direct'
                    }] : []),
                    // Custom IP bypass
                    ...(customIps.length > 0 ? [{
                        ip_cidr: customIps,
                        outbound: 'direct'
                    }] : []),
                    // Private IPs bypass VPN
                    ...(config.bypassPrivateIps !== false ? [
                        {
                            ip_is_private: true,
                            outbound: 'direct'
                        },
                        {
                            ip_cidr: privateCidrs,
                            outbound: 'direct'
                        }
                    ] : []),
                    // Iranian domain bypass
                    ...(config.bypassIranRoutes ? [{
                        domain_suffix: ['.ir'],
                        outbound: 'direct'
                    }] : []),
                    // Iranian IP bypass
                    ...(config.bypassIranRoutes ? [{
                        ip_cidr: IRAN_IP_CIDRS,
                        outbound: 'direct'
                    }] : []),
                    // FakeIP range → proxy
                    {
                        ip_cidr: ['198.18.0.0/15'],
                        outbound: 'proxy'
                    }
                ],
                final: 'proxy',
                auto_detect_interface: true
            },
            experimental: {
                clash_api: {
                    external_controller: `127.0.0.1:${this.clashApiPort}`,
                    secret: ''
                },
                cache_file: {
                    enabled: true,
                    store_dns: true,
                    store_fakeip: true
                }
            }
        }
    }

    /**
     * Build TLS configuration enforcing protocol-specific ALPN rules
     */
    private buildTlsConfig(config: SingboxProfile): object | undefined {
        if (config.security !== 'tls') return undefined

        let alpn: string[]
        if (config.transport === 'ws' || config.transport === 'httpupgrade') {
            // WebSocket and HTTPUpgrade MANDATE http/1.1 for HTTP Upgrade handshake
            alpn = ['http/1.1']
        } else if (config.transport === 'xhttp' || config.transport === 'grpc') {
            alpn = ['h2']
        } else if (config.alpn && config.alpn.length > 0) {
            alpn = config.alpn
        } else {
            alpn = ['h2', 'http/1.1']
        }

        return {
            enabled: true,
            server_name: config.sni || config.address,
            insecure: config.allowInsecure || false,
            alpn,
            utls: {
                enabled: true,
                fingerprint: config.fingerprint || 'chrome'
            }
        }
    }

    /**
     * Build transport configuration
     */
    private buildTransport(config: SingboxProfile): object | undefined {
        if (config.transport === 'tcp') {
            return undefined
        }

        if (config.transport === 'ws') {
            const host = config.host || config.sni
            return {
                type: 'ws',
                path: config.path || '/',
                ...(host ? { headers: { Host: host } } : {}),
                max_early_data: 2048,
                early_data_header_name: 'Sec-WebSocket-Protocol'
            }
        }

        if (config.transport === 'grpc') {
            return {
                type: 'grpc',
                service_name: config.serviceName || ''
            }
        }

        if (config.transport === 'httpupgrade') {
            const host = config.host || config.sni || config.address
            return {
                type: 'httpupgrade',
                path: config.path || '/',
                host: host
            }
        }

        if (config.transport === 'xhttp') {
            const host = config.host || config.sni || config.address
            return {
                type: 'xhttp',
                mode: config.mode || 'auto',
                path: config.path || '/',
                host: host
            }
        }

        return undefined
    }

    /**
     * Connect using sing-box
     */
    async connect(protocol: VpnProtocol, config: SingboxProfile, profileName: string): Promise<{ success: boolean; error?: string }> {
        if (this.status === 'connected' || this.status === 'connecting') {
            return { success: false, error: 'Already connected or connecting' }
        }

        this.status = 'connecting'
        this.emitStateChange()
        this.log('info', `Connecting to ${config.address}:${config.port} via ${protocol}...`)

        try {
            // Get original gateway before connection
            this.originalGateway = this.getOriginalGateway()

            // Resolve server IP (scanning for best reachable IP)
            this.serverIp = await this.resolveServerIp(config.address, config.port)
            this.log('info', `Server IP: ${this.serverIp}`)

            // Log the transport and TLS settings for debugging
            this.log('debug', `Transport: ${config.transport}, Security: ${config.security}, Path: ${config.path || 'none'}`)

            // Generate config
            const singboxConfig = this.generateConfig(protocol, config)
            fs.writeFileSync(this.configPath, JSON.stringify(singboxConfig, null, 2), 'utf8')
            this.log('debug', `Config written to ${this.configPath}`)

            // Add exclusion route for VPN server
            if (this.serverIp && this.originalGateway && this.originalIfIndex) {
                try {
                    execSync(`route delete ${this.serverIp}`, { encoding: 'utf8', timeout: 5000, stdio: 'pipe' })
                } catch { /* ignore */ }

                try {
                    execSync(`route add ${this.serverIp} mask 255.255.255.255 ${this.originalGateway} IF ${this.originalIfIndex} metric 1`, {
                        encoding: 'utf8',
                        timeout: 5000
                    })
                    this.log('info', `Added exclusion route for VPN server ${this.serverIp}`)
                } catch (error) {
                    this.log('warning', `Server exclusion route failed: ${error}`)
                }
            }

            // Get sing-box path
            const singboxPath = this.getSingboxPath()

            // Spawn sing-box process
            const args = ['run', '-c', this.configPath]
            this.log('debug', `Spawning: ${singboxPath} ${args.join(' ')}`)

            this.singboxProcess = spawn(singboxPath, args, {
                windowsHide: true,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    ENABLE_DEPRECATED_LEGACY_DNS_SERVERS: 'true',
                    ENABLE_DEPRECATED_MISSING_DOMAIN_RESOLVER: 'true',
                    ENABLE_DEPRECATED_SPECIAL_OUTBOUNDS: 'true',
                    ENABLE_DEPRECATED_LEGACY_DNS_FAKEIP_OPTIONS: 'true',
                    ENABLE_DEPRECATED_INDEPENDENT_CACHE: 'true'
                }
            })

            // Handle process output - log level is 'warn' so only warnings/errors come through
            this.singboxProcess.stdout?.on('data', (data: Buffer) => {
                const lines = data.toString().trim().split('\n')
                for (const rawLine of lines) {
                    const line = rawLine.trim()
                    if (line) {
                        this.log('info', line)
                    }
                }
            })

            this.singboxProcess.stderr?.on('data', (data: Buffer) => {
                const lines = data.toString().trim().split('\n')
                for (const rawLine of lines) {
                    const line = rawLine.trim()
                    if (line) {
                        this.log('warning', line)
                    }
                }
            })

            this.singboxProcess.on('error', (error) => {
                this.log('error', `sing-box process error: ${error.message}`)
                this.status = 'error'
                this.emitStateChange()
            })

            this.singboxProcess.on('exit', (code) => {
                this.log('info', `sing-box exited with code: ${code}`)
                if (this.status === 'connected' || this.status === 'connecting') {
                    this.status = 'disconnected'
                    this.emitStateChange()
                }
                this.cleanup()
            })

            // Detect connection via Clash API polling (reliable, independent of log level)
            const clashPollInterval = setInterval(async () => {
                if (this.status !== 'connecting') {
                    clearInterval(clashPollInterval)
                    return
                }
                try {
                    const resp = await fetch(`http://127.0.0.1:${this.clashApiPort}`, {
                        signal: AbortSignal.timeout(500)
                    })
                    if (resp.ok) {
                        clearInterval(clashPollInterval)
                        this.onConnected()
                    }
                } catch {
                    // Clash API not ready yet, keep polling
                }
            }, 300)

            // Wait for connection (timeout 30s)
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    if (this.status === 'connecting') {
                        this.log('error', 'Connection timeout')
                        this.disconnect()
                        resolve({ success: false, error: 'Connection timeout' })
                    }
                }, 30000)

                const checkConnected = setInterval(() => {
                    if (this.status === 'connected') {
                        clearTimeout(timeout)
                        clearInterval(checkConnected)
                        resolve({ success: true })
                    } else if (this.status === 'error' || this.status === 'disconnected') {
                        clearTimeout(timeout)
                        clearInterval(checkConnected)
                        resolve({ success: false, error: 'Connection failed' })
                    }
                }, 500)
            })

        } catch (error) {
            this.log('error', `Connection error: ${error}`)
            this.status = 'error'
            this.emitStateChange()
            return { success: false, error: String(error) }
        }
    }

    /**
     * Enable or disable Windows System Proxy (HTTP/SOCKS5 via 127.0.0.1:2080)
     */
    private setSystemProxy(enable: boolean) {
        try {
            if (enable) {
                execSync(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f`, { stdio: 'ignore' })
                execSync(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "127.0.0.1:2080" /f`, { stdio: 'ignore' })
                this.log('info', 'Enabled Windows System Proxy (127.0.0.1:2080)')
            } else {
                execSync(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`, { stdio: 'ignore' })
                this.log('info', 'Disabled Windows System Proxy')
            }
        } catch (e) {
            this.log('warning', `System proxy setting error: ${e}`)
        }
    }

    /**
     * Called when connection is established
     */
    private async onConnected() {
        // Guard against double-calling (can happen from multiple detection sources)
        if (this.status !== 'connecting') return

        this.connectTime = Date.now() // Set BEFORE status change
        this.status = 'connected'
        this.stats.privateIp = '172.19.0.1'
        this.stats.connectedTime = 0 // Start from 0
        this.emitStateChange()
        this.log('info', 'Connected successfully')

        // Enable Windows System Proxy (127.0.0.1:2080) for 100% full ISP speed in browsers
        this.setSystemProxy(true)

        // Fetch public IP
        await this.fetchPublicIp()

        // Start stats monitoring
        this.startStatsMonitoring()
    }

    /**
     * Fetch public IP
     */
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
                'https://api.ipify.org',
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

    /**
     * Fetch country from IP
     */
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

    /**
     * Test latency through the tunnel using HTTP request
     * Returns latency in milliseconds or -1 if failed
     */
    async testLatency(targetUrl: string = 'https://www.google.com/generate_204'): Promise<number> {
        if (this.status !== 'connected') {
            return -1
        }

        try {
            const startTime = performance.now()
            const response = await fetch(targetUrl, {
                method: 'HEAD',
                signal: AbortSignal.timeout(10000),
                cache: 'no-store'
            })
            const endTime = performance.now()

            if (response.ok || response.status === 204) {
                const latency = Math.round(endTime - startTime)
                this.log('debug', `Latency test: ${latency}ms to ${targetUrl}`)
                return latency
            }
            return -1
        } catch (error) {
            this.log('warning', `Latency test failed: ${error}`)
            return -1
        }
    }

    /**
     * Test TCP ping to the VPN server directly (not through tunnel)
     * Returns latency in milliseconds or -1 if failed
     */
    async testServerPing(): Promise<number> {
        if (!this.serverIp) {
            return -1
        }

        return new Promise((resolve) => {
            const net = require('net')
            const port = 443 // Use HTTPS port
            const startTime = performance.now()

            const socket = new net.Socket()
            socket.setTimeout(5000)

            socket.on('connect', () => {
                const latency = Math.round(performance.now() - startTime)
                socket.destroy()
                this.log('debug', `Server ping: ${latency}ms to ${this.serverIp}`)
                resolve(latency)
            })

            socket.on('error', () => {
                socket.destroy()
                resolve(-1)
            })

            socket.on('timeout', () => {
                socket.destroy()
                resolve(-1)
            })

            socket.connect(port, this.serverIp)
        })
    }

    /**
     * Start stats monitoring - fetches traffic from Clash API
     */
    private startStatsMonitoring() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval)
        }

        // Reset tracking values
        this.lastBytesReceived = 0
        this.lastBytesSent = 0
        this.lastStatsTime = Date.now()

        this.statsInterval = setInterval(async () => {
            if (this.status === 'connected' && this.connectTime > 0) {
                // Update connected time
                this.stats.connectedTime = Date.now() - this.connectTime

                // Fetch connection stats from Clash API /connections endpoint
                try {
                    const response = await fetch(`http://127.0.0.1:${this.clashApiPort}/connections`, {
                        signal: AbortSignal.timeout(1000)
                    })

                    if (response.ok) {
                        const data = await response.json()
                        const currentTime = Date.now()
                        const timeDelta = (currentTime - this.lastStatsTime) / 1000 // seconds

                        // /connections returns { downloadTotal: number, uploadTotal: number, connections: [] }
                        const downloadTotal = data.downloadTotal || 0
                        const uploadTotal = data.uploadTotal || 0

                        if (timeDelta > 0 && this.lastStatsTime > 0 && this.lastBytesReceived > 0) {
                            // Calculate speed (bytes per second)
                            const downloadDelta = downloadTotal - this.lastBytesReceived
                            const uploadDelta = uploadTotal - this.lastBytesSent

                            this.stats.downloadSpeed = downloadDelta > 0 ? downloadDelta / timeDelta : 0
                            this.stats.uploadSpeed = uploadDelta > 0 ? uploadDelta / timeDelta : 0
                        }

                        // Update totals
                        this.stats.totalDownloaded = downloadTotal
                        this.stats.totalUploaded = uploadTotal

                        // Store for next calculation
                        this.lastBytesReceived = downloadTotal
                        this.lastBytesSent = uploadTotal
                        this.lastStatsTime = currentTime
                    }
                } catch (error) {
                    // Clash API might not be ready yet, ignore errors
                }

                this.emitStateChange()
            }
        }, 1000)
    }

    /**
     * Disconnect
     */
    async disconnect(): Promise<{ success: boolean; error?: string }> {
        if (this.status === 'disconnected') {
            return { success: true }
        }

        this.status = 'disconnecting'
        this.emitStateChange()
        this.log('info', 'Disconnecting...')

        try {
            if (this.singboxProcess) {
                this.singboxProcess.kill('SIGTERM')

                // Force kill after 5 seconds
                setTimeout(() => {
                    if (this.singboxProcess) {
                        this.singboxProcess.kill('SIGKILL')
                    }
                }, 5000)
            }

            // Disable Windows System Proxy
            this.setSystemProxy(false)

            // Remove server exclusion route
            if (this.serverIp) {
                try {
                    execSync(`route delete ${this.serverIp}`, { encoding: 'utf8', timeout: 5000, stdio: 'pipe' })
                } catch { /* ignore */ }
            }

            this.cleanup()
            this.status = 'disconnected'
            this.emitStateChange()
            this.log('info', 'Disconnected')

            return { success: true }
        } catch (error) {
            this.log('error', `Disconnect error: ${error}`)
            return { success: false, error: String(error) }
        }
    }

    /**
     * Cleanup resources
     */
    /**
     * Generate temporary test configuration for checking real delay
     */
    private generateTestConfig(protocol: VpnProtocol, config: SingboxProfile, localPort: number): object {
        let outbound: any
        const serverAddress = config.address

        switch (protocol) {
            case 'vless':
                outbound = {
                    type: 'vless',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    uuid: config.uuid,
                    packet_encoding: 'xudp',
                    tls: config.security === 'tls' || config.security === 'reality' ? {
                        enabled: true,
                        server_name: config.sni || config.address,
                        insecure: config.allowInsecure || false,
                        alpn: config.transport === 'ws' ? ['http/1.1'] : (config.alpn || ['h2', 'http/1.1']),
                        utls: {
                            enabled: true,
                            fingerprint: config.fingerprint || 'chrome'
                        }
                    } : undefined,
                    transport: this.buildTransport(config)
                }
                if (config.security === 'reality') {
                    outbound.tls.reality = {
                        enabled: true,
                        public_key: config.publicKey || '',
                        short_id: config.shortId || ''
                    }
                }
                break

            case 'vmess':
                outbound = {
                    type: 'vmess',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    uuid: config.uuid,
                    security: config.encryption || 'auto',
                    alter_id: 0,
                    packet_encoding: 'xudp',
                    tls: config.security === 'tls' ? {
                        enabled: true,
                        server_name: config.sni || config.address,
                        insecure: config.allowInsecure || false,
                        alpn: config.transport === 'ws' ? ['http/1.1'] : (config.alpn || ['h2', 'http/1.1']),
                        utls: {
                            enabled: true,
                            fingerprint: config.fingerprint || 'chrome'
                        }
                    } : undefined,
                    transport: this.buildTransport(config)
                }
                break

            case 'trojan':
                outbound = {
                    type: 'trojan',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    password: config.uuid,
                    tls: {
                        enabled: true,
                        server_name: config.sni || config.address,
                        insecure: config.allowInsecure || false,
                        alpn: config.alpn,
                        utls: {
                            enabled: true,
                            fingerprint: config.fingerprint || 'chrome'
                        }
                    },
                    transport: this.buildTransport(config)
                }
                break

            case 'shadowsocks':
                outbound = {
                    type: 'shadowsocks',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    password: config.uuid,
                    method: config.method || 'aes-256-gcm'
                }
                break

            default:
                throw new Error(`Unsupported protocol: ${protocol}`)
        }

        return {
            log: {
                level: 'warn'
            },
            inbounds: [
                {
                    type: 'socks',
                    tag: 'socks-in',
                    listen: '127.0.0.1',
                    listen_port: localPort
                }
            ],
            outbounds: [
                outbound,
                {
                    type: 'direct',
                    tag: 'direct'
                }
            ],
            route: {
                rules: [],
                final: 'proxy'
            }
        }
    }

    /**
     * Test real delay to Google via a temporary proxy connection
     */
    async testProfileRealDelay(protocol: VpnProtocol, config: SingboxProfile): Promise<number> {
        // Find a random free port
        const getFreePort = (): Promise<number> => new Promise((resolve, reject) => {
            const server = net.createServer()
            server.unref()
            server.on('error', reject)
            server.listen(0, '127.0.0.1', () => {
                const port = (server.address() as net.AddressInfo).port
                server.close(() => resolve(port))
            })
        })

        let localPort = 0
        try {
            localPort = await getFreePort()
        } catch (e) {
            localPort = 10000 + Math.floor(Math.random() * 5000)
        }

        const testConfigPath = path.join(this.appDataPath, `singbox-test-${localPort}.json`)
        const testConfig = this.generateTestConfig(protocol, config, localPort)
        
        fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2))

        const singboxPath = this.getSingboxPath()
        const child = spawn(singboxPath, ['run', '-c', testConfigPath], {
            windowsHide: true
        })

        // Wait a bit for sing-box to spin up SOCKS listener
        await new Promise(resolve => setTimeout(resolve, 350))

        const cleanup = () => {
            try { child.kill() } catch (e) {}
            try { fs.unlinkSync(testConfigPath) } catch (e) {}
        }

        try {
            const delay = await new Promise<number>((resolve, reject) => {
                const socket = new net.Socket()
                socket.setTimeout(5000) // 5s timeout for real delay
                let startTime = 0  // Will be set AFTER SOCKS5 connection is established

                socket.connect(localPort, '127.0.0.1', () => {
                    // SOCKS5 Greeting
                    socket.write(Buffer.from([0x05, 0x01, 0x00]))
                })

                let state = 'greeting'

                socket.on('data', (data) => {
                    if (state === 'greeting') {
                        if (data[0] === 0x05 && data[1] === 0x00) {
                            state = 'connect'
                            const targetHost = 'www.gstatic.com'
                            const targetPort = 80
                            const hostBuffer = Buffer.from(targetHost)
                            const request = Buffer.alloc(7 + hostBuffer.length)
                            request[0] = 0x05
                            request[1] = 0x01
                            request[2] = 0x00
                            request[3] = 0x03
                            request[4] = hostBuffer.length
                            hostBuffer.copy(request, 5)
                            request.writeUInt16BE(targetPort, 5 + hostBuffer.length)
                            socket.write(request)
                        } else {
                            socket.destroy()
                            reject(new Error('SOCKS5 Greeting failed'))
                        }
                    } else if (state === 'connect') {
                        if (data[0] === 0x05 && data[1] === 0x00) {
                            state = 'http'
                            // Start timing AFTER SOCKS5 tunnel is established (matching V2RayN behavior)
                            startTime = performance.now()
                            const httpRequest = `GET /generate_204 HTTP/1.1\r\nHost: www.gstatic.com\r\nConnection: close\r\n\r\n`
                            socket.write(httpRequest)
                        } else {
                            socket.destroy()
                            reject(new Error('SOCKS5 Connection failed'))
                        }
                    } else if (state === 'http') {
                        const latency = Math.round(performance.now() - startTime)
                        socket.destroy()
                        resolve(latency)
                    }
                })

                socket.on('error', (err) => {
                    socket.destroy()
                    reject(err)
                })

                socket.on('timeout', () => {
                    socket.destroy()
                    reject(new Error('Timeout'))
                })
            })

            cleanup()
            return delay
        } catch (err) {
            cleanup()
            return -1
        }
    }

    private cleanup() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval)
            this.statsInterval = null
        }
        this.singboxProcess = null
        this.stats = this.createEmptyStats()
        this.connectTime = 0 // Reset connectTime to prevent stale time display
        this.serverIp = ''
    }

    /**
     * Get current state for IPC
     */
    getState() {
        return {
            status: this.status,
            stats: this.stats
        }
    }
}
