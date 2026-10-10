// Link parser utility for V2Ray/Xray share links
// Supports: vless://, vmess://, trojan://, ss://

import { VpnProtocol, SingboxProfile, SingboxTransport, SingboxSecurity } from '../types'

export interface ParsedLink {
    protocol: VpnProtocol
    name: string
    config: SingboxProfile
}

/**
 * Parse any supported share link
 */
export function parseShareLink(link: string): ParsedLink | null {
    link = link.trim()

    if (link.startsWith('vless://')) {
        return parseVlessLink(link)
    } else if (link.startsWith('vmess://')) {
        return parseVmessLink(link)
    } else if (link.startsWith('trojan://')) {
        return parseTrojanLink(link)
    } else if (link.startsWith('ss://')) {
        return parseShadowsocksLink(link)
    } else if (link.startsWith('hysteria2://')) {
        return parseHysteria2Link(link)
    }

    return null
}

/**
 * Parse VLESS link
 * Format: vless://uuid@host:port?type=ws&security=tls&...#name
 */
export function parseVlessLink(link: string): ParsedLink | null {
    try {
        // Replace vless:// with http:// for URL parsing
        const urlStr = link.replace('vless://', 'http://')
        const url = new URL(urlStr)

        const uuid = url.username
        const address = url.hostname
        const port = parseInt(url.port || '443', 10)
        const name = decodeURIComponent(url.hash.slice(1)) || `VLESS-${address}`

        const params = url.searchParams
        const rawType = params.get('type') || 'tcp'
        const transport = (rawType === 'splithttp' ? 'xhttp' : rawType) as SingboxTransport
        const security = (params.get('security') || 'none') as SingboxSecurity
        const extra = params.has('extra') ? JSON.parse(params.get('extra')!) : undefined
        if (extra !== undefined && (!extra || Array.isArray(extra) || typeof extra !== 'object')) {
            throw new Error('XHTTP extra must be a JSON object')
        }
        const mode = params.get('mode') || params.get('xhttpMode') ||
            (typeof extra?.mode === 'string' ? extra.mode : undefined)

        const config: SingboxProfile = {
            uuid,
            address,
            port,
            encryption: params.get('encryption') || 'none',
            transport,
            security,
            ech: params.get('ech') || undefined,
            sni: params.get('sni') || undefined,
            fingerprint: params.get('fp') || 'chrome',
            alpn: params.get('alpn')?.split(',') || undefined,
            path: params.get('path') || undefined,
            host: params.get('host') || params.get('sni') || undefined,
            serviceName: params.get('serviceName') || undefined,
            mode,
            extra,
            // Reality
            publicKey: params.get('pbk') || undefined,
            shortId: params.get('sid') || undefined
        }

        return { protocol: 'vless', name, config }
    } catch (error) {
        console.error('Failed to parse VLESS link:', error)
        return null
    }
}

/**
 * Parse VMess link
 * Format: vmess://base64(json)
 */
export function parseVmessLink(link: string): ParsedLink | null {
    try {
        const base64 = link.replace('vmess://', '')
        const json = JSON.parse(atob(base64))

        // VMess JSON format fields:
        // v: version (usually "2")
        // ps: name
        // add: address
        // port: port
        // id: uuid
        // scy: security/cipher
        // net: network type (tcp, ws, grpc, httpupgrade)
        // tls: tls or empty
        // path: path
        // host: host
        // fp: fingerprint
        // alpn: alpn

        const name = json.ps || `VMess-${json.add}`

        // Map VMess "net" to our transport type
        let transport: SingboxTransport = 'tcp'
        if (json.net === 'ws') transport = 'ws'
        else if (json.net === 'grpc') transport = 'grpc'
        else if (json.net === 'httpupgrade' || json.net === 'http') transport = 'httpupgrade'
        else if (json.net === 'xhttp') transport = 'xhttp'

        const config: SingboxProfile = {
            uuid: json.id,
            address: json.add,
            port: parseInt(json.port, 10),
            encryption: json.scy || 'auto',
            transport,
            security: json.tls === 'tls' ? 'tls' : 'none',
            sni: json.sni || json.add,
            fingerprint: json.fp || 'chrome',
            alpn: json.alpn?.split(',') || undefined,
            path: json.path || undefined,
            host: json.host || json.sni || undefined
        }

        return { protocol: 'vmess', name, config }
    } catch (error) {
        console.error('Failed to parse VMess link:', error)
        return null
    }
}

/**
 * Parse Trojan link
 * Format: trojan://password@host:port?security=tls&...#name
 */
