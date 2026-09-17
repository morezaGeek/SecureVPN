import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/theme.css'
import { setupTauriBridge } from './utils/tauri-bridge'

setupTauriBridge()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
)
