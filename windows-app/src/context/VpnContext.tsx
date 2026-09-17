import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { VpnProfile, ConnectionState, ConnectionStats, ConnectionLog, AppSettings, createDefaultSettings, VpnSubscription, createDefaultProfile } from '../types'

interface VpnContextType {
    // Connection state
    connectionState: ConnectionState
    currentProfile: VpnProfile | null
    stats: ConnectionStats

    // Profiles
    profiles: VpnProfile[]
    addProfile: (profile: VpnProfile) => void
    updateProfile: (profile: VpnProfile) => void
    deleteProfile: (id: string) => void
    selectProfile: (profile: VpnProfile) => void

    // Subscriptions
    subscriptions: VpnSubscription[]
    addSubscription: (url: string) => Promise<void>
    updateSubscription: (sub: VpnSubscription) => void
    deleteSubscription: (id: string) => void
    refreshSubscription: (id: string) => Promise<void>

    // Connection actions
    connect: () => Promise<void>
    disconnect: () => Promise<void>
    testAllPings: () => Promise<void>

    // Logs
    logs: ConnectionLog[]
    addLog: (log: Omit<ConnectionLog, 'id' | 'timestamp'>) => void
    clearLogs: () => void

    // Settings
    settings: AppSettings
    updateSettings: (settings: Partial<AppSettings>) => void
}

const VpnContext = createContext<VpnContextType | null>(null)

export function useVpn() {
    const context = useContext(VpnContext)
    if (!context) {
        throw new Error('useVpn must be used within VpnProvider')
    }
    return context
}

interface VpnProviderProps {
    children: ReactNode
}

