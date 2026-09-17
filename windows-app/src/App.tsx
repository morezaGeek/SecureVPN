import { useState } from 'react'
import { VpnProvider } from './context/VpnContext'
import { ThemeProvider } from './context/ThemeContext'
import HomeScreen from './screens/HomeScreen'
import ProfilesScreen from './screens/ProfilesScreen'
import SettingsScreen from './screens/SettingsScreen'
import LogsScreen from './screens/LogsScreen'
import { Home, User, Settings, FileText, Minus, Square, X, Shield } from 'lucide-react'
import packageJson from '../package.json'

type Screen = 'home' | 'profiles' | 'settings' | 'logs'

function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('home')

    const handleMinimize = () => window.electronAPI?.minimize()
    const handleMaximize = () => window.electronAPI?.maximize()
    const handleClose = () => window.electronAPI?.close()



    return (
        <ThemeProvider>
            <VpnProvider>
                <div className="app-container">
                    {/* Title Bar */}
                    <div className="title-bar">
                        <Shield className="title-bar-icon" size={16} />
                        <span className="title-bar-title">Secure VPN</span>
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

                            <div className="sidebar-footer">
                                <span className="version-text">
                                    v{packageJson.version}
                                </span>
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
