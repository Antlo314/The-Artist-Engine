import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from './App'
import { ThemeProvider } from './lib/theme'
import './index.css'

// Apply saved theme before first paint to avoid flash
try {
    const t = localStorage.getItem('engine_theme')
    if (t === 'light' || t === 'dark') {
        document.documentElement.setAttribute('data-theme', t)
        document.documentElement.style.colorScheme = t
    } else {
        document.documentElement.setAttribute('data-theme', 'dark')
    }
} catch {
    document.documentElement.setAttribute('data-theme', 'dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider>
            <App />
            <Analytics />
            <SpeedInsights />
        </ThemeProvider>
    </React.StrictMode>,
)