export function parseTrojanLink(link: string): ParsedLink | null {
    try {
        const urlStr = link.replace('trojan://', 'http://')
        const url = new URL(urlStr)

        const password = decodeURIComponent(url.username)
        const address = url.hostname
        const port = parseInt(url.port || '443', 10)
        const name = decodeURIComponent(url.hash.slice(1)) || `Trojan-${address}`

        const params = url.searchParams
        const rawType = params.get('type') || 'tcp'
        const transport = rawType as SingboxTransport
        const security = (params.get('security') || 'tls') as SingboxSecurity

        const config: SingboxProfile = {
            uuid: password, // Trojan uses password instead of UUID
            address,
            port,
            transport,
            security,
            ech: params.get('ech') || undefined,
            sni: params.get('sni') || undefined,
            fingerprint: params.get('fp') || 'chrome',
            alpn: params.get('alpn')?.split(',') || undefined,
            path: params.get('path') || undefined,
            host: params.get('host') || params.get('sni') || undefined
        }

        return { protocol: 'trojan', name, config }
    } catch (error) {
        console.error('Failed to parse Trojan link:', error)
        return null
    }
}

/**
 * Parse Shadowsocks link
 * Format: ss://base64(method:password)@host:port#name
 * Or: ss://base64(method:password@host:port)#name (SIP002)
 */
export function parseShadowsocksLink(link: string): ParsedLink | null {
    try {
        let name = ''
        let remaining = link.replace('ss://', '')

        // Extract name from hash
        const hashIndex = remaining.indexOf('#')
        if (hashIndex !== -1) {
            name = decodeURIComponent(remaining.slice(hashIndex + 1))
            remaining = remaining.slice(0, hashIndex)
        }

        let method: string
        let password: string
        let address: string
        let port: number

        // Check if it's SIP002 format (contains @)
        if (remaining.includes('@')) {
            // SIP002: base64(method:password)@host:port
            const [encodedPart, serverPart] = remaining.split('@')
            const decoded = atob(encodedPart)
            const colonIdx = decoded.indexOf(':')
            method = decoded.slice(0, colonIdx)
            password = decoded.slice(colonIdx + 1)

            const [host, portStr] = serverPart.split(':')
            address = host
            port = parseInt(portStr, 10)
        } else {
            // Legacy: base64(method:password@host:port)
            const decoded = atob(remaining)
            const match = decoded.match(/^([^:]+):([^@]+)@([^:]+):(\d+)$/)
            if (!match) throw new Error('Invalid SS format')

            method = match[1]
            password = match[2]
            address = match[3]
            port = parseInt(match[4], 10)
        }

        name = name || `SS-${address}`

        const config: SingboxProfile = {
            uuid: password, // SS uses password
            address,
            port,
            method,
            transport: 'tcp',
            security: 'none'
        }

        return { protocol: 'shadowsocks', name, config }
    } catch (error) {
        console.error('Failed to parse Shadowsocks link:', error)
        return null
    }
}

/**
 * Generate share link from profile (for export)
 */
export function generateShareLink(protocol: VpnProtocol, name: string, config: SingboxProfile): string {
    switch (protocol) {
        case 'vless': {
            const params = new URLSearchParams()
            params.set('type', config.transport)
            params.set('security', config.security)
            if (config.ech) params.set('ech', config.ech)
            if (config.sni) params.set('sni', config.sni)
            if (config.fingerprint) params.set('fp', config.fingerprint)
            if (config.alpn) params.set('alpn', config.alpn.join(','))
            if (config.path) params.set('path', config.path)
            if (config.host) params.set('host', config.host)
            if (config.encryption) params.set('encryption', config.encryption)
            if (config.mode) params.set('mode', config.mode)
            if (config.extra) params.set('extra', JSON.stringify(config.extra))
            if (config.publicKey) params.set('pbk', config.publicKey)
            if (config.shortId) params.set('sid', config.shortId)

            return `vless://${config.uuid}@${config.address}:${config.port}?${params.toString()}#${encodeURIComponent(name)}`
        }

        case 'vmess': {
            const json = {
                v: '2',
                ps: name,
                add: config.address,
                port: config.port,
                id: config.uuid,
                scy: config.encryption || 'auto',
                net: config.transport,
                tls: config.security === 'tls' ? 'tls' : '',
                path: config.path || '',
                host: config.host || '',
                fp: config.fingerprint || 'chrome',
                alpn: config.alpn?.join(',') || '',
                sni: config.sni || ''
            }
            return `vmess://${btoa(JSON.stringify(json))}`
        }

        case 'trojan': {
            const params = new URLSearchParams()
            params.set('type', config.transport)
            params.set('security', config.security)
            if (config.ech) params.set('ech', config.ech)
            if (config.sni) params.set('sni', config.sni)
            if (config.fingerprint) params.set('fp', config.fingerprint)
            if (config.alpn) params.set('alpn', config.alpn.join(','))
            if (config.path) params.set('path', config.path)

            return `trojan://${encodeURIComponent(config.uuid)}@${config.address}:${config.port}?${params.toString()}#${encodeURIComponent(name)}`
        }

        case 'hysteria2': {
            const params = new URLSearchParams()
            if (config.sni) params.set('sni', config.sni)
            if (config.alpn?.length) params.set('alpn', config.alpn.join(','))
            if (config.allowInsecure) params.set('insecure', '1')
            if (config.hysteriaObfs) params.set('obfs', config.hysteriaObfs)
            if (config.hysteriaObfsPassword) params.set('obfs-password', config.hysteriaObfsPassword)
            if (config.hysteriaObfs === 'gecko') {
                params.set('minPacketSize', String(config.hysteriaObfsMinPacketSize || 512))
                params.set('maxPacketSize', String(config.hysteriaObfsMaxPacketSize || 1200))
            }
            return `hysteria2://${encodeURIComponent(config.uuid)}@${config.address}:${config.port}?${params.toString()}#${encodeURIComponent(name)}`
        }

        case 'shadowsocks': {
            const encoded = btoa(`${config.method}:${config.uuid}`)
            return `ss://${encoded}@${config.address}:${config.port}#${encodeURIComponent(name)}`
        }

        default:
            return ''
    }
}

