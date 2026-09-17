export interface ElectronAPI {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    getVpnState: () => Promise<any>;
    connect: (profile: any) => Promise<{
        success: boolean;
        error?: string;
    }>;
    disconnect: () => Promise<{
        success: boolean;
        error?: string;
    }>;
    isElevated: () => Promise<boolean>;
    testLatency: () => Promise<{
        success: boolean;
        latency: number;
        error?: string;
    }>;
    testServerPing: () => Promise<{
        success: boolean;
        latency: number;
        error?: string;
    }>;
    tcpPing: (host: string, port: number) => Promise<{
        success: boolean;
        latency: number;
        error?: string;
    }>;
    showSaveDialog: (options: any) => Promise<{
        canceled: boolean;
        filePath?: string;
    }>;
    showOpenDialog: (options: any) => Promise<{
        canceled: boolean;
        filePaths?: string[];
    }>;
    writeFile: (filePath: string, content: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    readFile: (filePath: string) => Promise<{
        success: boolean;
        content?: string;
        error?: string;
    }>;
    fetchSubscription: (url: string) => Promise<{
        success: boolean;
        headers: Record<string, string>;
        content: string;
        error?: string;
    }>;
    onVpnStateChanged: (callback: (state: any) => void) => void;
    onVpnLog: (callback: (log: any) => void) => void;
    onTrayConnect: (callback: () => void) => void;
    onTrayDisconnect: (callback: () => void) => void;
}
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
