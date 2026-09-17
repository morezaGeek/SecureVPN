import { EventEmitter } from 'events';
export interface SingboxProfile {
    uuid: string;
    address: string;
    port: number;
    encryption?: string;
    transport: 'tcp' | 'ws' | 'grpc' | 'httpupgrade';
    security: 'none' | 'tls' | 'reality';
    sni?: string;
    fingerprint?: string;
    alpn?: string[];
    allowInsecure?: boolean;
    path?: string;
    host?: string;
    serviceName?: string;
    method?: string;
    publicKey?: string;
    shortId?: string;
    bypassIranRoutes?: boolean;
    bypassPrivateIps?: boolean;
    mtu?: number;
    tunStack?: 'mixed' | 'gvisor' | 'system';
}
export interface VpnStats {
    uploadSpeed: number;
    downloadSpeed: number;
    totalUploaded: number;
    totalDownloaded: number;
    connectedTime: number;
    privateIp: string;
    publicIp: string;
    countryCode?: string;
    countryName?: string;
}
type VpnStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';
type VpnProtocol = 'vless' | 'vmess' | 'trojan' | 'shadowsocks';
export declare class SingboxService extends EventEmitter {
    private singboxProcess;
    private status;
    private stats;
    private configPath;
    private appDataPath;
    private statsInterval;
    private connectTime;
    private originalGateway;
    private originalIfIndex;
    private originalIfName;
    private serverIp;
    private lastBytesReceived;
    private lastBytesSent;
    private lastStatsTime;
    private clashApiPort;
    private excludeRoutes;
    constructor();
    private createEmptyStats;
    getStatus(): VpnStatus;
    getStats(): VpnStats;
    private emitStateChange;
    private log;
    /**
     * Get path to sing-box executable
     */
    private getSingboxPath;
    /**
     * Get original gateway before VPN connection
     */
    /**
     * Get original gateway and interface index, excluding the VPN interface
     */
    private getOriginalGateway;
    /**
     * Resolve hostname to IP using PowerShell
     */
    /**
     * Resolve hostname to the best reachable IP (Happy Eyeballs-ish for Cloudflare)
     */
    private resolveServerIp;
    /**
     * Helper: Check TCP connectivity with short timeout
     */
    private checkTcpConnectivity;
    /**
     * Generate sing-box configuration JSON
     */
    private generateConfig;
    /**
     * Build transport configuration
     */
    private buildTransport;
    /**
     * Connect using sing-box
     */
    connect(protocol: VpnProtocol, config: SingboxProfile, profileName: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Called when connection is established
     */
    private onConnected;
    /**
     * Fetch public IP
     */
    private fetchPublicIp;
    /**
     * Fetch country from IP
     */
    private fetchCountryFromIp;
    /**
     * Test latency through the tunnel using HTTP request
     * Returns latency in milliseconds or -1 if failed
     */
    testLatency(targetUrl?: string): Promise<number>;
    /**
     * Test TCP ping to the VPN server directly (not through tunnel)
     * Returns latency in milliseconds or -1 if failed
     */
    testServerPing(): Promise<number>;
    /**
     * Start stats monitoring - fetches traffic from Clash API
     */
    private startStatsMonitoring;
    /**
     * Disconnect
     */
    disconnect(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Cleanup resources
     */
    private cleanup;
    /**
     * Get current state for IPC
     */
    getState(): {
        status: VpnStatus;
        stats: VpnStats;
    };
}
export {};
