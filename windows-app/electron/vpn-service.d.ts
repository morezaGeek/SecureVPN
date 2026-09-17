import { EventEmitter } from 'events';
export interface VpnProfile {
    id: string;
    name: string;
    serverAddress: string;
    protocol: 'openconnect' | 'sstp' | 'softether';
    port: number;
    username: string;
    password: string;
    authType: 'password' | 'certificate' | 'both';
    certificatePath?: string;
    caCertificatePath?: string;
    skipCertificateVerification: boolean;
    disableDtls: boolean;
    mtu?: number;
    dtlsCiphers?: string;
    preferWintun: boolean;
    bypassIranRoutes?: boolean;
}
export interface VpnStats {
    uploadSpeed: number;
    downloadSpeed: number;
    totalUploaded: number;
    totalDownloaded: number;
    connectedTime: number;
    privateIp: string;
    publicIp: string;
    transportProtocol?: 'TCP' | 'UDP/DTLS';
    countryCode?: string;
    countryName?: string;
    vpnGateway?: string;
}
export interface VpnConnectionResult {
    success: boolean;
    error?: string;
}
type VpnStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';
export declare class VpnService extends EventEmitter {
    private vpnProcess;
    private status;
    private currentProfile;
    private stats;
    private statsInterval;
    private lastBytesReceived;
    private lastBytesSent;
    private lastStatsTime;
    private vpnInterfaceName;
    private vpnGateway;
    private originalGateway;
    private serverIp;
    private routesConfigured;
    private vpnMtu;
    private lastServerFingerprint;
    private lastServerFingerprintRetried;
    private excludeRoutes;
    private includeRoutes;
    private originalIfIndex;
    private vpnInterfaceIndex;
    private connectTime;
    constructor();
    /**
     * Convert CIDR notation (e.g., "5.52.0.0/16") to network and mask.
     * Used to add Iran IP exclusion routes.
     */
    private cidrToNetworkMask;
    private createEmptyStats;
    getStatus(): VpnStatus;
    getStats(): VpnStats;
    getCurrentProfile(): VpnProfile | null;
    private emitStateChange;
    private log;
    private getOpenConnectPath;
    private getVpncScriptPath;
    private manualNetshConfig;
    private checkTapDriver;
    private getServerCertFingerprint;
    private probeWithOpenConnect;
    connect(profile: VpnProfile): Promise<VpnConnectionResult>;
    private buildOpenConnectArgs;
    private spawnOpenConnect;
    private fetchPublicIp;
    private fetchCountryFromIp;
    private configureRoutingAndFetchInfo;
    private getOriginalGateway;
    private resolveServerIp;
    private getVpnInterfaceIndex;
    private configureRouting;
    private applySplitRoutesBatch;
    private removeSplitRoutesBatch;
    private removeRoutes;
    private startStatsMonitoring;
    private updateStats;
    disconnect(): Promise<VpnConnectionResult>;
    isElevated(): boolean;
    getState(): {
        status: VpnStatus;
        profile: VpnProfile | null;
        stats: VpnStats;
    };
}
export declare const vpnService: VpnService;
export {};
