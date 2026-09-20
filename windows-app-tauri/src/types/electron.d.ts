export interface VpnState {
    status: 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error'
    profile: any | null
    stats: {
        uploadSpeed: number
        downloadSpeed: number
        totalUploaded: number
        totalDownloaded: number
        connectedTime: number
        privateIp: string
        publicIp: string
        mtu?: number
        transportProtocol?: 'TCP' | 'UDP/DTLS'
    }
}

export interface VpnLog {
    level: 'info' | 'warning' | 'error' | 'debug'
    message: string
    timestamp: number
}

export interface ElectronAPI {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    getVpnState: () => Promise<VpnState>
    connect: (profile: any) => Promise<{ success: boolean; error?: string }>
    disconnect: () => Promise<{ success: boolean; error?: string }>
    isElevated: () => Promise<boolean>
    testLatency: () => Promise<{ success: boolean; latency: number; error?: string }>
    testServerPing: () => Promise<{ success: boolean; latency: number; error?: string }>
    tcpPing: (host: string, port: number) => Promise<{ success: boolean; latency: number; error?: string }>
    httpPing: (host: string, port: number, tls?: boolean, sni?: string) => Promise<{ success: boolean; latency: number; error?: string }>
    testProfileRealDelay: (profile: any, testUrl?: string) => Promise<{ success: boolean; latency: number; error?: string }>
    batchRealDelay: (profiles: any[], testUrl?: string) => Promise<Record<string, number>>
    showSaveDialog: (options: {
        title?: string
        defaultPath?: string
        filters?: Array<{ name: string; extensions: string[] }>
    }) => Promise<{ canceled: boolean; filePath?: string }>
    showOpenDialog: (options: {
        title?: string
        filters?: Array<{ name: string; extensions: string[] }>
        properties?: string[]
    }) => Promise<{ canceled: boolean; filePaths?: string[] }>
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
    fetchSubscription: (url: string) => Promise<{ success: boolean; headers?: Record<string, string>; content?: string; error?: string }>
    onVpnStateChanged: (callback: (state: VpnState) => void) => void
    onVpnLog?: (callback: (log: VpnLog) => void) => void
    onPingResult?: (callback: (result: { profileId: string; latency: number; mode: string }) => void) => void
    onTrayConnect: (callback: () => void) => void
    onTrayDisconnect: (callback: () => void) => void
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI
    }
}
