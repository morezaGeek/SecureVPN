// sing-box Service for V2Ray/Xray protocols (VLESS, VMess, Trojan, Shadowsocks)
// Handles process management, config generation, and TUN mode routing
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { spawn, execSync } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { promises as dns } from 'dns';
import * as net from 'net';
import { IRAN_IP_CIDRS } from './iran-ips';
var SingboxService = /** @class */ (function (_super) {
    __extends(SingboxService, _super);
    function SingboxService() {
        var _this = _super.call(this) || this;
        _this.singboxProcess = null;
        _this.status = 'disconnected';
        _this.stats = _this.createEmptyStats();
        _this.statsInterval = null;
        _this.connectTime = 0;
        _this.originalGateway = '';
        _this.originalIfIndex = null;
        _this.originalIfName = '';
        _this.serverIp = '';
        // Traffic stats tracking for speed calculation
        _this.lastBytesReceived = 0;
        _this.lastBytesSent = 0;
        _this.lastStatsTime = 0;
        // Clash API port for stats
        _this.clashApiPort = 9090;
        // Iranian IP exclusion routes (same as vpn-service.ts)
        _this.excludeRoutes = [];
        _this.appDataPath = path.join(app.getPath('userData'));
        _this.configPath = path.join(_this.appDataPath, 'singbox-config.json');
        return _this;
    }
    SingboxService.prototype.createEmptyStats = function () {
        return {
            uploadSpeed: 0,
            downloadSpeed: 0,
            totalUploaded: 0,
            totalDownloaded: 0,
            connectedTime: 0,
            privateIp: '',
            publicIp: ''
        };
    };
    SingboxService.prototype.getStatus = function () {
        return this.status;
    };
    SingboxService.prototype.getStats = function () {
        return __assign({}, this.stats);
    };
    SingboxService.prototype.emitStateChange = function () {
        this.emit('stateChange', {
            status: this.status,
            stats: this.stats
        });
    };
    SingboxService.prototype.log = function (level, message) {
        this.emit('log', { level: level, message: "[SB] ".concat(message) });
    };
    /**
     * Get path to sing-box executable
     */
    SingboxService.prototype.getSingboxPath = function () {
        var possiblePaths = [
            // Production: installed app
            path.join(process.resourcesPath, 'singbox', 'sing-box.exe'),
            // Development
            path.join(__dirname, '..', 'resources', 'singbox', 'sing-box.exe'),
            path.join(app.getAppPath(), 'resources', 'singbox', 'sing-box.exe')
        ];
        for (var _i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
            var p = possiblePaths_1[_i];
            if (fs.existsSync(p)) {
                this.log('info', "Found sing-box at: ".concat(p));
                return p;
            }
        }
        // Fallback to PATH
        return 'sing-box.exe';
    };
    /**
     * Get original gateway before VPN connection
     */
    /**
     * Get original gateway and interface index, excluding the VPN interface
     */
    SingboxService.prototype.getOriginalGateway = function () {
        try {
            // Powershell command to:
            // 1. Get Tun Interface Index (if exists)
            // 2. Get Default Routes (0.0.0.0/0)
            // 3. Filter out Tun Interface
            // 4. Pick best metric
            var psCommand = "\n                $tunIndex = (Get-NetAdapter -Name \"SecureVPN-SB\" -ErrorAction SilentlyContinue).InterfaceIndex;\n                $route = Get-NetRoute -DestinationPrefix 0.0.0.0/0 | Where-Object { $_.InterfaceIndex -ne $tunIndex } | Sort-Object RouteMetric | Select-Object -First 1;\n                if ($route) { Write-Output ($route.NextHop + '|' + $route.InterfaceIndex) }\n            ";
            var output = execSync("powershell -Command \"".concat(psCommand.replace(/\n/g, ' '), "\""), { encoding: 'utf8', timeout: 5000 }).trim();
            if (output) {
                var parts = output.split('|');
                var gateway = parts[0];
                var ifIndex = parseInt(parts[1], 10);
                if (gateway && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(gateway)) {
                    this.log('info', "Original gateway: ".concat(gateway, ", IfIndex: ").concat(ifIndex));
                    if (!isNaN(ifIndex) && ifIndex > 0) {
                        this.originalIfIndex = ifIndex;
                        // Get the interface name from the index
                        try {
                            var nameCmd = "powershell -Command \"(Get-NetAdapter | Where-Object { $_.InterfaceIndex -eq ".concat(ifIndex, " }).Name\"");
                            var ifName = execSync(nameCmd, { encoding: 'utf8', timeout: 3000 }).trim();
                            if (ifName) {
                                this.originalIfName = ifName;
                                this.log('info', "Original interface name: ".concat(ifName));
                            }
                        }
                        catch ( /* ignore */_a) { /* ignore */ }
                    }
                    return gateway;
                }
            }
        }
        catch (error) {
            this.log('warning', "Could not get original gateway: ".concat(error));
        }
        return '';
    };
    /**
     * Resolve hostname to IP using PowerShell
     */
    /**
     * Resolve hostname to the best reachable IP (Happy Eyeballs-ish for Cloudflare)
     */
    SingboxService.prototype.resolveServerIp = function (hostname, port) {
        return __awaiter(this, void 0, void 0, function () {
            var addresses, psOutput, _i, addresses_1, ip, isReachable, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
                            return [2 /*return*/, hostname];
                        }
                        this.log('info', "Resolving ".concat(hostname, "..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, dns.resolve4(hostname).catch(function () { return []; })];
                    case 2:
                        addresses = _a.sent();
                        if (addresses.length === 0) {
                            psOutput = execSync("powershell -Command \"(Resolve-DnsName -Name '".concat(hostname, "' -Type A -ErrorAction Stop | Select-Object -First 1).IPAddress\""), { encoding: 'utf8', timeout: 5000 }).trim();
                            if (psOutput)
                                return [2 /*return*/, psOutput];
                            return [2 /*return*/, hostname];
                        }
                        this.log('info', "DNS returned IPs: ".concat(addresses.join(', ')));
                        _i = 0, addresses_1 = addresses;
                        _a.label = 3;
                    case 3:
                        if (!(_i < addresses_1.length)) return [3 /*break*/, 6];
                        ip = addresses_1[_i];
                        return [4 /*yield*/, this.checkTcpConnectivity(ip, port)];
                    case 4:
                        isReachable = _a.sent();
                        if (isReachable) {
                            this.log('info', "Selected best server IP: ".concat(ip, " (reachable)"));
                            return [2 /*return*/, ip];
                        }
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        // If none conform to check, return the first one as fallback
                        this.log('warning', "No IPs were reachable via TCP ping. Defaulting to ".concat(addresses[0]));
                        return [2 /*return*/, addresses[0]];
                    case 7:
                        error_1 = _a.sent();
                        this.log('warning', "DNS resolution failed: ".concat(error_1));
                        return [3 /*break*/, 8];
                    case 8: 
                    // Fallback: return hostname and let sing-box resolve it
                    return [2 /*return*/, hostname];
                }
            });
        });
    };
    /**
     * Helper: Check TCP connectivity with short timeout
     */
    SingboxService.prototype.checkTcpConnectivity = function (host, port) {
        return new Promise(function (resolve) {
            var socket = new net.Socket();
            socket.setTimeout(2000); // 2s timeout
            socket.on('connect', function () {
                socket.destroy();
                resolve(true);
            });
            socket.on('timeout', function () {
                socket.destroy();
                resolve(false);
            });
            socket.on('error', function () {
                socket.destroy();
                resolve(false);
            });
            socket.connect(port, host);
        });
    };
    /**
     * Generate sing-box configuration JSON
     */
    SingboxService.prototype.generateConfig = function (protocol, config) {
        // Use resolved IP if available to ensure routing match, otherwise fallback to address
        // This is CRITICAL for Cloudflare to prevent routing loops where sing-box passes
        // traffic to a different IP than the one we added a route exception for.
        var serverAddress = this.serverIp || config.address;
        // Build outbound based on protocol
        var outbound;
        switch (protocol) {
            case 'vless':
                outbound = {
                    type: 'vless',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    uuid: config.uuid,
                    packet_encoding: 'xudp', // CRITICAL for Xray-based servers
                    // flow is only used for TCP+XTLS, not for WebSocket
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
                    transport: this.buildTransport(config),
                    // FORCE outbound to use the physical interface to prevent loops
                    bind_interface: this.originalIfName || undefined
                };
                break;
            case 'vmess':
                outbound = {
                    type: 'vmess',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    uuid: config.uuid,
                    security: config.encryption || 'auto',
                    alter_id: 0,
                    packet_encoding: 'xudp', // Recommended for VMESS
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
                    transport: this.buildTransport(config),
                    // FORCE outbound to use the physical interface to prevent loops
                    bind_interface: this.originalIfName || undefined
                };
                break;
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
                    transport: this.buildTransport(config),
                    // FORCE outbound to use the physical interface to prevent loops
                    bind_interface: this.originalIfName || undefined
                };
                break;
            case 'shadowsocks':
                outbound = {
                    type: 'shadowsocks',
                    tag: 'proxy',
                    server: serverAddress,
                    server_port: config.port,
                    password: config.uuid,
                    method: config.method || 'aes-256-gcm',
                    // FORCE outbound to use the physical interface to prevent loops
                    bind_interface: this.originalIfName || undefined
                };
                break;
            default:
                throw new Error("Unsupported protocol: ".concat(protocol));
        }
        // Build complete config (sing-box 1.12+ format)
        return {
            log: {
                level: 'info', // Match v1.0.24
                timestamp: true
            },
            dns: {
                servers: [
                    {
                        // Route DNS through proxy to bypass ISP blocking (for googlevideo.com, etc.)
                        tag: 'proxy-dns',
                        type: 'udp',
                        server: '8.8.8.8',
                        detour: 'proxy' // DNS goes through VPN tunnel
                    },
                    {
                        // Fallback to Cloudflare DNS via proxy
                        tag: 'fallback-dns',
                        type: 'udp',
                        server: '1.1.1.1',
                        detour: 'proxy'
                    },
                    {
                        // Local DNS for Iranian domains (if bypass enabled)
                        tag: 'local-dns',
                        type: 'udp',
                        server: '8.8.8.8',
                        detour: 'direct'
                    }
                ],
                rules: __spreadArray([], (config.bypassIranRoutes ? [{
                        domain_suffix: ['.ir'],
                        server: 'local-dns'
                    }] : []), true),
                final: 'proxy-dns',
                strategy: 'prefer_ipv4'
            },
            inbounds: [
                {
                    type: 'tun',
                    tag: 'tun-in',
                    interface_name: 'SecureVPN-SB',
                    address: ['172.19.0.1/30'],
                    mtu: config.mtu || 1400, // Use MTU from settings (default: 1400)
                    auto_route: true,
                    strict_route: false, // Disabled to allow manual route exceptions for Cloudflare IPs
                    stack: 'gvisor', // gVisor is more reliable on Windows than system stack
                    sniff: true,
                    sniff_override_destination: true,
                    // Additional optimizations for better traffic flow
                    endpoint_independent_nat: true
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
                rules: __spreadArray(__spreadArray([
                    {
                        protocol: 'dns',
                        action: 'hijack-dns'
                    },
                    {
                        // DNS server IPs must bypass proxy to prevent circular dependency
                        ip_cidr: ['8.8.8.8/32', '8.8.4.4/32', '223.5.5.5/32', '223.6.6.6/32', '1.1.1.1/32'],
                        outbound: 'direct'
                    },
                    {
                        ip_is_private: true,
                        outbound: 'direct'
                    }
                ], (config.bypassIranRoutes ? [{
                        domain_suffix: ['.ir'],
                        outbound: 'direct'
                    }] : []), true), (config.bypassIranRoutes ? [{
                        ip_cidr: IRAN_IP_CIDRS,
                        outbound: 'direct'
                    }] : []), true),
                final: 'proxy',
                auto_detect_interface: true
            },
            experimental: {
                clash_api: {
                    external_controller: "127.0.0.1:".concat(this.clashApiPort),
                    secret: ''
                }
            }
        };
    };
    /**
     * Build transport configuration
     */
    SingboxService.prototype.buildTransport = function (config) {
        if (config.transport === 'tcp') {
            return undefined;
        }
        if (config.transport === 'ws') {
            var host = config.host || config.sni || config.address;
            return {
                type: 'ws',
                path: config.path || '/',
                headers: {
                    Host: host,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            };
        }
        if (config.transport === 'grpc') {
            return {
                type: 'grpc',
                service_name: config.serviceName || ''
            };
        }
        if (config.transport === 'httpupgrade') {
            return {
                type: 'httpupgrade',
                path: config.path || '/',
                host: config.host || config.address
            };
        }
        return undefined;
    };
    /**
     * Connect using sing-box
     */
    SingboxService.prototype.connect = function (protocol, config, profileName) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, singboxConfig, singboxPath, args, error_2;
            var _this = this;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (this.status === 'connected' || this.status === 'connecting') {
                            return [2 /*return*/, { success: false, error: 'Already connected or connecting' }];
                        }
                        this.status = 'connecting';
                        this.emitStateChange();
                        this.log('info', "Connecting to ".concat(config.address, ":").concat(config.port, " via ").concat(protocol, "..."));
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        // Get original gateway before connection
                        this.originalGateway = this.getOriginalGateway();
                        // Resolve server IP (scanning for best reachable IP)
                        _a = this;
                        return [4 /*yield*/, this.resolveServerIp(config.address, config.port)];
                    case 2:
                        // Resolve server IP (scanning for best reachable IP)
                        _a.serverIp = _d.sent();
                        this.log('info', "Server IP: ".concat(this.serverIp));
                        // Log the transport and TLS settings for debugging
                        this.log('debug', "Transport: ".concat(config.transport, ", Security: ").concat(config.security, ", Path: ").concat(config.path || 'none'));
                        singboxConfig = this.generateConfig(protocol, config);
                        fs.writeFileSync(this.configPath, JSON.stringify(singboxConfig, null, 2), 'utf8');
                        this.log('debug', "Config written to ".concat(this.configPath));
                        // Add exclusion route for VPN server
                        if (this.serverIp && this.originalGateway && this.originalIfIndex) {
                            try {
                                execSync("route delete ".concat(this.serverIp), { encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
                            }
                            catch ( /* ignore */_e) { /* ignore */ }
                            try {
                                execSync("route add ".concat(this.serverIp, " mask 255.255.255.255 ").concat(this.originalGateway, " IF ").concat(this.originalIfIndex, " metric 1"), {
                                    encoding: 'utf8',
                                    timeout: 5000
                                });
                                this.log('info', "Added exclusion route for VPN server ".concat(this.serverIp));
                            }
                            catch (error) {
                                this.log('warning', "Server exclusion route failed: ".concat(error));
                            }
                        }
                        singboxPath = this.getSingboxPath();
                        args = ['run', '-c', this.configPath];
                        this.log('debug', "Spawning: ".concat(singboxPath, " ").concat(args.join(' ')));
                        this.singboxProcess = spawn(singboxPath, args, {
                            windowsHide: true,
                            stdio: ['pipe', 'pipe', 'pipe'],
                            env: __assign(__assign({}, process.env), { ENABLE_DEPRECATED_LEGACY_DNS_SERVERS: 'true', ENABLE_DEPRECATED_MISSING_DOMAIN_RESOLVER: 'true', ENABLE_DEPRECATED_SPECIAL_OUTBOUNDS: 'true' })
                        });
                        // Handle process output
                        (_b = this.singboxProcess.stdout) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                            var line = data.toString().trim();
                            if (line) {
                                _this.log('info', line);
                                // Check for successful connection
                                if (line.includes('started') || line.includes('tun started')) {
                                    _this.onConnected();
                                }
                            }
                        });
                        (_c = this.singboxProcess.stderr) === null || _c === void 0 ? void 0 : _c.on('data', function (data) {
                            var line = data.toString().trim();
                            if (line) {
                                _this.log('warning', line);
                                // sing-box logs to stderr, check for successful start
                                if (line.includes('sing-box started') || line.includes('started at SecureVPN-SB')) {
                                    _this.onConnected();
                                }
                            }
                        });
                        this.singboxProcess.on('error', function (error) {
                            _this.log('error', "sing-box process error: ".concat(error.message));
                            _this.status = 'error';
                            _this.emitStateChange();
                        });
                        this.singboxProcess.on('exit', function (code) {
                            _this.log('info', "sing-box exited with code: ".concat(code));
                            if (_this.status === 'connected' || _this.status === 'connecting') {
                                _this.status = 'disconnected';
                                _this.emitStateChange();
                            }
                            _this.cleanup();
                        });
                        // Wait for connection (timeout 30s)
                        return [2 /*return*/, new Promise(function (resolve) {
                                var timeout = setTimeout(function () {
                                    if (_this.status === 'connecting') {
                                        _this.log('error', 'Connection timeout');
                                        _this.disconnect();
                                        resolve({ success: false, error: 'Connection timeout' });
                                    }
                                }, 30000);
                                var checkConnected = setInterval(function () {
                                    if (_this.status === 'connected') {
                                        clearTimeout(timeout);
                                        clearInterval(checkConnected);
                                        resolve({ success: true });
                                    }
                                    else if (_this.status === 'error' || _this.status === 'disconnected') {
                                        clearTimeout(timeout);
                                        clearInterval(checkConnected);
                                        resolve({ success: false, error: 'Connection failed' });
                                    }
                                }, 500);
                            })];
                    case 3:
                        error_2 = _d.sent();
                        this.log('error', "Connection error: ".concat(error_2));
                        this.status = 'error';
                        this.emitStateChange();
                        return [2 /*return*/, { success: false, error: String(error_2) }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Called when connection is established
     */
    SingboxService.prototype.onConnected = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.connectTime = Date.now(); // Set BEFORE status change
                        this.status = 'connected';
                        this.stats.privateIp = '172.19.0.1';
                        this.stats.connectedTime = 0; // Start from 0
                        this.emitStateChange();
                        this.log('info', 'Connected successfully');
                        // Fetch public IP
                        return [4 /*yield*/, this.fetchPublicIp()];
                    case 1:
                        // Fetch public IP
                        _a.sent();
                        return [4 /*yield*/, this.fetchCountryFromIp()
                            // Start stats monitoring
                        ];
                    case 2:
                        _a.sent();
                        // Start stats monitoring
                        this.startStatsMonitoring();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch public IP
     */
    SingboxService.prototype.fetchPublicIp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var services, _i, services_1, service, response, ip, _a, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 9, , 10]);
                        services = [
                            'https://api.ipify.org',
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
                        error_3 = _b.sent();
                        this.log('warning', "Could not fetch public IP: ".concat(error_3));
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch country from IP
     */
    SingboxService.prototype.fetchCountryFromIp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_4;
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
                        error_4 = _a.sent();
                        this.log('warning', "Could not fetch country info: ".concat(error_4));
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test latency through the tunnel using HTTP request
     * Returns latency in milliseconds or -1 if failed
     */
    SingboxService.prototype.testLatency = function () {
        return __awaiter(this, arguments, void 0, function (targetUrl) {
            var startTime, response, endTime, latency, error_5;
            if (targetUrl === void 0) { targetUrl = 'https://www.gstatic.com/generate_204'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.status !== 'connected') {
                            return [2 /*return*/, -1];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        startTime = performance.now();
                        return [4 /*yield*/, fetch(targetUrl, {
                                method: 'HEAD',
                                signal: AbortSignal.timeout(10000),
                                cache: 'no-store'
                            })];
                    case 2:
                        response = _a.sent();
                        endTime = performance.now();
                        if (response.ok || response.status === 204) {
                            latency = Math.round(endTime - startTime);
                            this.log('debug', "Latency test: ".concat(latency, "ms to ").concat(targetUrl));
                            return [2 /*return*/, latency];
                        }
                        return [2 /*return*/, -1];
                    case 3:
                        error_5 = _a.sent();
                        this.log('warning', "Latency test failed: ".concat(error_5));
                        return [2 /*return*/, -1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Test TCP ping to the VPN server directly (not through tunnel)
     * Returns latency in milliseconds or -1 if failed
     */
    SingboxService.prototype.testServerPing = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.serverIp) {
                    return [2 /*return*/, -1];
                }
                return [2 /*return*/, new Promise(function (resolve) {
                        var net = require('net');
                        var port = 443; // Use HTTPS port
                        var startTime = performance.now();
                        var socket = new net.Socket();
                        socket.setTimeout(5000);
                        socket.on('connect', function () {
                            var latency = Math.round(performance.now() - startTime);
                            socket.destroy();
                            _this.log('debug', "Server ping: ".concat(latency, "ms to ").concat(_this.serverIp));
                            resolve(latency);
                        });
                        socket.on('error', function () {
                            socket.destroy();
                            resolve(-1);
                        });
                        socket.on('timeout', function () {
                            socket.destroy();
                            resolve(-1);
                        });
                        socket.connect(port, _this.serverIp);
                    })];
            });
        });
    };
    /**
     * Start stats monitoring - fetches traffic from Clash API
     */
    SingboxService.prototype.startStatsMonitoring = function () {
        var _this = this;
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
        // Reset tracking values
        this.lastBytesReceived = 0;
        this.lastBytesSent = 0;
        this.lastStatsTime = Date.now();
        this.statsInterval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var response, data, currentTime, timeDelta, downloadTotal, uploadTotal, downloadDelta, uploadDelta, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.status === 'connected' && this.connectTime > 0)) return [3 /*break*/, 7];
                        // Update connected time
                        this.stats.connectedTime = Date.now() - this.connectTime;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, fetch("http://127.0.0.1:".concat(this.clashApiPort, "/connections"), {
                                signal: AbortSignal.timeout(1000)
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        currentTime = Date.now();
                        timeDelta = (currentTime - this.lastStatsTime) / 1000 // seconds
                        ;
                        downloadTotal = data.downloadTotal || 0;
                        uploadTotal = data.uploadTotal || 0;
                        if (timeDelta > 0 && this.lastStatsTime > 0 && this.lastBytesReceived > 0) {
                            downloadDelta = downloadTotal - this.lastBytesReceived;
                            uploadDelta = uploadTotal - this.lastBytesSent;
                            this.stats.downloadSpeed = downloadDelta > 0 ? downloadDelta / timeDelta : 0;
                            this.stats.uploadSpeed = uploadDelta > 0 ? uploadDelta / timeDelta : 0;
                        }
                        // Update totals
                        this.stats.totalDownloaded = downloadTotal;
                        this.stats.totalUploaded = uploadTotal;
                        // Store for next calculation
                        this.lastBytesReceived = downloadTotal;
                        this.lastBytesSent = uploadTotal;
                        this.lastStatsTime = currentTime;
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_6 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        this.emitStateChange();
                        _a.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        }); }, 1000);
    };
    /**
     * Disconnect
     */
    SingboxService.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.status === 'disconnected') {
                    return [2 /*return*/, { success: true }];
                }
                this.status = 'disconnecting';
                this.emitStateChange();
                this.log('info', 'Disconnecting...');
                try {
                    if (this.singboxProcess) {
                        this.singboxProcess.kill('SIGTERM');
                        // Force kill after 5 seconds
                        setTimeout(function () {
                            if (_this.singboxProcess) {
                                _this.singboxProcess.kill('SIGKILL');
                            }
                        }, 5000);
                    }
                    // Remove server exclusion route
                    if (this.serverIp) {
                        try {
                            execSync("route delete ".concat(this.serverIp), { encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
                        }
                        catch ( /* ignore */_b) { /* ignore */ }
                    }
                    this.cleanup();
                    this.status = 'disconnected';
                    this.emitStateChange();
                    this.log('info', 'Disconnected');
                    return [2 /*return*/, { success: true }];
                }
                catch (error) {
                    this.log('error', "Disconnect error: ".concat(error));
                    return [2 /*return*/, { success: false, error: String(error) }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Cleanup resources
     */
    SingboxService.prototype.cleanup = function () {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
        this.singboxProcess = null;
        this.stats = this.createEmptyStats();
        this.connectTime = 0; // Reset connectTime to prevent stale time display
        this.serverIp = '';
    };
    /**
     * Get current state for IPC
     */
    SingboxService.prototype.getState = function () {
        return {
            status: this.status,
            stats: this.stats
        };
    };
    return SingboxService;
}(EventEmitter));
export { SingboxService };