export function VpnProvider({ children }: VpnProviderProps) {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
    const [currentProfile, setCurrentProfile] = useState<VpnProfile | null>(null)
    const [stats, setStats] = useState<ConnectionStats>({
        uploadSpeed: 0,
        downloadSpeed: 0,
        totalUploaded: 0,
        totalDownloaded: 0,
        connectedTime: 0,
        privateIp: '',
        publicIp: '',
        mtu: 1400
    })
    const [profiles, setProfiles] = useState<VpnProfile[]>([])
    const [subscriptions, setSubscriptions] = useState<VpnSubscription[]>([])
    const [logs, setLogs] = useState<ConnectionLog[]>([])
    const [settings, setSettings] = useState<AppSettings>(createDefaultSettings())

    // Load saved data on mount
    useEffect(() => {
        // Check storage version - clear profiles on upgrade to 1.0.6
        const STORAGE_VERSION = '1.0.6'
        const storedVersion = localStorage.getItem('vpn-storage-version')

        if (storedVersion !== STORAGE_VERSION) {
            // Clear old profiles on version upgrade - fresh start
            localStorage.removeItem('vpn-profiles')
            localStorage.setItem('vpn-storage-version', STORAGE_VERSION)
            console.log('Cleared old profiles for version upgrade to', STORAGE_VERSION)
        }

        const savedProfiles = localStorage.getItem('vpn-profiles')
        const savedSubscriptions = localStorage.getItem('vpn-subscriptions')
        const savedSettings = localStorage.getItem('vpn-settings')

        if (savedProfiles) {
            try {
                setProfiles(JSON.parse(savedProfiles))
            } catch (e) {
                console.error('Failed to load profiles:', e)
            }
        }

        if (savedSubscriptions) {
            try {
                setSubscriptions(JSON.parse(savedSubscriptions))
            } catch (e) {
                console.error('Failed to load subscriptions:', e)
            }
        }

        if (savedSettings) {
            try {
                setSettings({ ...createDefaultSettings(), ...JSON.parse(savedSettings) })
            } catch (e) {
                console.error('Failed to load settings:', e)
            }
        }

        // Listen for VPN state changes from Electron
        if (window.electronAPI) {
            window.electronAPI.onVpnStateChanged((state) => {
                setConnectionState(state.status)
                if (state.profile) setCurrentProfile(state.profile)
                if (state.stats) setStats({ ...state.stats, mtu: state.stats.mtu || 1400 })
            })

            // Listen for VPN logs from main process
            window.electronAPI.onVpnLog?.((log) => {
                const newLog: ConnectionLog = {
                    id: crypto.randomUUID(),
                    profileId: currentProfile?.id || 'system',
                    profileName: currentProfile?.name || 'System',
                    timestamp: log.timestamp || Date.now(),
                    level: log.level || 'info',
                    message: log.message
                }
                setLogs(prev => [newLog, ...prev].slice(0, 1000))
            })

            window.electronAPI.onTrayConnect(() => {
                if (currentProfile) connect()
            })

            window.electronAPI.onTrayDisconnect(() => {
                disconnect()
            })
        }
    }, [])

    // Save profiles when changed
    useEffect(() => {
        localStorage.setItem('vpn-profiles', JSON.stringify(profiles))
    }, [profiles])

    // Save subscriptions when changed
    useEffect(() => {
        localStorage.setItem('vpn-subscriptions', JSON.stringify(subscriptions))
    }, [subscriptions])

    // Save settings when changed
    useEffect(() => {
        localStorage.setItem('vpn-settings', JSON.stringify(settings))
    }, [settings])

    const addLog = useCallback((log: Omit<ConnectionLog, 'id' | 'timestamp'>) => {
        const newLog: ConnectionLog = {
            ...log,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        }
        setLogs(prev => [newLog, ...prev].slice(0, 1000))
    }, [])

    const clearLogs = useCallback(() => {
        setLogs([])
    }, [])

    const addProfile = useCallback((profile: VpnProfile) => {
        setProfiles(prev => [...prev, profile])
        addLog({
            profileId: profile.id,
            profileName: profile.name,
            level: 'info',
            message: `Profile "${profile.name}" created`
        })
    }, [])

    const updateProfile = useCallback((profile: VpnProfile) => {
        setProfiles(prev => prev.map(p => p.id === profile.id ? profile : p))
        // CRITICAL: Also update currentProfile if this is the currently selected profile
        // This ensures connect() uses the latest profile settings (e.g., bypassIranRoutes)
        if (currentProfile?.id === profile.id) {
            setCurrentProfile(profile)
        }
    }, [currentProfile])

    const deleteProfile = useCallback((id: string) => {
        setProfiles(prev => prev.filter(p => p.id !== id))
        if (currentProfile?.id === id) {
            setCurrentProfile(null)
        }
    }, [currentProfile])

    const selectProfile = useCallback((profile: VpnProfile) => {
        setCurrentProfile(profile)
    }, [])

    const refreshSubscription = useCallback(async (id: string) => {
        if (!window.electronAPI) return
        const sub = subscriptions.find(s => s.id === id)
        if (!sub) return

        try {
            const res = await window.electronAPI.fetchSubscription(sub.url)
            if (!res.success) throw new Error(res.error)

            const { parseSubscriptionData } = await import('../utils/linkParser')
            const parsed = parseSubscriptionData(res.content!, res.headers!, sub.url)

            // Update sub stats
            const updatedSub = {
                ...sub,
                name: parsed.name || sub.name,
                upload: parsed.upload,
                download: parsed.download,
                total: parsed.total,
                expire: parsed.expire,
                lastUpdated: Date.now()
            }
            setSubscriptions(prev => prev.map(s => s.id === id ? updatedSub : s))

            // Replace profiles
            setProfiles(prev => {
                const filtered = prev.filter(p => p.subscriptionId !== id)
                const newProfiles = parsed.links.map(link => ({
                    ...createDefaultProfile(),
                    id: crypto.randomUUID(),
                    name: link.name,
                    serverAddress: link.config.address,
                    protocol: link.protocol,
                    port: link.config.port,
                    singboxConfig: link.config,
                    subscriptionId: id,
                    createdAt: Date.now()
                }))
                return [...filtered, ...newProfiles]
            })

            addLog({
                profileId: 'system',
                profileName: 'System',
                level: 'success',
                message: `Refreshed subscription: ${updatedSub.name}`
            })
        } catch (e) {
            addLog({
                profileId: 'system',
                profileName: 'System',
                level: 'error',
                message: `Failed to refresh subscription: ${e}`
            })
            throw e
        }
    }, [subscriptions, addLog])

    const addSubscription = useCallback(async (url: string) => {
        const id = crypto.randomUUID()
        const newSub = {
            id,
            name: 'New Subscription',
            url,
            upload: 0,
            download: 0,
            total: 0,
            expire: 0,
            lastUpdated: 0,
            createdAt: Date.now()
        }
        setSubscriptions(prev => [...prev, newSub])
        
        // Timeout to allow state to settle
        setTimeout(() => refreshSubscription(id), 100)
    }, [refreshSubscription])

    const updateSubscription = useCallback((sub: VpnSubscription) => {
        setSubscriptions(prev => prev.map(s => s.id === sub.id ? sub : s))
    }, [])

    const deleteSubscription = useCallback((id: string) => {
        setSubscriptions(prev => prev.filter(s => s.id !== id))
        setProfiles(prev => prev.filter(p => p.subscriptionId !== id))
    }, [])

    const testAllPings = useCallback(async () => {
        if (!window.electronAPI) return
        
        // Reset all pings first
        setProfiles(prev => prev.map(p => ({ ...p, ping: undefined })))
        
        const batchSize = 3
        const targetProfiles = [...profiles]

        for (let i = 0; i < targetProfiles.length; i += batchSize) {
            const batch = targetProfiles.slice(i, i + batchSize)
            await Promise.all(batch.map(async profile => {
                let finalLatency = -1
                try {
                    // Try Real Delay first (like Android)
                    if (['vless', 'vmess', 'trojan', 'shadowsocks'].includes(profile.protocol)) {
                        const realResult = await window.electronAPI.testProfileRealDelay(profile)
                        if (realResult.success && realResult.latency > 0) {
                            finalLatency = realResult.latency
                        }
                    }
                    
                    // Fallback to TCP ping if real delay failed
                    if (finalLatency <= 0 && profile.serverAddress && profile.port) {
                        const tcpResult = await window.electronAPI.tcpPing(profile.serverAddress, profile.port)
                        if (tcpResult.success && tcpResult.latency > 0) {
                            finalLatency = tcpResult.latency
                        }
                    }
                } catch (e) {
                    // Keep -1
                }
                
                setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, ping: finalLatency } : p))
            }))
        }
    }, [profiles])

    const connect = useCallback(async () => {
        if (!currentProfile) return

        setConnectionState('connecting')
        addLog({
            profileId: currentProfile.id,
            profileName: currentProfile.name,
            level: 'info',
            message: `Connecting to ${currentProfile.serverAddress}...`
        })

        try {
            if (window.electronAPI) {
                // Enrich profile with settings (MTU, etc.) for sing-box protocols
                const enrichedProfile = {
                    ...currentProfile,
                    bypassPrivateIps: settings.bypassPrivateIps,
                    bypassDomains: settings.bypassDomains,
                    bypassIps: settings.bypassIps,
                    singboxConfig: currentProfile.singboxConfig ? {
                        ...currentProfile.singboxConfig,
                        mtu: settings.mtuSize, // Pass MTU from app settings
                        tunStack: settings.tunStack, // Pass TUN Stack from app settings
                        bypassPrivateIps: settings.bypassPrivateIps,
                        bypassDomains: settings.bypassDomains,
                        bypassIps: settings.bypassIps
                    } : undefined
                }
                const result = await window.electronAPI.connect(enrichedProfile)
                if (!result.success) {
                    throw new Error(result.error)
                }
            } else {
                // Demo mode for development
                await new Promise(resolve => setTimeout(resolve, 2000))
                setConnectionState('connected')
                setStats(prev => ({
                    ...prev,
                    privateIp: '10.0.0.' + Math.floor(Math.random() * 255),
                    connectedTime: Date.now()
                }))
            }

            addLog({
                profileId: currentProfile.id,
                profileName: currentProfile.name,
                level: 'success',
                message: 'Connected successfully'
            })

            // Update last connected
            updateProfile({ ...currentProfile, lastConnected: Date.now() })
        } catch (error) {
            setConnectionState('error')
            addLog({
                profileId: currentProfile.id,
                profileName: currentProfile.name,
                level: 'error',
                message: `Connection failed: ${error}`
            })
        }
    }, [currentProfile, updateProfile, settings])

    const disconnect = useCallback(async () => {
        setConnectionState('disconnecting')

        if (currentProfile) {
            addLog({
                profileId: currentProfile.id,
                profileName: currentProfile.name,
                level: 'info',
                message: 'Disconnecting...'
            })
        }

        try {
            if (window.electronAPI) {
                await window.electronAPI.disconnect()
            } else {
                await new Promise(resolve => setTimeout(resolve, 500))
            }

            setConnectionState('disconnected')
            setStats({
                uploadSpeed: 0,
                downloadSpeed: 0,
                totalUploaded: 0,
                totalDownloaded: 0,
                connectedTime: 0,
                privateIp: '',
                publicIp: '',
                mtu: 1400
            })

            if (currentProfile) {
                addLog({
                    profileId: currentProfile.id,
                    profileName: currentProfile.name,
                    level: 'success',
                    message: 'Disconnected'
                })
            }
        } catch (error) {
            console.error('Disconnect error:', error)
        }
    }, [currentProfile])

    const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }))
    }, [])

    const contextValue = useMemo(() => ({
        connectionState,
        currentProfile,
        stats,
        profiles,
        addProfile,
        updateProfile,
        deleteProfile,
        selectProfile,
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        refreshSubscription,
        connect,
        disconnect,
        testAllPings,
        logs,
        addLog,
        clearLogs,
        settings,
        updateSettings
    }), [
        connectionState,
        currentProfile,
        stats,
        profiles,
        addProfile,
        updateProfile,
        deleteProfile,
        selectProfile,
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        refreshSubscription,
        connect,
        disconnect,
        testAllPings,
        logs,
        addLog,
        clearLogs,
        settings,
        updateSettings
    ])

    return (
        <VpnContext.Provider value={contextValue}>
            {children}
        </VpnContext.Provider>
    )
}
