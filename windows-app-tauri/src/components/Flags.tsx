// SVG Flag components for countries
// Using inline SVGs for reliable rendering across all Windows versions

interface FlagProps {
    size?: number
    className?: string
}

// Germany Flag
export const FlagDE = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.6} viewBox="0 0 5 3" className={className}>
        <rect width="5" height="1" y="0" fill="#000" />
        <rect width="5" height="1" y="1" fill="#DD0000" />
        <rect width="5" height="1" y="2" fill="#FFCE00" />
    </svg>
)

// United States Flag
export const FlagUS = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.6} viewBox="0 0 190 100" className={className}>
        <rect width="190" height="100" fill="#B22234" />
        <g fill="#fff">
            {[0, 2, 4, 6, 8, 10, 12].map(i => <rect key={i} y={i * 7.69} width="190" height="3.85" />)}
        </g>
        <rect width="76" height="53.85" fill="#3C3B6E" />
        <g fill="#fff">
            {/* Simplified stars pattern */}
            <circle cx="10" cy="7" r="3" /><circle cx="25" cy="7" r="3" /><circle cx="40" cy="7" r="3" /><circle cx="55" cy="7" r="3" /><circle cx="70" cy="7" r="3" />
            <circle cx="17" cy="15" r="3" /><circle cx="32" cy="15" r="3" /><circle cx="47" cy="15" r="3" /><circle cx="62" cy="15" r="3" />
            <circle cx="10" cy="23" r="3" /><circle cx="25" cy="23" r="3" /><circle cx="40" cy="23" r="3" /><circle cx="55" cy="23" r="3" /><circle cx="70" cy="23" r="3" />
            <circle cx="17" cy="31" r="3" /><circle cx="32" cy="31" r="3" /><circle cx="47" cy="31" r="3" /><circle cx="62" cy="31" r="3" />
            <circle cx="10" cy="39" r="3" /><circle cx="25" cy="39" r="3" /><circle cx="40" cy="39" r="3" /><circle cx="55" cy="39" r="3" /><circle cx="70" cy="39" r="3" />
            <circle cx="17" cy="47" r="3" /><circle cx="32" cy="47" r="3" /><circle cx="47" cy="47" r="3" /><circle cx="62" cy="47" r="3" />
        </g>
    </svg>
)

// United Kingdom Flag
export const FlagGB = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.5} viewBox="0 0 60 30" className={className}>
        <rect width="60" height="30" fill="#00247D" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#CF142B" strokeWidth="2" />
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#CF142B" strokeWidth="6" />
    </svg>
)

// France Flag
export const FlagFR = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 3 2" className={className}>
        <rect width="1" height="2" x="0" fill="#002395" />
        <rect width="1" height="2" x="1" fill="#fff" />
        <rect width="1" height="2" x="2" fill="#ED2939" />
    </svg>
)

// Netherlands Flag
export const FlagNL = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 9 6" className={className}>
        <rect width="9" height="2" y="0" fill="#AE1C28" />
        <rect width="9" height="2" y="2" fill="#fff" />
        <rect width="9" height="2" y="4" fill="#21468B" />
    </svg>
)

// Canada Flag
export const FlagCA = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.5} viewBox="0 0 1200 600" className={className}>
        <rect width="1200" height="600" fill="#fff" />
        <rect width="300" height="600" fill="#FF0000" />
        <rect x="900" width="300" height="600" fill="#FF0000" />
        <path fill="#FF0000" d="M600,100 L630,220 L550,160 L600,180 L650,160 L570,220 L600,100" />
    </svg>
)

// Japan Flag
export const FlagJP = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 30 20" className={className}>
        <rect width="30" height="20" fill="#fff" />
        <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </svg>
)

// Australia Flag
export const FlagAU = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.5} viewBox="0 0 10 5" className={className}>
        <rect width="10" height="5" fill="#00008B" />
        <g fill="#fff">
            <polygon points="3,3.5 3.3,4.5 2.2,3.9 3.8,3.9 2.7,4.5" />
            <polygon points="7,2 7.2,2.7 6.3,2.3 7.7,2.3 6.8,2.7" />
            <polygon points="8,3.5 8.15,4 7.5,3.7 8.5,3.7 7.85,4" />
            <polygon points="7,4.2 7.1,4.5 6.6,4.3 7.4,4.3 6.9,4.5" />
            <polygon points="5.5,3.5 5.6,3.8 5.2,3.6 5.8,3.6 5.4,3.8" />
        </g>
        <rect width="2.5" height="2.5" fill="#00247D" />
        <path d="M0,0 L2.5,2.5 M2.5,0 L0,2.5" stroke="#fff" strokeWidth="0.4" />
        <path d="M0,0 L2.5,2.5 M2.5,0 L0,2.5" stroke="#CF142B" strokeWidth="0.2" />
        <path d="M1.25,0 V2.5 M0,1.25 H2.5" stroke="#fff" strokeWidth="0.6" />
        <path d="M1.25,0 V2.5 M0,1.25 H2.5" stroke="#CF142B" strokeWidth="0.35" />
    </svg>
)

