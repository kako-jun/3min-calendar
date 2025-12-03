import { forwardRef, useRef, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useCalendarStore } from '../lib/store'
import { getCalendarDays, getWeekdayHeaders, getYearMonthParams } from '../lib/calendar'
import { isHoliday, getHolidayName } from '../lib/holidays'
import { THEMES, parseStampedText } from '../lib/types'

/** テキスト長に応じたフォントサイズを返す（セル内で収まるように自動縮小、最大サイズを大きく） */
function getTextFontSize(text: string): string {
  const len = text.length
  if (len <= 2) return '14px'
  if (len <= 4) return '12px'
  if (len <= 6) return '10px'
  if (len <= 9) return '9px'
  if (len <= 12) return '8px'
  return '7px'
}

/** スタンプのフォントサイズ */
const STAMP_FONT_SIZE = '10px'

interface CalendarGridProps {
  comment?: string
}

export const CalendarGrid = forwardRef<HTMLDivElement, CalendarGridProps>(function CalendarGrid(
  { comment: propComment },
  ref
) {
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

  // 月のコメント（propsがあればpropsを使用、なければストアから取得）
  const commentKey = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
  const storedComment = settings.calendarComments?.[commentKey] ?? ''
  const comment = propComment !== undefined ? propComment : storedComment
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
                border: `1px solid ${lineColor}`,
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
              className={`relative aspect-square p-0.5 ${isLinedStyle ? '' : 'rounded'} ${day.isCurrentMonth ? 'cursor-pointer' : ''} ${isLinedStyle && day.isCurrentMonth ? 'transition-colors hover:bg-black/5' : ''}`}
              style={linedCellStyle}
              title={holidayName || undefined}
              onClick={() => day.isCurrentMonth && setSelectedDate(day.dateString)}
            >
              {/* 選択枠（アニメーション付き） */}
              {isSelected && (
                <motion.div
                  layoutId="calendar-selection"
                  className={`pointer-events-none absolute inset-0 ${isLinedStyle ? '' : 'rounded'}`}
                  style={{
                    boxShadow: `inset 0 0 0 2px ${theme.accent}`,
                  }}
                  transition={{
                    type: 'tween',
                    duration: 0.15,
                    ease: 'easeOut',
                  }}
                />
              )}
              {(() => {
                const segments = text ? parseStampedText(text, t) : []
                const stamps = segments.filter((s) => s.type === 'stamp')
                const texts = segments.filter((s) => s.type === 'text')
                const textContent = texts.map((s) => s.text).join('')

                return (
                  <>
                    {/* 上部行: スタンプ（左上）と日付（右上） */}
                    <div className="flex items-start justify-between">
                      {/* スタンプ（左上固定） */}
                      <div className="flex flex-wrap gap-0.5">
                        {stamps.map((stamp, i) => (
                          <span
                            key={i}
                            className="inline-block shrink-0 rounded px-0.5 font-bold"
                            style={{
                              backgroundColor: stamp.style.bgColor,
                              color: stamp.style.textColor,
                              fontSize: STAMP_FONT_SIZE,
                              lineHeight: '1.3',
                            }}
                          >
                            {stamp.text}
                          </span>
                        ))}
                      </div>
                      {/* 日付（右上固定） */}
                      <div
                        className={`shrink-0 text-[11px] leading-tight ${day.isToday ? 'font-bold' : ''}`}
                        style={{ color: getDayColor() }}
                      >
                        {day.day}
                      </div>
                    </div>
                    {/* 本文テキスト（下部） */}
                    {textContent && (
                      <div
                        className="mt-0.5 overflow-hidden font-bold"
                        style={{
                          color: theme.text,
                          wordBreak: 'break-all',
                          lineHeight: '1.2',
                          fontSize: getTextFontSize(textContent),
                        }}
                        title={textContent}
                      >
                        {textContent}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )
        })}
      </div>

      {/* コメント表示（左下）- 常に表示してクリック可能に */}
      <div
        className="relative mt-1 flex cursor-pointer justify-start overflow-hidden"
        onClick={() => document.getElementById('calendar-comment-input')?.focus()}
        style={{ minHeight: '1.25rem' }}
      >
        <div
          ref={commentRef}
          className="whitespace-nowrap text-xs"
          style={{
            color: comment ? theme.text : theme.textMuted,
            transformOrigin: 'left center',
            transform: `scaleX(${commentScale})`,
          }}
        >
          {comment || t('calendar.commentPlaceholder')}
        </div>
      </div>
    </div>
  )
})
