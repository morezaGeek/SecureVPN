import { useState, useEffect, useCallback } from 'react'
import { useVpn } from '../context/VpnContext'
import { VpnProfile, VpnProtocol, AuthType, PROTOCOL_INFO, createDefaultProfile, SingboxTransport, SingboxSecurity } from '../types'
import { Plus, Globe, Edit2, Trash2, X, Check, Download, Upload, Clipboard, RefreshCw, Link as LinkIcon, Database, Activity } from 'lucide-react'
import { parseShareLink } from '../utils/linkParser'

// Convert 2-letter country code to flag CDN url
function countryCodeToFlagUrl(code: string): string {
    if (!code || code.length !== 2) return ''
    return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`
}

// Extract country code from profile name (e.g. "DE Germany | MR" → "DE", "🇺🇸 United-States" → "US")
function extractCountryCode(name: string): string {
    const match = name.match(/^([A-Z]{2})\s/)
    if (match) return match[1]
    
    // Try to extract from emoji
    const flagMatch = name.match(/^[\u{1F1E6}-\u{1F1FF}]{2}/u)
    if (flagMatch) {
        const chars = [...flagMatch[0]]
        if (chars.length >= 2) {
            const c1 = (chars[0].codePointAt(0) || 0) - 0x1F1E6 + 65
            const c2 = (chars[1].codePointAt(0) || 0) - 0x1F1E6 + 65
            return String.fromCharCode(c1, c2)
        }
    }
    return ''
}

export default function ProfilesScreen() {
    const { profiles, currentProfile, addProfile, updateProfile, deleteProfile, selectProfile, subscriptions, addSubscription, deleteSubscription, refreshSubscription, testAllPings, testAllRealDelays } = useVpn()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProfile, setEditingProfile] = useState<VpnProfile | null>(null)
    const [formData, setFormData] = useState<VpnProfile>(createDefaultProfile())
    const [subUrl, setSubUrl] = useState('')
    const [isAddingSub, setIsAddingSub] = useState(false)

    const openAddModal = () => {
        setEditingProfile(null)
        setFormData(createDefaultProfile())
        setIsModalOpen(true)
    }

    const openEditModal = (profile: VpnProfile) => {
        setEditingProfile(profile)
        setFormData({ ...profile })
        setIsModalOpen(true)
    }

    const handleSave = () => {
        if (!formData.name.trim() || !formData.serverAddress.trim()) {
            return // Basic validation
        }

        if (editingProfile) {
            updateProfile(formData)
        } else {
            addProfile(formData)
        }
        setIsModalOpen(false)
    }

    const handleDelete = (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation()
        if (confirm('Are you sure you want to delete this profile?')) {
            deleteProfile(profileId)
        }
    }

    const handleChange = (field: keyof VpnProfile, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Export profiles to JSON file
    const handleExport = async () => {
        if (profiles.length === 0) {
            alert('No profiles to export')
            return
        }

        try {
            const result = await window.electronAPI.showSaveDialog({
                title: 'Export Profiles',
                defaultPath: 'vpn-profiles.json',
                filters: [{ name: 'JSON Files', extensions: ['json'] }]
            })

            if (!result.canceled && result.filePath) {
                // Remove sensitive data or keep it based on user choice
                const exportData = {
                    version: '1.0',
                    exportedAt: new Date().toISOString(),
                    profiles: profiles.map(p => ({
                        ...p,
                        password: '' // Don't export passwords for security
                    }))
                }

                const writeResult = await window.electronAPI.writeFile(
                    result.filePath,
                    JSON.stringify(exportData, null, 2)
                )

                if (writeResult.success) {
                    alert(`Exported ${profiles.length} profile(s) successfully!`)
                } else {
                    alert('Failed to export: ' + writeResult.error)
                }
            }
        } catch (error) {
            console.error('Export error:', error)
            alert('Failed to export profiles')
        }
    }

    // Import profiles from JSON file
    const handleImport = async () => {
        try {
            const result = await window.electronAPI.showOpenDialog({
                title: 'Import Profiles',
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
                properties: ['openFile']
            })

            if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
                const readResult = await window.electronAPI.readFile(result.filePaths[0])

                if (readResult.success && readResult.content) {
                    const importData = JSON.parse(readResult.content)

                    if (!importData.profiles || !Array.isArray(importData.profiles)) {
                        alert('Invalid profile file format')
                        return
                    }

                    let imported = 0
                    for (const profile of importData.profiles) {
                        // Generate new ID to avoid conflicts
                        const newProfile: VpnProfile = {
                            ...profile,
                            id: crypto.randomUUID(),
                            createdAt: Date.now(),
                            password: profile.password || '' // Keep empty if not included
                        }
                        addProfile(newProfile)
                        imported++
                    }

                    alert(`Imported ${imported} profile(s) successfully!`)
                } else {
                    alert('Failed to read file: ' + readResult.error)
                }
            }
        } catch (error) {
            console.error('Import error:', error)
            alert('Failed to import profiles. Make sure the file is valid JSON.')
        }
    }

    // Import profile from clipboard (V2Ray links)
    const handleImportFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText()
            if (!text.trim()) {
                alert('Clipboard is empty')
                return
            }

            const parsed = parseShareLink(text.trim())
            if (!parsed) {
                alert('Invalid link format. Supported formats:\n• vless://...\n• vmess://...\n• trojan://...\n• ss://...')
                return
            }

            // Create profile from parsed link
            const newProfile: VpnProfile = {
                ...createDefaultProfile(),
                name: parsed.name,
                serverAddress: parsed.config.address,
                protocol: parsed.protocol,
                port: parsed.config.port,
                singboxConfig: parsed.config
            }

            addProfile(newProfile)
            alert(`Imported "${parsed.name}" successfully!`)
        } catch (error) {
            console.error('Clipboard import error:', error)
            alert('Failed to read clipboard. Make sure you have copied a valid V2Ray link.')
        }
    }

    const handleAddSubscription = async () => {
        if (!subUrl.trim()) return
        setIsAddingSub(true)
        try {
            await addSubscription(subUrl.trim())
            setSubUrl('')
        } catch (e) {
            alert('Failed to add subscription: ' + String(e))
        } finally {
            setIsAddingSub(false)
        }
    }

    // Ctrl+V shortcut for quick V2Ray link paste
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if Ctrl+V (or Cmd+V on Mac) is pressed
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                // Don't intercept if modal is open or if an input/textarea is focused
                const activeElement = document.activeElement
                const isInputFocused = activeElement?.tagName === 'INPUT' ||
                    activeElement?.tagName === 'TEXTAREA' ||
                    (activeElement as HTMLElement)?.isContentEditable

                if (!isModalOpen && !isInputFocused) {
                    e.preventDefault()
                    handleImportFromClipboard()
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isModalOpen])

    return (
        <div>
            <div className="card-header">
                <h2 className="card-title">VPN Profiles</h2>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="btn btn-secondary" onClick={handleImportFromClipboard} title="Import from clipboard (V2Ray link)">
                        <Clipboard size={18} />
                        Paste Link
                    </button>
                    <button className="btn btn-secondary" onClick={handleImport} title="Import profiles">
                        <Download size={18} />
                        Import
                    </button>
                    <button className="btn btn-secondary" onClick={handleExport} title="Export profiles" disabled={profiles.length === 0}>
                        <Upload size={18} />
                        Export
                    </button>
                    <button className="btn btn-secondary" onClick={testAllPings} title="Test Ping for all configurations">
                        <Activity size={18} />
                        Ping
                    </button>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={18} />
                        Add Profile
                    </button>
                </div>
            </div>

            {/* Subscriptions Section */}
            <div className="card-header" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Subscriptions</h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="https://.../sub/..." 
                        value={subUrl} 
                        onChange={e => setSubUrl(e.target.value)} 
                        style={{ width: '250px' }}
                    />
                    <button className="btn btn-primary" onClick={handleAddSubscription} disabled={isAddingSub}>
                        {isAddingSub ? <RefreshCw size={18} className="spin" /> : <LinkIcon size={18} />}
                        Add Sub
                    </button>
                </div>
            </div>

            {subscriptions.length > 0 && (
                <div className="profile-list" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    {subscriptions.map(sub => {
                        // Calculate percentage and days remaining
                        const used = sub.upload + sub.download
                        const percent = sub.total > 0 ? Math.min(100, Math.round((used / sub.total) * 100)) : 0
                        
                        const gbUsed = (used / (1024 * 1024 * 1024)).toFixed(2)
                        const gbTotal = sub.total > 0 ? (sub.total / (1024 * 1024 * 1024)).toFixed(2) : '∞'
                        
                        let daysLeft = '∞'
                        if (sub.expire > 0) {
                            const diff = sub.expire * 1000 - Date.now()
                            if (diff > 0) {
                                daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24)).toString()
                            } else {
                                daysLeft = 'Expired'
                            }
                        }

                        return (
                            <div key={sub.id} className="profile-card" style={{ cursor: 'default' }}>
                                <div className="profile-icon">
                                    <Database size={24} />
                                </div>
                                <div className="profile-info" style={{ flex: 2 }}>
                                    <div className="profile-name">{sub.name}</div>
                                    <div className="profile-server" style={{ fontSize: '0.8rem' }}>
                                        {gbUsed}GB / {gbTotal}GB • {daysLeft} Days left
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: '0 var(--spacing-md)' }}>
                                    {sub.total > 0 && (
                                        <div style={{ width: '100%', height: '6px', background: 'var(--surface-light)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: percent > 90 ? 'var(--danger)' : 'var(--primary)' }}></div>
                                        </div>
                                    )}
                                </div>
                                <button className="title-bar-button" onClick={() => refreshSubscription(sub.id)} title="Refresh">
                                    <RefreshCw size={16} />
                                </button>
                                <button className="title-bar-button" onClick={() => deleteSubscription(sub.id)} title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="card-header" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Servers</h3>
            </div>

            {profiles.length === 0 ? (
                <div className="empty-state">
                    <Globe size={64} />
                    <h3 className="empty-state-title">No Profiles Yet</h3>
                    <p className="empty-state-description">
                        Create your first VPN profile to get started
                    </p>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={18} />
                        Create Profile
                    </button>
                </div>
            ) : (
                <div className="profile-list">
                    {profiles.map(profile => (
                        <div
                            key={profile.id}
                            className={`profile-card ${currentProfile?.id === profile.id ? 'selected' : ''}`}
                            onClick={() => selectProfile(profile)}
                        >
                            <div className="profile-icon">
                                {(() => {
                                    const cc = profile.countryCode || extractCountryCode(profile.name)
                                    const flagUrl = countryCodeToFlagUrl(cc)
                                    if (flagUrl) {
                                        return <img src={flagUrl} alt={cc} style={{ width: '24px', borderRadius: '2px' }} />
                                    }
                                    return <Globe size={24} />
                                })()}
                            </div>
                            <div className="profile-info">
                                <div className="profile-name">{profile.name}</div>
                                <div className="profile-server">
                                    {profile.serverAddress}:{profile.port}
                                    {profile.ping !== undefined && (
                                        <span style={{ 
                                            marginLeft: '8px', 
                                            fontSize: '0.85em', 
                                            color: profile.ping > 0 ? (profile.ping < 200 ? 'var(--success)' : 'var(--warning)') : 'var(--danger)'
                                        }}>
                                            Ping: {profile.ping > 0 ? `${profile.ping}ms` : 'Timeout'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="profile-protocol">
                                {(() => {
                                    if (['vless', 'vmess', 'trojan', 'shadowsocks'].includes(profile.protocol) && profile.singboxConfig) {
                                        const parts = [PROTOCOL_INFO[profile.protocol].displayName.toUpperCase()]
                                        
                                        let network = profile.singboxConfig.transport?.toUpperCase() || 'TCP'
                                        
                                        parts.push(network)
                                        
                                        if (profile.singboxConfig.security === 'reality' || profile.singboxConfig.reality) {
                                            parts.push('REALITY')
                                        } else if (profile.singboxConfig.security === 'tls' || profile.singboxConfig.tls) {
                                            parts.push('TLS')
                                        }
                                        return parts.join(' ')
                                    }
                                    return PROTOCOL_INFO[profile.protocol].displayName
                                })()}
                            </span>
                            <button
                                className="title-bar-button"
                                onClick={(e) => { e.stopPropagation(); openEditModal(profile) }}
                                title="Edit"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                className="title-bar-button"
                                onClick={(e) => handleDelete(e, profile.id)}
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingProfile ? 'Edit Profile' : 'New Profile'}
                            </h3>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Profile Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="My VPN Server"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Server Address *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="vpn.example.com"
                                    value={formData.serverAddress}
                                    onChange={e => handleChange('serverAddress', e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">Protocol</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.protocol}
                                        onChange={e => handleChange('protocol', e.target.value as VpnProtocol)}
                                    >
                                        {Object.entries(PROTOCOL_INFO).map(([key, info]) => (
                                            <option key={key} value={key}>{info.displayName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Port</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.port}
                                        onChange={e => {
                                            const val = e.target.value
                                            const num = parseInt(val, 10)
                                            handleChange('port', isNaN(num) ? 443 : num)
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="username"
                                    value={formData.username}
                                    onChange={e => handleChange('username', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => handleChange('password', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Authentication Type</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.authType}
                                    onChange={e => handleChange('authType', e.target.value as AuthType)}
                                >
                                    <option value="password">Password</option>
                                    <option value="certificate">Certificate</option>
                                    <option value="both">Password + Certificate</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.skipCertificateVerification}
                                        onChange={e => handleChange('skipCertificateVerification', e.target.checked)}
                                    />
                                    Skip SSL certificate verification
                                </label>
                            </div>

                            {formData.protocol === 'openconnect' && (
                                <div style={{ marginTop: 'var(--spacing-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={formData.disableDtls}
                                                onChange={e => handleChange('disableDtls', e.target.checked)}
                                            />
                                            Disable DTLS (use TCP only)
                                        </label>
                                    </div>

                                    {!formData.disableDtls && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                            <div className="form-group">
                                                <label className="form-label">MTU Optimization</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    placeholder="e.g. 1400"
                                                    value={formData.mtu || ''}
                                                    onChange={e => handleChange('mtu', parseInt(e.target.value) || undefined)}
                                                />
                                                <p className="text-muted" style={{ fontSize: 11 }}>Recommended: 1200-1400</p>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">DTLS Ciphers</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="AES128-SHA..."
                                                    value={formData.dtlsCiphers || ''}
                                                    onChange={e => handleChange('dtlsCiphers', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Iran IP Bypass Option for OpenConnect */}
                                    <div className="form-group" style={{ marginTop: 'var(--spacing-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-md)' }}>
                                        <label className="form-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={formData.bypassIranRoutes || false}
                                                onChange={e => handleChange('bypassIranRoutes', e.target.checked)}
                                            />
                                            Route Iran IPs Directly (bypass tunnel)
                                        </label>
                                        <p className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                                            When enabled, Iranian websites and services will connect directly without going through the VPN tunnel.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* sing-box protocols (VLESS, VMess, Trojan, Shadowsocks) */}
                            {['vless', 'vmess', 'trojan', 'shadowsocks'].includes(formData.protocol) && (
                                <div style={{ marginTop: 'var(--spacing-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-md)' }}>
                                    <p className="text-muted" style={{ marginBottom: 'var(--spacing-sm)', fontSize: 12 }}>
                                        ℹ️ For easier setup, use "Paste Link" to import from clipboard
                                    </p>

                                    <div className="form-group">
                                        <label className="form-label">
                                            {formData.protocol === 'shadowsocks' ? 'Password' : 'UUID'}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder={formData.protocol === 'shadowsocks' ? 'password' : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'}
                                            value={formData.singboxConfig?.uuid || ''}
                                            onChange={e => {
                                                const config = formData.singboxConfig || {
                                                    uuid: '',
                                                    address: formData.serverAddress,
                                                    port: formData.port,
                                                    transport: 'tcp' as SingboxTransport,
                                                    security: 'tls' as SingboxSecurity
                                                }
                                                handleChange('singboxConfig', { ...config, uuid: e.target.value })
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                        <div className="form-group">
                                            <label className="form-label">Transport</label>
                                            <select
                                                className="form-input form-select"
                                                value={formData.singboxConfig?.transport || 'tcp'}
                                                onChange={e => {
                                                    const config = formData.singboxConfig || {
                                                        uuid: '',
                                                        address: formData.serverAddress,
                                                        port: formData.port,
                                                        transport: 'tcp' as SingboxTransport,
                                                        security: 'tls' as SingboxSecurity
                                                    }
                                                    handleChange('singboxConfig', { ...config, transport: e.target.value as SingboxTransport })
                                                }}
                                            >
                                                <option value="tcp">TCP</option>
                                                <option value="ws">WebSocket</option>
                                                <option value="grpc">gRPC</option>
                                                <option value="httpupgrade">HTTP Upgrade</option>
                                                <option value="xhttp">XHTTP</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Security</label>
                                            <select
                                                className="form-input form-select"
                                                value={formData.singboxConfig?.security || 'tls'}
                                                onChange={e => {
                                                    const config = formData.singboxConfig || {
                                                        uuid: '',
                                                        address: formData.serverAddress,
                                                        port: formData.port,
                                                        transport: 'tcp' as SingboxTransport,
                                                        security: 'tls' as SingboxSecurity
                                                    }
                                                    handleChange('singboxConfig', { ...config, security: e.target.value as SingboxSecurity })
                                                }}
                                            >
                                                <option value="none">None</option>
                                                <option value="tls">TLS</option>
                                                <option value="reality">Reality</option>
                                            </select>
                                        </div>
                                    </div>

                                    {formData.singboxConfig?.transport === 'ws' && (
                                        <div className="form-group">
                                            <label className="form-label">WebSocket Path</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="/"
                                                value={formData.singboxConfig?.path || ''}
                                                onChange={e => {
                                                    const config = formData.singboxConfig!
                                                    handleChange('singboxConfig', { ...config, path: e.target.value })
                                                }}
                                            />
                                        </div>
                                    )}

                                    {formData.singboxConfig?.security === 'tls' && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">SNI (Server Name)</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="example.com"
                                                    value={formData.singboxConfig?.sni || ''}
                                                    onChange={e => {
                                                        const config = formData.singboxConfig!
                                                        handleChange('singboxConfig', { ...config, sni: e.target.value })
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                                <div className="form-group">
                                                    <label className="form-label">Fingerprint</label>
                                                    <select
                                                        className="form-input form-select"
                                                        value={formData.singboxConfig?.fingerprint || 'chrome'}
                                                        onChange={e => {
                                                            const config = formData.singboxConfig!
                                                            handleChange('singboxConfig', { ...config, fingerprint: e.target.value })
                                                        }}
                                                    >
                                                        <option value="chrome">Chrome</option>
                                                        <option value="firefox">Firefox</option>
                                                        <option value="safari">Safari</option>
                                                        <option value="ios">iOS</option>
                                                        <option value="android">Android</option>
                                                        <option value="edge">Edge</option>
                                                        <option value="qq">QQ</option>
                                                        <option value="random">Random</option>
                                                        <option value="randomized">Randomized</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">ALPN</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="h2, http/1.1 (comma separated)"
                                                        value={(formData.singboxConfig?.alpn || []).join(', ')}
                                                        onChange={e => {
                                                            const config = formData.singboxConfig!
                                                            const alpnArray = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                            handleChange('singboxConfig', { ...config, alpn: alpnArray.length > 0 ? alpnArray : undefined })
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {formData.protocol === 'shadowsocks' && (
                                        <div className="form-group">
                                            <label className="form-label">Encryption Method</label>
                                            <select
                                                className="form-input form-select"
                                                value={formData.singboxConfig?.method || 'aes-256-gcm'}
                                                onChange={e => {
                                                    const config = formData.singboxConfig || {
                                                        uuid: '',
                                                        address: formData.serverAddress,
                                                        port: formData.port,
                                                        transport: 'tcp' as SingboxTransport,
                                                        security: 'none' as SingboxSecurity
                                                    }
                                                    handleChange('singboxConfig', { ...config, method: e.target.value })
                                                }}
                                            >
                                                <option value="aes-256-gcm">AES-256-GCM</option>
                                                <option value="aes-128-gcm">AES-128-GCM</option>
                                                <option value="chacha20-ietf-poly1305">ChaCha20-IETF-Poly1305</option>
                                                <option value="2022-blake3-aes-256-gcm">2022-Blake3-AES-256-GCM</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Iran IP Bypass Option */}
                                    <div className="form-group" style={{ marginTop: 'var(--spacing-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-md)' }}>
                                        <label className="form-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={formData.singboxConfig?.bypassIranRoutes || false}
                                                onChange={e => {
                                                    // Preserve ALL existing singboxConfig fields when toggling
                                                    const existingConfig = formData.singboxConfig || {
                                                        uuid: '',
                                                        address: formData.serverAddress,
                                                        port: formData.port,
                                                        transport: 'tcp' as SingboxTransport,
                                                        security: 'tls' as SingboxSecurity
                                                    }
                                                    handleChange('singboxConfig', {
                                                        ...existingConfig,
                                                        bypassIranRoutes: e.target.checked
                                                    })
                                                }}
                                            />
                                            Route Iran IPs Directly (bypass tunnel)
                                        </label>
                                        <p className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                                            When enabled, Iranian websites and services will connect directly without going through the VPN tunnel.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                <Check size={18} />
                                {editingProfile ? 'Save Changes' : 'Create Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
