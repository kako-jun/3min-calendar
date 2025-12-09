import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faReply } from '@fortawesome/free-solid-svg-icons'
import { useCalendarStore } from '../lib/store'
import { getYearMonthParams } from '../lib/calendar'
import { APP_THEMES } from '../lib/types'
import { AppHeader } from './AppHeader'
import { MonthSelector } from './MonthSelector'
import { CalendarGridCanvas, type CalendarGridCanvasHandle } from './CalendarGridCanvas'
import { CalendarThemeSelector } from './CalendarThemeSelector'
import { DayEditor } from './DayEditor'
import { ActionButtons } from './ActionButtons'
import { SettingsPanel } from './SettingsPanel'

export function Calendar() {
  const { t } = useTranslation()
  const view = useCalendarStore((state) => state.view)
  const settings = useCalendarStore((state) => state.settings)
  const copyFromPreviousMonth = useCalendarStore((state) => state.copyFromPreviousMonth)
  const getCalendarComment = useCalendarStore((state) => state.getCalendarComment)
  const updateCalendarComment = useCalendarStore((state) => state.updateCalendarComment)
  const appTheme = APP_THEMES[settings.appTheme]
  const calendarRef = useRef<CalendarGridCanvasHandle>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [comment, setComment] = useState('')
  const [isWideScreen, setIsWideScreen] = useState(false)

  // 画面幅を監視（lg: 1024px以上）
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    setIsWideScreen(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setIsWideScreen(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // 月が変わったらコメントを読み込む
  useEffect(() => {
    setComment(getCalendarComment(view.year, view.month))
  }, [view.year, view.month, getCalendarComment])

  const handleCopyFromPrev = async () => {
    if (isCopying) return
    setIsCopying(true)
    await copyFromPreviousMonth()
    setIsCopying(false)
  }

  const yearMonthParams = getYearMonthParams(view.year, view.month)
  const monthNames = t('calendar.monthNames', { returnObjects: true }) as string[] | string
  const monthName = Array.isArray(monthNames) ? monthNames[view.month] : String(view.month + 1)
  const title = t('calendar.yearMonth', { ...yearMonthParams, monthName })
  const filename = `calendar-${view.year}-${String(view.month + 1).padStart(2, '0')}`

  return (
    <div className="mx-auto max-w-6xl px-2">
      {/* アプリヘッダー + 月セレクター */}
      <div className="flex items-center justify-between">
        <AppHeader />
        <MonthSelector title={title} />
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1 text-base transition-opacity hover:opacity-60"
          style={{ color: appTheme.textMuted }}
        >
          <FontAwesomeIcon icon={faGear} />
        </button>
      </div>

      {/* レスポンシブ: モバイルは縦並び、デスクトップは横並び */}
      <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-start">
        {/* カレンダーグリッド + コントロール（テーマ＆アクション） */}
        <div className="flex flex-col items-center gap-2 lg:w-1/2">
          <CalendarGridCanvas ref={calendarRef} comment={comment} />
          <div className="flex items-center gap-3">
            <CalendarThemeSelector />
            <button
              onClick={handleCopyFromPrev}
              disabled={isCopying}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
            >
              <FontAwesomeIcon icon={faReply} />
              <span>{t('actions.copyFromPrevShort')}</span>
            </button>
            <ActionButtons calendarRef={calendarRef} filename={filename} />
          </div>
        </div>
        {/* 日ごとの編集領域 */}
        <div className="lg:w-1/2">
          <DayEditor showAllDays={isWideScreen} />
          {/* コメント入力欄 */}
          <div className="mt-2">
            <input
              id="calendar-comment-input"
              type="text"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                updateCalendarComment(view.year, view.month, e.target.value)
              }}
              placeholder={t('calendar.commentPlaceholder')}
              className="w-full rounded border px-2 py-1 text-sm focus:outline-none"
              style={{
                backgroundColor: appTheme.surface,
                borderColor: appTheme.textMuted,
                color: appTheme.text,
              }}
            />
          </div>
        </div>
      </div>

      {/* 設定パネル */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
