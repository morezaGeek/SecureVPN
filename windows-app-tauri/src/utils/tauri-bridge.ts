import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import type { ElectronAPI } from '../types/electron'

export function setupTauriBridge() {
    const appWindow = getCurrentWindow()

    const tauriAPI: ElectronAPI = {
        minimize: async () => {
            try {
                await invoke('app_minimize')
            } catch (err) {
                console.error('Minimize error:', err)
            }
        },
        maximize: async () => {
            try {
                await invoke('app_maximize')
            } catch (err) {
                console.error('Maximize error:', err)
            }
        },
        close: async () => {
            try {
                await invoke('app_close')
            } catch (err) {
                console.error('Close error:', err)
            }
        },
        getVpnState: async () => {
            return await invoke('vpn_get_state')
        },
        connect: async (profile: any) => {
            return await invoke('vpn_connect', { profile })
        },
        disconnect: async () => {
            return await invoke('vpn_disconnect')
        },
        isElevated: async () => {
            return await invoke('vpn_is_elevated')
        },
        testLatency: async () => {
            return await invoke('singbox_test_latency')
        },
        testServerPing: async () => {
            return await invoke('singbox_test_server_ping')
        },
        tcpPing: async (host: string, port: number) => {
            return await invoke('tcp_ping', { host, port })
        },
        httpPing: async (host: string, port: number, tls?: boolean, sni?: string) => {
            return await invoke('http_ping', { host, port, tls, sni })
        },
        testProfileRealDelay: async (profile: any, testUrl?: string) => {
            return await invoke('singbox_test_profile_real_delay', { profile, testUrl })
        },
        batchRealDelay: async (profiles: any[], testUrl?: string) => {
            return await invoke('singbox_batch_real_delay', { profiles, testUrl })
        },
        showSaveDialog: async (options: any) => {
            try {
                const filePath = await save({
                    title: options.title,
                    defaultPath: options.defaultPath,
                    filters: options.filters
                })
                return { canceled: !filePath, filePath: filePath || undefined }
            } catch {
                return { canceled: true }
            }
        },
        showOpenDialog: async (options: any) => {
            try {
                const selected = await open({
                    title: options.title,
                    multiple: false,
                    directory: false,
                    filters: options.filters
                })
                if (selected && typeof selected === 'string') {
                    return { canceled: false, filePaths: [selected] }
                }
                return { canceled: true }
            } catch {
                return { canceled: true }
            }
        },
        writeFile: async (filePath: string, content: string) => {
            try {
                await writeTextFile(filePath, content)
                return { success: true }
            } catch (err: any) {
                return { success: false, error: String(err) }
            }
        },
        readFile: async (filePath: string) => {
            try {
                const content = await readTextFile(filePath)
                return { success: true, content }
            } catch (err: any) {
                return { success: false, error: String(err) }
            }
        },
        fetchSubscription: async (url: string) => {
            return await invoke('subscription_fetch', { url })
        },
        onVpnStateChanged: (callback: (state: any) => void) => {
            listen('vpn:stateChanged', (event: any) => callback(event.payload))
        },
        onVpnLog: (callback: (log: any) => void) => {
            listen('vpn:log', (event: any) => callback(event.payload))
        },
        onPingResult: (callback: (result: any) => void) => {
            listen('vpn:pingResult', (event: any) => callback(event.payload))
        },
        onTrayConnect: (callback: () => void) => {
            listen('tray:connect', () => callback())
        },
        onTrayDisconnect: (callback: () => void) => {
            listen('tray:disconnect', () => callback())
        }
    }

    ;(window as any).electronAPI = tauriAPI
    console.log('[TauriBridge] Initialized and mapped to window.electronAPI')
}
