import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react'
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
    addSubscription: (url: string, name?: string) => Promise<void>
    updateSubscription: (sub: VpnSubscription) => void
    deleteSubscription: (id: string) => void
    refreshSubscription: (id: string, directSub?: VpnSubscription) => Promise<void>
    refreshingSubIds: string[]

    // Connection actions
    connect: (overrideProfile?: VpnProfile) => Promise<void>
    disconnect: () => Promise<void>
    testAllPings: (mode?: 'tcp' | 'http' | 'real', profileIds?: string[]) => Promise<void>
    testSingleProfile: (profileId: string, mode?: 'tcp' | 'http' | 'real') => Promise<void>
    cancelPings: () => Promise<void>
    pingProgress: { done: number; total: number }
    clearPings: () => void
    isTestingPings: boolean
    testingProfileIds: string[]

    // Logs
    logs: ConnectionLog[]
    addLog: (log: Omit<ConnectionLog, 'id' | 'timestamp'>) => void
    clearLogs: () => void

    // Settings
    settings: AppSettings
    updateSettings: (settings: Partial<AppSettings>) => Promise<boolean>
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
    const [refreshingSubIds, setRefreshingSubIds] = useState<string[]>([])
    const [isTestingPings, setIsTestingPings] = useState(false)
    const [testingProfileIds, setTestingProfileIds] = useState<string[]>([])
    const [pingProgress, setPingProgress] = useState({ done: 0, total: 0 })
    const pingRun = useRef<{ id: string; pending: Set<string>; total: number } | null>(null)
    const pingBusy = useRef(false)
    const cancellingPings = useRef<Promise<void> | null>(null)
    const acceptPing = useCallback((id: string, latency: number, mode: 'tcp' | 'http' | 'real', requestId: string) => {
        const run = pingRun.current
        if (!run || run.id !== requestId || !run.pending.delete(id)) return
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, ping: latency, pingMode: mode } : p))
        setTestingProfileIds([...run.pending])
        setPingProgress({ done: run.total - run.pending.size, total: run.total })
    }, [])
    const subscriptionsRef = useRef<VpnSubscription[]>([])
    subscriptionsRef.current = subscriptions

    const currentProfileRef = useRef<VpnProfile | null>(null)
    currentProfileRef.current = currentProfile

    const profilesRef = useRef<VpnProfile[]>([])
    profilesRef.current = profiles

    const connectionStateRef = useRef<ConnectionState>(connectionState)
    connectionStateRef.current = connectionState

    const [logs, setLogs] = useState<ConnectionLog[]>([])
    const [settings, setSettings] = useState<AppSettings>(createDefaultSettings())

    const settingsRef = useRef(settings)
    settingsRef.current = settings
    const pendingRouting = useRef<AppSettings | null>(null)
    const applyingRouting = useRef<Promise<boolean> | null>(null)

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
                const target = currentProfileRef.current || profilesRef.current[0]
                if (target) connect(target)
            })

            window.electronAPI.onTrayDisconnect(() => {
                disconnect()
            })

            window.electronAPI.onTraySelectProfile?.((profileId: string) => {
                const target = profilesRef.current.find(p => p.id === profileId)
                if (!target) return
                if (connectionStateRef.current === 'connected' && currentProfileRef.current?.id === profileId) {
                    disconnect()
                } else {
                    selectProfile(target)
                    connect(target)
                }
            })

            window.electronAPI.onPingResult?.((res) => {
                if (res.requestId) acceptPing(res.profileId, res.latency, res.mode as any, res.requestId)
            })
        }
    }, [])

    // Sync system tray menu whenever profiles or connection state changes
    useEffect(() => {
        if (window.electronAPI?.updateTrayMenu) {
            const isConnected = connectionState === 'connected'
            window.electronAPI.updateTrayMenu(profiles, isConnected, currentProfile?.id)
        }
    }, [profiles, connectionState, currentProfile])

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

    const refreshSubscription = useCallback(async (id: string, directSub?: VpnSubscription) => {
        if (!window.electronAPI) return
        const sub = directSub || subscriptionsRef.current.find(s => s.id === id)
        if (!sub) return

        setRefreshingSubIds(prev => prev.includes(id) ? prev : [...prev, id])

        try {
            const res = await window.electronAPI.fetchSubscription(sub.url)
            if (!res.success) throw new Error(res.error)

            const { parseSubscriptionData } = await import('../utils/linkParser')
            const parsed = parseSubscriptionData(res.content!, res.headers!, sub.url)

            // Update sub stats
            const updatedSub: VpnSubscription = {
                ...sub,
                name: (sub.name && sub.name !== 'New Subscription' && sub.name !== new URL(sub.url).hostname) ? sub.name : (parsed.name || sub.name),
                upload: parsed.upload,
                download: parsed.download,
                total: parsed.total,
                expire: parsed.expire,
                lastUpdated: Date.now()
            }
            setSubscriptions(prev => {
                const exists = prev.some(s => s.id === id)
                if (exists) {
                    return prev.map(s => s.id === id ? updatedSub : s)
                } else {
                    return [...prev, updatedSub]
                }
            })

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
        } finally {
            setRefreshingSubIds(prev => prev.filter(item => item !== id))
        }
    }, [addLog])

    // Auto-refresh subscriptions on startup once loaded
    const initialRefreshDone = useRef(false)
    useEffect(() => {
        if (!initialRefreshDone.current && subscriptions.length > 0) {
            initialRefreshDone.current = true
            subscriptions.forEach((sub, idx) => {
                setTimeout(() => {
                    refreshSubscription(sub.id, sub)
                }, idx * 300)
            })
        }
    }, [subscriptions, refreshSubscription])

    const addSubscription = useCallback(async (url: string, name: string = '') => {
        const id = crypto.randomUUID()
        const newSub: VpnSubscription = {
            id,
            name: name || 'New Subscription',
            url,
            upload: 0,
            download: 0,
            total: 0,
            expire: 0,
            lastUpdated: 0,
            createdAt: Date.now()
        }
        setSubscriptions(prev => [...prev, newSub])
        await refreshSubscription(id, newSub)
    }, [refreshSubscription])

    const updateSubscription = useCallback((sub: VpnSubscription) => {
        setSubscriptions(prev => prev.map(s => s.id === sub.id ? sub : s))
    }, [])

    const deleteSubscription = useCallback((id: string) => {
        setSubscriptions(prev => prev.filter(s => s.id !== id))
        setProfiles(prev => prev.filter(p => p.subscriptionId !== id))
    }, [])

    const cancelPings = useCallback(async () => {
        if (cancellingPings.current) return cancellingPings.current
        pingBusy.current = true
        pingRun.current = null // Ignore already queued results immediately.
        const cancellation = (async () => {
            try { await window.electronAPI?.cancelPingTests() }
            catch (e) { console.error('Cancel ping tests:', e) }
            finally {
                pingBusy.current = false
                setTestingProfileIds([])
                setIsTestingPings(false)
            }
        })()
        cancellingPings.current = cancellation
        try { await cancellation } finally { cancellingPings.current = null }
    }, [])

    const testAllPings = useCallback(async (mode: 'tcp' | 'http' | 'real' = 'real', profileIds?: string[]) => {
        const api = window.electronAPI
        if (!api || pingBusy.current) return
        const chosen = profileIds ? new Set(profileIds) : null
        const targets = profilesRef.current.filter(p => !chosen || chosen.has(p.id))
        if (!targets.length) return
        const requestId = crypto.randomUUID()
        const ids = new Set(targets.map(p => p.id))
        pingBusy.current = true
        pingRun.current = { id: requestId, pending: new Set(ids), total: ids.size }
        setIsTestingPings(true)
        setTestingProfileIds([...ids])
        setPingProgress({ done: 0, total: ids.size })
        setProfiles(prev => prev.map(p => ids.has(p.id) ? { ...p, ping: undefined, pingMode: undefined } : p))
        try {
            if (mode === 'real') {
                const results = await api.batchRealDelay(targets, undefined, requestId)
                for (const p of targets) acceptPing(p.id, results[p.id] ?? -1, p.protocol === 'openconnect' ? 'tcp' : 'real', requestId)
            } else {
                for (let i = 0; i < targets.length && pingRun.current?.id === requestId; i += 4) {
                    await Promise.all(targets.slice(i, i + 4).map(async p => {
                        let ms = -1
                        try {
                            const result = mode === 'tcp'
                                ? await api.tcpPing(p.serverAddress, p.port)
                                : await api.httpPing(p.serverAddress, p.port, p.singboxConfig?.security === 'tls' || p.singboxConfig?.security === 'reality' || p.port === 443, p.singboxConfig?.sni || p.serverAddress)
                            if (result.success) ms = result.latency
                        } catch { /* Failed profiles retain an explicit timeout. */ }
                        acceptPing(p.id, ms, mode, requestId)
                    }))
                }
            }
        } catch (e) {
            console.error('Ping test failed:', e)
            for (const p of targets) acceptPing(p.id, -1, mode, requestId)
        } finally {
            // Cancellation/new runs own their state; old completions must not reset it.
            if (pingRun.current?.id === requestId) {
                pingRun.current = null
                pingBusy.current = false
                setTestingProfileIds([])
                setIsTestingPings(false)
            }
        }
    }, [acceptPing])

    const testSingleProfile = useCallback(async (profileId: string, mode: 'tcp' | 'http' | 'real' = 'real') => {
        await testAllPings(mode, [profileId])
    }, [testAllPings])

    const clearPings = useCallback(() => {
        void cancelPings()
        setProfiles(prev => prev.map(p => ({ ...p, ping: undefined, pingMode: undefined })))
    }, [cancelPings])

    const connect = useCallback(async (overrideProfile?: VpnProfile) => {
        const target = overrideProfile || currentProfileRef.current
        if (!target) return

        if (overrideProfile && overrideProfile.id !== currentProfileRef.current?.id) {
            setCurrentProfile(overrideProfile)
            localStorage.setItem('vpn-current-profile', overrideProfile.id)
        }

        setConnectionState('connecting')
        addLog({
            profileId: target.id,
            profileName: target.name,
            level: 'info',
            message: `Connecting to ${target.serverAddress}...`
        })

        try {
            if (window.electronAPI) {
                // Use settings as the single authoritative source for split tunneling
                const isBypassActive = settings.bypassIranRoutes === true
                const enrichedProfile = {
                    ...target,
                    bypassIranRoutes: isBypassActive,
                    bypassPrivateIps: isBypassActive,
                    bypassDomains: settings.bypassDomains || [],
                    bypassIps: settings.bypassIps || [],
                    singboxConfig: target.singboxConfig ? {
                        ...target.singboxConfig,
                        mtu: settings.mtuSize, // Pass MTU from app settings
                        tunStack: settings.tunStack, // Pass TUN Stack from app settings
                        bypassIranRoutes: isBypassActive,
                        bypassPrivateIps: isBypassActive,
                        bypassDomains: settings.bypassDomains || [],
                        bypassIps: settings.bypassIps || []
                    } : undefined
                }
                const result = await window.electronAPI.connect(enrichedProfile)
                if (!result.success) {
                    throw new Error(result.error)
                }
                setConnectionState('connected')
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
                profileId: target.id,
                profileName: target.name,
                level: 'success',
                message: 'Connected successfully'
            })

            // Update last connected
            updateProfile({ ...target, lastConnected: Date.now() })
        } catch (error) {
            setConnectionState('error')
            addLog({
                profileId: target.id,
                profileName: target.name,
                level: 'error',
                message: `Connection failed: ${error}`
            })
        }
    }, [updateProfile, settings, addLog])

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

    const updateSettings = useCallback(async (newSettings: Partial<AppSettings>): Promise<boolean> => {
        const previous = settingsRef.current
        const changed = (Object.keys(newSettings) as (keyof AppSettings)[])
            .filter(key => JSON.stringify(previous[key]) !== JSON.stringify(newSettings[key]))
        // A blur followed by Save, or window focus changes, must not restart VPN.
        if (!changed.length) return applyingRouting.current || true
        const merged = { ...previous, ...newSettings }
        settingsRef.current = merged
        setSettings(merged)
        const routingKeys: (keyof AppSettings)[] = ['bypassIranRoutes', 'bypassPrivateIps', 'bypassDomains', 'bypassIps', 'tunStack', 'mtuSize']
        if (!changed.some(key => routingKeys.includes(key)) || connectionStateRef.current !== 'connected' || !window.electronAPI) return true
        pendingRouting.current = merged
        if (applyingRouting.current) return applyingRouting.current
        const apply = (async () => {
            let succeeded = true
            while (pendingRouting.current) {
                const snapshot = pendingRouting.current
                pendingRouting.current = null
                const profile = currentProfileRef.current
                if (connectionStateRef.current !== 'connected' || !profile) break
                const bypass = snapshot.bypassIranRoutes === true
                const routing = { bypassIranRoutes: bypass, bypassPrivateIps: bypass, bypassDomains: snapshot.bypassDomains || [], bypassIps: snapshot.bypassIps || [] }
                const enriched = { ...profile, ...routing,
                    singboxConfig: profile.singboxConfig ? { ...profile.singboxConfig, ...routing, mtu: snapshot.mtuSize, tunStack: snapshot.tunStack } : undefined }
                try {
                    addLog({ profileId: profile.id, profileName: profile.name, level: 'info', message: 'Applying updated bypass rules...' })
                    const result = await window.electronAPI!.connect(enriched)
                    if (!result.success) throw new Error(result.error || 'Could not apply routing settings')
                    addLog({ profileId: profile.id, profileName: profile.name, level: 'success', message: 'Bypass settings applied to active connection' })
                } catch (error) {
                    succeeded = false
                    pendingRouting.current = null
                    addLog({ profileId: profile.id, profileName: profile.name, level: 'error', message: `Settings saved; reconnect to apply them: ${String(error)}` })
                }
            }
            return succeeded
        })()
        applyingRouting.current = apply
        try { return await apply } finally { applyingRouting.current = null }
    }, [addLog])

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
        refreshingSubIds,
        connect,
        disconnect,
        testAllPings,
        testSingleProfile,
        clearPings,
        cancelPings,
        pingProgress,
        isTestingPings,
        testingProfileIds,
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
        refreshingSubIds,
        connect,
        disconnect,
        testAllPings,
        testSingleProfile,
        clearPings,
        cancelPings,
        pingProgress,
        isTestingPings,
        testingProfileIds,
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
