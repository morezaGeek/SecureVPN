import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, Notification } from 'electron'
// Enable hardware acceleration - disabling it at start can cause issues on some systems, but fixes blank screen on Windows 10
app.disableHardwareAcceleration() 
import path from 'path'
import { exec, execSync } from 'child_process'
import fs from 'fs'
import os from 'os'

// Setup global crash logger (only on error)
const logPath = path.join(app.getPath('userData'), 'crash.log')

process.on('uncaughtException', (error) => {
    // Only write to file if a crash actually happens
    try {
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] CRITICAL ERROR: ${error.stack || error}\n`)
    } catch { } // Ignore logging errors

    dialog.showErrorBox('Application Error', `The application encountered a critical error:\n${error.message}`)
    process.exit(1)
})

// Lazy load vpnService to speed up startup
let vpnService: any = null
function getVpnService() {
    if (!vpnService) {
        vpnService = require('./vpn-service').vpnService
    }
    return vpnService
}

// Lazy load singboxService for V2Ray protocols
let singboxService: any = null
function getSingboxService() {
    if (!singboxService) {
        const { SingboxService } = require('./singbox-service')
        singboxService = new SingboxService()
    }
    return singboxService
}

// Settings for notifications (can be controlled from renderer)
let notificationsEnabled = true

// Show system notification
function showNotification(title: string, body: string) {
    if (!notificationsEnabled) return

    if (Notification.isSupported()) {
        const notification = new Notification({
            title,
            body,
            silent: false
        })
        notification.show()
    }
}

// ===== PERFORMANCE OPTIMIZATIONS =====
// Detect if running in a VM (Hyper-V, VMware, VirtualBox)
function checkVMStatus(callback: (isVM: boolean) => void) {
    const { exec } = require('child_process')
    exec('wmic computersystem get model', { encoding: 'utf-8' }, (error: Error | null, stdout: string) => {
        if (error) {
            callback(false)
            return
        }
        const vmIndicators = ['virtual', 'vmware', 'virtualbox', 'hyper-v', 'qemu', 'xen']
        const isVM = vmIndicators.some(indicator => stdout.toLowerCase().includes(indicator))
        callback(isVM)
    })
}

// Common optimizations for faster startup
app.commandLine.appendSwitch('disable-background-networking')
app.commandLine.appendSwitch('disable-breakpad')
app.commandLine.appendSwitch('no-proxy-server')

// Prevent garbage collection
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 720,
        minWidth: 800,
        minHeight: 600,
        useContentSize: false,
        center: true,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#0a0a1a',
        show: false, // Don't show until ready
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false
        }
    })

    // Load URL first, then set up the show handler
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer] ${message} (${sourceId}:${line})`)
    })

    if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173')
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    // Strategies to show window precisely ONCE
    let windowShown = false
    const showWindowOnce = (reason: string) => {
        if (!windowShown && mainWindow) {
            console.log(`Showing window due to: ${reason}`)
            windowShown = true
            mainWindow.show()
            mainWindow.focus()
        }
    }

    mainWindow.webContents.once('did-finish-load', () => {
        console.log('webContents did-finish-load fired')
        setTimeout(() => showWindowOnce('did-finish-load'), 150)
    })

    mainWindow.webContents.once('dom-ready', () => {
        console.log('webContents dom-ready fired')
        showWindowOnce('dom-ready')
    })

    // Fallback: Show after 5s max no matter what
    setTimeout(() => showWindowOnce('fallback'), 5000)

    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            isQuitting = true
            app.quit()
        }
    })
}

