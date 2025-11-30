import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '../lib/store'
import { getYearMonthParams } from '../lib/calendar'
import { APP_THEMES } from '../lib/types'
import { AppHeader } from './AppHeader'
import { MonthSelector } from './MonthSelector'
import { CalendarGrid } from './CalendarGrid'
import { CalendarThemeSelector } from './CalendarThemeSelector'
import { DayEditor } from './DayEditor'
import { ActionButtons } from './ActionButtons'
import { SettingsPanel } from './SettingsPanel'

export function Calendar() {
  const { t } = useTranslation()
  const view = useCalendarStore((state) => state.view)
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]
  const calendarRef = useRef<HTMLDivElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const yearMonthParams = getYearMonthParams(view.year, view.month)
  const title = t('calendar.yearMonth', yearMonthParams)
  const filename = `calendar-${view.year}-${String(view.month + 1).padStart(2, '0')}`

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* アプリヘッダー */}
      <div className="flex items-start justify-between">
        <AppHeader />
        <button
          onClick={() => setSettingsOpen(true)}
          className="rounded px-3 py-1 text-sm transition-colors hover:opacity-80"
          style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
        >
          ⚙️ {t('actions.settings')}
        </button>
      </div>

      {/* 月セレクター */}
      <div className="mt-2">
        <MonthSelector title={title} />
      </div>

      {/* レスポンシブ: モバイルは縦並び、デスクトップは横並び */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* カレンダーグリッド + テーマセレクター + アクションボタン */}
        <div className="flex flex-col items-center gap-4 lg:w-1/2">
          <CalendarGrid ref={calendarRef} />
          <CalendarThemeSelector />
          <ActionButtons calendarRef={calendarRef} filename={filename} />
        </div>
        {/* 日ごとの編集領域 */}
        <div className="lg:w-1/2">
          <DayEditor />
        </div>
      </div>

      {/* 設定パネル */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
