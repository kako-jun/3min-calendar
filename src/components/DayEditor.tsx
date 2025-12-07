import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faClipboard } from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from 'framer-motion'
import { useCalendarStore } from '../lib/store'
import { format, addDays } from 'date-fns'
import { QuickInputButtons } from './QuickInputButtons'
import { EmojiPicker } from './EmojiPicker'
import { APP_THEMES, THEMES } from '../lib/types'
import type { DayEntry } from '../lib/types'
import { isHoliday } from '../lib/holidays'

/** 30分刻みの時刻オプションを生成 */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const minutes = (i % 2) * 30
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
})

/** 時刻から時間帯の色を取得 */
function getTimeColor(time: string | undefined): string {
  if (!time) return ''
  const [hourStr] = time.split(':')
  if (!hourStr) return ''
  const hour = parseInt(hourStr, 10)
  if (hour >= 5 && hour < 10) return '#f59e0b' // 朝: オレンジ
  if (hour >= 10 && hour < 12) return '#84cc16' // 午前: ライム
  if (hour >= 12 && hour < 17) return '#22c55e' // 午後: グリーン
  if (hour >= 17 && hour < 21) return '#f97316' // 夕方: ディープオレンジ
  if (hour >= 21 || hour < 5) return '#8b5cf6' // 夜/深夜: パープル
  return ''
}

/** コピー/ペースト用にエントリをシリアライズ */
function serializeEntry(entry: Partial<DayEntry>): string {
  return JSON.stringify({
    stamp: entry.stamp,
    timeFrom: entry.timeFrom,
    timeTo: entry.timeTo,
    text: entry.text,
  })
}

/** コピー/ペースト用にエントリをデシリアライズ */
function deserializeEntry(str: string): Partial<DayEntry> | null {
  try {
    const data = JSON.parse(str)
    return {
      stamp: data.stamp ?? null,
      timeFrom: data.timeFrom ?? '',
      timeTo: data.timeTo ?? '',
      text: data.text ?? '',
    }
  } catch {
    // JSONでない場合は従来のテキストとして扱う
    return { text: str }
  }
}

interface DayRowProps {
  date: Date
  entry: DayEntry | undefined
  isSelected: boolean
  onUpdate: (date: string, updates: Partial<Omit<DayEntry, 'date'>>) => void
  onCopy: (entry: Partial<DayEntry>) => void
  onPaste: (date: string) => void
  onSelect: (date: string) => void
}

