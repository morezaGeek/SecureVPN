import { VpnProfile, VpnSubscription } from '../types'

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
