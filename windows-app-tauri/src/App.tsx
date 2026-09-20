import { useState, useEffect } from 'react'
import { VpnProvider } from './context/VpnContext'
import { ThemeProvider } from './context/ThemeContext'
import HomeScreen from './screens/HomeScreen'
import ProfilesScreen from './screens/ProfilesScreen'
import SettingsScreen from './screens/SettingsScreen'
import LogsScreen from './screens/LogsScreen'
import { Home, User, Settings, FileText, Minus, Square, X, Shield, Github } from 'lucide-react'
import packageJson from '../package.json'

type Screen = 'home' | 'profiles' | 'settings' | 'logs'

function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('home')

    useEffect(() => {
        window.dispatchEvent(new Event('app-ready'))
    }, [])

    const handleMinimize = () => window.electronAPI?.minimize()
    const handleMaximize = () => window.electronAPI?.maximize()
    const handleClose = () => window.electronAPI?.close()



    return (
        <ThemeProvider>
            <VpnProvider>
                <div className="app-container">
                    {/* Title Bar */}
                    <div className="title-bar" data-tauri-drag-region>
                        <Shield className="title-bar-icon" size={16} />
                        <span className="title-bar-title" data-tauri-drag-region>Secure VPN</span>
                        <div className="title-bar-buttons">
                            <button className="title-bar-button" onClick={handleMinimize} title="Minimize">
                                <Minus size={16} />
                            </button>
                            <button className="title-bar-button" onClick={handleMaximize} title="Maximize">
                                <Square size={14} />
                            </button>
                            <button className="title-bar-button close" onClick={handleClose} title="Close">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Main Layout */}
                    <div className="main-layout">
                        {/* Sidebar */}
                        <nav className="sidebar">
                            <div className="sidebar-nav">
                                <button
                                    className={`nav-item ${currentScreen === 'home' ? 'active' : ''}`}
                                    onClick={() => setCurrentScreen('home')}
                                >
                                    <Home size={20} />
                                    <span>Connection</span>
                                </button>
                                <button
                                    className={`nav-item ${currentScreen === 'profiles' ? 'active' : ''}`}
                                    onClick={() => setCurrentScreen('profiles')}
                                >
                                    <User size={20} />
                                    <span>Profiles</span>
                                </button>
                                <button
                                    className={`nav-item ${currentScreen === 'settings' ? 'active' : ''}`}
                                    onClick={() => setCurrentScreen('settings')}
                                >
                                    <Settings size={20} />
                                    <span>Settings</span>
                                </button>
                                <button
                                    className={`nav-item ${currentScreen === 'logs' ? 'active' : ''}`}
                                    onClick={() => setCurrentScreen('logs')}
                                >
                                    <FileText size={20} />
                                    <span>Logs</span>
                                </button>
                            </div>

                            <div className="sidebar-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                                <span className="version-text" style={{ fontSize: '0.8rem' }}>
                                    v{packageJson.version}
                                </span>
                                <button
                                    onClick={() => window.electronAPI?.openExternal?.('https://github.com/morezaGeek/SecureVPN/releases')}
                                    title="GitHub Releases & Updates"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.78rem',
                                        cursor: 'pointer',
                                        padding: '3px 6px',
                                        borderRadius: '4px',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.color = 'var(--primary)'
                                        e.currentTarget.style.background = 'var(--surface-light)'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.color = 'var(--text-secondary)'
                                        e.currentTarget.style.background = 'transparent'
                                    }}
                                >
                                    <Github size={13} />
                                    <span>Releases</span>
                                </button>
                            </div>
                        </nav>

                        {/* Content */}
                        <main className="main-content">
                            {currentScreen === 'home' && <HomeScreen />}
                            {currentScreen === 'profiles' && <ProfilesScreen />}
                            {currentScreen === 'settings' && <SettingsScreen />}
                            {currentScreen === 'logs' && <LogsScreen />}
                        </main>
                    </div>
                </div>
            </VpnProvider>
        </ThemeProvider>
    )
}

export default App
