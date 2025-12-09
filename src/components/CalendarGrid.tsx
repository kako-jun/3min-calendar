import { forwardRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useCalendarStore } from '../lib/store'
import { getCalendarDays, getWeekdayHeaders, getYearMonthParams } from '../lib/calendar'
import { isHoliday, getHolidayName } from '../lib/holidays'
import { getRokuyoName } from '../lib/rokuyo'
import { getWarekiYear } from '../lib/wareki'
import { THEMES, QUICK_INPUT_STYLES } from '../lib/types'
import { STAMP_ICONS } from './ui/StampIcons'

/** 予定コメントのフォントサイズ */
const TEXT_FONT_SIZE = '10px'

/** スタンプのフォントサイズ */
const STAMP_FONT_SIZE = '8px'

/** 時刻のフォントサイズ */
const TIME_FONT_SIZE = '9px'

/** スタンプキーからスタイルを取得 */
function getStampStyle(stampKey: string | null | undefined) {
  if (!stampKey) return null
  return QUICK_INPUT_STYLES.find((s) => s.key === stampKey) ?? null
}

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
  const calendarComments = useCalendarStore((state) => state.calendarComments)
  const selectedDate = useCalendarStore((state) => state.selectedDate)
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate)

  const calendarThemes = useCalendarStore((state) => state.calendarThemes)

  const days = getCalendarDays(view.year, view.month, settings.weekStartsOn)
  const weekdays = getWeekdayHeaders(settings.weekStartsOn)
  const yearMonthParams = getYearMonthParams(view.year, view.month)
  const isLinedStyle = settings.gridStyle === 'lined'
  const rowCount = Math.ceil(days.length / 7) // 5行または6行

  // 月ごとのカレンダーテーマ（未設定の場合はsettingsのデフォルトを使用）
  const monthKey = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
  const calendarThemeId = calendarThemes[monthKey] ?? settings.calendarTheme
  const theme = THEMES[calendarThemeId]

  // 罫線モード用の罫線色（テーマに合わせて調整）
  const lineColor = useMemo(() => {
    // textMutedの色を少し透明にして罫線に使用
    return `${theme.textMuted}60`
  }, [theme.textMuted])

  // 月のコメント（propsがあればpropsを使用、なければストアから取得）
  const commentKey = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
  const storedComment = calendarComments[commentKey] ?? ''
  const comment = propComment !== undefined ? propComment : storedComment

  const getEntry = (date: string) => {
    return entries.find((e) => e.date === date)
  }

  return (
    <div
      ref={ref}
      data-calendar-grid
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        aspectRatio: '1 / 1',
        width: '100%',
        maxWidth: '500px',
        overflow: 'hidden',
        borderRadius: '8px',
        padding: '12px',
        backgroundColor: theme.surface,
        boxSizing: 'border-box',
      }}
    >
      {/* 背景画像 */}
      {settings.backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            backgroundImage: `url(${settings.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: settings.backgroundOpacity,
          }}
        />
      )}

      {/* ヘッダー：店名（左）と年月（右） */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          marginBottom: '4px',
          color: theme.text,
        }}
      >
        {/* 店名（ロゴと文字） */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {settings.shopLogo && (
            <img
              src={settings.shopLogo}
              alt="Shop logo"
              style={{
                height: '20px',
                width: '20px',
                objectFit: 'contain',
              }}
            />
          )}
          {settings.shopName && <span>{settings.shopName}</span>}
        </div>

        {/* 年月 */}
        <div style={{ fontWeight: 700 }}>
          <span style={{ fontSize: '16px', opacity: 0.6 }}>
            {settings.useWareki
              ? getWarekiYear(new Date(view.year, view.month, 1))
              : yearMonthParams.year}
            {t('calendar.yearSuffix')}
          </span>
          <span style={{ marginLeft: '4px', fontSize: '24px' }}>{yearMonthParams.month}</span>
          <span style={{ fontSize: '16px' }}>{t('calendar.monthSuffix')}</span>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          flexShrink: 0,
          marginBottom: isLinedStyle ? 0 : '4px',
          gap: isLinedStyle ? 0 : '4px',
          ...(isLinedStyle
            ? {
                border: `1px solid ${lineColor}`,
                borderBottom: `1px solid ${lineColor}`,
              }
            : {}),
        }}
      >
        {weekdays.map((day, index) => (
          <div
            key={day.dayOfWeek}
            style={{
              padding: '4px 0',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 600,
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

      {/* 日付グリッド（5行または6行 x 7列） */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: `repeat(${rowCount}, 1fr)`,
            height: '100%',
            overflow: 'hidden',
            gap: isLinedStyle ? 0 : '4px',
            ...(isLinedStyle
              ? {
                  border: `1px solid ${lineColor}`,
                  borderTop: 'none',
                }
              : {}),
          }}
        >
          {days.map((day, index) => {
            const dayOfWeek = day.date.getDay()
            const isSunday = dayOfWeek === 0
            const isSaturday = dayOfWeek === 6
            const entry = getEntry(day.dateString)
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

            // 罫線モード用のセルスタイル
            const col = index % 7
            const row = Math.floor(index / 7)
            const linedCellStyle = isLinedStyle
              ? {
                  borderRight: col < 6 ? `1px solid ${lineColor}` : 'none',
                  borderBottom: row < rowCount - 1 ? `1px solid ${lineColor}` : 'none',
                  backgroundColor: day.isCurrentMonth ? 'transparent' : `${theme.bg}40`,
                }
              : {
                  backgroundColor: day.isCurrentMonth ? theme.bg : `${theme.bg}80`,
                }

            // エントリから値を取得
            const stampStyle = getStampStyle(entry?.stamp)
            const timeFrom = entry?.timeFrom ?? ''
            const timeTo = entry?.timeTo ?? ''
            // 片方だけ入力の場合もハイフンを表示（「10:00-」=10:00から、「-12:00」=12:00まで）
            const time = timeFrom || timeTo ? `${timeFrom}-${timeTo}` : ''
            const freeText = entry?.text ?? ''

            return (
              <div
                key={day.dateString}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '2px',
                  borderRadius: isLinedStyle ? 0 : '4px',
                  cursor: day.isCurrentMonth ? 'pointer' : 'default',
                  height: '100%',
                  maxHeight: '100%',
                  boxSizing: 'border-box',
                  ...linedCellStyle,
                }}
                title={holidayName || undefined}
                onClick={() => day.isCurrentMonth && setSelectedDate(day.dateString)}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                  }}
                >
                  {/* 1行目: スタンプ（左上）と日付（右上） */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexShrink: 0,
                    }}
                  >
                    {/* スタンプ（左上固定） */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: '2px',
                      }}
                    >
                      {stampStyle && (
                        <span
                          style={{
                            display: 'inline-flex',
                            flexShrink: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2px 4px',
                            fontWeight: 700,
                            backgroundColor: stampStyle.bgColor,
                            color: stampStyle.textColor,
                            fontSize: STAMP_FONT_SIZE,
                            lineHeight: '1.2',
                            borderRadius: '2px',
                          }}
                        >
                          {(() => {
                            const IconComponent = STAMP_ICONS[stampStyle.key]
                            return IconComponent ? (
                              <IconComponent size={10} />
                            ) : (
                              t(`quickInput.${stampStyle.key}`)
                            )
                          })()}
                        </span>
                      )}
                    </div>
                    {/* 六曜と日付（右上固定） */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexShrink: 0,
                        alignItems: 'baseline',
                        gap: '4px',
                      }}
                    >
                      {settings.showRokuyo && day.isCurrentMonth && (
                        <div
                          style={{
                            fontSize: '6px',
                            lineHeight: 1,
                            color: getDayColor(),
                          }}
                        >
                          {getRokuyoName(day.date)}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          lineHeight: 1,
                          color: getDayColor(),
                        }}
                      >
                        {day.day}
                      </div>
                    </div>
                  </div>
                  {/* 2行目: 時刻 */}
                  {time && (
                    <div
                      style={{
                        marginTop: '4px',
                        flexShrink: 0,
                        fontWeight: 700,
                        color: theme.textMuted,
                        fontSize: TIME_FONT_SIZE,
                        lineHeight: '1.2',
                      }}
                    >
                      {time}
                    </div>
                  )}
                  {/* 3行目以降: 予定コメント */}
                  {freeText && (
                    <div
                      style={{
                        marginTop: '4px',
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                        fontWeight: 700,
                        color: theme.text,
                        wordBreak: 'break-all',
                        lineHeight: '1.2',
                        fontSize: TEXT_FONT_SIZE,
                      }}
                    >
                      {freeText}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 選択枠（グリッドの外側に配置してアニメーション） */}
        {(() => {
          const selectedIndex = days.findIndex((d) => d.dateString === selectedDate)
          if (selectedIndex === -1) return null
          const col = selectedIndex % 7
          const row = Math.floor(selectedIndex / 7)
          const gap = isLinedStyle ? 0 : 4 // gap-1 = 0.25rem = 4px
          const cellWidthPercent = 100 / 7
          const cellHeightPercent = 100 / rowCount
          return (
            <motion.div
              layoutId="calendar-selection"
              data-selection-frame
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                borderRadius: isLinedStyle ? 0 : '4px',
                left: `calc(${col * cellWidthPercent}% + ${(col * gap) / 7}px)`,
                top: `calc(${row * cellHeightPercent}% + ${(row * gap) / rowCount}px)`,
                width: `calc(${cellWidthPercent}% - ${((7 - 1) * gap) / 7}px)`,
                height: `calc(${cellHeightPercent}% - ${((rowCount - 1) * gap) / rowCount}px)`,
                boxShadow: `inset 0 0 0 2px ${theme.accent}`,
                zIndex: 10,
              }}
              transition={{
                type: 'tween',
                duration: 0.15,
                ease: 'easeOut',
              }}
            />
          )
        })()}
      </div>

      {/* コメント表示（右下）- コメントがある場合のみ表示 */}
      {comment && (
        <div
          style={{
            position: 'relative',
            marginTop: '4px',
            flexShrink: 0,
            overflow: 'hidden',
            textAlign: 'right',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: theme.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {comment}
          </div>
        </div>
      )}
    </div>
  )
})
