import { useEffect } from 'react'
import { useCalendarStore } from './lib/store'
import { THEMES } from './lib/types'
import { Calendar } from './components/Calendar'

function App() {
  const initialize = useCalendarStore((state) => state.initialize)
  const settings = useCalendarStore((state) => state.settings)
  const initialized = useCalendarStore((state) => state.initialized)

  useEffect(() => {
    initialize()
  }, [initialize])

  const theme = THEMES[settings.theme]

  if (!initialized) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <div style={{ color: theme.text }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <Calendar />
    </div>
  )
}

export default App