function createTray() {
    // Create a simple fallback icon (16x16 cyan square) as base64
    const fallbackIconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAP0lEQVQ4T2NkYGD4z4AHMOKTZxgVQJgEBoYArAYQox+rFxgYGP4TchVWMSIcRzQDBj9omBBljdAOJMolBAAAN3QIEUkH3+0AAAAASUVORK5CYII='

    // Try to load icon from various paths
    let icon: Electron.NativeImage | null = null

    const possiblePaths = app.isPackaged
        ? [
            path.join(process.resourcesPath, 'app.asar', 'dist', 'icon.png'),
            path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'icon.png'),
            path.join(__dirname, '../dist/icon.png'),
            path.join(process.resourcesPath, 'icon.png')
        ]
        : [
            path.join(__dirname, '../public/icon.png'),
            path.join(__dirname, '../dist/icon.png')
        ]

    const fs = require('fs')
    for (const iconPath of possiblePaths) {
        try {
            if (fs.existsSync(iconPath)) {
                const loadedIcon = nativeImage.createFromPath(iconPath)
                if (!loadedIcon.isEmpty()) {
                    // Resize to standard tray size
                    icon = loadedIcon.resize({ width: 16, height: 16 })
                    break
                }
            }
        } catch (e) {
            // Continue to next path
        }
    }

    // Use fallback if no icon was loaded
    if (!icon || icon.isEmpty()) {
        icon = nativeImage.createFromDataURL(`data:image/png;base64,${fallbackIconBase64}`)
    }

    try {
        tray = new Tray(icon)
    } catch (e) {
        console.error('Failed to create tray:', e)
        tray = new Tray(nativeImage.createFromDataURL(`data:image/png;base64,${fallbackIconBase64}`))
    }

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Secure VPN',
            click: () => mainWindow?.show()
        },
        { type: 'separator' },
        {
            label: 'Connect',
            click: () => mainWindow?.webContents.send('tray-connect')
        },
        {
            label: 'Disconnect',
            click: () => mainWindow?.webContents.send('tray-disconnect')
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true
                app.quit()
            }
        }
    ])

    tray.setToolTip('Secure VPN')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => mainWindow?.show())
}

// Update tray icon based on connection status
function updateTrayStatus(status: string) {
    if (!tray) return

    const tooltips: Record<string, string> = {
        'connected': 'Secure VPN - Connected',
        'connecting': 'Secure VPN - Connecting...',
        'disconnected': 'Secure VPN - Disconnected',
        'disconnecting': 'Secure VPN - Disconnecting...',
        'error': 'Secure VPN - Connection Error'
    }

    tray.setToolTip(tooltips[status] || 'Secure VPN')
}

// Check if running as administrator (async to prevent blocking)
async function isElevatedAsync(): Promise<boolean> {
    return new Promise((resolve) => {
        exec('net session', (err) => {
            resolve(!err)
        })
    })
}

// Keep sync one for IPC if needed, but avoid during startup
function isElevatedSync(): boolean {
    try {
        execSync('net session', { stdio: 'ignore' })
        return true
    } catch {
        return false
    }
}

