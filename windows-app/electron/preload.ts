import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),

    // VPN operations
    getVpnState: () => ipcRenderer.invoke('vpn:getState'),
    connect: (profile: any) => ipcRenderer.invoke('vpn:connect', profile),
    disconnect: () => ipcRenderer.invoke('vpn:disconnect'),
    isElevated: () => ipcRenderer.invoke('vpn:isElevated'),
    testLatency: () => ipcRenderer.invoke('singbox:testLatency'),
    testServerPing: () => ipcRenderer.invoke('singbox:testServerPing'),
    tcpPing: (host: string, port: number) => ipcRenderer.invoke('tcp-ping', host, port),
    testProfileRealDelay: (profile: any) => ipcRenderer.invoke('singbox:testProfileRealDelay', profile),

    // File operations for import/export
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSave', options),
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpen', options),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
    readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),

    // Subscriptions
    fetchSubscription: (url: string) => ipcRenderer.invoke('subscription:fetch', url),

    // Event listeners
    onVpnStateChanged: (callback: (state: any) => void) => {
        ipcRenderer.on('vpn:stateChanged', (_event, state) => callback(state))
    },
    onVpnLog: (callback: (log: any) => void) => {
        ipcRenderer.on('vpn:log', (_event, log) => callback(log))
    },
    onTrayConnect: (callback: () => void) => {
        ipcRenderer.on('tray-connect', callback)
    },
    onTrayDisconnect: (callback: () => void) => {
        ipcRenderer.on('tray-disconnect', callback)
    }
})

// Type definitions for renderer
export interface ElectronAPI {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    getVpnState: () => Promise<any>
    connect: (profile: any) => Promise<{ success: boolean; error?: string }>
    disconnect: () => Promise<{ success: boolean; error?: string }>
    isElevated: () => Promise<boolean>
    testLatency: () => Promise<{ success: boolean; latency: number; error?: string }>
    testServerPing: () => Promise<{ success: boolean; latency: number; error?: string }>
    tcpPing: (host: string, port: number) => Promise<{ success: boolean; latency: number; error?: string }>
    testProfileRealDelay: (profile: any) => Promise<{ success: boolean; latency: number; error?: string }>
    showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>
    showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths?: string[] }>
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
    fetchSubscription: (url: string) => Promise<{ success: boolean; headers: Record<string, string>; content: string; error?: string }>
    onVpnStateChanged: (callback: (state: any) => void) => void
    onVpnLog: (callback: (log: any) => void) => void
    onTrayConnect: (callback: () => void) => void
    onTrayDisconnect: (callback: () => void) => void
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}

