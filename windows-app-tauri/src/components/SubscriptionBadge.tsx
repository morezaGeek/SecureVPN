import { VpnProfile, VpnSubscription } from '../types'
import { profileSubscriptionLabel } from '../utils/profilePresentation'

export default function SubscriptionBadge({ profile, subscriptions }: { profile: VpnProfile; subscriptions: VpnSubscription[] }) {
    const label = profileSubscriptionLabel(profile, subscriptions)
    return <span className={`subscription-badge ${label.tone}`} title={label.name}>{label.name}</span>
}
