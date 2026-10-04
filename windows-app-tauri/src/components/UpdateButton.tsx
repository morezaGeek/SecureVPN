import { Download, Github, RefreshCw } from 'lucide-react'
import { useUpdates } from '../context/UpdateContext'

export default function UpdateButton({ compact = false }: { compact?: boolean }) {
    const { available, checking, checked, phase, percent, error, check, install } = useUpdates()
    const busy = phase !== 'idle'
    const label = phase === 'downloading' ? `${percent}%` : phase === 'installing' ? 'Installing…' : available ? (compact ? 'Update' : `Install v${available.version}`) : checking ? 'Checking…' : compact ? 'Releases' : 'Check for Updates'
    return <div className={compact ? 'update-footer-control' : 'update-settings-control'}>
        <button
            className={compact ? `update-sidebar-button ${available ? 'available' : ''}` : 'btn btn-secondary'}
            disabled={busy || checking}
            onClick={() => {
                if (available) void install()
                else if (compact) void window.electronAPI?.openExternal?.('https://github.com/morezaGeek/SecureVPN/releases')
                else void check()
            }}
            title={available ? `Download and install v${available.version}. VPN will disconnect after download; settings are kept by default.` : 'GitHub Releases & Updates'}
        >
            {busy || checking ? <RefreshCw size={compact ? 14 : 16} /> : available ? <Download size={compact ? 14 : 16} /> : <Github size={compact ? 14 : 16} />}
            <span>{label}</span>
            {available && !busy && <span className="update-dot" aria-label="Update available" />}
        </button>
        {error && <span className="update-error" role="alert" title={error}>{compact ? (available ? 'Update failed; retry' : 'Check failed') : error}</span>}
        {!compact && checked && !available && !error && !checking && <span className="update-message">You have the latest Windows version.</span>}
        {!compact && available && <span className="update-message">Settings are kept by default. The VPN disconnects when installation starts.</span>}
    </div>
}
