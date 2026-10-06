import { useState, useEffect, useCallback } from 'react'
import { useVpn } from '../context/VpnContext'
import { VpnProfile, VpnProtocol, AuthType, PROTOCOL_INFO, createDefaultProfile, SingboxTransport, SingboxSecurity } from '../types'
import { Plus, Globe, Edit2, Trash2, X, Check, Download, Upload, Clipboard, RefreshCw, Link as LinkIcon, Database, Activity, Play, RotateCcw } from 'lucide-react'
import { parseShareLink } from '../utils/linkParser'
import { orderProfilesBySubscription } from '../utils/profilePresentation'
import SubscriptionBadge from '../components/SubscriptionBadge'

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
    const { 
        profiles, 
        currentProfile, 
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
        testAllPings, 
        testSingleProfile,
        clearPings,
        cancelPings,
        pingProgress,
        isTestingPings, 
        testingProfileIds 
    } = useVpn()
    const [pingMode, setPingMode] = useState<'tcp' | 'http' | 'real'>(() => {
        const saved = localStorage.getItem('vpn-ping-mode')
        if (saved === 'real' || saved === 'tcp') return saved
        return 'real'
    })

    useEffect(() => {
        localStorage.setItem('vpn-ping-mode', pingMode)
    }, [pingMode])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProfile, setEditingProfile] = useState<VpnProfile | null>(null)
    const [formData, setFormData] = useState<VpnProfile>(createDefaultProfile())
    const [isSubModalOpen, setIsSubModalOpen] = useState(false)
    const [subFormData, setSubFormData] = useState({ id: '', name: '', url: '' })
    const [isAddingSub, setIsAddingSub] = useState(false)
    const [selectedSubId, setSelectedSubId] = useState<string | null>(() => {
        const saved = localStorage.getItem('vpn-selected-subscription')
        try {
            const cached = JSON.parse(localStorage.getItem('vpn-subscriptions') || '[]')
            return cached.some((sub: { id: string }) => sub.id === saved) ? saved : null
        } catch { return null }
    })
    useEffect(() => {
        if (selectedSubId) localStorage.setItem('vpn-selected-subscription', selectedSubId)
        else localStorage.removeItem('vpn-selected-subscription')
    }, [selectedSubId])
    const [editingSub, setEditingSub] = useState<boolean>(false)

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
        const api = window.electronAPI
        if (!api) return
        if (profiles.length === 0) {
            alert('No profiles to export')
            return
        }

        try {
            const result = await api.showSaveDialog({
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

                const writeResult = await api.writeFile(
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
        const api = window.electronAPI
        if (!api) return
        try {
            const result = await api.showOpenDialog({
                title: 'Import Profiles',
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
                properties: ['openFile']
            })

            if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
                const readResult = await api.readFile(result.filePaths[0])

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

    const openAddSubModal = () => {
        setEditingSub(false)
        setSubFormData({ id: '', name: '', url: '' })
        setIsSubModalOpen(true)
    }

    const openEditSubModal = (sub: any) => {
        setEditingSub(true)
        setSubFormData({ id: sub.id, name: sub.name, url: sub.url })
        setIsSubModalOpen(true)
    }

    const handleSaveSub = async () => {
        if (!subFormData.url.trim()) return
        setIsAddingSub(true)
        try {
            if (editingSub) {
                // We need `updateSubscription` from VpnContext
                // which is already imported and available!
                updateSubscription({ ...subscriptions.find(s => s.id === subFormData.id)!, name: subFormData.name, url: subFormData.url })
                // Also trigger a refresh if URL changed, or just save
            } else {
                await addSubscription(subFormData.url.trim(), subFormData.name.trim())
            }
            setIsSubModalOpen(false)
        } catch (e) {
            alert('Failed to save subscription: ' + String(e))
        } finally {
            setIsAddingSub(false)
        }
    }

    // Keyboard shortcuts: Ctrl+V (paste link) and Ctrl+R (test ping on selected profile)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isModalOpen) return

            const activeElement = document.activeElement
            const isInputFocused = activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA' ||
                (activeElement as HTMLElement)?.isContentEditable

            if (isInputFocused) return

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                e.preventDefault()
                handleImportFromClipboard()
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
                e.preventDefault()
                const target = currentProfile || profiles[0]
                if (target) {
                    testSingleProfile(target.id, pingMode)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isModalOpen, currentProfile, profiles, pingMode, testSingleProfile])

    const displayedProfiles = selectedSubId ? profiles.filter(p => p.subscriptionId === selectedSubId) : orderProfilesBySubscription(profiles, subscriptions)

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
                    <button className="btn btn-primary" onClick={openAddSubModal} disabled={isAddingSub}>
                        {isAddingSub ? <RefreshCw size={18} className="spin-animation" /> : <LinkIcon size={18} />}
                        Add Sub
                    </button>
                </div>
            </div>

            {subscriptions.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
                    <div 
                        className={`profile-card ${selectedSubId === null ? 'selected' : ''}`} 
                        onClick={() => setSelectedSubId(null)}
                        style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', flexShrink: 0, minHeight: 'auto' }}
                    >
                        <strong>All Profiles</strong>
                    </div>
                    {subscriptions.map(sub => (
                        <div 
                            key={sub.id} 
                            className={`profile-card ${selectedSubId === sub.id ? 'selected' : ''}`} 
                            onClick={() => setSelectedSubId(sub.id)}
                            style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, minHeight: 'auto' }}
                        >
                            <strong>{sub.name}</strong>
                            <button className="title-bar-button" onClick={(e) => { e.stopPropagation(); refreshSubscription(sub.id); }} title="Refresh" disabled={refreshingSubIds?.includes(sub.id)} style={{ padding: '2px' }}>
                                <RefreshCw size={14} className={refreshingSubIds?.includes(sub.id) ? 'spin-animation' : ''} />
                            </button>
                            <button className="title-bar-button" onClick={(e) => { e.stopPropagation(); openEditSubModal(sub); }} title="Edit" style={{ padding: '2px' }}>
                                <Edit2 size={14} />
                            </button>
                            <button className="title-bar-button" onClick={(e) => { e.stopPropagation(); deleteSubscription(sub.id); if(selectedSubId === sub.id) setSelectedSubId(null); }} title="Delete" style={{ padding: '2px', color: 'var(--danger)' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Show stats for selected subscription */}
            {selectedSubId && subscriptions.find(s => s.id === selectedSubId) && (
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    {(() => {
                        const sub = subscriptions.find(s => s.id === selectedSubId)!
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
                            <div className="profile-card" style={{ cursor: 'default' }}>
                                <div className="profile-icon"><Database size={24} /></div>
                                <div className="profile-info" style={{ flex: 2 }}>
                                    <div className="profile-name">{sub.name} Stats</div>
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
                            </div>
                        )
                    })()}
                </div>
            )}

            <div className="card-header" style={{ marginTop: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ fontSize: '1.1rem' }}>
                    Servers {displayedProfiles.length > 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({displayedProfiles.length})</span>}
                </h3>

                {displayedProfiles.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Segmented control: [Real delay] [TCP] */}
                        <div className="ping-mode-group">
                            <button 
                                type="button" 
                                className={`ping-mode-btn ${pingMode === 'real' ? 'active' : ''}`}
                                onClick={() => setPingMode('real')}
                                title="Real delay through proxy tunnel via Google (V2rayN True Real Delay)"
                            >
                                Real delay
                            </button>
                            <button 
                                type="button" 
                                className={`ping-mode-btn ${pingMode === 'tcp' ? 'active' : ''}`}
                                onClick={() => setPingMode('tcp')}
                                title="Direct TCP latency to server relay"
                            >
                                TCP
                            </button>
                        </div>

                        {/* Test all button */}
                        <button 
                            className="btn btn-primary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 14px', fontSize: '0.85rem' }}
                            onClick={() => testAllPings(pingMode, displayedProfiles.map(p => p.id))}
                            disabled={isTestingPings || displayedProfiles.length === 0}
                            title={`Test all servers using ${pingMode.toUpperCase()}`}
                        >
                            {isTestingPings ? (
                                <RefreshCw size={14} className="spin-animation" />
                            ) : (
                                <Play size={14} fill="currentColor" />
                            )}
                            {isTestingPings ? `${pingProgress.done}/${pingProgress.total}` : 'Test all'}
                        </button>

                        {isTestingPings && <button className="btn btn-secondary" onClick={() => void cancelPings()}>Stop</button>}
                        {/* Clear / Reset button */}
                        <button 
                            className="title-bar-button" 
                            style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '5px', height: '30px', width: '30px' }}
                            onClick={clearPings} 
                            title="Clear all ping results"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                )}
            </div>

            {displayedProfiles.length === 0 ? (
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
                    {displayedProfiles.map(profile => (
                        <div
                            key={profile.id}
                            className={`profile-card ${currentProfile?.id === profile.id ? 'selected' : ''}`}
                            onClick={() => selectProfile(profile)}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key.toLowerCase() === 'r' && e.ctrlKey) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    testSingleProfile(profile.id, pingMode);
                                }
                            }}
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
                                <div className="profile-name-row">
                                    <div className="profile-name">{profile.name}</div>
                                    <SubscriptionBadge profile={profile} subscriptions={subscriptions} />
                                </div>
                                <div className="profile-server">
                                    {profile.serverAddress}:{profile.port}
                                    {testingProfileIds?.includes(profile.id) ? (
                                        <span style={{ 
                                            marginLeft: '8px', 
                                            fontSize: '0.85em', 
                                            color: 'var(--warning)',
                                            fontWeight: 500
                                        }}>
                                            Testing...
                                        </span>
                                    ) : profile.ping !== undefined ? (
                                        <span 
                                            onClick={(e) => { e.stopPropagation(); testSingleProfile(profile.id, pingMode) }}
                                            style={{ 
                                                marginLeft: '8px', 
                                                fontSize: '0.85em', 
                                                color: profile.ping > 0 ? (profile.ping < 200 ? 'var(--success)' : 'var(--warning)') : 'var(--danger)',
                                                fontWeight: 500,
                                                cursor: 'pointer'
                                            }}
                                            title={`${profile.pingMode === 'tcp' ? 'TCP handshake to server' : 'HTTP response through tunnel'} — click to retest (Ctrl+R)`}
                                        >
                                            {profile.ping > 0 ? `${profile.ping}ms` : 'Timeout'}
                                        </span>
                                    ) : null}
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
                                onClick={(e) => { e.stopPropagation(); testSingleProfile(profile.id, pingMode) }}
                                title={`Test ${pingMode.toUpperCase()} (Ctrl+R)`}
                                disabled={testingProfileIds?.includes(profile.id)}
                            >
                                <Activity size={16} className={testingProfileIds?.includes(profile.id) ? 'spin-animation' : ''} />
                            </button>
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

            {isSubModalOpen && (
                <div className="modal-overlay" onClick={() => setIsSubModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingSub ? 'Edit Subscription' : 'Add Subscription'}</h3>
                            <button className="modal-close" onClick={() => setIsSubModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Name (Optional)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={subFormData.name} 
                                    onChange={e => setSubFormData({...subFormData, name: e.target.value})} 
                                    placeholder="My Subscription"
                                />
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Leave blank to use the name provided by the server.
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">URL</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={subFormData.url} 
                                    onChange={e => setSubFormData({...subFormData, url: e.target.value})} 
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsSubModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveSub} disabled={isAddingSub || !subFormData.url.trim()}>
                                {isAddingSub ? <RefreshCw size={18} className="spin-animation" /> : <Check size={18} />}
                                {editingSub ? 'Save Changes' : 'Add Subscription'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
