import { useState, useEffect } from 'react'
import { useVpn } from '../context/VpnContext'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, Bell, Shield, Globe, Network, Check, Save, Github, ExternalLink } from 'lucide-react'
import packageJson from '../../package.json'

export default function SettingsScreen() {
    const { settings, updateSettings, connectionState } = useVpn()
    const { theme, toggleTheme } = useTheme()

    const [bypassDomainsInput, setBypassDomainsInput] = useState<string>('')
    const [bypassIpsInput, setBypassIpsInput] = useState<string>('')
    const [domainsSaved, setDomainsSaved] = useState<boolean>(false)
    const [ipsSaved, setIpsSaved] = useState<boolean>(false)

    useEffect(() => {
        setBypassDomainsInput((settings.bypassDomains || []).join('\n'))
    }, [settings.bypassDomains])

    useEffect(() => {
        setBypassIpsInput((settings.bypassIps || []).join('\n'))
    }, [settings.bypassIps])

    const sanitizeInputDomain = (d: string) => {
        return d.trim()
            .replace(/^https?:\/\//i, '')
            .split('/')[0]
            .split(':')[0]
            .replace(/^\*+\.?/, '')
            .replace(/^\.+/, '')
            .trim()
            .toLowerCase()
    }

    const saveDomains = (value: string) => {
        const domains = value
            .split(/[\n,]+/)
            .map(sanitizeInputDomain)
            .filter(Boolean)
        const unique = Array.from(new Set(domains))
        updateSettings({ bypassDomains: unique })
        setDomainsSaved(true)
        setTimeout(() => setDomainsSaved(false), 2500)
    }

    const saveIps = (value: string) => {
        const ips = value
            .split(/[\n,]+/)
            .map(ip => ip.trim())
            .filter(Boolean)
        const unique = Array.from(new Set(ips))
        updateSettings({ bypassIps: unique })
        setIpsSaved(true)
        setTimeout(() => setIpsSaved(false), 2500)
    }

    const handleDomainsBlur = () => {
        saveDomains(bypassDomainsInput)
    }

    const handleIpsBlur = () => {
        saveIps(bypassIpsInput)
    }

    return (
        <div>
            <h2 className="card-title" style={{ marginBottom: 'var(--spacing-xl)' }}>Settings</h2>

            {/* Appearance Settings */}
            <div className="settings-section">
                <h3 className="settings-section-title">Appearance</h3>

                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                            Dark Mode
                        </span>
                        <span className="settings-label-description">Switch between dark and light themes</span>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={theme === 'dark'}
                            onChange={toggleTheme}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div className="settings-section">
                <h3 className="settings-section-title">General</h3>

                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bell size={18} />
                            Notifications
                        </span>
                        <span className="settings-label-description">Show system notifications on connect/disconnect</span>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.notifications !== false}
                            onChange={e => updateSettings({ notifications: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-text">Start with Windows</span>
                        <span className="settings-label-description">Launch Secure VPN when Windows starts</span>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.startWithWindows}
                            onChange={e => updateSettings({ startWithWindows: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-text">Minimize to Tray</span>
                        <span className="settings-label-description">When minimized, hide to system tray instead of taskbar</span>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.minimizeToTray}
                            onChange={e => updateSettings({ minimizeToTray: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            {/* Connection Settings */}
            <div className="settings-section">
                <h3 className="settings-section-title">Connection</h3>

                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-text">TCP No Delay</span>
                        <span className="settings-label-description">Disable Nagle's algorithm for lower latency</span>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.tcpNoDelay}
                            onChange={e => updateSettings({ tcpNoDelay: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-text">Buffer Size</span>
                        <span className="settings-label-description">Network buffer size for data transfer</span>
                    </div>
                    <select
                        className="form-input form-select"
                        style={{ width: 'auto' }}
                        value={settings.bufferSize}
                        onChange={e => updateSettings({ bufferSize: parseInt(e.target.value) })}
                    >
                        <option value={524288}>512 KB</option>
                        <option value={1048576}>1 MB</option>
                        <option value={2097152}>2 MB (Default)</option>
                        <option value={4194304}>4 MB</option>
                        <option value={8388608}>8 MB</option>
                    </select>
                </div>

                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-text">TUN Stack Mode</span>
                        <span className="settings-label-description">
                            <b>Mixed (Default)</b>: Full TCP speed + UDP via gVisor.<br/>
                            <b>System</b>: Maximum speed (requires wintun driver).<br/>
                            <b>gVisor</b>: User-space stack (lower speed, higher CPU).
                        </span>
                    </div>
                    <select
                        className="form-input form-select"
                        style={{ width: 'auto' }}
                        value={settings.tunStack || 'system'}
                        onChange={e => updateSettings({ tunStack: e.target.value as any })}
                    >
                        <option value="system">System (Recommended - Native Speed)</option>
                        <option value="mixed">Mixed</option>
                        <option value="gvisor">gVisor</option>
                    </select>
                </div>
            </div>

            {/* Bypass Rules (Direct Routing) */}
            <div className="settings-section">
                <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={18} />
                    Bypass & Split Tunneling
                </h3>

                {/* Combined Iran & Private IP Bypass Switch */}
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-text">
                            Bypass Iranian Websites & Local LAN (Split Tunneling)
                        </span>
                        <span className="settings-label-description">
                            Route Iranian websites (.ir), domestic IP ranges, and private LAN networks (10.x, 192.168.x) directly without passing through the VPN
                        </span>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.bypassIranRoutes || false}
                            onChange={e => {
                                const val = e.target.checked
                                updateSettings({
                                    bypassIranRoutes: val,
                                    bypassPrivateIps: val
                                })
                            }}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                {/* Custom Domains Bypass List */}
                <div style={{ marginTop: 'var(--spacing-lg)', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 600 }}>
                            <Globe size={16} />
                            Custom Bypass Domains
                        </label>

                        <button
                            type="button"
                            onClick={() => saveDomains(bypassDomainsInput)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                background: domainsSaved ? 'var(--accent-green)' : 'var(--accent-primary)',
                                color: '#fff',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {domainsSaved ? <Check size={14} /> : <Save size={14} />}
                            {domainsSaved ? (connectionState === 'connected' ? 'Applied Live!' : 'Saved') : 'Save'}
                        </button>
                    </div>

                    <span className="settings-label-description" style={{ display: 'block', marginBottom: '10px', fontSize: 12 }}>
                        Domains entered here and all their subdomains (e.g. <code>*.domain.com</code>) will bypass the VPN automatically. Enter one domain per line (e.g. <code>soft98.ir</code> or <code>mycompany.local</code>).
                    </span>

                    <textarea
                        className="form-input"
                        rows={4}
                        placeholder={`example.com\n.local\nsub.internal-service.net`}
                        style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                        value={bypassDomainsInput}
                        onChange={e => setBypassDomainsInput(e.target.value)}
                        onBlur={handleDomainsBlur}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>Saved Domains: {(settings.bypassDomains || []).length}</span>
                        <span>Auto-saved on blur or click save</span>
                    </div>
                </div>

                {/* Custom IPs Bypass List */}
                <div style={{ marginTop: 'var(--spacing-lg)', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 600 }}>
                            <Network size={16} />
                            Custom Bypass IPs & Subnets
                        </label>

                        <button
                            type="button"
                            onClick={() => saveIps(bypassIpsInput)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                background: ipsSaved ? 'var(--accent-green)' : 'var(--accent-primary)',
                                color: '#fff',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {ipsSaved ? <Check size={14} /> : <Save size={14} />}
                            {ipsSaved ? (connectionState === 'connected' ? 'Applied Live!' : 'Saved') : 'Save'}
                        </button>
                    </div>

                    <span className="settings-label-description" style={{ display: 'block', marginBottom: '10px', fontSize: 12 }}>
                        IP addresses or CIDR subnets entered here will bypass the VPN tunnel. Enter one per line (e.g. <code>1.1.1.1</code> or <code>10.50.0.0/16</code>).
                    </span>

                    <textarea
                        className="form-input"
                        rows={4}
                        placeholder={`1.1.1.1\n10.50.0.0/16\n192.168.10.5`}
                        style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                        value={bypassIpsInput}
                        onChange={e => setBypassIpsInput(e.target.value)}
                        onBlur={handleIpsBlur}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>Saved IPs/Subnets: {(settings.bypassIps || []).length}</span>
                        <span>Auto-saved on blur or click save</span>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="settings-section">
                <h3 className="settings-section-title">About</h3>

                <div className="card">
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.3px',
                            marginBottom: 'var(--spacing-xs)'
                        }}>
                            Secure VPN
                        </h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Version {packageJson.version}</p>
                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '7px 16px', borderRadius: '6px' }}
                                onClick={() => window.electronAPI?.openExternal?.('https://github.com/morezaGeek/SecureVPN/releases')}
                                title="Open GitHub Releases"
                            >
                                <Github size={16} />
                                <span>Check for Updates (GitHub)</span>
                                <ExternalLink size={13} style={{ opacity: 0.6 }} />
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--spacing-md)', fontSize: 13 }}>
                            A premium VPN client for Windows with support for<br />
                            OpenConnect, V2Ray (VLESS/VMess), and SoftEther protocols.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

