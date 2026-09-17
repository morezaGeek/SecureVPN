var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { spawn, execSync, exec } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import tls from 'tls';
import { IRAN_IP_CIDRS } from './iran-ips';
var VpnService = /** @class */ (function (_super) {
    __extends(VpnService, _super);
    function VpnService() {
        var _this = _super.call(this) || this;
        _this.vpnProcess = null;
        _this.status = 'disconnected';
        _this.currentProfile = null;
        _this.stats = _this.createEmptyStats();
        _this.statsInterval = null;
        _this.lastBytesReceived = 0;
        _this.lastBytesSent = 0;
        _this.lastStatsTime = 0;
        _this.vpnInterfaceName = '';
        _this.vpnGateway = '';
        _this.originalGateway = '';
        _this.serverIp = '';
        _this.routesConfigured = false;
        _this.vpnMtu = 1200; // Default fallback - safe for DTLS
        _this.lastServerFingerprint = '';
        _this.lastServerFingerprintRetried = false;
        _this.excludeRoutes = [];
        _this.includeRoutes = [];
        _this.originalIfIndex = null;
        _this.vpnInterfaceIndex = null; // Parsed from OpenConnect stdout for instant routing
        _this.connectTime = 0; // Time when connection was established
        return _this;
    }
    /**
     * Convert CIDR notation (e.g., "5.52.0.0/16") to network and mask.
     * Used to add Iran IP exclusion routes.
     */
    VpnService.prototype.cidrToNetworkMask = function (cidr) {
        var parts = cidr.split('/');
        if (parts.length !== 2)
            return null;
        var network = parts[0];
        var prefix = parseInt(parts[1], 10);
        if (isNaN(prefix) || prefix < 0 || prefix > 32)
            return null;
        // Convert prefix length to subnet mask
        var maskNum = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
        var mask = [
            (maskNum >>> 24) & 255,
            (maskNum >>> 16) & 255,
            (maskNum >>> 8) & 255,
            maskNum & 255
        ].join('.');
        return { network: network, mask: mask };
    };
    VpnService.prototype.createEmptyStats = function () {
        return {
            uploadSpeed: 0,
            downloadSpeed: 0,
            totalUploaded: 0,
            totalDownloaded: 0,
            connectedTime: 0,
            privateIp: '',
            publicIp: '',
            transportProtocol: 'TCP'
        };
    };
    VpnService.prototype.getStatus = function () {
        return this.status;
    };
    VpnService.prototype.getStats = function () {
        return __assign({}, this.stats);
    };
    VpnService.prototype.getCurrentProfile = function () {
        return this.currentProfile;
    };
    VpnService.prototype.emitStateChange = function () {
        this.emit('stateChanged', {
            status: this.status,
            profile: this.currentProfile,
            stats: this.stats
        });
    };
    VpnService.prototype.log = function (level, message) {
        this.emit('log', { level: level, message: message, timestamp: Date.now() });
        console.log("[VPN ".concat(level.toUpperCase(), "] ").concat(message));
    };
    VpnService.prototype.getOpenConnectPath = function () {
        // Check for bundled OpenConnect first
        var bundledPath = app.isPackaged
            ? path.join(process.resourcesPath, 'openconnect', 'openconnect.exe')
            : path.join(__dirname, '..', 'resources', 'openconnect', 'openconnect.exe');
        this.log('debug', "Looking for OpenConnect at: ".concat(bundledPath));
        if (fs.existsSync(bundledPath)) {
            this.log('info', "Found OpenConnect at: ".concat(bundledPath));
            // If running from UNC path (like \\tsclient), copy to local folder
            if (bundledPath.startsWith('\\\\')) {
                var localDir = path.join(app.getPath('userData'), 'openconnect');
                var localExe = path.join(localDir, 'openconnect.exe');
                var bundledDir = path.dirname(bundledPath);
                try {
                    // Create local directory
                    if (!fs.existsSync(localDir)) {
                        fs.mkdirSync(localDir, { recursive: true });
                    }
                    // Copy ALL files from bundled openconnect directory (exe + all DLLs)
                    var files = fs.readdirSync(bundledDir);
                    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                        var file = files_1[_i];
                        var srcFile = path.join(bundledDir, file);
                        var dstFile = path.join(localDir, file);
                        // Skip directories and non-essential files
                        if (fs.statSync(srcFile).isDirectory())
                            continue;
                        if (file.endsWith('.md'))
                            continue; // Skip readme
                        // Copy if not exists or newer
                        if (!fs.existsSync(dstFile) || fs.statSync(srcFile).mtime > fs.statSync(dstFile).mtime) {
                            fs.copyFileSync(srcFile, dstFile);
                            this.log('info', "Copied ".concat(file, " to local"));
                        }
                    }
                    // Return local path
                    return localExe;
                }
                catch (err) {
                    this.log('error', "Failed to copy OpenConnect to local: ".concat(err));
                }
            }
            return bundledPath;
        }
        // Check common installation paths
        var commonPaths = [
            'C:\\Program Files\\OpenConnect\\openconnect.exe',
            'C:\\Program Files (x86)\\OpenConnect\\openconnect.exe',
            path.join(os.homedir(), 'AppData', 'Local', 'OpenConnect', 'openconnect.exe'),
        ];
        for (var _a = 0, commonPaths_1 = commonPaths; _a < commonPaths_1.length; _a++) {
            var p = commonPaths_1[_a];
            if (fs.existsSync(p)) {
                return p;
            }
        }
        // Try to find in PATH
        try {
            var result = execSync('where openconnect', { encoding: 'utf8' });
            var firstPath = result.trim().split('\n')[0];
            if (firstPath && fs.existsSync(firstPath)) {
                return firstPath;
            }
        }
        catch (_b) {
            // Not in PATH
        }
        throw new Error('OpenConnect executable not found. Please install OpenConnect for Windows or place openconnect.exe in the resources folder.');
    };
    VpnService.prototype.getVpncScriptPath = function () {
        var userDataPath = app.getPath('userData');
        // Use .js instead of .bat to avoid spawning errors with spaces
        // OpenConnect for Windows can execute JScript if named properly
        var jsFileName = 'vpnc-script-win.js';
        var jsPath = path.join(userDataPath, jsFileName);
        try {
            // Create a DUMMY JScript that does NOTHING.
            // format: WScript.Quit(0);
            var jsContent = 'WScript.Quit(0);';
            fs.writeFileSync(jsPath, jsContent);
            this.log('info', "Created dummy script wrapper: ".concat(jsPath));
            return jsPath;
        }
        catch (err) {
            this.log('error', "Failed to create dummy script: ".concat(err));
            return jsPath;
        }
    };
    VpnService.prototype.manualNetshConfig = function (ip, mask, dns, mtu, interfaceName) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        try {
                            _this.log('info', "Manual Config Starting for interface \"".concat(interfaceName, "\"..."));
                            // Use a sequence of netsh commands
                            // 1. Set IP and Mask
                            var setIpCmd = "netsh interface ipv4 set address name=\"".concat(interfaceName, "\" static ").concat(ip, " ").concat(mask, " store=active");
                            // 2. Set DNS (if provided)
                            var setDnsCmd = dns ? "netsh interface ipv4 set dnsservers name=\"".concat(interfaceName, "\" static ").concat(dns, " validate=no") : null;
                            // 3. Set MTU (if provided)
                            var setMtuCmd = mtu ? "netsh interface ipv4 set subinterface \"".concat(interfaceName, "\" mtu=").concat(mtu, " store=active") : null;
                            _this.log('debug', "Running: ".concat(setIpCmd));
                            // We use execSync for blocking execution of network commands
                            try {
                                execSync(setIpCmd, { stdio: 'ignore' });
                                if (setDnsCmd) {
                                    _this.log('debug', "Running: ".concat(setDnsCmd));
                                    execSync(setDnsCmd, { stdio: 'ignore' });
                                }
                                if (setMtuCmd) {
                                    _this.log('debug', "Running: ".concat(setMtuCmd));
                                    execSync(setMtuCmd, { stdio: 'ignore' });
                                }
                                _this.log('info', 'Manual interface configuration completed successfully');
                                resolve(true);
                            }
                            catch (err) {
                                _this.log('error', "Netsh command failed: ".concat(err));
                                resolve(false);
                            }
                        }
                        catch (err) {
                            _this.log('error', "Manual config exception: ".concat(err));
                            resolve(false);
                        }
                    })];
            });
        });
    };
    VpnService.prototype.checkTapDriver = function () {
        try {
            // Check if TAP-Windows adapter exists
            var output = execSync('netsh interface show interface', { encoding: 'utf8' });
            return output.toLowerCase().includes('tap') || output.toLowerCase().includes('tun') || output.toLowerCase().includes('securevpn');
        }
        catch (_a) {
            return false;
        }
    };
    VpnService.prototype.getServerCertFingerprint = function (host, port) {
        var _this = this;
        return new Promise(function (resolve) {
            _this.log('info', "Probing TLS fingerprint for ".concat(host, ":").concat(port, "..."));
            // First try standard TLS
            var socket = tls.connect({
                host: host,
                port: port,
                rejectUnauthorized: false,
                timeout: 15000 // Increased to 15s for slow servers
            }, function () {
                var cert = socket.getPeerCertificate(true);
                if (cert && cert.raw) {
                    var hash = crypto.createHash('sha256').update(cert.raw).digest('base64');
                    socket.destroy();
                    var fingerprint = "pin-sha256:".concat(hash);
                    _this.log('info', "TLS fingerprint: ".concat(fingerprint));
                    resolve(fingerprint);
                }
                else {
                    socket.destroy();
                    _this.log('info', 'TLS connected but no certificate');
                    resolve(null);
                }
            });
            socket.on('error', function (err) {
                socket.destroy();
                _this.log('info', "TLS error: ".concat(err.message, ", trying OpenConnect probe..."));
                // TLS failed, try using OpenConnect to probe
                _this.probeWithOpenConnect(host, port).then(resolve);
            });
            socket.on('timeout', function () {
                socket.destroy();
                _this.log('warning', 'TLS probe timeout - trying OpenConnect fallback...');
                // fallback to OpenConnect if TLS times out
                _this.probeWithOpenConnect(host, port).then(resolve);
            });
        });
    };
    VpnService.prototype.probeWithOpenConnect = function (host, port) {
        var _this = this;
        return new Promise(function (resolve) {
            var _a, _b;
            try {
                var openconnectPath = _this.getOpenConnectPath();
                var args = [
                    '--protocol=anyconnect',
                    "--server=".concat(host, ":").concat(port),
                    '--authenticate',
                    '--non-inter' // Non-interactive - fails fast showing cert info
                ];
                _this.log('info', "Probing fingerprint with OpenConnect...");
                var proc_1 = spawn(openconnectPath, args, {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    windowsHide: true
                });
                var output_1 = '';
                (_a = proc_1.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (d) { return output_1 += d.toString(); });
                (_b = proc_1.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (d) { return output_1 += d.toString(); });
                // Send empty password to make it fail quickly
                setTimeout(function () {
                    var _a, _b;
                    (_a = proc_1.stdin) === null || _a === void 0 ? void 0 : _a.write('\n');
                    (_b = proc_1.stdin) === null || _b === void 0 ? void 0 : _b.end();
                }, 500);
                proc_1.on('exit', function () {
                    // Extract fingerprint from output - try multiple patterns
                    // OpenConnect outputs: "--servercert pin-sha256:XXXX" or "server's certificate: pin-sha256:XXXX"
                    var match = output_1.match(/--servercert\s+(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                        output_1.match(/server's certificate:\s*(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                        output_1.match(/SHA256\s+fingerprint[:\s]*(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                        output_1.match(/(pin-sha256:[A-Za-z0-9+/=]+)/i); // Last resort - find any pin-sha256
                    if (match) {
                        _this.log('info', "Probed fingerprint: ".concat(match[1]));
                        resolve(match[1]);
                    }
                    else {
                        // Log more of the output to help debug
                        _this.log('info', "Probe failed - no fingerprint in: ".concat(output_1.substring(0, 300)));
                        resolve(null);
                    }
                });
                // Timeout after 10 seconds
                setTimeout(function () {
                    proc_1.kill();
                    _this.log('warning', 'Fingerprint probe timeout');
                    resolve(null);
                }, 10000);
            }
            catch (err) {
                _this.log('warning', "Fingerprint probe error: ".concat(err));
                resolve(null);
            }
        });
    };
    VpnService.prototype.connect = function (profile) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, openconnectPath, fingerprint, args, error_1, errorMsg;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.status === 'connected' || this.status === 'connecting') {
                            return [2 /*return*/, { success: false, error: 'Already connected or connecting' }];
                        }
                        // Reset fingerprint for new connection - each server may have different cert
                        this.lastServerFingerprint = '';
                        this.lastServerFingerprintRetried = false; // Allow retry for new connection
                        this.currentProfile = profile;
                        this.status = 'connecting';
                        this.emitStateChange();
                        if (!(this.routesConfigured || this.excludeRoutes.length > 0 || this.includeRoutes.length > 0)) return [3 /*break*/, 2];
                        this.log('info', 'Cleaning up stale routes from previous connection...');
                        return [4 /*yield*/, this.removeRoutes()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        // Reset interface index - will be populated from OpenConnect stdout
                        this.vpnInterfaceIndex = null;
                        this.excludeRoutes = [];
                        this.includeRoutes = [];
                        // Set MTU from profile (or default to 1200 for DTLS stability)
                        this.vpnMtu = profile.mtu || 1200;
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 8, , 9]);
                        // Save original gateway BEFORE connection
                        this.originalGateway = this.getOriginalGateway();
                        if (!this.originalGateway) {
                            this.log('warning', 'Could not determine original gateway - routing may fail');
                        }
                        // Resolve server IP (for routing exclusion)
                        _a = this;
                        return [4 /*yield*/, this.resolveServerIp(profile.serverAddress)];
                    case 4:
                        // Resolve server IP (for routing exclusion)
                        _a.serverIp = _b.sent();
                        this.log('info', "Server IP: ".concat(this.serverIp));
                        openconnectPath = this.getOpenConnectPath();
                        this.log('info', "Using OpenConnect at: ".concat(openconnectPath));
                        if (!this.checkTapDriver()) {
                            this.log('warning', 'TAP driver not detected. Connection may fail.');
                        }
                        if (!(profile.skipCertificateVerification && !this.lastServerFingerprint)) return [3 /*break*/, 6];
                        this.log('info', 'Skip cert: probing server fingerprint...');
                        return [4 /*yield*/, this.getServerCertFingerprint(profile.serverAddress, profile.port)];
                    case 5:
                        fingerprint = _b.sent();
                        if (fingerprint) {
                            this.lastServerFingerprint = fingerprint;
                            this.log('info', "Pre-fetched fingerprint: ".concat(fingerprint));
                        }
                        else {
                            this.log('warning', 'Could not get server fingerprint - connection may fail for hostname mismatch');
                        }
                        _b.label = 6;
                    case 6:
                        args = this.buildOpenConnectArgs(profile);
                        this.log('info', "Connecting to ".concat(profile.serverAddress, ":").concat(profile.port, "..."));
                        return [4 /*yield*/, this.spawnOpenConnect(openconnectPath, args, profile)];
                    case 7: return [2 /*return*/, _b.sent()];
                    case 8:
                        error_1 = _b.sent();
                        this.status = 'error';
                        this.emitStateChange();
                        errorMsg = error_1 instanceof Error ? error_1.message : String(error_1);
                        this.log('error', "Connection failed: ".concat(errorMsg));
                        return [2 /*return*/, { success: false, error: errorMsg }];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    VpnService.prototype.buildOpenConnectArgs = function (profile) {
        var args = [];
        // Protocol
        args.push('--protocol=anyconnect');
        // Server
        args.push("--server=".concat(profile.serverAddress, ":").concat(profile.port));
        // Username
        if (profile.username) {
            args.push("--user=".concat(profile.username));
        }
        // Certificate options
        if (profile.skipCertificateVerification) {
            // --no-cert-check was removed from modern OpenConnect
            // Use fingerprint-based retry approach:
            // 1. First attempt: if we have cached fingerprint, use it
            // 2. On cert failure, OpenConnect outputs the server's fingerprint
            // 3. We capture that and retry with --servercert=<fingerprint>
            if (this.lastServerFingerprint) {
                args.push("--servercert=".concat(this.lastServerFingerprint));
                this.log('info', "Skip cert: using cached fingerprint");
            }
            else {
                this.log('info', 'Skip cert: first attempt, will retry with fingerprint if needed');
            }
        }
        if (profile.caCertificatePath) {
            args.push("--cafile=".concat(profile.caCertificatePath));
        }
        if (profile.certificatePath) {
            args.push("--certificate=".concat(profile.certificatePath));
        }
        // Script for routing - using a dummy script to avoid OpenConnect errors
        // We handle actual configuration manually in TypeScript
        var scriptPath = this.getVpncScriptPath();
        args.push('--script', scriptPath);
        // Force a fixed interface name - RAHAVPN adapter is created during install
        args.push('--interface=RAHAVPN');
        // DTLS
        if (profile.disableDtls) {
            args.push('--no-dtls');
        }
        else {
            // Force safe MTU for DTLS to prevent packet drops
            args.push("--base-mtu=".concat(profile.mtu || 1200));
        }
        if (profile.dtlsCiphers) {
            args.push("--dtls-ciphers=".concat(profile.dtlsCiphers));
        }
        // Password via stdin
        args.push('--passwd-on-stdin');
        // Verbose for debugging
        args.push('-v');
        return args;
    };
    VpnService.prototype.spawnOpenConnect = function (execPath, args, profile) {
        var _this = this;
        return new Promise(function (resolve) {
            var _a, _b;
            _this.log('debug', "Spawning: ".concat(execPath, " ").concat(args.join(' ')));
            _this.vpnProcess = spawn(execPath, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true,
                shell: false, // Avoid CMD.exe parsing issues with UNC paths and spaces
                cwd: 'C:\\Windows\\System32' // Use local path as fallback
            });
            var outputBuffer = '';
            var errorBuffer = '';
            var connectionEstablished = false;
            var resolved = false;
            // Track connection parameters for manual configuration
            var vpnIp = '';
            var vpnNetmask = '';
            var vpnDns = '';
            var vpnMtu = '';
            var activeInterface = 'RAHAVPN'; // Default - persistent adapter
            var resolveOnce = function (result) {
                if (!resolved) {
                    resolved = true;
                    resolve(result);
                }
            };
            // Send password when prompted
            if (_this.vpnProcess.stdin && profile.password) {
                // OpenConnect may prompt for password, send it
                // We send it slightly earlier to catch the prompt reliably
                setTimeout(function () {
                    var _a;
                    if ((_a = _this.vpnProcess) === null || _a === void 0 ? void 0 : _a.stdin) {
                        _this.vpnProcess.stdin.write(profile.password + '\r\n');
                    }
                }, 300);
            }
            (_a = _this.vpnProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                var text = data.toString();
                outputBuffer += text;
                // Aggressive filtering of OpenConnect stdout to prevent log spam and UI freeze
                // Only log truly important messages
                var trimmedText = text.trim();
                var shouldLog = trimmedText.length > 0 &&
                    !trimmedText.includes('X-CSTP-Split-') && // Hundreds of route lines
                    !trimmedText.includes('X-DTLS-') && // DTLS config noise
                    !trimmedText.includes('Set-Cookie') && // Cookie spam
                    !trimmedText.includes('HTTP body length') &&
                    !trimmedText.includes('Content-Type') &&
                    !trimmedText.includes('Content-Length') &&
                    !trimmedText.includes('X-Transcend-Version') &&
                    !trimmedText.includes('Connection: Keep-Alive') &&
                    !trimmedText.includes('SO_SNDBUF') &&
                    !trimmedText.includes('POST https://') && // HTTP request lines
                    !trimmedText.includes('Got HTTP response:'); // HTTP response headers
                if (shouldLog) {
                    _this.log('info', "[OC] ".concat(trimmedText));
                }
                // Parse connection info - tighten check to avoid matching "Connected to IP:PORT"
                // Valid success indicators: "DTLS connection established", "CSTP connected", "Session established"
                // "Connected as 192..."
                if (text.includes('CSTP connected') ||
                    text.includes('Established DTLS') ||
                    text.includes('Session established') ||
                    text.includes('Connected as')) {
                    connectionEstablished = true;
                    _this.log('info', 'Tunnel basic connection established, waiting for gateway/config...');
                }
                // Extract assigned IP - more patterns for OpenConnect output
                var ipMatch = text.match(/Got IP address ([\d.]+)/i) ||
                    text.match(/Internal IP: ([\d.]+)/i) ||
                    text.match(/IPv4 address: ([\d.]+)/i) ||
                    text.match(/X-CSTP-Address: ([\d.]+)/i) ||
                    text.match(/Configured as ([\d.]+)/i);
                if (ipMatch) {
                    _this.stats.privateIp = ipMatch[1];
                    _this.log('info', "Assigned VPN IP detected: ".concat(_this.stats.privateIp));
                }
                // Extract VPN gateway - more patterns for OpenConnect output
                var gwMatch = text.match(/Gateway: ([\d.]+)/i) ||
                    text.match(/Next hop: ([\d.]+)/i) ||
                    text.match(/Route gateway: ([\d.]+)/i) ||
                    text.match(/netmask \d+\.\d+\.\d+\.\d+.*gw ([\d.]+)/i) ||
                    text.match(/INTERNAL_IP4_DNS1:([\d.]+)/i);
                if (gwMatch) {
                    _this.vpnGateway = gwMatch[1];
                    _this.log('info', "VPN Gateway detected: ".concat(_this.vpnGateway));
                }
                // Extract server MTU and use MIN of profile MTU and server MTU
                // This prevents oversized packet drops when profile MTU > server MTU
                // Patterns: "X-CSTP-MTU: 1426", "max=1426)", "was 1426)"
                var mtuMatch = text.match(/X-CSTP-MTU:\s*(\d+)/i) ||
                    text.match(/max=(\d+)\)/i) ||
                    text.match(/was\s*(\d+)\)/i);
                if (mtuMatch) {
                    var serverMtu = parseInt(mtuMatch[1]);
                    if (serverMtu > 0 && serverMtu < _this.vpnMtu) {
                        // Use server's lower MTU to prevent packet drops
                        var profileMtu = _this.vpnMtu;
                        _this.vpnMtu = serverMtu;
                        _this.log('info', "MTU: profile=".concat(profileMtu, ", server=").concat(serverMtu, " \u2192 using ").concat(_this.vpnMtu));
                    }
                }
                // DTLS Detection - just log, don't override profile MTU
                // MTU is already set from profile.mtu in connect() and passed via --base-mtu
                if (text.includes('Established DTLS')) {
                    _this.stats.transportProtocol = 'UDP/DTLS';
                    _this.log('info', "DTLS connection confirmed. Using MTU ".concat(_this.vpnMtu));
                }
                // Extract Netmask
                var maskMatch = text.match(/Netmask: ([\d.]+)/i) || text.match(/X-CSTP-Netmask: ([\d.]+)/i);
                if (maskMatch) {
                    _this.log('info', "VPN Netmask detected: ".concat(maskMatch[1]));
                }
                // Extract Split Routes (Include/Exclude)
                // Format: X-CSTP-Split-Exclude: 217.171.145.0/255.255.255.0
                var splitExcludeMatch = text.match(/X-CSTP-Split-Exclude:\s*([\d.]+)\/([\d.]+)/i);
                if (splitExcludeMatch) {
                    _this.excludeRoutes.push({ network: splitExcludeMatch[1], mask: splitExcludeMatch[2] });
                    // Excessive logging here freezes the UI with hundreds of routes
                    // this.log('debug', `Parsed exclusion route: ${splitExcludeMatch[1]}/${splitExcludeMatch[2]}`)
                }
                var splitIncludeMatch = text.match(/X-CSTP-Split-Include:\s*([\d.]+)\/([\d.]+)/i);
                if (splitIncludeMatch) {
                    _this.includeRoutes.push({ network: splitIncludeMatch[1], mask: splitIncludeMatch[2] });
                    // Excessive logging here freezes the UI
                    // this.log('debug', `Parsed inclusion route: ${splitIncludeMatch[1]}/${splitIncludeMatch[2]}`)
                }
                // If we have BOTH base connection AND gateway (or IP), resolve!
                if (connectionEstablished && (_this.vpnGateway || _this.stats.privateIp)) {
                    if (!resolved) {
                        _this.log('info', 'VPN connection and gateway confirmed.');
                        // DON'T set status to 'connected' yet - wait for routing to complete!
                        // The tunnel isn't usable until routing is configured
                        _this.stats.connectedTime = Date.now();
                        // Update protocol display if DTLS was established
                        if (outputBuffer.includes('Established DTLS') || text.includes('Established DTLS')) {
                            _this.stats.transportProtocol = 'UDP/DTLS';
                        }
                        else {
                            _this.stats.transportProtocol = 'TCP';
                        }
                        _this.startStatsMonitoring();
                        // configureRoutingAndFetchInfo will set status to 'connected' when done
                        _this.configureRoutingAndFetchInfo();
                        _this.emitStateChange();
                        resolveOnce({ success: true });
                    }
                }
                // Also update protocol if DTLS established later (common)
                if (text.includes('Established DTLS')) {
                    _this.stats.transportProtocol = 'UDP/DTLS';
                    _this.emitStateChange();
                }
                // Extract interface name - more patterns
                var ifMatch = text.match(/Using ([\w]+) as default route/i) ||
                    text.match(/Interface: ([\w]+)/i) ||
                    text.match(/TUNDEV=([\w]+)/i) ||
                    text.match(/Using TAP adapter '([^']+)'/i);
                if (ifMatch) {
                    _this.vpnInterfaceName = ifMatch[1];
                    _this.log('info', "VPN Interface: ".concat(_this.vpnInterfaceName));
                }
                // OPTIMIZATION: Extract Wintun interface index directly from OpenConnect's log
                // This eliminates the 14s polling delay! 
                // Pattern: "Using Wintun device 'RAHAVPN', index 70" or similar
                // Fixed regex patterns to properly handle single quotes in OpenConnect output
                var wintunIndexMatch = text.match(/Using Wintun device\s+['"]?RAHAVPN['"]?,?\s*index\s+(\d+)/i) ||
                    text.match(/Wintun device[^,]*RAHAVPN[^,]*,?\s*index\s+(\d+)/i) ||
                    text.match(/Using Wintun.*index\s+(\d+)/i);
                if (wintunIndexMatch && !_this.vpnInterfaceIndex) {
                    _this.vpnInterfaceIndex = parseInt(wintunIndexMatch[1], 10);
                    _this.vpnInterfaceName = 'RAHAVPN';
                    _this.log('info', "*** Wintun interface detected from stdout: IF ".concat(_this.vpnInterfaceIndex, " ***"));
                }
            });
            (_b = _this.vpnProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                var text = data.toString();
                errorBuffer += text;
                // Log all stderr output as 'info' for visibility in UI
                _this.log('info', "[OC] ".concat(text.trim()));
                // Extract server certificate fingerprint for retry
                // Multiple patterns OpenConnect might output:
                // "server's certificate: pin-sha256:XXXX="
                // "SHA256 fingerprint: XXXX"
                // "servercert pin-sha256:XXXX"
                var fingerprintMatch = text.match(/server's certificate:\s*(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                    text.match(/servercert\s+(pin-sha256:[A-Za-z0-9+/=]+)/i) ||
                    text.match(/(pin-sha256:[A-Za-z0-9+/=]+)/i);
                if (fingerprintMatch && !_this.lastServerFingerprint) {
                    _this.lastServerFingerprint = fingerprintMatch[1];
                    _this.log('info', "Fingerprint captured: ".concat(_this.lastServerFingerprint));
                }
                // OpenConnect outputs progress to stderr
                if (text.includes('CSTP connected') ||
                    text.includes('Established DTLS') ||
                    text.includes('Session established') ||
                    text.includes('Connected as')) {
                    connectionEstablished = true;
                    if (!resolved) {
                        _this.status = 'connected';
                        _this.stats.connectedTime = Date.now();
                        _this.startStatsMonitoring();
                        _this.configureRoutingAndFetchInfo();
                        _this.emitStateChange();
                        resolveOnce({ success: true });
                    }
                }
                // Check for authentication success
                if (text.includes('Got CONNECT response: 200')) {
                    _this.log('info', 'Authentication successful');
                }
                // Extract IP from stderr too
                var ipMatch = text.match(/Got IP address ([\d.]+)/i) ||
                    text.match(/Internal IP: ([\d.]+)/i);
                if (ipMatch) {
                    _this.stats.privateIp = ipMatch[1];
                }
                if (text.includes('Established DTLS') || text.includes('ESP session established') || text.includes('UDP session established')) {
                    _this.stats.transportProtocol = 'UDP/DTLS';
                    _this.log('info', 'Real DTLS Activation: UDP Tunnel Established');
                    _this.emitStateChange();
                }
                // CRITICAL FIX: OpenConnect outputs Wintun device info to STDERR, not stdout!
                // Pattern: "Using Wintun device 'RAHAVPN', index 70"
                var wintunStderrMatch = text.match(/Using Wintun device\s+['"]?RAHAVPN['"]?,?\s*index\s+(\d+)/i) ||
                    text.match(/Wintun device[^,]*RAHAVPN[^,]*,?\s*index\s+(\d+)/i) ||
                    text.match(/Using Wintun.*index\s+(\d+)/i);
                if (wintunStderrMatch && !_this.vpnInterfaceIndex) {
                    _this.vpnInterfaceIndex = parseInt(wintunStderrMatch[1], 10);
                    _this.vpnInterfaceName = 'RAHAVPN';
                    _this.log('info', "*** Wintun interface detected from stderr: IF ".concat(_this.vpnInterfaceIndex, " ***"));
                }
            });
            _this.vpnProcess.on('error', function (error) {
                _this.log('error', "Process error: ".concat(error.message));
                _this.status = 'error';
                _this.emitStateChange();
                resolveOnce({ success: false, error: error.message });
            });
            _this.vpnProcess.on('exit', function (code) { return __awaiter(_this, void 0, void 0, function () {
                var hasCertError, retryResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.log('info', "OpenConnect exited with code: ".concat(code));
                            if (!(connectionEstablished && resolved)) return [3 /*break*/, 1];
                            this.status = 'disconnected';
                            this.emitStateChange();
                            return [3 /*break*/, 4];
                        case 1:
                            if (!!resolved) return [3 /*break*/, 4];
                            hasCertError = errorBuffer.includes('certificate') ||
                                errorBuffer.includes('verify failed') ||
                                errorBuffer.includes('fingerprint');
                            if (!(profile.skipCertificateVerification &&
                                this.lastServerFingerprint &&
                                hasCertError &&
                                !this.lastServerFingerprintRetried)) return [3 /*break*/, 3];
                            this.lastServerFingerprintRetried = true; // prevent infinite loop
                            this.log('info', "Retrying with fingerprint: ".concat(this.lastServerFingerprint));
                            return [4 /*yield*/, this.spawnOpenConnect(execPath, this.buildOpenConnectArgs(profile), profile)];
                        case 2:
                            retryResult = _a.sent();
                            resolveOnce(retryResult);
                            return [2 /*return*/];
                        case 3:
                            this.status = 'error';
                            this.emitStateChange();
                            resolveOnce({
                                success: false,
                                error: errorBuffer || outputBuffer || "OpenConnect exited with code ".concat(code)
                            });
                            _a.label = 4;
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // Timeout for connection
            setTimeout(function () {
                if (!resolved) {
                    if (connectionEstablished || _this.stats.privateIp) {
                        // Fallback: if we matched connection but missed the event?
                        _this.status = 'connected';
                        _this.stats.connectedTime = Date.now();
                        _this.startStatsMonitoring();
                        _this.fetchPublicIp();
                        _this.emitStateChange();
                        resolveOnce({ success: true });
                    }
                    else {
                        _this.log('error', 'Connection timeout');
                        // Kill process if timeout
                        if (_this.vpnProcess && !_this.vpnProcess.killed) {
                            _this.vpnProcess.kill();
                        }
                        _this.disconnect();
                        resolveOnce({ success: false, error: 'Connection timeout' });
                    }
                }
            }, 30000); // 30 second timeout
        });
    };
    VpnService.prototype.fetchPublicIp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var services, _i, services_1, service, response, ip, _a, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 9, , 10]);
                        services = [
                            'https://api.ipify.org?format=text',
                            'https://ifconfig.me/ip',
                            'https://icanhazip.com'
                        ];
                        _i = 0, services_1 = services;
                        _b.label = 1;
                    case 1:
                        if (!(_i < services_1.length)) return [3 /*break*/, 8];
                        service = services_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 6, , 7]);
                        return [4 /*yield*/, fetch(service, {
                                signal: AbortSignal.timeout(5000)
                            })];
                    case 3:
                        response = _b.sent();
                        if (!response.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, response.text()];
                    case 4:
                        ip = (_b.sent()).trim();
                        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
                            this.stats.publicIp = ip;
                            this.log('info', "Public IP: ".concat(ip));
                            this.emitStateChange();
                            return [2 /*return*/];
                        }
                        _b.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        _a = _b.sent();
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 1];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_2 = _b.sent();
                        this.log('warning', "Could not fetch public IP: ".concat(error_2));
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    VpnService.prototype.fetchCountryFromIp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.stats.publicIp)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, fetch("http://ip-api.com/json/".concat(this.stats.publicIp, "?fields=status,country,countryCode"), {
                                signal: AbortSignal.timeout(5000)
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        if (data.status === 'success') {
                            this.stats.countryCode = data.countryCode;
                            this.stats.countryName = data.country;
                            this.log('info', "VPN Location: ".concat(data.country, " (").concat(data.countryCode, ")"));
                            this.emitStateChange();
                        }
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        this.log('warning', "Could not fetch country info: ".concat(error_3));
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    VpnService.prototype.configureRoutingAndFetchInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ipParts, routingSuccess;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // If VPN gateway not parsed from output, use private IP as gateway (common for TAP adapters)
                        if (!this.vpnGateway && this.stats.privateIp) {
                            ipParts = this.stats.privateIp.split('.');
                            if (ipParts.length === 4) {
                                this.vpnGateway = "".concat(ipParts[0], ".").concat(ipParts[1], ".").concat(ipParts[2], ".1");
                                this.log('info', "Estimated VPN Gateway: ".concat(this.vpnGateway));
                            }
                        }
                        if (!(this.vpnGateway && this.originalGateway)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.configureRouting()];
                    case 1:
                        routingSuccess = _a.sent();
                        if (routingSuccess) {
                            // NOW we're truly connected - routing is configured!
                            this.connectTime = Date.now();
                            this.status = 'connected';
                            this.emitStateChange();
                            this.log('info', '*** VPN fully connected - routing configured ***');
                        }
                        else {
                            this.log('warning', 'Routing configuration failed - traffic may not go through VPN');
                            // Still mark as connected but with warning - user can see in logs
                            this.connectTime = Date.now();
                            this.status = 'connected';
                            this.emitStateChange();
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        this.log('warning', 'No VPN gateway detected - skipping routing configuration');
                        // Mark as connected anyway - some VPNs don't need local routing
                        this.connectTime = Date.now();
                        this.status = 'connected';
                        this.emitStateChange();
                        _a.label = 3;
                    case 3:
                        // Fetch IP/Country in background with delay (wait for async routing to settle)
                        setTimeout(function () {
                            _this.fetchPublicIp().then(function () { return _this.fetchCountryFromIp(); });
                        }, 5000);
                        return [2 /*return*/];
                }
            });
        });
    };
    VpnService.prototype.getOriginalGateway = function () {
        try {
            // Use 'route print' which is MUCH faster than PowerShell (instant vs 2-3s startup)
            var output = execSync('route print 0.0.0.0', { encoding: 'utf8', timeout: 3000 });
            // Parse output to find default gateway (0.0.0.0 route)
            // Format: Network Destination   Netmask          Gateway       Interface  Metric
            // Example: 0.0.0.0            0.0.0.0       192.168.1.1     192.168.1.100     25
            var lines = output.split('\n');
            var bestGateway = '';
            var bestMetric = 999999;
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var line = lines_1[_i];
                var trimmed = line.trim();
                // Look for default route (0.0.0.0 with 0.0.0.0 netmask)
                if (trimmed.startsWith('0.0.0.0')) {
                    var parts = trimmed.split(/\s+/);
                    // parts[0] = 0.0.0.0 (destination)
                    // parts[1] = 0.0.0.0 (netmask)  
                    // parts[2] = gateway IP
                    // parts[3] = interface IP
                    // parts[4] = metric
                    if (parts.length >= 5 && parts[2] && parts[2] !== '0.0.0.0') {
                        var gateway = parts[2];
                        var metric = parseInt(parts[4], 10) || 999999;
                        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(gateway) && metric < bestMetric) {
                            bestGateway = gateway;
                            bestMetric = metric;
                        }
                    }
                }
            }
            if (bestGateway) {
                this.log('info', "Original gateway: ".concat(bestGateway, " (metric: ").concat(bestMetric, ")"));
            }
            // Also get interface index using netsh - CRITICAL for exclusion routes
            try {
                var netshOutput = execSync('netsh interface ipv4 show route | findstr /C:"0.0.0.0/0"', { encoding: 'utf8', timeout: 3000 });
                // Parse netsh output for interface index
                // Format typically: No  Manual  35   0.0.0.0/0              192.168.1.1       Wi-Fi
                var netshLines = netshOutput.split('\n');
                for (var _a = 0, netshLines_1 = netshLines; _a < netshLines_1.length; _a++) {
                    var line = netshLines_1[_a];
                    var parts = line.trim().split(/\s+/);
                    // Looking for metric/interface index in the output
                    if (parts.length >= 4) {
                        // Try to parse interface index (usually 3rd column after "No" and "Manual" etc)
                        for (var i = 0; i < parts.length; i++) {
                            var num = parseInt(parts[i], 10);
                            if (!isNaN(num) && num > 0 && num < 1000) {
                                this.originalIfIndex = num;
                                this.log('info', "Original physical interface index: ".concat(this.originalIfIndex));
                                break;
                            }
                        }
                        if (this.originalIfIndex)
                            break;
                    }
                }
            }
            catch (_b) {
                // Ignore netsh errors
            }
            // Fallback: Use PowerShell if netsh didn't get interface index
            if (!this.originalIfIndex && bestGateway) {
                try {
                    var psOutput = execSync("powershell -NoProfile -Command \"(Get-NetRoute -DestinationPrefix 0.0.0.0/0 | Where-Object {$_.NextHop -eq '".concat(bestGateway, "'} | Select-Object -First 1).InterfaceIndex\""), { encoding: 'utf8', timeout: 5000 });
                    var ifIndex = parseInt(psOutput.trim(), 10);
                    if (!isNaN(ifIndex) && ifIndex > 0) {
                        this.originalIfIndex = ifIndex;
                        this.log('info', "Original interface index (via PS): ".concat(this.originalIfIndex));
                    }
                }
                catch (_c) {
                    // Ignore PS errors
                }
            }
            return bestGateway;
        }
        catch (error) {
            this.log('warning', "Could not get original gateway: ".concat(error));
        }
        return '';
    };
    VpnService.prototype.resolveServerIp = function (hostname) {
        return __awaiter(this, void 0, void 0, function () {
            var output, lines, foundAnswer, _i, lines_2, line, match;
            return __generator(this, function (_a) {
                try {
                    // Check if already an IP
                    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
                        return [2 /*return*/, hostname];
                    }
                    output = execSync("nslookup ".concat(hostname), { encoding: 'utf8', timeout: 5000 });
                    lines = output.split('\n');
                    foundAnswer = false;
                    for (_i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
                        line = lines_2[_i];
                        // Skip the first "Address:" which is the DNS server
                        if (line.includes('Address:') || line.includes('Addresses:')) {
                            if (foundAnswer) {
                                match = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
                                if (match) {
                                    this.log('info', "Resolved ".concat(hostname, " to ").concat(match[1]));
                                    return [2 /*return*/, match[1]];
                                }
                            }
                            foundAnswer = true; // Next Address line is the answer
                        }
                    }
                }
                catch (error) {
                    this.log('warning', "Could not resolve ".concat(hostname, ": ").concat(error));
                }
                return [2 /*return*/, hostname];
            });
        });
    };
    VpnService.prototype.getVpnInterfaceIndex = function () {
        return __awaiter(this, void 0, void 0, function () {
            var benchStart, attempt, output, lines, _i, lines_3, line, parts, index, _a, lines_4, line, match, index, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        benchStart = Date.now();
                        attempt = 0;
                        _b.label = 1;
                    case 1:
                        if (!(attempt < 30)) return [3 /*break*/, 7];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 5, , 6]);
                        output = execSync('netsh interface ipv4 show interfaces', { encoding: 'utf8', timeout: 2000 });
                        lines = output.split('\n');
                        // 1. Look for exact "RAHAVPN" match first
                        for (_i = 0, lines_3 = lines; _i < lines_3.length; _i++) {
                            line = lines_3[_i];
                            if (line.includes('RAHAVPN')) {
                                parts = line.trim().split(/\s+/);
                                index = parseInt(parts[0], 10);
                                if (!isNaN(index) && index > 0) {
                                    this.log('info', "Found RAHAVPN interface index: ".concat(index, " (attempt ").concat(attempt + 1, ") in ").concat(Date.now() - benchStart, "ms"));
                                    this.vpnInterfaceName = 'RAHAVPN';
                                    return [2 /*return*/, index];
                                }
                            }
                        }
                        // 2. Fallback: Look for "TAP" or "Wintun" if RAHAVPN not named yet
                        for (_a = 0, lines_4 = lines; _a < lines_4.length; _a++) {
                            line = lines_4[_a];
                            if (line.includes('TAP') || line.includes('Wintun')) {
                                match = line.trim().match(/^(\d+)\s+/);
                                if (match && match[1]) {
                                    index = parseInt(match[1], 10);
                                    // Double check it's not the "VPN - VPN Client" which is our physical adapter
                                    if (!line.includes('VPN - VPN Client')) {
                                        this.log('info', "Found generic VPN interface index: ".concat(index, " (attempt ").concat(attempt + 1, ") in ").concat(Date.now() - benchStart, "ms"));
                                        return [2 /*return*/, index];
                                    }
                                }
                            }
                        }
                        if (!(attempt < 29)) return [3 /*break*/, 4];
                        // Only log every 5th attempt to reduce spam
                        if (attempt % 5 === 0) {
                            this.log('debug', "RAHAVPN interface not found yet, retrying... (attempt ".concat(attempt + 1, "/30)"));
                        }
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_4 = _b.sent();
                        this.log('warning', "Interface detection attempt ".concat(attempt + 1, " failed: ").concat(error_4));
                        return [3 /*break*/, 6];
                    case 6:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 7:
                        this.log('error', 'Could not find VPN interface after all attempts');
                        return [2 /*return*/, null];
                }
            });
        });
    };
    VpnService.prototype.configureRouting = function () {
        return __awaiter(this, void 0, void 0, function () {
            var vpnIfIndex_1, maxWaitTime, pollInterval_1, startTime, routeGateway_1, ifCmd_1, iranRouteStartCount, _i, IRAN_IP_CIDRS_1, cidr, route, error_5;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        vpnIfIndex_1 = null;
                        maxWaitTime = 20000 // 20 seconds max wait
                        ;
                        pollInterval_1 = 500 // Check every 500ms
                        ;
                        startTime = Date.now();
                        this.log('info', 'Waiting for Wintun interface from OpenConnect stdout...');
                        _b.label = 1;
                    case 1:
                        if (!(Date.now() - startTime < maxWaitTime)) return [3 /*break*/, 3];
                        if (this.vpnInterfaceIndex) {
                            vpnIfIndex_1 = this.vpnInterfaceIndex;
                            this.log('info', "Interface index parsed from OpenConnect stdout: ".concat(vpnIfIndex_1, " (in ").concat(Date.now() - startTime, "ms)"));
                            return [3 /*break*/, 3];
                        }
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, pollInterval_1); })];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 1];
                    case 3:
                        if (!!vpnIfIndex_1) return [3 /*break*/, 5];
                        this.log('info', 'Interface not detected from stdout, falling back to netsh polling...');
                        return [4 /*yield*/, this.getVpnInterfaceIndex()];
                    case 4:
                        vpnIfIndex_1 = _b.sent();
                        _b.label = 5;
                    case 5:
                        if (!vpnIfIndex_1) {
                            this.log('error', 'Could not find VPN interface index - routing will fail');
                            return [2 /*return*/, false];
                        }
                        // Step 0: Manually assign the VPN IP to the interface
                        // This is NECESSARY because the batch script fails, leaving the interface without an IP
                        if (this.stats.privateIp) {
                            try {
                                this.log('info', "Manually assigning IP ".concat(this.stats.privateIp, " to interface IF ").concat(vpnIfIndex_1));
                                // Use netsh to set the address. We assume 255.255.255.0 if not detected
                                execSync("netsh interface ipv4 set address name=\"".concat(vpnIfIndex_1, "\" static ").concat(this.stats.privateIp, " 255.255.255.0"), {
                                    encoding: 'utf8', timeout: 5000
                                });
                            }
                            catch (error) {
                                this.log('warning', "Manual IP assignment failed (might already be set): ".concat(error));
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
                            this.log('info', 'Applying interface settings (MTU & DNS)...');
                            // 1. Set MTU if detected to prevent packet drops (Fix for "Drop oversized packet")
                            if (this.vpnMtu) {
                                this.log('info', "Configuring MTU ".concat(this.vpnMtu, " on RAHAVPN..."));
                                exec("netsh interface ipv4 set subinterface \"RAHAVPN\" mtu=".concat(this.vpnMtu, " store=active"), function (err) {
                                    if (err)
                                        _this.log('warning', "Failed to set MTU: ".concat(err.message));
                                    else
                                        _this.log('info', "MTU ".concat(_this.vpnMtu, " applied successfully"));
                                });
                            }
                            // 2. Set DNS servers (using public DNS that works through VPN)
                            // We use exec here to keep it async
                            exec("netsh interface ipv4 set dnsservers name=\"RAHAVPN\" static 8.8.8.8 primary validate=no", function (err) {
                                if (err)
                                    _this.log('warning', "DNS config failed: ".concat(err.message));
                            });
                            exec("netsh interface ipv4 add dnsservers name=\"RAHAVPN\" 1.1.1.1 index=2 validate=no", function (err) {
                                if (err)
                                    _this.log('warning', "Secondary DNS failed: ".concat(err.message));
                            });
                            // 3. Flush DNS cache
                            exec('ipconfig /flushdns');
                            this.log('info', 'DNS configuration scheduled');
                        }
                        catch (error) {
                            this.log('warning', "Interface configuration scheduler error: ".concat(error));
                        }
                        routeGateway_1 = '0.0.0.0';
                        this.log('info', "Configuring routes using interface IF ".concat(vpnIfIndex_1, ", gateway ").concat(routeGateway_1));
                        this.log('info', "Original Gateway: ".concat(this.originalGateway, ", Server IP: ").concat(this.serverIp));
                        // Step 1: Add exclusion route for VPN server (must go through original gateway, NOT the VPN)
                        if (this.serverIp && this.originalGateway) {
                            ifCmd_1 = this.originalIfIndex ? "IF ".concat(this.originalIfIndex) : '';
                            exec("route delete ".concat(this.serverIp), function () {
                                exec("route add ".concat(_this.serverIp, " mask 255.255.255.255 ").concat(_this.originalGateway, " ").concat(ifCmd_1, " metric 1"), function (err) {
                                    if (err)
                                        _this.log('warning', "Exclusion route failed: ".concat(err.message));
                                    else
                                        _this.log('info', "Exclusion route for server ".concat(_this.serverIp, " added."));
                                });
                            });
                        }
                        // Step 2: Clean up any existing split routes
                        try {
                            execSync("route delete 0.0.0.0 mask 128.0.0.0", { encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
                            execSync("route delete 128.0.0.0 mask 128.0.0.0", { encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
                        }
                        catch (_c) {
                            // Routes might not exist
                        }
                        // Step 3: Add split routes with LOW priority (metric 500)
                        // This ensures ANY local or exclusion route (usually metric 1-50) will override the tunnel.
                        // Metric 500 is high enough that it won't conflict with physical interface default routes.
                        setImmediate(function () {
                            var addCmds = [
                                "route add 0.0.0.0 mask 128.0.0.0 ".concat(routeGateway_1, " IF ").concat(vpnIfIndex_1, " metric 500"),
                                "route add 128.0.0.0 mask 128.0.0.0 ".concat(routeGateway_1, " IF ").concat(vpnIfIndex_1, " metric 500")
                            ];
                            // Use a helper chain or just exec multiple times
                            exec("route delete 0.0.0.0 mask 128.0.0.0", function () {
                                exec(addCmds[0], function (err) {
                                    if (err)
                                        _this.log('warning', "Tunnel route 1 failed: ".concat(err.message, ". Trying netsh fallback..."));
                                    // Fallback to netsh if primary fails
                                    if (err)
                                        exec("netsh interface ipv4 add route 0.0.0.0/1 interface=\"".concat(vpnIfIndex_1, "\" nexthop=").concat(routeGateway_1, " metric=500 store=active"));
                                });
                            });
                            exec("route delete 128.0.0.0 mask 128.0.0.0", function () {
                                exec(addCmds[1], function (err) {
                                    if (err)
                                        _this.log('warning', "Tunnel route 2 failed: ".concat(err.message, ". Trying netsh fallback..."));
                                    // Fallback to netsh if primary fails
                                    if (err)
                                        exec("netsh interface ipv4 add route 128.0.0.0/1 interface=\"".concat(vpnIfIndex_1, "\" nexthop=").concat(routeGateway_1, " metric=500 store=active"));
                                });
                            });
                            _this.log('info', 'Tunnel default routes scheduled (High Metric)');
                        });
                        // Step 4: Add Iran IP exclusion routes (bypass Iranian IPs directly)
                        // Only add if the profile has bypassIranRoutes enabled
                        // Server-pushed routes (X-CSTP-Split-Exclude) are ALWAYS applied regardless of this setting
                        if ((_a = this.currentProfile) === null || _a === void 0 ? void 0 : _a.bypassIranRoutes) {
                            iranRouteStartCount = this.excludeRoutes.length;
                            for (_i = 0, IRAN_IP_CIDRS_1 = IRAN_IP_CIDRS; _i < IRAN_IP_CIDRS_1.length; _i++) {
                                cidr = IRAN_IP_CIDRS_1[_i];
                                route = this.cidrToNetworkMask(cidr);
                                if (route) {
                                    this.excludeRoutes.push(route);
                                }
                            }
                            this.log('info', "Added ".concat(this.excludeRoutes.length - iranRouteStartCount, " Iran IP exclusion routes"));
                        }
                        // Step 5: Apply server-pushed split routes + Iran routes IN BACKGROUND to avoid UI freeze
                        if (this.includeRoutes.length > 0 || this.excludeRoutes.length > 0) {
                            this.log('info', "Scheduling split routes (".concat(this.includeRoutes.length, " include, ").concat(this.excludeRoutes.length, " exclude) in background via batch script..."));
                            // Run in background
                            setImmediate(function () {
                                _this.applySplitRoutesBatch(vpnIfIndex_1);
                            });
                        }
                        this.routesConfigured = true;
                        this.stats.vpnGateway = routeGateway_1;
                        this.log('info', 'Routing orchestration completed (Async)');
                        return [2 /*return*/, true];
                    case 6:
                        error_5 = _b.sent();
                        this.log('error', "Failed to orchestrate routing: ".concat(error_5));
                        return [2 /*return*/, false];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    VpnService.prototype.applySplitRoutesBatch = function (vpnIfIndex) {
        var _this = this;
        var benchStart = Date.now();
        var batchLines = ['@echo off'];
        this.log('info', "Preparing batch file for ".concat(this.includeRoutes.length + this.excludeRoutes.length, " routes..."));
        this.log('debug', "Original Gateway: ".concat(this.originalGateway, ", Original IF: ").concat(this.originalIfIndex));
        // Inclusion routes (into tunnel)
        for (var _i = 0, _a = this.includeRoutes; _i < _a.length; _i++) {
            var r = _a[_i];
            // Delete first to avoid "The route addition failed: The object already exists" errors
            batchLines.push("route delete ".concat(r.network, " mask ").concat(r.mask, " > nul 2>&1"));
            batchLines.push("route add ".concat(r.network, " mask ").concat(r.mask, " 0.0.0.0 IF ").concat(vpnIfIndex, " metric 1"));
        }
        // Exclusion routes (stay on physical) - CRITICAL: Add these with very low metric
        if (this.originalGateway) {
            var ifPart = this.originalIfIndex ? "IF ".concat(this.originalIfIndex) : '';
            this.log('info', "Applying ".concat(this.excludeRoutes.length, " exclusion routes via ").concat(this.originalGateway, " ").concat(ifPart));
            for (var _b = 0, _c = this.excludeRoutes; _b < _c.length; _b++) {
                var r = _c[_b];
                // Delete first to avoid conflicts
                batchLines.push("route delete ".concat(r.network, " mask ").concat(r.mask, " > nul 2>&1"));
                // Add with metric 1 (higher priority than tunnel routes with metric 500)
                batchLines.push("route add ".concat(r.network, " mask ").concat(r.mask, " ").concat(this.originalGateway, " ").concat(ifPart, " metric 1"));
            }
        }
        else {
            this.log('warning', 'Cannot apply exclusion routes - originalGateway is empty!');
        }
        if (batchLines.length <= 1)
            return;
        try {
            var tempBatchFile_1 = path.join(os.tmpdir(), "vpn_routes_".concat(Date.now(), ".bat"));
            fs.writeFileSync(tempBatchFile_1, batchLines.join('\r\n'));
            this.log('info', "Executing batch routing script (Async): ".concat(tempBatchFile_1));
            // Execute the batch file asynchronously to prevent UI freeze
            exec("\"".concat(tempBatchFile_1, "\""), { timeout: 60000 }, function (error, stdout, stderr) {
                // Cleanup file regardless of outcome
                try {
                    fs.unlinkSync(tempBatchFile_1);
                }
                catch (_a) { }
                if (error) {
                    _this.log('error', "Batch routing failed: ".concat(error.message));
                    if (stderr)
                        _this.log('debug', "Stderr: ".concat(stderr));
                    return;
                }
                var duration = Date.now() - benchStart;
                _this.log('info', "Batch routing completed in ".concat(duration, "ms. ").concat(_this.excludeRoutes.length, " exclusion routes applied."));
            });
        }
        catch (error) {
            this.log('error', "Batch routing setup failed: ".concat(error));
        }
    };
    VpnService.prototype.removeSplitRoutesBatch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var batchLines, _i, _a, r, _b, _c, r, tempBatchFile_2;
            var _this = this;
            return __generator(this, function (_d) {
                batchLines = ['@echo off'];
                this.log('info', "Preparing cleanup batch for ".concat(this.includeRoutes.length + this.excludeRoutes.length, " routes..."));
                for (_i = 0, _a = this.includeRoutes; _i < _a.length; _i++) {
                    r = _a[_i];
                    batchLines.push("route delete ".concat(r.network));
                }
                for (_b = 0, _c = this.excludeRoutes; _b < _c.length; _b++) {
                    r = _c[_b];
                    batchLines.push("route delete ".concat(r.network));
                }
                if (batchLines.length <= 1)
                    return [2 /*return*/];
                try {
                    tempBatchFile_2 = path.join(os.tmpdir(), "vpn_routes_cleanup_".concat(Date.now(), ".bat"));
                    fs.writeFileSync(tempBatchFile_2, batchLines.join('\r\n'));
                    return [2 /*return*/, new Promise(function (resolve) {
                            exec("\"".concat(tempBatchFile_2, "\""), { timeout: 60000 }, function (error) {
                                try {
                                    fs.unlinkSync(tempBatchFile_2);
                                }
                                catch (_a) { }
                                if (error) {
                                    _this.log('warning', "Cleanup batch failed partially: ".concat(error.message));
                                }
                                else {
                                    _this.log('info', 'Split routes cleanup completed.');
                                }
                                // Always clear arrays
                                _this.includeRoutes = [];
                                _this.excludeRoutes = [];
                                resolve();
                            });
                        })];
                }
                catch (error) {
                    this.log('error', "Batch cleanup setup failed: ".concat(error));
                    this.includeRoutes = [];
                    this.excludeRoutes = [];
                }
                return [2 /*return*/];
            });
        });
    };
    VpnService.prototype.removeRoutes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.routesConfigured)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        this.log('info', 'Initiating full route cleanup...');
                        if (!(this.includeRoutes.length > 0 || this.excludeRoutes.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.removeSplitRoutesBatch()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        // 2. Remove default override routes
                        try {
                            execSync("route delete 0.0.0.0 mask 128.0.0.0", { encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
                            execSync("route delete 128.0.0.0 mask 128.0.0.0", { encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
                        }
                        catch (_b) {
                            // Routes might not exist
                        }
                        // 3. Remove exclusion route for server (Explicitly)
                        if (this.serverIp) {
                            try {
                                execSync("route delete ".concat(this.serverIp), { encoding: 'utf8', timeout: 5000, stdio: 'ignore' });
                            }
                            catch (_c) {
                                // Route might not exist
                            }
                        }
                        this.routesConfigured = false;
                        this.log('info', 'VPN routes cleanup finished');
                        return [3 /*break*/, 5];
                    case 4:
                        error_6 = _a.sent();
                        this.log('warning', "Error during route removal: ".concat(error_6));
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    VpnService.prototype.startStatsMonitoring = function () {
        var _this = this;
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
        this.lastStatsTime = Date.now();
        this.lastBytesReceived = 0;
        this.lastBytesSent = 0;
        this.statsInterval = setInterval(function () {
            _this.updateStats();
        }, 1000); // 1 second for real-time speed display like other VPN apps
    };
    VpnService.prototype.updateStats = function () {
        var _this = this;
        if (this.status !== 'connected')
            return;
        if (!this.vpnInterfaceName)
            return;
        // Use 'netsh interface ipv4 show subinterfaces' which shows per-interface Bytes In/Out
        // Output format:
        //    MTU  MediaSenseState   Bytes In  Bytes Out  Interface
        // ------  ---------------  ---------  ---------  -------------
        //   1200                1   12345678   12345678  RAHAVPN
        exec('netsh interface ipv4 show subinterfaces', { encoding: 'utf8', timeout: 3000 }, function (error, stdout, stderr) {
            if (error) {
                _this.log('warning', "Stats command failed: ".concat(error.message));
                return;
            }
            try {
                var lines = stdout.split('\n');
                for (var _i = 0, lines_5 = lines; _i < lines_5.length; _i++) {
                    var line = lines_5[_i];
                    // Look for our interface name in the line
                    if (line.includes(_this.vpnInterfaceName) || line.includes('RAHAVPN')) {
                        // Parse the columns: MTU, MediaSenseState, Bytes In, Bytes Out, Interface
                        // Example: "   1200                1   12345678   12345678  RAHAVPN"
                        var parts = line.trim().split(/\s+/);
                        // Find the bytes columns (should be 3rd and 4th numeric values)
                        // Format: MTU[0], MediaSenseState[1], BytesIn[2], BytesOut[3], Interface[4+]
                        if (parts.length >= 5) {
                            var bytesIn = parseInt(parts[2]) || 0;
                            var bytesOut = parseInt(parts[3]) || 0;
                            var now = Date.now();
                            var timeDiff = (now - _this.lastStatsTime) / 1000;
                            if (_this.lastBytesReceived > 0 && timeDiff > 0) {
                                _this.stats.downloadSpeed = Math.max(0, (bytesIn - _this.lastBytesReceived) / timeDiff);
                                _this.stats.uploadSpeed = Math.max(0, (bytesOut - _this.lastBytesSent) / timeDiff);
                            }
                            _this.stats.totalDownloaded = bytesIn;
                            _this.stats.totalUploaded = bytesOut;
                            _this.lastBytesReceived = bytesIn;
                            _this.lastBytesSent = bytesOut;
                            _this.lastStatsTime = now;
                            // Calculate connected time
                            if (_this.connectTime > 0) {
                                _this.stats.connectedTime = Date.now() - _this.connectTime;
                            }
                            _this.emitStateChange();
                            return;
                        }
                    }
                }
                // Interface not found in subinterfaces list
                _this.log('debug', 'VPN interface not found in subinterfaces list');
            }
            catch (err) {
                _this.log('warning', "Stats parsing error: ".concat(err));
            }
        });
    };
    VpnService.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pidFile, pid, error_7, errorMsg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.status === 'disconnected') {
                            return [2 /*return*/, { success: true }];
                        }
                        this.status = 'disconnecting';
                        this.emitStateChange();
                        this.log('info', 'Disconnecting...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Reset RAHAVPN interface to DHCP (clears static IP and DNS)
                        try {
                            this.log('info', 'Resetting RAHAVPN interface...');
                            execSync('netsh interface ipv4 set address name="RAHAVPN" dhcp', { stdio: 'ignore' });
                            execSync('netsh interface ipv4 set dnsservers name="RAHAVPN" dhcp', { stdio: 'ignore' });
                        }
                        catch (err) {
                            this.log('debug', "Interface reset error (likely already DHCP): ".concat(err));
                        }
                        // Remove VPN routes
                        return [4 /*yield*/, this.removeRoutes()
                            // Stop stats monitoring
                        ];
                    case 2:
                        // Remove VPN routes
                        _a.sent();
                        // Stop stats monitoring
                        if (this.statsInterval) {
                            clearInterval(this.statsInterval);
                            this.statsInterval = null;
                        }
                        // Kill the VPN process
                        if (this.vpnProcess) {
                            this.vpnProcess.kill('SIGTERM');
                            this.vpnProcess = null;
                        }
                        // Also try to kill any running openconnect processes
                        try {
                            execSync('taskkill /F /IM openconnect.exe', { stdio: 'ignore' });
                        }
                        catch (_b) {
                            // Process might not exist
                        }
                        pidFile = path.join(os.tmpdir(), 'openconnect.pid');
                        if (fs.existsSync(pidFile)) {
                            try {
                                pid = fs.readFileSync(pidFile, 'utf8').trim();
                                execSync("taskkill /F /PID ".concat(pid), { stdio: 'ignore' });
                                fs.unlinkSync(pidFile);
                            }
                            catch (_c) {
                                // Ignore
                            }
                        }
                        // Reset state
                        this.status = 'disconnected';
                        this.currentProfile = null;
                        this.stats = this.createEmptyStats();
                        this.vpnGateway = '';
                        this.originalGateway = '';
                        this.serverIp = '';
                        this.vpnInterfaceIndex = null; // Clear cached interface index for next connection
                        this.vpnInterfaceName = '';
                        this.originalIfIndex = null; // Clear original interface index
                        this.routesConfigured = false; // Reset routing status
                        this.excludeRoutes = []; // Clear exclude routes for fresh reconnect
                        this.includeRoutes = []; // Clear include routes for fresh reconnect
                        this.vpnMtu = 1200; // Reset MTU to default
                        this.lastBytesReceived = 0; // Reset stats counters
                        this.lastBytesSent = 0;
                        this.lastStatsTime = 0;
                        this.connectTime = 0; // Reset connection time
                        this.emitStateChange();
                        this.log('info', 'Disconnected successfully');
                        return [2 /*return*/, { success: true }];
                    case 3:
                        error_7 = _a.sent();
                        errorMsg = error_7 instanceof Error ? error_7.message : String(error_7);
                        this.log('error', "Disconnect error: ".concat(errorMsg));
                        // Force disconnect anyway
                        this.status = 'disconnected';
                        this.currentProfile = null;
                        this.stats = this.createEmptyStats();
                        this.emitStateChange();
                        return [2 /*return*/, { success: true }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    VpnService.prototype.isElevated = function () {
        try {
            // Try to access a protected registry key or run a privileged command
            execSync('net session', { stdio: 'ignore' });
            return true;
        }
        catch (_a) {
            return false;
        }
    };
    VpnService.prototype.getState = function () {
        return {
            status: this.status,
            profile: this.currentProfile,
            stats: this.stats
        };
    };
    return VpnService;
}(EventEmitter));
export { VpnService };
// Singleton instance
export var vpnService = new VpnService();
