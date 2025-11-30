import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '../lib/store'
import { THEMES, APP_THEMES, type CalendarThemeId } from '../lib/types'

const CALENDAR_THEME_IDS: CalendarThemeId[] = ['dark', 'light', 'cafe', 'nature', 'ocean', 'sunset']

export function CalendarThemeSelector() {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const updateSettings = useCalendarStore((state) => state.updateSettings)
  const appTheme = APP_THEMES[settings.appTheme]

  const handleThemeChange = (theme: CalendarThemeId) => {
    updateSettings({ calendarTheme: theme })
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {CALENDAR_THEME_IDS.map((themeId) => {
        const theme = THEMES[themeId]
        const isSelected = settings.calendarTheme === themeId

        return (
          <button
            key={themeId}
            onClick={() => handleThemeChange(themeId)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all ${
              isSelected ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: theme.surface,
              color: theme.text,
              // @ts-expect-error CSS custom property for Tailwind ring color
              '--tw-ring-color': isSelected ? appTheme.accent : undefined,
            }}
            title={t(`calendarThemes.${themeId}`)}
          >
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.bg }} />
            <span>{t(`calendarThemes.${themeId}`)}</span>
          </button>
        )
      })}
    </div>
  )
}