// Setup IPC handlers - must be called after app is ready
function setupIpcHandlers() {
    ipcMain.handle('window:minimize', () => mainWindow?.minimize())
    ipcMain.handle('window:maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize()
        } else {
            mainWindow?.maximize()
        }
    })
    ipcMain.handle('window:close', () => {
        isQuitting = true
        app.quit()
    })

    // VPN state
    ipcMain.handle('vpn:getState', () => getVpnService().getState())

    // VPN connect - uses OpenConnect or sing-box based on protocol
    ipcMain.handle('vpn:connect', async (_event, profile) => {
        // Check for admin privileges
        if (!isElevatedSync()) {
            const result = await dialog.showMessageBox(mainWindow!, {
                type: 'warning',
                title: 'Administrator Required',
                message: 'VPN connections require administrator privileges.',
                detail: 'Please restart the application as Administrator to connect to the VPN.',
                buttons: ['OK'],
                defaultId: 0
            })
            return { success: false, error: 'Administrator privileges required. Please restart as Administrator.' }
        }

        try {
            // Route to appropriate service based on protocol
            const singboxProtocols = ['vless', 'vmess', 'trojan', 'shadowsocks']
            if (singboxProtocols.includes(profile.protocol)) {
                // Use sing-box for V2Ray protocols
                // Override singboxConfig with profile's main address/port (in case user edited them)
                const singboxConfig = {
                    ...profile.singboxConfig,
                    address: profile.serverAddress,
                    port: profile.port,
                    bypassPrivateIps: profile.bypassPrivateIps,
                    bypassDomains: profile.bypassDomains || profile.singboxConfig?.bypassDomains,
                    bypassIps: profile.bypassIps || profile.singboxConfig?.bypassIps,
                    bypassIranRoutes: profile.bypassIranRoutes || profile.singboxConfig?.bypassIranRoutes
                }
                const singbox = getSingboxService()
                const result = await singbox.connect(profile.protocol, singboxConfig, profile.name)
                return result
            } else {
                // Use OpenConnect for other protocols
                const result = await getVpnService().connect(profile)
                return result
            }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // VPN disconnect
    ipcMain.handle('vpn:disconnect', async () => {
        try {
            // Try to disconnect from both services (only one should be active)
            const vpnResult = await getVpnService().disconnect()
            const singboxResult = await getSingboxService().disconnect()
            return vpnResult.success || singboxResult.success ? { success: true } : vpnResult
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    // Check elevation status
    ipcMain.handle('vpn:isElevated', () => isElevatedSync())

    // Singbox latency test
    ipcMain.handle('singbox:testLatency', async () => {
        try {
            const singbox = getSingboxService()
            const latency = await singbox.testLatency()
            return { success: true, latency }
        } catch (error) {
            return { success: false, latency: -1, error: String(error) }
        }
    })

    // Singbox server ping (TCP ping to VPN server)
    ipcMain.handle('singbox:testServerPing', async () => {
        try {
            const singbox = getSingboxService()
            const latency = await singbox.testServerPing()
            return { success: true, latency }
        } catch (error) {
            return { success: false, latency: -1, error: String(error) }
        }
    })

    // TCP Ping for testing delays
    ipcMain.handle('tcp-ping', async (_event, host: string, port: number) => {
        return new Promise<{ success: boolean; latency: number; error?: string }>((resolve) => {
            const net = require('net')
            const dns = require('dns')
            
            // Pre-resolve DNS to exclude DNS lookup time from the latency measurement
            dns.lookup(host, (err: any, address: string) => {
                if (err) {
                    resolve({ success: false, latency: -1, error: 'DNS resolution failed: ' + err.message })
                    return
                }

                const startTime = performance.now()
                const socket = new net.Socket()
                socket.setTimeout(2500) // 2.5s timeout for fast checking

                socket.on('connect', () => {
                    const latency = Math.round(performance.now() - startTime)
                    socket.destroy()
                    resolve({ success: true, latency })
                })

                socket.on('error', (error: any) => {
                    socket.destroy()
                    resolve({ success: false, latency: -1, error: error.message })
                })

                socket.on('timeout', () => {
                    socket.destroy()
                    resolve({ success: false, latency: -1, error: 'Timeout' })
                })

                socket.connect(port, address)
            })
        })
    })

    // Singbox real delay test (TCP/HTTP request to google through proxy)
    ipcMain.handle('singbox:testProfileRealDelay', async (_event, profile) => {
        try {
            const singbox = getSingboxService()
            if (!['vless', 'vmess', 'trojan', 'shadowsocks'].includes(profile.protocol)) {
                return { success: false, latency: -1, error: 'Unsupported protocol' }
            }
            const latency = await singbox.testProfileRealDelay(profile.protocol, profile.singboxConfig)
            return {
                success: latency > 0,
                latency,
                error: latency > 0 ? undefined : 'Ping failed'
            }
        } catch (error) {
            return { success: false, latency: -1, error: String(error) }
        }
    })

    // File dialog handlers for import/export
    ipcMain.handle('dialog:showSave', async (_event, options) => {
        return dialog.showSaveDialog(mainWindow!, options)
    })

    ipcMain.handle('dialog:showOpen', async (_event, options) => {
        return dialog.showOpenDialog(mainWindow!, options)
    })

    // Fetch subscription
    ipcMain.handle('subscription:fetch', async (_event, url: string) => {
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                signal: AbortSignal.timeout(15000)
            })
            
            if (!response.ok) {
                return { success: false, error: `HTTP Error: ${response.status}` }
            }
            
            const content = await response.text()
            const headers: Record<string, string> = {}
            
            response.headers.forEach((value, key) => {
                headers[key.toLowerCase()] = value
            })
            
            return { success: true, content, headers }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
        try {
            const fs = await import('fs/promises')
            await fs.writeFile(filePath, content, 'utf-8')
            return { success: true }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })

    ipcMain.handle('file:read', async (_event, filePath: string) => {
        try {
            const fs = await import('fs/promises')
            const content = await fs.readFile(filePath, 'utf-8')
            return { success: true, content }
        } catch (error) {
            return { success: false, error: String(error) }
        }
    })
}

// Setup VPN service event handlers
function setupVpnServiceEvents() {
    let previousStatus = 'disconnected'
    const service = getVpnService()

    service.on('stateChanged', (state: any) => {
        mainWindow?.webContents.send('vpn:stateChanged', state)
        updateTrayStatus(state.status)

        // Send notifications on status change
        if (state.status !== previousStatus) {
            if (state.status === 'connected') {
                showNotification('VPN Connected', `Connected to ${state.profile?.name || 'VPN server'}`)
            } else if (state.status === 'disconnected' && previousStatus === 'connected') {
                showNotification('VPN Disconnected', 'Your VPN connection has been terminated')
            } else if (state.status === 'error') {
                showNotification('VPN Error', 'Connection failed. Check logs for details.')
            }
            previousStatus = state.status
        }
    })

    service.on('log', (log: any) => {
        mainWindow?.webContents.send('vpn:log', log)
    })
}

// Setup sing-box service event handlers
function setupSingboxServiceEvents() {
    let previousStatus = 'disconnected'
    const singbox = getSingboxService()

    singbox.on('stateChange', (state: any) => {
        mainWindow?.webContents.send('vpn:stateChanged', state)
        updateTrayStatus(state.status)

        // Send notifications on status change
        if (state.status !== previousStatus) {
            if (state.status === 'connected') {
                showNotification('VPN Connected', 'Connected via sing-box')
            } else if (state.status === 'disconnected' && previousStatus === 'connected') {
                showNotification('VPN Disconnected', 'Your VPN connection has been terminated')
            } else if (state.status === 'error') {
                showNotification('VPN Error', 'Connection failed. Check logs for details.')
            }
            previousStatus = state.status
        }
    })

    singbox.on('log', (log: any) => {
        mainWindow?.webContents.send('vpn:log', log)
    })
}

// App lifecycle
console.log('Main process starting...')
app.whenReady().then(async () => {
    console.log('App ready, creating window...')
    createWindow()
    createTray()

    setupIpcHandlers()
    setupVpnServiceEvents()
    setupSingboxServiceEvents()

    console.log('System handlers initialized')

    const elevated = await isElevatedAsync()
    console.log('Elevation status:', elevated)
    if (!elevated) {
        dialog.showMessageBox({
            type: 'info',
            title: 'Administrator Mode Recommended',
            message: 'For full VPN functionality, run this application as Administrator.',
            detail: 'VPN connections require administrator privileges.',
            buttons: ['OK']
        })
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.on('before-quit', (event) => {
    const service = getVpnService()
    // If connected, we must disconnect to clean up routes
    if (service.getStatus() === 'connected' || service.getStatus() === 'connecting') {
        // If we haven't already initiated the shutdown sequence
        if (!isQuitting) {
            event.preventDefault() // Stop the quit process
            isQuitting = true // Mark as quitting to prevent loops if we call quit again (though here we just wait)

            // Show notification if possible
            if (Notification.isSupported()) {
                new Notification({ title: 'Exiting', body: 'Cleaning up VPN routes...' }).show()
            }

            // Disconnect and then quit
            service.disconnect().finally(() => {
                app.quit()
            })
            return
        }
    }
    // If properly disconnected or force quitting, allow exit
    isQuitting = true
})
