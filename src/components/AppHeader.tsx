import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '../lib/store'
import { APP_THEMES } from '../lib/types'

export function AppHeader() {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]

  return (
    <header className="py-2 text-center">
      <h1 className="text-xl font-bold" style={{ color: appTheme.text }}>
        {t('app.title')}
      </h1>
      <p className="text-xs" style={{ color: appTheme.textMuted }}>
        {t('app.tagline')}
      </p>
    </header>
  )
}