// Singapore Flag
export const FlagSG = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 4320 2880" className={className}>
        <rect width="4320" height="1440" fill="#ED2939" />
        <rect y="1440" width="4320" height="1440" fill="#fff" />
        <circle cx="1080" cy="720" r="540" fill="#fff" />
        <circle cx="1260" cy="720" r="540" fill="#ED2939" />
        <g fill="#fff">
            <polygon points="1380,180 1400,250 1475,250 1415,295 1435,365 1380,320 1325,365 1345,295 1285,250 1360,250" />
            <polygon points="1020,450 1040,520 1115,520 1055,565 1075,635 1020,590 965,635 985,565 925,520 1000,520" />
            <polygon points="1740,450 1760,520 1835,520 1775,565 1795,635 1740,590 1685,635 1705,565 1645,520 1720,520" />
            <polygon points="1140,810 1160,880 1235,880 1175,925 1195,995 1140,950 1085,995 1105,925 1045,880 1120,880" />
            <polygon points="1620,810 1640,880 1715,880 1655,925 1675,995 1620,950 1565,995 1585,925 1525,880 1600,880" />
        </g>
    </svg>
)

// Hong Kong Flag
export const FlagHK = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 900 600" className={className}>
        <rect width="900" height="600" fill="#DE2910" />
        <g fill="#fff" transform="translate(450,300)">
            <ellipse rx="60" ry="150" transform="rotate(0)" />
            <ellipse rx="60" ry="150" transform="rotate(72)" />
            <ellipse rx="60" ry="150" transform="rotate(144)" />
            <ellipse rx="60" ry="150" transform="rotate(216)" />
            <ellipse rx="60" ry="150" transform="rotate(288)" />
        </g>
    </svg>
)

// Iran Flag
export const FlagIR = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.57} viewBox="0 0 630 360" className={className}>
        <rect width="630" height="120" y="0" fill="#239F40" />
        <rect width="630" height="120" y="120" fill="#fff" />
        <rect width="630" height="120" y="240" fill="#DA0000" />
        <text x="315" y="200" textAnchor="middle" fill="#DA0000" fontSize="60" fontWeight="bold">☫</text>
    </svg>
)

// Turkey Flag
export const FlagTR = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 30 20" className={className}>
        <rect width="30" height="20" fill="#E30A17" />
        <circle cx="10" cy="10" r="6" fill="#fff" />
        <circle cx="11.5" cy="10" r="4.8" fill="#E30A17" />
        <polygon points="16,10 17.5,11.2 17,9.3 18.5,8.2 16.5,8.2 16,6.3 15.5,8.2 13.5,8.2 15,9.3 14.5,11.2" fill="#fff" />
    </svg>
)

// UAE Flag
export const FlagAE = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.5} viewBox="0 0 12 6" className={className}>
        <rect width="12" height="2" y="0" fill="#00732F" />
        <rect width="12" height="2" y="2" fill="#fff" />
        <rect width="12" height="2" y="4" fill="#000" />
        <rect width="3" height="6" fill="#FF0000" />
    </svg>
)

// Russia Flag
export const FlagRU = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 9 6" className={className}>
        <rect width="9" height="2" y="0" fill="#fff" />
        <rect width="9" height="2" y="2" fill="#0039A6" />
        <rect width="9" height="2" y="4" fill="#D52B1E" />
    </svg>
)

// Switzerland Flag
export const FlagCH = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" fill="#FF0000" />
        <rect x="13" y="6" width="6" height="20" fill="#fff" />
        <rect x="6" y="13" width="20" height="6" fill="#fff" />
    </svg>
)

// Sweden Flag
export const FlagSE = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.625} viewBox="0 0 16 10" className={className}>
        <rect width="16" height="10" fill="#006AA7" />
        <rect x="5" width="2" height="10" fill="#FECC00" />
        <rect y="4" width="16" height="2" fill="#FECC00" />
    </svg>
)

// Norway Flag
export const FlagNO = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.73} viewBox="0 0 22 16" className={className}>
        <rect width="22" height="16" fill="#EF2B2D" />
        <rect x="6" width="4" height="16" fill="#fff" />
        <rect y="6" width="22" height="4" fill="#fff" />
        <rect x="7" width="2" height="16" fill="#002868" />
        <rect y="7" width="22" height="2" fill="#002868" />
    </svg>
)

// Finland Flag
export const FlagFI = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.61} viewBox="0 0 18 11" className={className}>
        <rect width="18" height="11" fill="#fff" />
        <rect x="5" width="3" height="11" fill="#003580" />
        <rect y="4" width="18" height="3" fill="#003580" />
    </svg>
)

// Italy Flag
export const FlagIT = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 3 2" className={className}>
        <rect width="1" height="2" x="0" fill="#009246" />
        <rect width="1" height="2" x="1" fill="#fff" />
        <rect width="1" height="2" x="2" fill="#CE2B37" />
    </svg>
)

