import { useState, useEffect, useMemo, useRef } from 'react'
import { useVpn } from '../context/VpnContext'
import { VpnProfile, VpnProtocol, AuthType, PROTOCOL_INFO, createDefaultProfile, SingboxTransport, SingboxSecurity,
    XHTTP_MODES, effectiveXhttpMode, linkXhttpMode } from '../types'
import { Plus, Globe, Edit2, Trash2, X, Check, Download, Upload, Clipboard, RefreshCw, Link as LinkIcon, Database, Play, RotateCcw, Share2, ArrowDownWideNarrow } from 'lucide-react'
import { parseShareLink, generateShareLink } from '../utils/linkParser'
import { orderProfilesBySubscription, sortProfilesByPing, type ProfileSort } from '../utils/profilePresentation'
import ProfileListCard from '../components/ProfileListCard'

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
        testingProfileIds,
        settings
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
    const [profileSort, setProfileSort] = useState<ProfileSort>(() =>
        localStorage.getItem('vpn-profile-sort') === 'ping' ? 'ping' : 'default')
    const [actionTarget, setActionTarget] = useState<{ id: string; keyboard: boolean } | null>(null)
    const [shareStatus, setShareStatus] = useState<{ profileId: string; message: string } | null>(null)
    const actionsTrigger = useRef<HTMLButtonElement | null>(null)
    const editAction = useRef<HTMLButtonElement>(null)
    const sortControl = useRef<HTMLSelectElement>(null)
    const pingingIds = useMemo(() => new Set(testingProfileIds), [testingProfileIds])
    const visibleProfiles = useMemo(() => selectedSubId
        ? profiles.filter(p => p.subscriptionId === selectedSubId)
        : orderProfilesBySubscription(profiles, subscriptions), [profiles, subscriptions, selectedSubId])
    const displayedProfiles = useMemo(() => profileSort === 'ping' ? sortProfilesByPing(visibleProfiles)
        : visibleProfiles, [profileSort, visibleProfiles])
    const actionProfile = displayedProfiles.find(profile => profile.id === actionTarget?.id)

    useEffect(() => {
        localStorage.setItem('vpn-profile-sort', profileSort)
    }, [profileSort])

    useEffect(() => {
        if (!actionTarget) return
        if (!actionProfile) {
            setActionTarget(null)
            setShareStatus(null)
            actionsTrigger.current = null
            return
        }
        actionsTrigger.current?.scrollIntoView({ block: 'nearest' })
        if (actionTarget.keyboard) editAction.current?.focus({ preventScroll: true })
    }, [actionTarget, actionProfile?.id])

    const closeActions = (restoreFocus = false) => {
        setActionTarget(null)
        setShareStatus(null)
        if (restoreFocus) actionsTrigger.current?.focus({ preventScroll: true })
        actionsTrigger.current = null
    }

    const showActions = (id: string, trigger: HTMLButtonElement, keyboard: boolean) => {
        actionsTrigger.current = trigger
        setShareStatus(null)
        setActionTarget({ id, keyboard })
    }

    const chooseSubscription = (id: string | null) => {
        closeActions()
        setSelectedSubId(id)
    }

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

    const handleDelete = (profile: VpnProfile) => {
        if (confirm(`Delete “${profile.name}”?`)) {
            deleteProfile(profile.id)
            closeActions()
            sortControl.current?.focus({ preventScroll: true })
        }
    }

    const handleChange = (field: keyof VpnProfile, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Export profiles to JSON file
    const handleExport = async (items: VpnProfile[] = profiles) => {
        const api = window.electronAPI
        if (!api) return
        if (items.length === 0) {
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
                    profiles: items.map(p => ({
                        ...p,
                        password: '' // Don't export passwords for security
                    }))
                }

                const writeResult = await api.writeFile(
                    result.filePath,
                    JSON.stringify(exportData, null, 2)
                )

                if (writeResult.success) {
                    alert(`Exported ${items.length} profile(s) successfully!`)
                } else {
                    alert('Failed to export: ' + writeResult.error)
                }
            }
        } catch (error) {
            console.error('Export error:', error)
            alert('Failed to export profiles')
        }
    }

    const shareProfile = async (profile: VpnProfile) => {
        let link = ''
        if (profile.protocol !== 'openconnect' && profile.singboxConfig?.uuid) {
            try {
                link = generateShareLink(profile.protocol, profile.name, {
                    ...profile.singboxConfig,
                    address: profile.serverAddress,
                    port: profile.port,
                })
            } catch { /* Profiles without a share link can still be exported. */ }
        }
        if (!link) {
            await handleExport([profile])
            return
        }
        try {
            await navigator.clipboard.writeText(link)
            setShareStatus({ profileId: profile.id, message: 'Link copied. It includes the profile credentials.' })
        } catch {
            setShareStatus({ profileId: profile.id, message: 'Could not copy the profile link. Try again.' })
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
            if (isModalOpen || isSubModalOpen) return
            if (e.key === 'Escape' && actionTarget) {
                e.preventDefault()
                closeActions(true)
                return
            }

            const activeElement = document.activeElement
            const isInputFocused = activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'SELECT' ||
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
    }, [isModalOpen, isSubModalOpen, actionTarget, currentProfile, profiles, pingMode, testSingleProfile])

    return (
        <div className="profiles-screen">
            <div className="profiles-scroll">
            <div className="card-header profiles-header">
                <h2 className="card-title">VPN Profiles</h2>
                <div className="profiles-controls">
                    <button className="btn btn-secondary" onClick={handleImportFromClipboard} title="Import from clipboard (V2Ray link)">
                        <Clipboard size={18} />
                        Paste Link
                    </button>
                    <button className="btn btn-secondary" onClick={handleImport} title="Import profiles">
                        <Download size={18} />
                        Import
                    </button>
                    <button className="btn btn-secondary" onClick={() => void handleExport()} title="Export profiles" disabled={profiles.length === 0}>
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
                <div className="profile-subscriptions">
                    <div 
                        className={`profile-card ${selectedSubId === null ? 'selected' : ''}`} 
                        onClick={() => chooseSubscription(null)}
                        style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', flexShrink: 0, minHeight: 'auto' }}
                    >
                        <strong>All Profiles</strong>
                    </div>
                    {subscriptions.map(sub => (
                        <div 
                            key={sub.id} 
                            className={`profile-card ${selectedSubId === sub.id ? 'selected' : ''}`} 
                            onClick={() => chooseSubscription(sub.id)}
                            style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, minHeight: 'auto' }}
                        >
                            <strong>{sub.name}</strong>
                            <button className="title-bar-button" onClick={(e) => { e.stopPropagation(); refreshSubscription(sub.id); }} title="Refresh" disabled={refreshingSubIds?.includes(sub.id)} style={{ padding: '2px' }}>
                                <RefreshCw size={14} className={refreshingSubIds?.includes(sub.id) ? 'spin-animation' : ''} />
                            </button>
                            <button className="title-bar-button" onClick={(e) => { e.stopPropagation(); openEditSubModal(sub); }} title="Edit" style={{ padding: '2px' }}>
                                <Edit2 size={14} />
                            </button>
                            <button className="title-bar-button" onClick={(e) => { e.stopPropagation(); deleteSubscription(sub.id); if(selectedSubId === sub.id) chooseSubscription(null); }} title="Delete" style={{ padding: '2px', color: 'var(--accent-red)' }}>
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

            <div className="card-header profiles-header profiles-server-header">
                <h3 className="card-title" style={{ fontSize: '1.1rem' }}>
                    Servers {displayedProfiles.length > 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({displayedProfiles.length})</span>}
                </h3>

                <div className="profiles-controls">
                    <label className="profiles-sort">
                        <ArrowDownWideNarrow size={14} aria-hidden="true" />
                        <span>Sort by</span>
                        <select ref={sortControl} value={profileSort} onChange={event =>
                            setProfileSort(event.target.value === 'ping' ? 'ping' : 'default')}>
                            <option value="default">Default</option>
                            <option value="ping">Ping</option>
                        </select>
                    </label>
                    {displayedProfiles.length > 0 && <>
                        {/* Segmented control: [Real delay] [TCP] */}
                        <div className="ping-mode-group">
                            <button 
                                type="button" 
                                className={`ping-mode-btn ${pingMode === 'real' ? 'active' : ''}`}
                                aria-pressed={pingMode === 'real'}
                                onClick={() => setPingMode('real')}
                                title="Real delay through proxy tunnel via Google (V2rayN True Real Delay)"
                            >
                                Real delay
                            </button>
                            <button 
                                type="button" 
                                className={`ping-mode-btn ${pingMode === 'tcp' ? 'active' : ''}`}
                                aria-pressed={pingMode === 'tcp'}
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
                        <button 
                            className="title-bar-button" 
                            onClick={clearPings} 
                            aria-label="Clear ping results"
                            title="Clear all ping results"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </>}
                </div>
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
                <>
                    <p className="profiles-hint" id="profile-actions-hint">Right-click or hold a profile for actions. Keyboard: Shift + F10.</p>
                    <ul className="config-list" aria-label="VPN profiles">
                        {displayedProfiles.map(profile => (
                            <ProfileListCard
                                key={profile.id}
                                profile={profile}
                                subscriptions={subscriptions}
                                forceXhttpStreamUp={settings.forceXhttpStreamUp}
                                selected={currentProfile?.id === profile.id}
                                actionTarget={actionProfile?.id === profile.id}
                                testing={pingingIds.has(profile.id)}
                                canPing={!isTestingPings}
                                onSelect={() => { closeActions(); selectProfile(profile) }}
                                onActions={(trigger, keyboard) => showActions(profile.id, trigger, keyboard)}
                                onPing={() => void testSingleProfile(profile.id, pingMode)}
                            />
                        ))}
                    </ul>
                </>
            )}
            </div>

            {actionProfile && (
                <section className="profile-action-bar" aria-label="Profile actions">
                    <div className="profile-action-target">
                        <div className="profile-action-caption">Profile actions</div>
                        <div className="profile-action-name" title={actionProfile.name} dir="auto">{actionProfile.name}</div>
                    </div>
                    <div className="profile-action-buttons">
                        <button className="profile-action-button" type="button" ref={editAction}
                            onClick={() => { closeActions(); openEditModal(actionProfile) }}>
                            <Edit2 size={15} aria-hidden="true" /> Edit
                        </button>
                        <button className="profile-action-button" type="button" onClick={() => void shareProfile(actionProfile)}
                            title={actionProfile.protocol === 'openconnect' || !actionProfile.singboxConfig?.uuid
                                ? 'Export this profile as JSON without its login password' : 'Copy the share link, including profile credentials'}>
                            <Share2 size={15} aria-hidden="true" /> Share
                        </button>
                        <button className="profile-action-button danger" type="button" onClick={() => handleDelete(actionProfile)}>
                            <Trash2 size={15} aria-hidden="true" /> Delete
                        </button>
                        <button className="profile-action-button close" type="button" aria-label="Close profile actions"
                            title="Close (Esc)" onClick={() => closeActions(true)}>
                            <X size={16} aria-hidden="true" />
                        </button>
                    </div>
                    {shareStatus?.profileId === actionProfile.id && <p className="profile-action-status" role="status">{shareStatus.message}</p>}
                </section>
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

                                    {formData.singboxConfig?.transport === 'xhttp' && (
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="xhttp-mode">XHTTP Mode</label>
                                            <select
                                                id="xhttp-mode"
                                                className="form-input form-select"
                                                aria-describedby="xhttp-mode-description"
                                                value={formData.xhttpModeOverride || ''}
                                                onChange={e => handleChange('xhttpModeOverride', e.target.value || undefined)}
                                            >
                                                <option value="">Follow app setting ({effectiveXhttpMode({ ...formData, xhttpModeOverride: undefined }, settings.forceXhttpStreamUp)})</option>
                                                {XHTTP_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                            </select>
                                            <span className="text-muted" id="xhttp-mode-description"
                                                style={{ display: 'block', marginTop: 'var(--spacing-xs)', fontSize: 12 }}>
                                                Server link: {linkXhttpMode(formData.singboxConfig)}. Your choice is kept when the subscription refreshes. Reconnect to apply.
                                            </span>
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
