import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: function () { return ipcRenderer.invoke('window:minimize'); },
    maximize: function () { return ipcRenderer.invoke('window:maximize'); },
    close: function () { return ipcRenderer.invoke('window:close'); },
    // VPN operations
    getVpnState: function () { return ipcRenderer.invoke('vpn:getState'); },
    connect: function (profile) { return ipcRenderer.invoke('vpn:connect', profile); },
    disconnect: function () { return ipcRenderer.invoke('vpn:disconnect'); },
    isElevated: function () { return ipcRenderer.invoke('vpn:isElevated'); },
    testLatency: function () { return ipcRenderer.invoke('singbox:testLatency'); },
    testServerPing: function () { return ipcRenderer.invoke('singbox:testServerPing'); },
    tcpPing: function (host, port) { return ipcRenderer.invoke('tcp-ping', host, port); },
    // File operations for import/export
    showSaveDialog: function (options) { return ipcRenderer.invoke('dialog:showSave', options); },
    showOpenDialog: function (options) { return ipcRenderer.invoke('dialog:showOpen', options); },
    writeFile: function (filePath, content) { return ipcRenderer.invoke('file:write', filePath, content); },
    readFile: function (filePath) { return ipcRenderer.invoke('file:read', filePath); },
    // Subscriptions
    fetchSubscription: function (url) { return ipcRenderer.invoke('subscription:fetch', url); },
    // Event listeners
    onVpnStateChanged: function (callback) {
        ipcRenderer.on('vpn:stateChanged', function (_event, state) { return callback(state); });
    },
    onVpnLog: function (callback) {
        ipcRenderer.on('vpn:log', function (_event, log) { return callback(log); });
    },
    onTrayConnect: function (callback) {
        ipcRenderer.on('tray-connect', callback);
    },
    onTrayDisconnect: function (callback) {
        ipcRenderer.on('tray-disconnect', callback);
    }
});
