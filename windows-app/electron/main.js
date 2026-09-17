var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, Notification } from 'electron';
// Enable hardware acceleration - disabling it at start can cause issues on some systems, but fixes blank screen on Windows 10
app.disableHardwareAcceleration();
import path from 'path';
import { exec, execSync } from 'child_process';
import fs from 'fs';
// Setup global crash logger (only on error)
var logPath = path.join(app.getPath('userData'), 'crash.log');
process.on('uncaughtException', function (error) {
    // Only write to file if a crash actually happens
    try {
        fs.appendFileSync(logPath, "[".concat(new Date().toISOString(), "] CRITICAL ERROR: ").concat(error.stack || error, "\n"));
    }
    catch (_a) { } // Ignore logging errors
    dialog.showErrorBox('Application Error', "The application encountered a critical error:\n".concat(error.message));
    process.exit(1);
});
// Lazy load vpnService to speed up startup
var vpnService = null;
function getVpnService() {
    if (!vpnService) {
        vpnService = require('./vpn-service').vpnService;
    }
    return vpnService;
}
// Lazy load singboxService for V2Ray protocols
var singboxService = null;
function getSingboxService() {
    if (!singboxService) {
        var SingboxService = require('./singbox-service').SingboxService;
        singboxService = new SingboxService();
    }
    return singboxService;
}
// Settings for notifications (can be controlled from renderer)
var notificationsEnabled = true;
// Show system notification
function showNotification(title, body) {
    if (!notificationsEnabled)
        return;
    if (Notification.isSupported()) {
        var notification = new Notification({
            title: title,
            body: body,
            silent: false
        });
        notification.show();
    }
}
// ===== PERFORMANCE OPTIMIZATIONS =====
// Detect if running in a VM (Hyper-V, VMware, VirtualBox)
function checkVMStatus(callback) {
    var exec = require('child_process').exec;
    exec('wmic computersystem get model', { encoding: 'utf-8' }, function (error, stdout) {
        if (error) {
            callback(false);
            return;
        }
        var vmIndicators = ['virtual', 'vmware', 'virtualbox', 'hyper-v', 'qemu', 'xen'];
        var isVM = vmIndicators.some(function (indicator) { return stdout.toLowerCase().includes(indicator); });
        callback(isVM);
    });
}
// Common optimizations for faster startup
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('no-proxy-server');
// Prevent garbage collection
var mainWindow = null;
var tray = null;
var isQuitting = false;
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
    });
    // Load URL first, then set up the show handler
    mainWindow.webContents.on('console-message', function (event, level, message, line, sourceId) {
        console.log("[Renderer] ".concat(message, " (").concat(sourceId, ":").concat(line, ")"));
    });
    if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    // Strategies to show window precisely ONCE
    var windowShown = false;
    var showWindowOnce = function (reason) {
        if (!windowShown && mainWindow) {
            console.log("Showing window due to: ".concat(reason));
            windowShown = true;
            mainWindow.show();
            mainWindow.focus();
        }
    };
    mainWindow.webContents.once('did-finish-load', function () {
        console.log('webContents did-finish-load fired');
        setTimeout(function () { return showWindowOnce('did-finish-load'); }, 150);
    });
    mainWindow.webContents.once('dom-ready', function () {
        console.log('webContents dom-ready fired');
        showWindowOnce('dom-ready');
    });
    // Fallback: Show after 5s max no matter what
    setTimeout(function () { return showWindowOnce('fallback'); }, 5000);
    mainWindow.on('close', function (event) {
        if (!isQuitting) {
            isQuitting = true;
            app.quit();
        }
    });
}
function createTray() {
    // Create a simple fallback icon (16x16 cyan square) as base64
    var fallbackIconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAP0lEQVQ4T2NkYGD4z4AHMOKTZxgVQJgEBoYArAYQox+rFxgYGP4TchVWMSIcRzQDBj9omBBljdAOJMolBAAAN3QIEUkH3+0AAAAASUVORK5CYII=';
    // Try to load icon from various paths
    var icon = null;
    var possiblePaths = app.isPackaged
        ? [
            path.join(process.resourcesPath, 'app.asar', 'dist', 'icon.png'),
            path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'icon.png'),
            path.join(__dirname, '../dist/icon.png'),
            path.join(process.resourcesPath, 'icon.png')
        ]
        : [
            path.join(__dirname, '../public/icon.png'),
            path.join(__dirname, '../dist/icon.png')
        ];
    var fs = require('fs');
    for (var _i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
        var iconPath = possiblePaths_1[_i];
        try {
            if (fs.existsSync(iconPath)) {
                var loadedIcon = nativeImage.createFromPath(iconPath);
                if (!loadedIcon.isEmpty()) {
                    // Resize to standard tray size
                    icon = loadedIcon.resize({ width: 16, height: 16 });
                    break;
                }
            }
        }
        catch (e) {
            // Continue to next path
        }
    }
    // Use fallback if no icon was loaded
    if (!icon || icon.isEmpty()) {
        icon = nativeImage.createFromDataURL("data:image/png;base64,".concat(fallbackIconBase64));
    }
    try {
        tray = new Tray(icon);
    }
    catch (e) {
        console.error('Failed to create tray:', e);
        tray = new Tray(nativeImage.createFromDataURL("data:image/png;base64,".concat(fallbackIconBase64)));
    }
    var contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Secure VPN',
            click: function () { return mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show(); }
        },
        { type: 'separator' },
        {
            label: 'Connect',
            click: function () { return mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('tray-connect'); }
        },
        {
            label: 'Disconnect',
            click: function () { return mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('tray-disconnect'); }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: function () {
                isQuitting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('Secure VPN');
    tray.setContextMenu(contextMenu);
    tray.on('click', function () { return mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show(); });
}
// Update tray icon based on connection status
function updateTrayStatus(status) {
    if (!tray)
        return;
    var tooltips = {
        'connected': 'Secure VPN - Connected',
        'connecting': 'Secure VPN - Connecting...',
        'disconnected': 'Secure VPN - Disconnected',
        'disconnecting': 'Secure VPN - Disconnecting...',
        'error': 'Secure VPN - Connection Error'
    };
    tray.setToolTip(tooltips[status] || 'Secure VPN');
}
// Check if running as administrator (async to prevent blocking)
function isElevatedAsync() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    exec('net session', function (err) {
                        resolve(!err);
                    });
                })];
        });
    });
}
// Keep sync one for IPC if needed, but avoid during startup
function isElevatedSync() {
    try {
        execSync('net session', { stdio: 'ignore' });
        return true;
    }
    catch (_a) {
        return false;
    }
}
// Setup IPC handlers - must be called after app is ready
function setupIpcHandlers() {
    var _this = this;
    ipcMain.handle('window:minimize', function () { return mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.minimize(); });
    ipcMain.handle('window:maximize', function () {
        if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.maximize();
        }
    });
    ipcMain.handle('window:close', function () {
        isQuitting = true;
        app.quit();
    });
    // VPN state
    ipcMain.handle('vpn:getState', function () { return getVpnService().getState(); });
    // VPN connect - uses OpenConnect or sing-box based on protocol
    ipcMain.handle('vpn:connect', function (_event, profile) { return __awaiter(_this, void 0, void 0, function () {
        var result, singboxProtocols, singboxConfig, singbox, result, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!isElevatedSync()) return [3 /*break*/, 2];
                    return [4 /*yield*/, dialog.showMessageBox(mainWindow, {
                            type: 'warning',
                            title: 'Administrator Required',
                            message: 'VPN connections require administrator privileges.',
                            detail: 'Please restart the application as Administrator to connect to the VPN.',
                            buttons: ['OK'],
                            defaultId: 0
                        })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, { success: false, error: 'Administrator privileges required. Please restart as Administrator.' }];
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    singboxProtocols = ['vless', 'vmess', 'trojan', 'shadowsocks'];
                    if (!singboxProtocols.includes(profile.protocol)) return [3 /*break*/, 4];
                    singboxConfig = __assign(__assign({}, profile.singboxConfig), { address: profile.serverAddress, port: profile.port });
                    singbox = getSingboxService();
                    return [4 /*yield*/, singbox.connect(profile.protocol, singboxConfig, profile.name)];
                case 3:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 4: return [4 /*yield*/, getVpnService().connect(profile)];
                case 5:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    return [2 /*return*/, { success: false, error: String(error_1) }];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    // VPN disconnect
    ipcMain.handle('vpn:disconnect', function () { return __awaiter(_this, void 0, void 0, function () {
        var vpnResult, singboxResult, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getVpnService().disconnect()];
                case 1:
                    vpnResult = _a.sent();
                    return [4 /*yield*/, getSingboxService().disconnect()];
                case 2:
                    singboxResult = _a.sent();
                    return [2 /*return*/, vpnResult.success || singboxResult.success ? { success: true } : vpnResult];
                case 3:
                    error_2 = _a.sent();
                    return [2 /*return*/, { success: false, error: String(error_2) }];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Check elevation status
    ipcMain.handle('vpn:isElevated', function () { return isElevatedSync(); });
    // Singbox latency test
    ipcMain.handle('singbox:testLatency', function () { return __awaiter(_this, void 0, void 0, function () {
        var singbox, latency, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    singbox = getSingboxService();
                    return [4 /*yield*/, singbox.testLatency()];
                case 1:
                    latency = _a.sent();
                    return [2 /*return*/, { success: true, latency: latency }];
                case 2:
                    error_3 = _a.sent();
                    return [2 /*return*/, { success: false, latency: -1, error: String(error_3) }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Singbox server ping (TCP ping to VPN server)
    ipcMain.handle('singbox:testServerPing', function () { return __awaiter(_this, void 0, void 0, function () {
        var singbox, latency, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    singbox = getSingboxService();
                    return [4 /*yield*/, singbox.testServerPing()];
                case 1:
                    latency = _a.sent();
                    return [2 /*return*/, { success: true, latency: latency }];
                case 2:
                    error_4 = _a.sent();
                    return [2 /*return*/, { success: false, latency: -1, error: String(error_4) }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // TCP Ping for testing delays
    ipcMain.handle('tcp-ping', function (_event, host, port) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var net = require('net');
                    var startTime = performance.now();
                    var socket = new net.Socket();
                    socket.setTimeout(2500); // 2.5s timeout for fast checking
                    socket.on('connect', function () {
                        var latency = Math.round(performance.now() - startTime);
                        socket.destroy();
                        resolve({ success: true, latency: latency });
                    });
                    socket.on('error', function (err) {
                        socket.destroy();
                        resolve({ success: false, latency: -1, error: err.message });
                    });
                    socket.on('timeout', function () {
                        socket.destroy();
                        resolve({ success: false, latency: -1, error: 'Timeout' });
                    });
                    socket.connect(port, host);
                })];
        });
    }); });
    // File dialog handlers for import/export
    ipcMain.handle('dialog:showSave', function (_event, options) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, dialog.showSaveDialog(mainWindow, options)];
        });
    }); });
    ipcMain.handle('dialog:showOpen', function (_event, options) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, dialog.showOpenDialog(mainWindow, options)];
        });
    }); });
    // Fetch subscription
    ipcMain.handle('subscription:fetch', function (_event, url) { return __awaiter(_this, void 0, void 0, function () {
        var response, content, headers_1, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch(url, {
                            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                            signal: AbortSignal.timeout(15000)
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        return [2 /*return*/, { success: false, error: "HTTP Error: ".concat(response.status) }];
                    }
                    return [4 /*yield*/, response.text()];
                case 2:
                    content = _a.sent();
                    headers_1 = {};
                    response.headers.forEach(function (value, key) {
                        headers_1[key.toLowerCase()] = value;
                    });
                    return [2 /*return*/, { success: true, content: content, headers: headers_1 }];
                case 3:
                    error_5 = _a.sent();
                    return [2 /*return*/, { success: false, error: String(error_5) }];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle('file:write', function (_event, filePath, content) { return __awaiter(_this, void 0, void 0, function () {
        var fs_1, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, import('fs/promises')];
                case 1:
                    fs_1 = _a.sent();
                    return [4 /*yield*/, fs_1.writeFile(filePath, content, 'utf-8')];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
                case 3:
                    error_6 = _a.sent();
                    return [2 /*return*/, { success: false, error: String(error_6) }];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    ipcMain.handle('file:read', function (_event, filePath) { return __awaiter(_this, void 0, void 0, function () {
        var fs_2, content, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, import('fs/promises')];
                case 1:
                    fs_2 = _a.sent();
                    return [4 /*yield*/, fs_2.readFile(filePath, 'utf-8')];
                case 2:
                    content = _a.sent();
                    return [2 /*return*/, { success: true, content: content }];
                case 3:
                    error_7 = _a.sent();
                    return [2 /*return*/, { success: false, error: String(error_7) }];
                case 4: return [2 /*return*/];
            }
        });
    }); });
}
// Setup VPN service event handlers
function setupVpnServiceEvents() {
    var previousStatus = 'disconnected';
    var service = getVpnService();
    service.on('stateChanged', function (state) {
        var _a;
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('vpn:stateChanged', state);
        updateTrayStatus(state.status);
        // Send notifications on status change
        if (state.status !== previousStatus) {
            if (state.status === 'connected') {
                showNotification('VPN Connected', "Connected to ".concat(((_a = state.profile) === null || _a === void 0 ? void 0 : _a.name) || 'VPN server'));
            }
            else if (state.status === 'disconnected' && previousStatus === 'connected') {
                showNotification('VPN Disconnected', 'Your VPN connection has been terminated');
            }
            else if (state.status === 'error') {
                showNotification('VPN Error', 'Connection failed. Check logs for details.');
            }
            previousStatus = state.status;
        }
    });
    service.on('log', function (log) {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('vpn:log', log);
    });
}
// Setup sing-box service event handlers
function setupSingboxServiceEvents() {
    var previousStatus = 'disconnected';
    var singbox = getSingboxService();
    singbox.on('stateChange', function (state) {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('vpn:stateChanged', state);
        updateTrayStatus(state.status);
        // Send notifications on status change
        if (state.status !== previousStatus) {
            if (state.status === 'connected') {
                showNotification('VPN Connected', 'Connected via sing-box');
            }
            else if (state.status === 'disconnected' && previousStatus === 'connected') {
                showNotification('VPN Disconnected', 'Your VPN connection has been terminated');
            }
            else if (state.status === 'error') {
                showNotification('VPN Error', 'Connection failed. Check logs for details.');
            }
            previousStatus = state.status;
        }
    });
    singbox.on('log', function (log) {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('vpn:log', log);
    });
}
// App lifecycle
console.log('Main process starting...');
app.whenReady().then(function () { return __awaiter(void 0, void 0, void 0, function () {
    var elevated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('App ready, creating window...');
                createWindow();
                createTray();
                setupIpcHandlers();
                setupVpnServiceEvents();
                setupSingboxServiceEvents();
                console.log('System handlers initialized');
                return [4 /*yield*/, isElevatedAsync()];
            case 1:
                elevated = _a.sent();
                console.log('Elevation status:', elevated);
                if (!elevated) {
                    dialog.showMessageBox({
                        type: 'info',
                        title: 'Administrator Mode Recommended',
                        message: 'For full VPN functionality, run this application as Administrator.',
                        detail: 'VPN connections require administrator privileges.',
                        buttons: ['OK']
                    });
                }
                return [2 /*return*/];
        }
    });
}); });
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
app.on('before-quit', function (event) {
    var service = getVpnService();
    // If connected, we must disconnect to clean up routes
    if (service.getStatus() === 'connected' || service.getStatus() === 'connecting') {
        // If we haven't already initiated the shutdown sequence
        if (!isQuitting) {
            event.preventDefault(); // Stop the quit process
            isQuitting = true; // Mark as quitting to prevent loops if we call quit again (though here we just wait)
            // Show notification if possible
            if (Notification.isSupported()) {
                new Notification({ title: 'Exiting', body: 'Cleaning up VPN routes...' }).show();
            }
            // Disconnect and then quit
            service.disconnect().finally(function () {
                app.quit();
            });
            return;
        }
    }
    // If properly disconnected or force quitting, allow exit
    isQuitting = true;
});
