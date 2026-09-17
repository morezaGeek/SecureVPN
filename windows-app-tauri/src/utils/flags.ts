// Country code to flag emoji converter
// Uses regional indicator symbols to create flag emojis

export function countryCodeToFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) {
        return '🌍' // Globe emoji as fallback
    }

    const code = countryCode.toUpperCase()

    // Convert country code to regional indicator symbols
    // A = 🇦, B = 🇧, etc.
    const offset = 127397 // Regional indicator A is U+1F1E6
    const flag = String.fromCodePoint(
        code.charCodeAt(0) + offset,
        code.charCodeAt(1) + offset
    )

    return flag
}

// Common country names
const countryNames: Record<string, string> = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'NL': 'Netherlands',
    'CA': 'Canada',
    'AU': 'Australia',
    'JP': 'Japan',
    'SG': 'Singapore',
    'HK': 'Hong Kong',
    'IR': 'Iran',
    'TR': 'Turkey',
    'AE': 'United Arab Emirates',
    'RU': 'Russia',
    'CH': 'Switzerland',
    'SE': 'Sweden',
    'NO': 'Norway',
    'FI': 'Finland',
    'IT': 'Italy',
    'ES': 'Spain',
    'BR': 'Brazil',
    'IN': 'India',
    'KR': 'South Korea',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'AT': 'Austria',
    'BE': 'Belgium',
    'DK': 'Denmark',
    'IE': 'Ireland',
    'UA': 'Ukraine',
}

export function getCountryName(countryCode: string): string {
    if (!countryCode) return ''
    const code = countryCode.toUpperCase()
    return countryNames[code] || countryCode
}