/**
 * Parse Hysteria2 link
 */
function parseHysteria2Link(link: string): ParsedLink | null {
    try {
        const uri = new URL(link.replace('hysteria2://', 'http://'))
        const password = decodeURIComponent(uri.username || uri.password)
        const address = uri.hostname
        const port = parseInt(uri.port || '443', 10)
        let name = decodeURIComponent(uri.hash.substring(1) || `Hysteria2-${address}`)

        const sni = uri.searchParams.get('sni') || address
        const obfs = uri.searchParams.get('obfs') || undefined
        const obfsPassword = uri.searchParams.get('obfs-password') || undefined
        const fp = uri.searchParams.get('fp') || 'chrome'
        const alpn = uri.searchParams.get('alpn')

        return {
            protocol: 'hysteria2',
            name,
            config: {
                uuid: password, // Store password in uuid field since they share similar auth purpose
                address,
                port,
                transport: 'tcp', // Hysteria2 is inherently QUIC/UDP, we will handle this in singbox-service
                security: 'tls',
                sni,
                fingerprint: fp,
                alpn: alpn ? alpn.split(',') : undefined,
                allowInsecure: uri.searchParams.get('insecure') === '1' || uri.searchParams.get('allowInsecure') === '1',
                hysteriaObfs: obfs,
                hysteriaObfsPassword: obfsPassword,
                hysteriaObfsMinPacketSize: Number(uri.searchParams.get("minPacketSize")) || 512,
                hysteriaObfsMaxPacketSize: Number(uri.searchParams.get("maxPacketSize")) || 1200
            }
        }
    } catch (e) {
        console.error('Failed to parse Hysteria2 link:', e)
        return null
    }
}

/**
 * Parse Subscription data from headers and body
 */
export function parseSubscriptionData(content: string, headers: Record<string, string>, url: string) {
    let links: ParsedLink[] = []
    
    // Parse content (usually base64 encoded)
    try {
        const raw = content.trim()
        const decoded = /^(vless|vmess|trojan|ss|hysteria2):\/\//.test(raw) ? raw :
            new TextDecoder().decode(Uint8Array.from(atob(raw.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)))
        const lines = decoded.split('\n').filter(line => line.trim().length > 0)
        
        for (const line of lines) {
            const parsed = parseShareLink(line)
            if (parsed) {
                links.push(parsed)
            }
        }
    } catch (e) {
        console.error('Failed to parse subscription content:', e)
    }

    // Parse headers for Userinfo (upload, download, total, expire)
    let upload = 0
    let download = 0
    let total = 0
    let expire = 0
    let name = 'Subscription'

    // Sometimes the profile title is in headers
    const titleHeader = headers['profile-title']
    if (titleHeader) {
        if (titleHeader.startsWith('base64:')) {
            try { name = atob(titleHeader.replace('base64:', '')) } catch (e) {}
        } else {
            name = titleHeader
        }
    } else {
        try { name = new URL(url).hostname } catch (e) {}
    }

    const userInfo = headers['subscription-userinfo']
    if (userInfo) {
        const parts = userInfo.split(';')
        for (const part of parts) {
            const [key, value] = part.trim().split('=')
            if (!key || !value) continue
            
            const num = parseInt(value, 10)
            if (isNaN(num)) continue
            
            if (key.toLowerCase() === 'upload') upload = num
            else if (key.toLowerCase() === 'download') download = num
            else if (key.toLowerCase() === 'total') total = num
            else if (key.toLowerCase() === 'expire') expire = num
        }
    }

    return {
        name,
        links,
        upload,
        download,
        total,
        expire
    }
}
