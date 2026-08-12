// VPN Protocol types
export type VpnProtocol = 'openconnect' | 'vless' | 'vmess' | 'trojan' | 'shadowsocks'

export const PROTOCOL_INFO: Record<VpnProtocol, { displayName: string; description: string }> = {
    openconnect: { displayName: 'OpenConnect', description: 'Cisco AnyConnect compatible' },
    vless: { displayName: 'VLESS', description: 'Lightweight V2Ray protocol' },
    vmess: { displayName: 'VMess', description: 'V2Ray main protocol' },
    trojan: { displayName: 'Trojan', description: 'Trojan-GFW protocol' },
    shadowsocks: { displayName: 'Shadowsocks', description: 'Secure SOCKS5 proxy' }
}

// sing-box transport types
export type SingboxTransport = 'tcp' | 'ws' | 'grpc' | 'httpupgrade' | 'xhttp'
export type SingboxSecurity = 'none' | 'tls' | 'reality'

// sing-box specific profile configuration
export interface SingboxProfile {
    uuid: string                    // VLESS/VMess UUID or Trojan/SS password
    address: string
    port: number
    encryption?: string             // "none" for VLESS, "auto" for VMess
    transport: SingboxTransport
    security: SingboxSecurity
    tunStack?: 'mixed' | 'gvisor' | 'system'

    // TLS options
    sni?: string
    fingerprint?: string            // "chrome", "firefox", "safari", etc.
    alpn?: string[]
    allowInsecure?: boolean

    // Transport options
    path?: string                   // WebSocket/gRPC path
    host?: string                   // HTTP Host header
    serviceName?: string            // gRPC service name
    mode?: string                   // xhttp mode: "auto", "stream-one", "stream-up", "packet-up"

    // Shadowsocks specific
    method?: string                 // Cipher method: "aes-256-gcm", "chacha20-ietf-poly1305", etc.

    // Reality specific  
    publicKey?: string
    shortId?: string

    // Iran IP bypass - routes Iranian IPs directly (not through tunnel)
    bypassIranRoutes?: boolean

    // Custom bypass domains and IPs
    bypassDomains?: string[]
    bypassIps?: string[]
}

// Connection state
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error'

// Authentication type
export type AuthType = 'password' | 'certificate' | 'both'

// VPN Profile
export interface VpnProfile {
    id: string
    name: string
    serverAddress: string
    protocol: VpnProtocol
    port: number
    username: string
    password: string
    authType: AuthType
    subscriptionId?: string

    // Optional certificate
    certificatePath?: string
    caCertificatePath?: string
    skipCertificateVerification: boolean

    // OpenConnect specific
    disableDtls: boolean
    mtu?: number
    dtlsCiphers?: string
    preferWintun: boolean
    bypassIranRoutes?: boolean        // Route Iranian IPs directly (bypass VPN tunnel)

    // sing-box specific (for VLESS, VMess, Trojan, Shadowsocks)
    singboxConfig?: SingboxProfile

    // Server location
    countryCode?: string

    // Metadata
    isDefault: boolean
    lastConnected?: number
    createdAt: number
    ping?: number
    realDelay?: number
}

// Connection statistics
export interface ConnectionStats {
    uploadSpeed: number
    downloadSpeed: number
    totalUploaded: number
    totalDownloaded: number
    connectedTime: number
    privateIp: string
    publicIp: string
    countryCode?: string
    countryName?: string
    mtu: number
    transportProtocol?: 'TCP' | 'UDP/DTLS'
}

// Connection info
export interface VpnConnectionInfo {
    status: ConnectionState
    profile: VpnProfile | null
    stats: ConnectionStats
    errorMessage?: string
}

// Log entry
export interface ConnectionLog {
    id: string
    profileId: string
    profileName: string
    timestamp: number
    level: 'info' | 'warning' | 'error' | 'debug' | 'success'
    message: string
}

// VPN Subscription
export interface VpnSubscription {
    id: string
    name: string
    url: string
    upload: number
    download: number
    total: number
    expire: number // 0 means no expiration
    lastUpdated: number
    createdAt: number
}

// App settings
export interface AppSettings {
    startWithWindows: boolean
    minimizeToTray: boolean
    bufferSize: number
    tcpNoDelay: boolean
    mtuSize: number
    theme: 'dark' | 'light'
    notifications: boolean
    tunStack: 'mixed' | 'gvisor' | 'system'
    bypassPrivateIps?: boolean
    bypassDomains?: string[]
    bypassIps?: string[]
}

// Create default profile
export function createDefaultProfile(): VpnProfile {
    return {
        id: crypto.randomUUID(),
        name: '',
        serverAddress: '',
        protocol: 'openconnect',
        port: 443,
        username: '',
        password: '',
        authType: 'password',
        skipCertificateVerification: true,
        disableDtls: false,
        preferWintun: true,
        isDefault: false,
        createdAt: Date.now()
    }
}

// Create default settings
export function createDefaultSettings(): AppSettings {
    return {
        startWithWindows: false,
        minimizeToTray: true,
        bufferSize: 2097152, // 2MB
        tcpNoDelay: true,
        mtuSize: 1400,
        theme: 'dark',
        notifications: true,
        tunStack: 'system',
        bypassPrivateIps: true,
        bypassDomains: [],
        bypassIps: []
    }
}

// Format bytes
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format duration
export function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Format bits (for speed display - matches ISP advertised speeds like Mbps)
export function formatBits(bytesPerSecond: number): string {
    const bitsPerSecond = bytesPerSecond * 8
    if (bitsPerSecond === 0) return '0 b'
    const k = 1000 // Use 1000 for bits (not 1024) as is standard for network speeds
    const sizes = ['b', 'Kb', 'Mb', 'Gb', 'Tb']
    const i = Math.floor(Math.log(bitsPerSecond) / Math.log(k))
    return Math.round(bitsPerSecond / Math.pow(k, i)) + ' ' + sizes[i]
}
