import { useEffect, useState } from 'react'
import { useVpn } from '../context/VpnContext'
import { DEFAULT_TUNNEL_DNS_URL } from '../types'

export default function TunnelDnsSettings() {
    const { settings, updateSettings } = useVpn()
    const { tunnelDnsUrl, tunnelDnsFakeIp, openConnectServerDns } = settings
    const [url, setUrl] = useState(tunnelDnsUrl)
    const [fakeIp, setFakeIp] = useState(tunnelDnsFakeIp)
    const [serverDns, setServerDns] = useState(openConnectServerDns)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        setUrl(tunnelDnsUrl)
        setFakeIp(tunnelDnsFakeIp)
        setServerDns(openConnectServerDns)
    }, [tunnelDnsUrl, tunnelDnsFakeIp, openConnectServerDns])

    const editUrl = (value: string) => {
        setUrl(value)
        setFakeIp(false)
        setError('')
        setSaved(false)
    }

    const save = (value: string, useFakeIp: boolean, useServerDns: boolean) => {
        value = value.trim()
        try {
            const endpoint = new URL(value)
            if (!/^https:\/\//i.test(value) || !endpoint.hostname || endpoint.username ||
                endpoint.password || value.includes('#') || endpoint.port === '0') {
                throw new Error('Invalid DNS URL')
            }
        } catch {
            setError('Enter a valid HTTPS DNS-over-HTTPS URL.')
            setSaved(false)
            return
        }
        void updateSettings({ tunnelDnsUrl: value, tunnelDnsFakeIp: useFakeIp, openConnectServerDns: useServerDns })
        setUrl(value)
        setFakeIp(useFakeIp)
        setServerDns(useServerDns)
        setError('')
        setSaved(true)
    }

    return (
        <section className="settings-section" aria-labelledby="tunnel-dns-title">
            <h3 className="settings-section-title" id="tunnel-dns-title">Tunnel DNS</h3>
            <form className="tunnel-dns-settings" noValidate onSubmit={event => { event.preventDefault(); save(url, fakeIp, serverDns) }}>
                <label className="settings-label-text" htmlFor="tunnel-doh-url">DNS-over-HTTPS URL</label>
                <input id="tunnel-doh-url" className="form-input" type="url" spellCheck={false}
                    value={url} onChange={event => editUrl(event.target.value)}
                    aria-invalid={Boolean(error)} aria-describedby="tunnel-doh-help" />
                <p id="tunnel-doh-help" className="settings-label-description">V2Ray and Hysteria2 use this resolver through the tunnel.</p>
                <label className="tunnel-dns-option">
                    <input type="checkbox" checked={fakeIp} onChange={event => { setFakeIp(event.target.checked); setSaved(false) }} />
                    <span>FakeIP <small className="settings-label-description">Use synthetic addresses for A/AAAA queries</small></span>
                </label>
                <label className="tunnel-dns-option">
                    <input type="checkbox" checked={serverDns} onChange={event => { setServerDns(event.target.checked); setSaved(false) }} />
                    <span>Use VPN server DNS for OpenConnect <small className="settings-label-description">Google DNS is used by default (8.8.8.8 and 8.8.4.4).</small></span>
                </label>
                <div className="tunnel-dns-buttons">
                    <button type="submit" className="btn btn-primary">Save DNS</button>
                    <button type="button" className="btn btn-outline" onClick={() => save(DEFAULT_TUNNEL_DNS_URL, false, false)}>Use Google DNS</button>
                </div>
                {error ? <p role="alert" className="tunnel-dns-error">{error}</p> :
                    <p role="status" className="settings-label-description">{saved ? 'DNS saved. Applies on the next connection.' : 'Changes apply on the next connection.'}</p>}
            </form>
        </section>
    )
}
