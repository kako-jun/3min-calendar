import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useCalendarStore } from './lib/store'
import { APP_THEMES } from './lib/types'
import { Calendar } from './components/Calendar'
import { QRPage } from './components/QRPage'

function App() {
  const initialize = useCalendarStore((state) => state.initialize)
  const settings = useCalendarStore((state) => state.settings)
  const initialized = useCalendarStore((state) => state.initialized)

  useEffect(() => {
    initialize()
  }, [initialize])

  const appTheme = APP_THEMES[settings.appTheme]

  if (!initialized) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ backgroundColor: appTheme.bg }}
      >
        <div style={{ color: appTheme.text }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-full pb-8" style={{ backgroundColor: appTheme.bg, color: appTheme.text }}>
      <Routes>
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/qr" element={<QRPage />} />
      </Routes>
    </div>
  )
}

export default App
