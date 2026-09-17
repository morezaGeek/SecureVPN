import { useVpn } from '../context/VpnContext'
import { FileText, Trash2, Copy } from 'lucide-react'
import { useState } from 'react'

export default function LogsScreen() {
    const { logs, clearLogs } = useVpn()
    const [copied, setCopied] = useState(false)

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    }

    const copyLogs = () => {
        const logText = logs.map(log =>
            `${formatDate(log.timestamp)} ${formatTime(log.timestamp)} [${log.level.toUpperCase()}] [${log.profileName}] ${log.message}`
        ).join('\n')
        navigator.clipboard.writeText(logText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div>
            <div className="card-header">
                <h2 className="card-title">Connection Logs</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {logs.length > 0 && (
                        <>
                            <button className="btn btn-secondary" onClick={copyLogs}>
                                <Copy size={16} />
                                {copied ? 'Copied!' : 'Copy Logs'}
                            </button>
                            <button className="btn btn-secondary" onClick={clearLogs}>
                                <Trash2 size={16} />
                                Clear Logs
                            </button>
                        </>
                    )}
                </div>
            </div>

            {logs.length === 0 ? (
                <div className="empty-state">
                    <FileText size={64} />
                    <h3 className="empty-state-title">No Logs Yet</h3>
                    <p className="empty-state-description">
                        Connection activity will appear here
                    </p>
                </div>
            ) : (
                <div className="log-list">
                    {logs.map(log => (
                        <div key={log.id} className="log-entry">
                            <span className="log-time">
                                {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                            </span>
                            <span className={`log-level ${log.level}`}>
                                {log.level}
                            </span>
                            <span className="log-message">
                                <strong>[{log.profileName}]</strong> {log.message}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
