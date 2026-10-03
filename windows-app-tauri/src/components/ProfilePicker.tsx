import { useEffect, useId, useRef, useState, KeyboardEvent } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { VpnProfile, VpnSubscription } from '../types'
import { profileSubscriptionLabel } from '../utils/profilePresentation'
import SubscriptionBadge from './SubscriptionBadge'

export default function ProfilePicker({ profiles, subscriptions, currentProfile, onSelect }: {
    profiles: VpnProfile[]
    subscriptions: VpnSubscription[]
    currentProfile: VpnProfile | null
    onSelect: (profile: VpnProfile) => void
}) {
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(0)
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef({ text: '', time: 0 })
    const id = useId()
    const selected = profiles.find(profile => profile.id === currentProfile?.id)
    const activeIndex = Math.min(active, Math.max(0, profiles.length - 1))

    useEffect(() => {
        if (!open) return
        listRef.current?.focus()
        const closeOutside = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener('pointerdown', closeOutside)
        return () => document.removeEventListener('pointerdown', closeOutside)
    }, [open])

    useEffect(() => {
        if (open) listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }, [open, activeIndex])

    const show = (index?: number) => {
        const selectedIndex = profiles.findIndex(profile => profile.id === selected?.id)
        setActive(index ?? Math.max(0, selectedIndex))
        searchRef.current = { text: '', time: 0 }
        setOpen(true)
    }
    const close = () => {
        setOpen(false)
        triggerRef.current?.focus()
    }
    const choose = (profile: VpnProfile) => {
        onSelect(profile)
        close()
    }
    const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Tab') { setOpen(false); return }
        if (event.key === 'Escape') { event.preventDefault(); close(); return }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (profiles[activeIndex]) choose(profiles[activeIndex])
            return
        }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault()
            setActive(event.key === 'Home' ? 0 : event.key === 'End' ? profiles.length - 1
                : Math.max(0, Math.min(profiles.length - 1, activeIndex + (event.key === 'ArrowDown' ? 1 : -1))))
            return
        }
        if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
            event.preventDefault()
            const now = Date.now()
            const previous = now - searchRef.current.time < 700 ? searchRef.current.text : ''
            const query = previous + event.key.toLocaleLowerCase()
            searchRef.current = { text: query, time: now }
            const index = profiles.findIndex(profile =>
                profile.name.toLocaleLowerCase().startsWith(query) ||
                profileSubscriptionLabel(profile, subscriptions).name.toLocaleLowerCase().startsWith(query))
            if (index >= 0) setActive(index)
        }
    }

    return (
        <div ref={rootRef} className="profile-picker" onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
        }}>
            <button ref={triggerRef} type="button" className="form-input profile-picker-trigger"
                aria-label="Select VPN Profile" aria-haspopup="listbox" aria-expanded={open} aria-controls={id}
                onClick={() => open ? setOpen(false) : show()}
                onKeyDown={event => {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                        event.preventDefault()
                        show(event.key === 'ArrowUp' && !selected ? profiles.length - 1 : undefined)
                    }
                }}>
                <span className="profile-picker-name">{selected?.name || 'Select Profile...'}</span>
                {selected && <SubscriptionBadge profile={selected} subscriptions={subscriptions} />}
                <ChevronDown size={18} aria-hidden="true" />
            </button>
            {open && (
                <div ref={listRef} id={id} className="profile-picker-list" role="listbox" tabIndex={-1}
                    aria-label="VPN Profiles" aria-activedescendant={profiles[activeIndex] ? `${id}-${activeIndex}` : undefined}
                    onKeyDown={onListKeyDown}>
                    {profiles.map((profile, index) => (
                        <div key={profile.id} id={`${id}-${index}`} role="option" aria-selected={profile.id === selected?.id}
                            className={`profile-picker-option ${index === activeIndex ? 'active' : ''}`}
                            onMouseEnter={() => setActive(index)} onClick={() => choose(profile)}>
                            <span className="profile-picker-name">{profile.name}</span>
                            <SubscriptionBadge profile={profile} subscriptions={subscriptions} />
                            <span className="profile-picker-check">{profile.id === selected?.id && <Check size={16} aria-hidden="true" />}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
