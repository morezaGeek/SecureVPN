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

export interface UpdateInfo { version: string }
export interface UpdateProgress { downloaded: number; total: number; phase: 'downloading' | 'installing' }

export interface ElectronAPI {
    checkUpdate: () => Promise<UpdateInfo | null>
    installUpdate: () => Promise<void>
    onUpdateProgress: (callback: (progress: UpdateProgress) => void) => Promise<() => void>
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
    testProfileRealDelay: (profile: any, testUrl?: string, requestId?: string) => Promise<{ success: boolean; latency: number; error?: string }>
    cancelPingTests: () => Promise<void>
    batchRealDelay: (profiles: any[], testUrl?: string, requestId?: string) => Promise<Record<string, number>>
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
    fetchOriginalIp: () => Promise<string>
    onVpnStateChanged: (callback: (state: VpnState) => void) => void
    onVpnLog?: (callback: (log: VpnLog) => void) => void
    onPingResult?: (callback: (result: { profileId: string; latency: number; mode: string; requestId?: string }) => void) => void
    onTrayConnect: (callback: () => void) => void
    onTrayDisconnect: (callback: () => void) => void
    onTraySelectProfile?: (callback: (profileId: string) => void) => void
    updateTrayMenu?: (profiles: any[], isConnected: boolean, currentProfileId?: string) => Promise<void>
    openExternal?: (url: string) => Promise<void>
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI
    }
}
