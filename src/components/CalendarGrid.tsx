import { forwardRef, useRef, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '../lib/store'
import { getCalendarDays, getWeekdayHeaders, getYearMonthParams } from '../lib/calendar'
import { isHoliday, getHolidayName } from '../lib/holidays'
import { THEMES, parseStampedText } from '../lib/types'

/** テキスト長に応じたフォントサイズを返す（セル内で収まるように自動縮小） */
function getTextFontSize(text: string): string {
  const len = text.length
  if (len <= 4) return '9px'
  if (len <= 6) return '8px'
  if (len <= 9) return '7px'
  if (len <= 12) return '6px'
  return '5px'
}

/** テキスト長に応じたスケールを返す（非常に長いテキスト用） */
function getTextScale(text: string): number {
  const len = text.length
  if (len <= 12) return 1
  if (len <= 16) return 0.9
  return 0.8
}

export const CalendarGrid = forwardRef<HTMLDivElement>(function CalendarGrid(_, ref) {
  const { t } = useTranslation()
  const view = useCalendarStore((state) => state.view)
  const settings = useCalendarStore((state) => state.settings)
  const entries = useCalendarStore((state) => state.entries)
  const selectedDate = useCalendarStore((state) => state.selectedDate)
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate)

  const days = getCalendarDays(view.year, view.month, settings.weekStartsOn)
  const weekdays = getWeekdayHeaders(settings.weekStartsOn)
  const yearMonthParams = getYearMonthParams(view.year, view.month)
  const isLinedStyle = settings.gridStyle === 'lined'

  // カレンダー画像用のテーマ
  const theme = THEMES[settings.calendarTheme]

  // 罫線モード用の罫線色（テーマに合わせて調整）
  const lineColor = useMemo(() => {
    // textMutedの色を少し透明にして罫線に使用
    return `${theme.textMuted}60`
  }, [theme.textMuted])

  // 月のコメント（settingsから直接取得して再レンダリングを確実にする）
  const commentKey = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
  const comment = settings.calendarComments?.[commentKey] ?? ''
  const commentRef = useRef<HTMLDivElement>(null)
  const [commentScale, setCommentScale] = useState(1)

  // コメントがオーバーフローする場合は縮小
  useEffect(() => {
    if (!commentRef.current || !comment) {
      setCommentScale(1)
      return
    }
    const container = commentRef.current.parentElement
    if (!container) return
    const containerWidth = container.clientWidth
    const textWidth = commentRef.current.scrollWidth
    if (textWidth > containerWidth) {
      setCommentScale(containerWidth / textWidth)
    } else {
      setCommentScale(1)
    }
  }, [comment])

  const getEntryText = (date: string) => {
    const entry = entries.find((e) => e.date === date)
    return entry?.text ?? ''
  }

  return (
    <div
      ref={ref}
      className="relative aspect-square w-full max-w-[500px] overflow-hidden rounded-lg p-3"
      style={{ backgroundColor: theme.surface }}
    >
      {/* 背景画像 */}
      {settings.backgroundImage && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${settings.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: settings.backgroundOpacity,
          }}
        />
      )}

      {/* ヘッダー：店名（左）と年月（右） */}
      <div
        className="relative mb-2 flex items-center justify-between"
        style={{ color: theme.text }}
      >
        {/* 店名（ロゴと文字） */}
        <div className="flex items-center gap-1 text-sm font-medium">
          {settings.shopLogo && (
            <img src={settings.shopLogo} alt="Shop logo" className="h-5 w-5 object-contain" />
          )}
          {settings.shopName && <span>{settings.shopName}</span>}
        </div>

        {/* 年月 */}
        <div className="text-lg font-bold">{t('calendar.yearMonth', yearMonthParams)}</div>
      </div>

      {/* 曜日ヘッダー */}
      <div
        className={`relative grid grid-cols-7 ${isLinedStyle ? 'mb-0' : 'mb-1 gap-1'}`}
        style={
          isLinedStyle
            ? {
                borderBottom: `1px solid ${lineColor}`,
              }
            : undefined
        }
      >
        {weekdays.map((day, index) => (
          <div
            key={day.dayOfWeek}
            className="py-1 text-center text-xs font-semibold"
            style={{
              color:
                day.dayOfWeek === 0
                  ? theme.sunday
                  : day.dayOfWeek === 6
                    ? theme.saturday
                    : theme.textMuted,
              ...(isLinedStyle && index < 6 ? { borderRight: `1px solid ${lineColor}` } : {}),
            }}
          >
            {t(day.labelKey)}
          </div>
        ))}
      </div>

      {/* 日付グリッド（6行7列、正方形セル） */}
      <div
        className={`relative grid flex-1 grid-cols-7 grid-rows-6 ${isLinedStyle ? 'gap-0' : 'gap-1'}`}
        style={
          isLinedStyle
            ? {
                border: `1px solid ${lineColor}`,
                borderTop: 'none',
              }
            : undefined
        }
      >
        {days.map((day, index) => {
          const dayOfWeek = day.date.getDay()
          const isSunday = dayOfWeek === 0
          const isSaturday = dayOfWeek === 6
          const text = getEntryText(day.dateString)
          const holidayInfo =
            settings.showHolidays && day.isCurrentMonth ? isHoliday(day.date) : false
          const holidayName = holidayInfo ? getHolidayName(day.date) : null

          // 日付の色を決定
          const getDayColor = () => {
            if (!day.isCurrentMonth) return theme.textMuted
            if (holidayInfo || isSunday) return theme.sunday
            if (isSaturday) return theme.saturday
            return theme.text
          }

          const isSelected = selectedDate === day.dateString

          // 罫線モード用のセルスタイル
          const col = index % 7
          const row = Math.floor(index / 7)
          const linedCellStyle = isLinedStyle
            ? {
                borderRight: col < 6 ? `1px solid ${lineColor}` : 'none',
                borderBottom: row < 5 ? `1px solid ${lineColor}` : 'none',
                backgroundColor: day.isCurrentMonth ? 'transparent' : `${theme.bg}40`,
              }
            : {
                backgroundColor: day.isCurrentMonth ? theme.bg : `${theme.bg}80`,
              }

          return (
            <div
              key={day.dateString}
              className={`aspect-square p-0.5 ${isLinedStyle ? '' : 'rounded'} ${isSelected ? 'ring-2 ring-inset' : ''} ${day.isCurrentMonth ? 'cursor-pointer' : ''} ${isLinedStyle && day.isCurrentMonth ? 'transition-colors hover:bg-black/5' : ''}`}
              style={{
                ...linedCellStyle,
                // @ts-expect-error ringColor is a valid Tailwind CSS-in-JS property
                '--tw-ring-color': isSelected ? theme.accent : undefined,
              }}
              title={holidayName || undefined}
              onClick={() => day.isCurrentMonth && setSelectedDate(day.dateString)}
            >
              <div
                className={`text-right text-[11px] leading-tight ${day.isToday ? 'font-bold' : ''}`}
                style={{ color: getDayColor() }}
              >
                {day.day}
              </div>
              {text &&
                (() => {
                  const segments = parseStampedText(text, t)
                  const hasStamps = segments.some((s) => s.type === 'stamp')

                  if (hasStamps) {
                    // スタンプを含む場合：スタンプは固定サイズ、テキストは通常表示
                    return (
                      <div className="mt-0.5 flex flex-wrap items-center gap-0.5">
                        {segments.map((segment, i) =>
                          segment.type === 'stamp' ? (
                            <span
                              key={i}
                              className="inline-block shrink-0 rounded px-1 text-[9px] font-bold"
                              style={{
                                backgroundColor: segment.style.bgColor,
                                color: segment.style.textColor,
                                lineHeight: '1.4',
                              }}
                            >
                              {segment.text}
                            </span>
                          ) : (
                            <span
                              key={i}
                              className="font-bold"
                              style={{
                                color: theme.text,
                                lineHeight: '1.2',
                                fontSize: getTextFontSize(segment.text),
                              }}
                            >
                              {segment.text}
                            </span>
                          )
                        )}
                      </div>
                    )
                  } else {
                    // スタンプなし：通常テキスト（長さに応じて自動縮小）
                    const fontSize = getTextFontSize(text)
                    const scale = getTextScale(text)
                    return (
                      <div
                        className="mt-0.5 overflow-hidden font-bold"
                        style={{
                          color: theme.text,
                          wordBreak: 'break-all',
                          lineHeight: '1.2',
                          fontSize,
                          transform: scale < 1 ? `scale(${scale})` : undefined,
                          transformOrigin: 'top left',
                        }}
                        title={text}
                      >
                        {text}
                      </div>
                    )
                  }
                })()}
            </div>
          )
        })}
      </div>

      {/* コメント表示（右下）- 常に表示してクリック可能に */}
      <div
        className="relative mt-1 flex cursor-pointer justify-end overflow-hidden"
        onClick={() => document.getElementById('calendar-comment-input')?.focus()}
        style={{ minHeight: '1.25rem' }}
      >
        <div
          ref={commentRef}
          className="whitespace-nowrap text-xs"
          style={{
            color: comment ? theme.text : theme.textMuted,
            transformOrigin: 'right center',
            transform: `scaleX(${commentScale})`,
          }}
        >
          {comment || t('calendar.commentPlaceholder')}
        </div>
      </div>
    </div>
  )
})
