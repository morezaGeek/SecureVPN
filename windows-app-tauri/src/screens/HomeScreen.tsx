import { useVpn } from '../context/VpnContext'
import { Power, ArrowUp, ArrowDown, Clock, Globe, Shield, MapPin, Zap, Server } from 'lucide-react'
import { formatBytes, formatBits, formatDuration } from '../types'
import { getFlag } from '../components/Flags'
import { useEffect, useState, useRef, useCallback } from 'react'

type LatencyTestMode = 'manual' | '1s' | '5s' | '30s' | '60s'

export default function HomeScreen() {
    const { connectionState, currentProfile, stats, profiles, selectProfile, connect, disconnect } = useVpn()
    const [elapsedTime, setElapsedTime] = useState(0)
    const [latency, setLatency] = useState<number | null>(null)
    const [isTestingLatency, setIsTestingLatency] = useState(false)
    const [latencyTestMode, setLatencyTestMode] = useState<LatencyTestMode>('manual')
    const [realPublicIp, setRealPublicIp] = useState<string | null>(null)
    const latencyIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch real public IP when disconnected
    useEffect(() => {
        if (connectionState === 'disconnected' && !realPublicIp) {
            if (window.electronAPI && window.electronAPI.fetchOriginalIp) {
                window.electronAPI.fetchOriginalIp().then(ip => {
                    if (ip) setRealPublicIp(ip)
                }).catch(() => {})
            }
        }
    }, [connectionState, realPublicIp])

    // Check if current profile is V2ray protocol
    const isV2rayProtocol = currentProfile?.protocol &&
        ['vless', 'vmess', 'trojan', 'shadowsocks'].includes(currentProfile.protocol)

    // Update connection time - smooth local 1s timer when connected
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        if (connectionState === 'connected') {
            const initialTime = stats.connectedTime || 0
            const startTime = Date.now() - initialTime
            setElapsedTime(initialTime)
            interval = setInterval(() => {
                setElapsedTime(Date.now() - startTime)
            }, 1000)
        } else {
            setElapsedTime(0)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [connectionState])

    // Test latency function
    const testLatency = useCallback(async () => {
        if (connectionState !== 'connected' || !isV2rayProtocol) return

        setIsTestingLatency(true)
        try {
            const latencyResult = await window.electronAPI.testLatency()

            if (latencyResult.success && latencyResult.latency > 0) {
                setLatency(latencyResult.latency)
            } else {
                setLatency(-1)
            }
        } catch {
            setLatency(-1)
        } finally {
            setIsTestingLatency(false)
        }
    }, [connectionState, isV2rayProtocol])

    // Handle latency test mode changes
    useEffect(() => {
        // Clear any existing interval
        if (latencyIntervalRef.current) {
            clearInterval(latencyIntervalRef.current)
            latencyIntervalRef.current = null
        }

        // Reset latency when disconnected
        if (connectionState !== 'connected') {
            setLatency(null)
            setLatencyTestMode('manual')
            return
        }

        // Set up auto-test based on mode
        if (latencyTestMode !== 'manual' && isV2rayProtocol) {
            const intervals: Record<string, number> = {
                '1s': 1000,
                '5s': 5000,
                '30s': 30000,
                '60s': 60000
            }
            const interval = intervals[latencyTestMode]
            if (interval) {
                // Run immediately first
                testLatency()
                // Then set up interval
                latencyIntervalRef.current = setInterval(testLatency, interval)
            }
        }

        return () => {
            if (latencyIntervalRef.current) {
                clearInterval(latencyIntervalRef.current)
                latencyIntervalRef.current = null
            }
        }
    }, [latencyTestMode, connectionState, isV2rayProtocol, testLatency])

    const handleToggleConnection = async () => {
        if (connectionState === 'connected' || connectionState === 'connecting') {
            await disconnect()
        } else {
            await connect()
        }
    }

    const getButtonClass = () => {
        switch (connectionState) {
            case 'connecting':
            case 'disconnecting':
                return 'connection-button connecting'
            case 'connected':
                return 'connection-button connected'
            default:
                return 'connection-button'
        }
    }

    const getStatusText = () => {
        switch (connectionState) {
            case 'connecting': return 'Connecting...'
            case 'connected': return 'Connected'
            case 'disconnecting': return 'Disconnecting...'
            case 'error': return 'Error'
            default: return 'Disconnected'
        }
    }

    const getPingDisplay = (value: number | null) => {
        if (isTestingLatency) return '...'
        if (value === null) return '—'
        if (value < 0) return 'Error'
        return `${value}ms`
    }

    const getPingColor = (value: number | null) => {
        if (value === null || value < 0) return undefined
        if (value < 100) return '#4ade80' // green
        if (value < 300) return '#fbbf24' // yellow
        return '#ef4444' // red
    }

    return (
        <div>
            {/* Profile Selector - Shown when disconnected or error */}
            {profiles.length > 0 && (connectionState === 'disconnected' || connectionState === 'error') && (
                <div className="profile-selector-container">
                    <select
                        className="form-input form-select compact-select"
                        value={currentProfile?.id || ''}
                        onChange={(e) => {
                            const profile = profiles.find(p => p.id === e.target.value)
                            if (profile) selectProfile(profile)
                        }}
                        title="Select VPN Profile"
                    >
                        <option value="">Select Profile...</option>
                        {profiles.map(profile => (
                            <option key={profile.id} value={profile.id}>
                                {profile.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Connection Button Area */}
            <div className="connection-button-container">
                <button
                    className={getButtonClass()}
                    onClick={handleToggleConnection}
                    disabled={!currentProfile && connectionState === 'disconnected'}
                    title={!currentProfile ? 'Select a profile first' : undefined}
                >
                    <Power strokeWidth={1.5} />
                </button>

                <div className="connection-status">
                    <div className={`connection-status-badge ${connectionState}`}>
                        <span className="status-dot"></span>
                        <span className={`connection-status-text ${connectionState}`}>
                            {getStatusText().toUpperCase()}
                        </span>
                    </div>
                    {currentProfile && (
                        <p className="connection-status-detail">
                            {currentProfile.name} • {connectionState === 'connected' ? stats.publicIp : currentProfile.serverAddress}
                        </p>
                    )}
                </div>
            </div>

            {/* Integrated Stats Grid - Shown when connected or connecting */}
            {(connectionState === 'connected' || connectionState === 'connecting') && (
                <div className="stats-grid-compact">
                    <div className="stat-card stat-card-compact">
                        <ArrowDown size={12} className="stat-icon stat-icon-compact" />
                        <div className="stat-value-compact">{formatBits(stats.downloadSpeed)}/s</div>
                        <div className="stat-label-compact">Down</div>
                    </div>
                    <div className="stat-card stat-card-compact">
                        <ArrowUp size={12} className="stat-icon stat-icon-compact" />
                        <div className="stat-value-compact">{formatBits(stats.uploadSpeed)}/s</div>
                        <div className="stat-label-compact">Up</div>
                    </div>
                    <div className="stat-card stat-card-compact">
                        <Clock size={12} className="stat-icon stat-icon-compact" />
                        <div className="stat-value-compact">{formatDuration(elapsedTime)}</div>
                        <div className="stat-label-compact">Time</div>
                    </div>
                    <div className="stat-card stat-card-compact">
                        <Globe size={12} className="stat-icon stat-icon-compact" />
                        <div className="stat-value-xs">{stats.publicIp || stats.privateIp || '—'}</div>
                        <div className="stat-label-compact">{stats.publicIp ? 'Public IP' : 'VPN IP'}</div>
                    </div>
                    <div className="stat-card stat-card-compact">
                        <MapPin size={12} className="stat-icon stat-icon-compact" />
                        <div style={{ marginTop: 4 }}>{getFlag(stats.countryCode || '', 28)}</div>
                        <div className="stat-label-compact">{stats.countryName || 'Location'}</div>
                    </div>
                    <div 
                        className="stat-card stat-card-compact clickable" 
                        onClick={testLatency}
                        style={{ cursor: isV2rayProtocol ? 'pointer' : 'default' }}
                        title={isV2rayProtocol ? "Click to test latency manually" : "Latency test not available for this protocol"}
                    >
                        <Zap size={12} className="stat-icon stat-icon-compact" color={getPingColor(latency)} />
                        <div className="stat-value-xs" style={{ color: getPingColor(latency) }}>
                            {getPingDisplay(latency)}
                        </div>
                        <div className="stat-label-compact">Live Ping</div>
                    </div>
                    <div className="stat-card stat-card-compact" style={{ gridColumn: '1 / -1', flexDirection: 'row', gap: '12px', justifyContent: 'center' }}>
                        <Shield size={14} className="stat-icon stat-icon-compact" style={{ marginBottom: 0 }} />
                        <div className="stat-label-compact" style={{ fontSize: '11px' }}>Original IP:</div>
                        <div className="stat-value-xs" style={{ fontSize: '12px' }}>{realPublicIp || '—'}</div>
                    </div>
                </div>
            )}

            {/* Compact Total Traffic Info */}
            {connectionState === 'connected' && (
                <div className="traffic-stats">
                    <span>Total ↓: {formatBytes(stats.totalDownloaded)}</span>
                    <span>Total ↑: {formatBytes(stats.totalUploaded)}</span>
                </div>
            )}

            {/* Latency Test - Only for V2ray protocols when connected */}
            {connectionState === 'connected' && isV2rayProtocol && (
                <div className="latency-test-container">
                    <div className="latency-display">
                        <Zap size={14} style={{ color: getPingColor(latency) }} />
                        <span className="latency-value" style={{ color: getPingColor(latency) }}>
                            {getPingDisplay(latency)}
                        </span>
                        <span className="latency-label">Latency</span>
                    </div>
                    <div className="latency-controls">
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={testLatency}
                            disabled={isTestingLatency || latencyTestMode !== 'manual'}
                            title="Test latency now"
                        >
                            Test
                        </button>
                        <select
                            className="form-input form-select latency-mode-select"
                            value={latencyTestMode}
                            onChange={(e) => setLatencyTestMode(e.target.value as LatencyTestMode)}
                        >
                            <option value="manual">Manual</option>
                            <option value="1s">Every 1s</option>
                            <option value="5s">Every 5s</option>
                            <option value="30s">Every 30s</option>
                            <option value="60s">Every 60s</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    )
}

