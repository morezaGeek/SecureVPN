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
    const [serverPing, setServerPing] = useState<number | null>(null)
    const [isTestingLatency, setIsTestingLatency] = useState(false)
    const [latencyTestMode, setLatencyTestMode] = useState<LatencyTestMode>('manual')
    const latencyIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Check if current profile is V2ray protocol
    const isV2rayProtocol = currentProfile?.protocol &&
        ['vless', 'vmess', 'trojan', 'shadowsocks'].includes(currentProfile.protocol)

    // Update connection time - stats.connectedTime is already duration in ms
    useEffect(() => {
        if (connectionState === 'connected' && stats.connectedTime > 0) {
            // stats.connectedTime is already the duration, use it directly
            setElapsedTime(stats.connectedTime)
        } else {
            setElapsedTime(0)
        }
    }, [connectionState, stats.connectedTime])

    // Test both latencies function
    const testLatency = useCallback(async () => {
        if (connectionState !== 'connected' || !isV2rayProtocol) return

        setIsTestingLatency(true)
        try {
            // Test both in parallel
            const [latencyResult, serverPingResult] = await Promise.all([
                window.electronAPI.testLatency(),
                window.electronAPI.testServerPing()
            ])

            if (latencyResult.success && latencyResult.latency > 0) {
                setLatency(latencyResult.latency)
            } else {
                setLatency(-1)
            }

            if (serverPingResult.success && serverPingResult.latency > 0) {
                setServerPing(serverPingResult.latency)
            } else {
                setServerPing(-1)
            }
        } catch {
            setLatency(-1)
            setServerPing(-1)
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
            setServerPing(null)
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
                    <p className={`connection-status-text ${connectionState}`} style={{ fontSize: 16, fontWeight: 700 }}>
                        {getStatusText().toUpperCase()}
                    </p>
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
                    <div className="stat-card stat-card-compact">
                        <Shield size={12} className="stat-icon stat-icon-compact" />
                        <div className="stat-value-xs">{stats.transportProtocol || 'TCP'}</div>
                        <div className="stat-label-compact">Protocol</div>
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
                        <Server size={14} style={{ color: getPingColor(serverPing) }} />
                        <span className="latency-value" style={{ color: getPingColor(serverPing) }}>
                            {getPingDisplay(serverPing)}
                        </span>
                        <span className="latency-label">TCP PING</span>
                    </div>
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

