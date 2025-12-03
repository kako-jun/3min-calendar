import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPalette, faTableCells, faSquare } from '@fortawesome/free-solid-svg-icons'
import { useCalendarStore } from '../lib/store'
import { THEMES, APP_THEMES, type CalendarThemeId, type GridStyle } from '../lib/types'

const CALENDAR_THEME_IDS: CalendarThemeId[] = ['dark', 'light', 'cafe', 'nature', 'ocean', 'sunset']

export function CalendarThemeSelector() {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const updateSettings = useCalendarStore((state) => state.updateSettings)
  const appTheme = APP_THEMES[settings.appTheme]
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleThemeChange = (theme: CalendarThemeId) => {
    updateSettings({ calendarTheme: theme })
    // クリックしても閉じない（次々とプレビューできる）
  }

  const handleGridStyleChange = (style: GridStyle) => {
    updateSettings({ gridStyle: style })
  }

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const currentTheme = THEMES[settings.calendarTheme]

  return (
    <div className="relative" ref={containerRef}>
      {/* テーマ選択トグルボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-opacity hover:opacity-80"
        style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
        title={t('settings.calendarTheme')}
      >
        <FontAwesomeIcon icon={faPalette} />
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: currentTheme.bg }} />
      </button>

      {/* テーマ選択ポップアップ */}
      {isOpen && (
        <div
          className="absolute left-1/2 z-10 mt-1 -translate-x-1/2 rounded-lg p-2 shadow-lg"
          style={{ backgroundColor: appTheme.surface }}
        >
          {/* テーマカラー選択 */}
          <div className="flex gap-1">
            {CALENDAR_THEME_IDS.map((themeId) => {
              const theme = THEMES[themeId]
              const isSelected = settings.calendarTheme === themeId

              return (
                <button
                  key={themeId}
                  onClick={() => handleThemeChange(themeId)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                    isSelected ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: theme.bg,
                    // @ts-expect-error CSS custom property for Tailwind ring color
                    '--tw-ring-color': isSelected ? appTheme.accent : undefined,
                  }}
                  title={t(`calendarThemes.${themeId}`)}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: theme.surface }}
                  />
                </button>
              )
            })}
          </div>

          {/* 区切り線 */}
          <div className="my-2 border-t" style={{ borderColor: `${appTheme.textMuted}40` }} />

          {/* グリッドスタイル選択 */}
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => handleGridStyleChange('rounded')}
              className={`flex h-7 w-7 items-center justify-center rounded transition-all ${
                settings.gridStyle === 'rounded'
                  ? 'ring-2 ring-offset-1'
                  : 'opacity-50 hover:opacity-100'
              }`}
              style={{
                backgroundColor: appTheme.bg,
                color: appTheme.text,
                // @ts-expect-error CSS custom property for Tailwind ring color
                '--tw-ring-color': settings.gridStyle === 'rounded' ? appTheme.accent : undefined,
              }}
              title={t('gridStyles.rounded')}
            >
              <FontAwesomeIcon icon={faSquare} className="text-xs" />
            </button>
            <button
              onClick={() => handleGridStyleChange('lined')}
              className={`flex h-7 w-7 items-center justify-center rounded transition-all ${
                settings.gridStyle === 'lined'
                  ? 'ring-2 ring-offset-1'
                  : 'opacity-50 hover:opacity-100'
              }`}
              style={{
                backgroundColor: appTheme.bg,
                color: appTheme.text,
                // @ts-expect-error CSS custom property for Tailwind ring color
                '--tw-ring-color': settings.gridStyle === 'lined' ? appTheme.accent : undefined,
              }}
              title={t('gridStyles.lined')}
            >
              <FontAwesomeIcon icon={faTableCells} className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