// Spain Flag
export const FlagES = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 3 2" className={className}>
        <rect width="3" height="0.5" y="0" fill="#AA151B" />
        <rect width="3" height="1" y="0.5" fill="#F1BF00" />
        <rect width="3" height="0.5" y="1.5" fill="#AA151B" />
    </svg>
)

// Brazil Flag
export const FlagBR = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.7} viewBox="0 0 20 14" className={className}>
        <rect width="20" height="14" fill="#009B3A" />
        <polygon points="10,1 19,7 10,13 1,7" fill="#FEDF00" />
        <circle cx="10" cy="7" r="3.5" fill="#002776" />
    </svg>
)

// India Flag
export const FlagIN = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 900 600" className={className}>
        <rect width="900" height="200" y="0" fill="#FF9933" />
        <rect width="900" height="200" y="200" fill="#fff" />
        <rect width="900" height="200" y="400" fill="#138808" />
        <circle cx="450" cy="300" r="60" fill="#000080" fillOpacity="0" />
        <circle cx="450" cy="300" r="60" stroke="#000080" strokeWidth="12" fill="none" />
    </svg>
)

// South Korea Flag
export const FlagKR = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 900 600" className={className}>
        <rect width="900" height="600" fill="#fff" />
        <circle cx="450" cy="300" r="150" fill="#C60C30" />
        <path d="M450,150 A150,150 0 0,1 450,450 A75,75 0 0,1 450,300 A75,75 0 0,0 450,150" fill="#003478" />
    </svg>
)

// Poland Flag
export const FlagPL = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.625} viewBox="0 0 8 5" className={className}>
        <rect width="8" height="2.5" y="0" fill="#fff" />
        <rect width="8" height="2.5" y="2.5" fill="#DC143C" />
    </svg>
)

// Czech Republic Flag
export const FlagCZ = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 6 4" className={className}>
        <rect width="6" height="2" y="0" fill="#fff" />
        <rect width="6" height="2" y="2" fill="#D7141A" />
        <polygon points="0,0 3,2 0,4" fill="#11457E" />
    </svg>
)

// Austria Flag
export const FlagAT = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 3 2" className={className}>
        <rect width="3" height="0.67" y="0" fill="#ED2939" />
        <rect width="3" height="0.67" y="0.67" fill="#fff" />
        <rect width="3" height="0.67" y="1.34" fill="#ED2939" />
    </svg>
)

// Belgium Flag
export const FlagBE = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.87} viewBox="0 0 3 2.6" className={className}>
        <rect width="1" height="2.6" x="0" fill="#000" />
        <rect width="1" height="2.6" x="1" fill="#FFD90C" />
        <rect width="1" height="2.6" x="2" fill="#F31830" />
    </svg>
)

// Denmark Flag
export const FlagDK = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.76} viewBox="0 0 37 28" className={className}>
        <rect width="37" height="28" fill="#C8102E" />
        <rect x="12" width="4" height="28" fill="#fff" />
        <rect y="12" width="37" height="4" fill="#fff" />
    </svg>
)

// Ireland Flag
export const FlagIE = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.5} viewBox="0 0 2 1" className={className}>
        <rect width="0.67" height="1" x="0" fill="#169B62" />
        <rect width="0.67" height="1" x="0.67" fill="#fff" />
        <rect width="0.67" height="1" x="1.34" fill="#FF883E" />
    </svg>
)

// Ukraine Flag
export const FlagUA = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 3 2" className={className}>
        <rect width="3" height="1" y="0" fill="#0057B7" />
        <rect width="3" height="1" y="1" fill="#FFD700" />
    </svg>
)

// Globe fallback
export const FlagGlobe = ({ size = 24, className }: FlagProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
)

// Map of country codes to flag components
const flagComponents: Record<string, React.FC<FlagProps>> = {
    'DE': FlagDE,
    'US': FlagUS,
    'GB': FlagGB,
    'UK': FlagGB, // Alias
    'FR': FlagFR,
    'NL': FlagNL,
    'CA': FlagCA,
    'AU': FlagAU,
    'JP': FlagJP,
    'SG': FlagSG,
    'HK': FlagHK,
    'IR': FlagIR,
    'TR': FlagTR,
    'AE': FlagAE,
    'RU': FlagRU,
    'CH': FlagCH,
    'SE': FlagSE,
    'NO': FlagNO,
    'FI': FlagFI,
    'IT': FlagIT,
    'ES': FlagES,
    'BR': FlagBR,
    'IN': FlagIN,
    'KR': FlagKR,
    'PL': FlagPL,
    'CZ': FlagCZ,
    'AT': FlagAT,
    'BE': FlagBE,
    'DK': FlagDK,
    'IE': FlagIE,
    'UA': FlagUA,
}

// Get flag component for country code
export function getFlag(countryCode: string, size: number = 24): JSX.Element {
    const code = countryCode?.toUpperCase() || ''
    const FlagComponent = flagComponents[code] || FlagGlobe
    return <FlagComponent size={size} />
}

// Common country names
const countryNames: Record<string, string> = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'UK': 'United Kingdom',
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
