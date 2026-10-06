import { Download, RefreshCw } from 'lucide-react'
import { useUpdates } from '../context/UpdateContext'

export default function UpdateButton({ compact = false }: { compact?: boolean }) {
    const { available, checking, checked, phase, percent, error, check, install } = useUpdates()
    const busy = phase !== 'idle'
    const label = phase === 'downloading' ? `${percent}%` : phase === 'installing' ? 'Installing…' : checking ? 'Checking…' : available ? (compact ? 'Update' : `Install v${available.version}`) : 'Check for Updates'
    return <div className={compact ? 'update-footer-control' : 'update-settings-control'}>
        <button
            className={compact ? `update-sidebar-button ${available ? 'available' : ''}` : 'btn btn-secondary'}
            disabled={busy || checking}
            onClick={() => {
                if (available) void install()
                else void check()
            }}
            title={available ? `Download and install v${available.version}. VPN will disconnect after download; settings are kept by default.` : 'Check GitHub for a newer Windows version'}
        >
            {available && !busy && !checking ? <Download size={compact ? 14 : 16} /> : <RefreshCw size={compact ? 14 : 16} />}
            <span>{label}</span>
            {available && !busy && <span className="update-dot" aria-label="Update available" />}
        </button>
        {error && <span className="update-error" role="alert" title={error}>{compact ? (available ? 'Update failed; retry' : 'Check failed') : error}</span>}
        {checked && !available && !error && !checking && <span className="update-message" role="status">{compact ? 'Up to date' : 'You have the latest Windows version.'}</span>}
        {!compact && available && <span className="update-message">Settings are kept by default. The VPN disconnects when installation starts.</span>}
    </div>
}
