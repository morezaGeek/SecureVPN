import { VpnProfile, VpnSubscription } from '../types'

export type ProfileSort = 'default' | 'ping'

export function hasPingResult(ping: number | undefined): ping is number {
    return typeof ping === 'number' && Number.isFinite(ping) && ping >= 0
}

export function pingTone(ping: number | undefined) {
    if (!hasPingResult(ping)) return ping === undefined ? 'untested' : 'red'
    if (ping < 100) return 'blue'
    if (ping <= 160) return 'green'
    if (ping <= 270) return 'yellow'
    return 'red'
}

export function sortProfilesByPing(profiles: VpnProfile[]): VpnProfile[] {
    const rank = (ping: number | undefined) => hasPingResult(ping) ? ping : Number.POSITIVE_INFINITY
    // Equal and unmeasured results retain their relative order.
    return [...profiles].sort((a, b) => {
        const first = rank(a.ping)
        const second = rank(b.ping)
        return first === second ? 0 : first < second ? -1 : 1
    })
}

// Match the left-to-right subscription tabs without changing persisted profiles.
export function orderProfilesBySubscription(profiles: VpnProfile[], subscriptions: VpnSubscription[]): VpnProfile[] {
    const ranks = new Map(subscriptions.map((sub, index) => [sub.id, index]))
    const rank = (profile: VpnProfile) => ranks.get(profile.subscriptionId || '') ?? subscriptions.length
    return [...profiles].sort((a, b) => rank(a) - rank(b))
}

export function profileSubscriptionLabel(profile: VpnProfile, subscriptions: VpnSubscription[]) {
    const index = subscriptions.findIndex(sub => sub.id === profile.subscriptionId)
    return index >= 0
        ? { name: subscriptions[index].name, tone: `subscription-tone-${index % 6}` }
        : { name: profile.subscriptionId ? 'Unknown subscription' : 'Manual', tone: 'subscription-tone-manual' }
}