function DayRow({ date, entry, isSelected, onUpdate, onCopy, onPaste, onSelect }: DayRowProps) {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]
  const calendarTheme = THEMES[settings.calendarTheme]
  const dayOfWeek = date.getDay()
  const isSunday = dayOfWeek === 0
  const isSaturday = dayOfWeek === 6
  const dateString = format(date, 'yyyy-MM-dd')
  const dayNumber = date.getDate()
  const holiday = settings.showHolidays && isHoliday(date)

  // 曜日名（言語対応）
  const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const weekdayName = t(`weekdays.${weekdayKeys[dayOfWeek]}`)

  // エントリから値を取得
  const stamp = entry?.stamp ?? null
  const timeFrom = entry?.timeFrom ?? ''
  const timeTo = entry?.timeTo ?? ''
  const freeText = entry?.text ?? ''

  // IME入力中フラグ（Android日本語入力対応）
  const isComposingRef = useRef(false)
  const [localFreeText, setLocalFreeText] = useState(freeText)

  // 親からのtext変更を反映（IME入力中でなければ）
  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalFreeText(freeText)
    }
  }, [freeText])

  // 入力欄やボタンにフォーカス/クリックしたらこの日を選択
  const handleFocus = () => onSelect(dateString)

  // スタンプ変更ハンドラ
  const handleStampChange = (stampKey: string | null) => {
    handleFocus()
    onUpdate(dateString, { stamp: stampKey })
  }

  // 時刻変更ハンドラ
  const handleTimeChange = (type: 'from' | 'to', value: string) => {
    handleFocus()
    if (type === 'from') {
      onUpdate(dateString, { timeFrom: value })
    } else {
      onUpdate(dateString, { timeTo: value })
    }
  }

  // 自由テキスト変更ハンドラ
  const handleFreeTextChange = (newFreeText: string) => {
    onUpdate(dateString, { text: newFreeText })
  }

  // 絵文字追加ハンドラ
  const handleEmojiSelect = (emoji: string) => {
    handleFocus()
    const newFreeText = localFreeText + emoji
    setLocalFreeText(newFreeText)
    handleFreeTextChange(newFreeText)
  }

  return (
    <div
      className={`cursor-pointer rounded p-2 ${isSelected ? 'ring-2' : ''}`}
      style={{
        backgroundColor: appTheme.surface,
        // @ts-expect-error ringColor is a valid Tailwind CSS-in-JS property
        '--tw-ring-color': isSelected ? appTheme.accent : undefined,
      }}
      onClick={handleFocus}
    >
      <div className="flex items-center gap-2">
        {/* 日付表示 */}
        <div
          className="w-14 shrink-0 text-center text-sm font-medium"
          style={{
            color:
              isSunday || holiday
                ? calendarTheme.sunday
                : isSaturday
                  ? calendarTheme.saturday
                  : appTheme.text,
          }}
        >
          <span className="text-lg">{dayNumber}</span>
          <span className="ml-1 text-xs">({weekdayName})</span>
        </div>

        {/* テキスト入力（自由作文のみ） */}
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={localFreeText}
            onChange={(e) => {
              const newValue = e.target.value
              setLocalFreeText(newValue)
              // IME入力中でなければ即座に親に反映
              if (!isComposingRef.current) {
                handleFreeTextChange(newValue)
              }
            }}
            onCompositionStart={() => {
              isComposingRef.current = true
            }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false
              // IME確定時に親に反映
              handleFreeTextChange(e.currentTarget.value)
            }}
            onFocus={handleFocus}
            placeholder={t('editor.freeTextPlaceholder')}
            className="w-full rounded border py-1 pl-2 pr-7 text-sm focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: appTheme.text,
            }}
          />
          {localFreeText && (
            <button
              onClick={() => {
                handleFocus()
                setLocalFreeText('')
                handleFreeTextChange('')
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-1"
              style={{ color: appTheme.textMuted }}
              title={t('actions.clear')}
            >
              ✕
            </button>
          )}
        </div>

        {/* コピーボタン */}
        <button
          onClick={() => {
            handleFocus()
            onCopy({ stamp, timeFrom, timeTo, text: freeText })
          }}
          className="shrink-0 rounded px-2 py-1 text-xs transition-opacity hover:opacity-80"
          style={{ backgroundColor: appTheme.bg, color: appTheme.text }}
          title={t('actions.copy')}
        >
          <FontAwesomeIcon icon={faCopy} />
        </button>

        {/* ペーストボタン */}
        <button
          onClick={() => {
            handleFocus()
            onPaste(dateString)
          }}
          className="shrink-0 rounded px-2 py-1 text-xs transition-opacity hover:opacity-80"
          style={{ backgroundColor: appTheme.bg, color: appTheme.text }}
          title={t('actions.paste')}
        >
          <FontAwesomeIcon icon={faClipboard} />
        </button>
      </div>

      {/* スタンプボタンと時刻入力 */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <QuickInputButtons selectedStamp={stamp} onSelect={handleStampChange} />

        {/* 時刻入力 */}
        <div className="flex items-center gap-1">
          <select
            value={timeFrom}
            onChange={(e) => handleTimeChange('from', e.target.value)}
            className="rounded border px-1 py-0.5 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: getTimeColor(timeFrom) || appTheme.text,
            }}
            title={t('time.from')}
          >
            <option value="">{t('time.none')}</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          <span style={{ color: appTheme.textMuted }}>-</span>
          <select
            value={timeTo}
            onChange={(e) => handleTimeChange('to', e.target.value)}
            className="rounded border px-1 py-0.5 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: getTimeColor(timeTo) || appTheme.text,
            }}
            title={t('time.to')}
          >
            <option value="">{t('time.none')}</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* 絵文字ピッカー */}
        <EmojiPicker appTheme={settings.appTheme} onSelect={handleEmojiSelect} />
      </div>
    </div>
  )
}

