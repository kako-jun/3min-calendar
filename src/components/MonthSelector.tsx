import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '../lib/store'
import { APP_THEMES } from '../lib/types'

interface MonthSelectorProps {
  title: string
}

export function MonthSelector({ title }: MonthSelectorProps) {
  const { t } = useTranslation()
  const goToPrevMonth = useCalendarStore((state) => state.goToPrevMonth)
  const goToNextMonth = useCalendarStore((state) => state.goToNextMonth)
  const goToToday = useCalendarStore((state) => state.goToToday)
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={goToPrevMonth}
        className="rounded px-4 py-2 text-2xl transition-opacity hover:opacity-70"
        style={{ color: appTheme.text }}
        aria-label="前月"
      >
        ◀
      </button>

      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold" style={{ color: appTheme.text }}>
          {title}
        </h1>
        <button
          onClick={goToToday}
          className="rounded px-3 py-1 text-sm transition-opacity hover:opacity-80"
          style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
        >
          {t('calendar.today')}
        </button>
      </div>

      <button
        onClick={goToNextMonth}
        className="rounded px-4 py-2 text-2xl transition-opacity hover:opacity-70"
        style={{ color: appTheme.text }}
        aria-label="翌月"
      >
        ▶
      </button>
    </div>
  )
}
