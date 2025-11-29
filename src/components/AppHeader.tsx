import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '../lib/store'
import { THEMES } from '../lib/types'

export function AppHeader() {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const theme = THEMES[settings.theme]

  return (
    <header className="py-2 text-center">
      <h1 className="text-xl font-bold" style={{ color: theme.text }}>
        {t('app.title')}
      </h1>
      <p className="text-xs" style={{ color: theme.textMuted }}>
        {t('app.tagline')}
      </p>
    </header>
  )
}
