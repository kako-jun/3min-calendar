import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '../lib/store'
import { getCalendarDays, getWeekdayHeaders, getYearMonthParams } from '../lib/calendar'
import { isHoliday, getHolidayName } from '../lib/holidays'
import { THEMES, parseStampedText } from '../lib/types'

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

  // カレンダー画像用のテーマ
  const theme = THEMES[settings.calendarTheme]

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
      <div className="relative mb-1 grid grid-cols-7 gap-1">
        {weekdays.map((day) => (
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
            }}
          >
            {t(day.labelKey)}
          </div>
        ))}
      </div>

      {/* 日付グリッド（6行7列、正方形セル） */}
      <div className="relative grid flex-1 grid-cols-7 grid-rows-6 gap-1">
        {days.map((day) => {
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

          return (
            <div
              key={day.dateString}
              className={`aspect-square rounded p-1 ${isSelected ? 'ring-2' : ''} ${day.isCurrentMonth ? 'cursor-pointer' : ''}`}
              style={{
                backgroundColor: day.isCurrentMonth ? theme.bg : `${theme.bg}80`,
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
                              className="text-[8px] font-bold"
                              style={{
                                color: theme.text,
                                lineHeight: '1.2',
                              }}
                            >
                              {segment.text.length > 6 ? segment.text.slice(0, 6) : segment.text}
                            </span>
                          )
                        )}
                      </div>
                    )
                  } else {
                    // スタンプなし：通常テキスト
                    return (
                      <div
                        className="mt-0.5 text-[8px] font-bold"
                        style={{
                          color: theme.text,
                          wordBreak: 'break-all',
                          lineHeight: '1.2',
                        }}
                        title={text}
                      >
                        {text.length > 8 ? text.slice(0, 8) : text}
                      </div>
                    )
                  }
                })()}
            </div>
          )
        })}
      </div>
    </div>
  )
})
