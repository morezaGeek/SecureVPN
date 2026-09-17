import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}

interface ThemeProviderProps {
    children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('app-theme')
        return (saved as Theme) || 'dark'
    })

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('app-theme', theme)
    }, [theme])

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
    }, [])

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme)
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