export function DayEditor() {
  const { t } = useTranslation()
  const view = useCalendarStore((state) => state.view)
  const getEntry = useCalendarStore((state) => state.getEntry)
  const updateEntry = useCalendarStore((state) => state.updateEntry)
  const selectedDate = useCalendarStore((state) => state.selectedDate)
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate)
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]
  const [clipboard, setClipboard] = useState<Partial<DayEntry>>({})

  // アニメーション方向を追跡（1: 下へ移動=次の日を選択, -1: 上へ移動=前の日を選択）
  const prevSelectedDateRef = useRef<string | null>(null)

  // direction計算をレンダリング中に同期的に行う
  let direction = 0
  if (selectedDate && prevSelectedDateRef.current && selectedDate !== prevSelectedDateRef.current) {
    const prev = new Date(prevSelectedDateRef.current).getTime()
    const curr = new Date(selectedDate).getTime()
    direction = curr > prev ? 1 : -1
  }

  // prevSelectedDateRefをレンダリング後に更新
  useEffect(() => {
    prevSelectedDateRef.current = selectedDate
  })

  const handleCopy = useCallback((entry: Partial<DayEntry>) => {
    setClipboard(entry)
    navigator.clipboard.writeText(serializeEntry(entry)).catch(() => {})
  }, [])

  const handlePaste = useCallback(
    async (date: string) => {
      try {
        const systemClipboard = await navigator.clipboard.readText()
        if (systemClipboard) {
          const parsed = deserializeEntry(systemClipboard)
          if (parsed) {
            updateEntry(date, parsed)
            return
          }
        }
      } catch {}
      if (Object.keys(clipboard).length > 0) {
        updateEntry(date, clipboard)
      }
    },
    [clipboard, updateEntry]
  )

  // 選択された日がない、または現在表示中の月と異なる場合
  if (
    !selectedDate ||
    !selectedDate.startsWith(`${view.year}-${String(view.month + 1).padStart(2, '0')}`)
  ) {
    return (
      <div
        className="rounded p-4 text-center text-sm"
        style={{ backgroundColor: appTheme.surface, color: appTheme.textMuted }}
      >
        {t('editor.selectDay')}
      </div>
    )
  }

  const selectedDateObj = new Date(selectedDate)

  // 前後1日を含む3日分の日付を生成（ただし当月の日のみ）
  const currentMonthPrefix = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
  const daysToShow = [-1, 0, 1]
    .map((offset) => {
      const date = addDays(selectedDateObj, offset)
      const dateString = format(date, 'yyyy-MM-dd')
      return {
        date,
        dateString,
        entry: getEntry(dateString),
        isSelected: offset === 0,
      }
    })
    .filter((day) => day.dateString.startsWith(currentMonthPrefix))

  // アニメーションバリアント（オーバーシュートなし）
  const rowVariants = {
    initial: (dir: number) => ({
      y: dir * 20,
      opacity: 0,
    }),
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'tween' as const,
        duration: 0.15,
        ease: 'easeOut' as const,
      },
    },
    exit: (dir: number) => ({
      y: dir * -20,
      opacity: 0,
      transition: {
        type: 'tween' as const,
        duration: 0.15,
        ease: 'easeIn' as const,
      },
    }),
  }

  return (
    <div className="flex flex-col gap-2 overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        {daysToShow.map(({ date, dateString, entry, isSelected }) => (
          <motion.div
            key={dateString}
            custom={direction}
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <DayRow
              date={date}
              entry={entry}
              isSelected={isSelected}
              onUpdate={updateEntry}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onSelect={setSelectedDate}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
