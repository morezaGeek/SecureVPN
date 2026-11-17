import { useEffect, useRef } from 'react'
import { Activity, Check, Loader2 } from 'lucide-react'
import { PROTOCOL_INFO, VpnProfile, VpnSubscription, effectiveXhttpMode } from '../types'
import { hasPingResult, pingTone } from '../utils/profilePresentation'
import { getFlag } from './Flags'
import SubscriptionBadge from './SubscriptionBadge'

function countryCode(profile: VpnProfile): string {
    if (profile.countryCode) return profile.countryCode
    const flag = profile.name.match(/^[\u{1F1E6}-\u{1F1FF}]{2}/u)
    if (flag) return [...flag[0]].map(char => String.fromCodePoint(char.codePointAt(0)! - 127397)).join('')
    return profile.name.match(/^([A-Z]{2})\s/)?.[1] ?? ''
}

function protocolLabel(profile: VpnProfile, forceXhttpStreamUp: boolean): string {
    const name = PROTOCOL_INFO[profile.protocol]?.displayName ?? profile.protocol
    const config = profile.singboxConfig
    if (!config || profile.protocol === 'hysteria2' || profile.protocol === 'openconnect') return name
    const security = config.security === 'reality' || config.reality ? 'REALITY'
        : config.security === 'tls' || config.tls ? 'TLS' : null
    const mode = effectiveXhttpMode(profile, forceXhttpStreamUp)
    const transport = [(config.transport || 'tcp').toUpperCase(), mode].filter(Boolean).join(' ')
    return [name, transport, security].filter(Boolean).join(' · ')
}

export default function ProfileListCard({ profile, subscriptions, forceXhttpStreamUp, selected, actionTarget,
    testing, canPing, onSelect, onActions, onPing }: {
    profile: VpnProfile
    subscriptions: VpnSubscription[]
    forceXhttpStreamUp: boolean
    selected: boolean
    actionTarget: boolean
    testing: boolean
    canPing: boolean
    onSelect: () => void
    onActions: (trigger: HTMLButtonElement, keyboard: boolean) => void
    onPing: () => void
}) {
    const hold = useRef<{ timer: number; x: number; y: number; pointerId: number } | null>(null)
    const suppressClick = useRef(false)
    const cancelHold = () => {
        if (hold.current) window.clearTimeout(hold.current.timer)
        hold.current = null
    }
    useEffect(() => cancelHold, [])

    const cc = countryCode(profile)
    const endpoint = `${profile.serverAddress.includes(':') && !profile.serverAddress.startsWith('[')
        ? `[${profile.serverAddress}]` : profile.serverAddress}:${profile.port}`
    const pingLabel = testing ? 'Testing…' : hasPingResult(profile.ping) ? `${profile.ping} ms`
        : profile.ping === undefined ? 'Ping' : 'Timeout'
    const pingMethod = profile.pingMode === 'tcp' ? 'TCP' : profile.pingMode ? 'Tunnel' : ''

    return (
        <li className={`config-card${selected ? ' selected' : ''}${actionTarget ? ' action-target' : ''}`}>
            <button
                type="button"
                className="config-card-select"
                aria-label={`Select ${profile.name}`}
                aria-pressed={selected}
                aria-describedby="profile-actions-hint"
                title={profile.name}
                onClick={event => {
                    if (suppressClick.current && event.detail !== 0) {
                        suppressClick.current = false
                        return
                    }
                    onSelect()
                }}
                onContextMenu={event => {
                    event.preventDefault()
                    cancelHold()
                    const keyboard = event.button !== 2 && event.detail === 0
                    if (!keyboard) suppressClick.current = true
                    onActions(event.currentTarget, keyboard)
                }}
                onPointerDown={event => {
                    if (!event.isPrimary || event.button !== 0) return
                    cancelHold()
                    suppressClick.current = false
                    const trigger = event.currentTarget
                    hold.current = {
                        x: event.clientX, y: event.clientY, pointerId: event.pointerId,
                        timer: window.setTimeout(() => {
                            hold.current = null
                            suppressClick.current = true
                            onActions(trigger, false)
                        }, 500)
                    }
                }}
                onPointerMove={event => {
                    const start = hold.current
                    if (start?.pointerId === event.pointerId &&
                        (Math.abs(event.clientX - start.x) > 10 || Math.abs(event.clientY - start.y) > 10)) cancelHold()
                }}
                onPointerUp={cancelHold}
                onPointerCancel={cancelHold}
                onPointerLeave={cancelHold}
                onKeyDown={event => {
                    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                        event.preventDefault()
                        onActions(event.currentTarget, true)
                    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
                        event.preventDefault()
                        event.stopPropagation()
                        if (canPing) onPing()
                    }
                }}
            >
                <span className="config-card-name-row">
                    {selected ? <Check size={16} className="config-card-check" aria-hidden="true" />
                        : cc && <span className="config-card-flag" aria-hidden="true">{getFlag(cc, 16)}</span>}
                    <span className="config-card-name" dir="auto">{profile.name}</span>
                    <SubscriptionBadge profile={profile} subscriptions={subscriptions} />
                </span>
                <span className="config-card-details">
                    <span className="config-card-endpoint" dir="ltr" title={endpoint}>{endpoint}</span>
                    <span className="config-card-protocol">{protocolLabel(profile, forceXhttpStreamUp)}</span>
                </span>
            </button>
            <button
                type="button"
                className={`config-card-ping ping-${testing ? 'untested' : pingTone(profile.ping)}`}
                disabled={!canPing}
                onClick={onPing}
                aria-label={`${profile.name}: ${pingLabel}${pingMethod && !testing ? ` (${pingMethod})` : ''}. Test ping`}
                title={`Test ping${pingMethod ? ` · Last result: ${pingMethod}` : ''}`}
            >
                {testing ? <Loader2 size={14} className="spin-animation" aria-hidden="true" />
                    : profile.ping === undefined && <Activity size={14} aria-hidden="true" />}
                {pingLabel}
            </button>
        </li>
    )
}
