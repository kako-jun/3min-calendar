import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faClipboard } from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from 'framer-motion'
import { useCalendarStore } from '../lib/store'
import { format, addDays } from 'date-fns'
import { QuickInputButtons } from './QuickInputButtons'
import { EmojiPicker } from './EmojiPicker'
import { APP_THEMES, THEMES } from '../lib/types'
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

/** 時刻パターン: HH:MM-HH:MM, HH:MM-, -HH:MM */
const TIME_PATTERN = /(\d{1,2}:\d{2})?-(\d{1,2}:\d{2})?/

/** テキストから時刻部分を抽出 */
function parseTimeFromText(text: string): { from: string; to: string } | null {
  const match = text.match(TIME_PATTERN)
  if (!match || (!match[1] && !match[2])) return null
  return { from: match[1] || '', to: match[2] || '' }
}

/** テキストに時刻を追加/更新 */
function updateTimeInText(text: string, from: string, to: string): string {
  const timeStr = from || to ? `${from}-${to}` : ''
  const existing = text.match(TIME_PATTERN)

  if (existing) {
    // 既存の時刻部分を置換
    if (!timeStr) {
      // 時刻を削除
      return text.replace(TIME_PATTERN, '').trim()
    }
    return text.replace(TIME_PATTERN, timeStr)
  } else if (timeStr) {
    // 時刻がない場合は末尾に追加
    return text ? `${text}${timeStr}` : timeStr
  }
  return text
}

interface DayRowProps {
  date: Date
  text: string
  isSelected: boolean
  onTextChange: (date: string, text: string) => void
  onCopy: (text: string) => void
  onPaste: (date: string) => void
  onQuickInput: (date: string, value: string) => void
  onEmojiSelect: (date: string, emoji: string) => void
  onSelect: (date: string) => void
}

function DayRow({
  date,
  text,
  isSelected,
  onTextChange,
  onCopy,
  onPaste,
  onQuickInput,
  onEmojiSelect,
  onSelect,
}: DayRowProps) {
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

  // テキストから現在の時刻を解析
  const currentTime = useMemo(() => parseTimeFromText(text), [text])

  // IME入力中フラグ（Android日本語入力対応）
  const isComposingRef = useRef(false)
  const [localText, setLocalText] = useState(text)

  // 親からのtext変更を反映（IME入力中でなければ）
  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalText(text)
    }
  }, [text])

  // 入力欄やボタンにフォーカス/クリックしたらこの日を選択
  const handleFocus = () => onSelect(dateString)

  // 時刻変更ハンドラ
  const handleTimeChange = (type: 'from' | 'to', value: string) => {
    handleFocus()
    const from = type === 'from' ? value : currentTime?.from || ''
    const to = type === 'to' ? value : currentTime?.to || ''
    const newText = updateTimeInText(text, from, to)
    onTextChange(dateString, newText)
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

        {/* テキスト入力 */}
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={localText}
            onChange={(e) => {
              const newValue = e.target.value
              setLocalText(newValue)
              // IME入力中でなければ即座に親に反映
              if (!isComposingRef.current) {
                onTextChange(dateString, newValue)
              }
            }}
            onCompositionStart={() => {
              isComposingRef.current = true
            }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false
              // IME確定時に親に反映
              onTextChange(dateString, e.currentTarget.value)
            }}
            onFocus={handleFocus}
            maxLength={10}
            className="w-full rounded border py-1 pl-2 pr-7 text-sm focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: appTheme.text,
            }}
          />
          {localText && (
            <button
              onClick={() => {
                handleFocus()
                setLocalText('')
                onTextChange(dateString, '')
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
            onCopy(text)
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

      {/* クイック入力ボタンと時刻入力 */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <QuickInputButtons
          onSelect={(value) => {
            handleFocus()
            onQuickInput(dateString, value)
          }}
        />

        {/* 時刻入力 */}
        <div className="flex items-center gap-1">
          <select
            value={currentTime?.from || ''}
            onChange={(e) => handleTimeChange('from', e.target.value)}
            className="rounded border px-1 py-0.5 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: getTimeColor(currentTime?.from || '') || appTheme.text,
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
            value={currentTime?.to || ''}
            onChange={(e) => handleTimeChange('to', e.target.value)}
            className="rounded border px-1 py-0.5 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: getTimeColor(currentTime?.to || '') || appTheme.text,
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
        <EmojiPicker
          appTheme={settings.appTheme}
          onSelect={(emoji) => {
            handleFocus()
            onEmojiSelect(dateString, emoji)
          }}
        />
      </div>
    </div>
  )
}

export function DayEditor() {
  const { t } = useTranslation()
  const view = useCalendarStore((state) => state.view)
  const entries = useCalendarStore((state) => state.entries)
  const updateEntry = useCalendarStore((state) => state.updateEntry)
  const selectedDate = useCalendarStore((state) => state.selectedDate)
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate)
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]
  const [clipboard, setClipboard] = useState('')

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

  const getEntryText = useCallback(
    (date: string) => {
      const entry = entries.find((e) => e.date === date)
      return entry?.text ?? ''
    },
    [entries]
  )

  const handleCopy = useCallback((text: string) => {
    setClipboard(text)
    navigator.clipboard.writeText(text).catch(() => {})
  }, [])

  const handlePaste = useCallback(
    async (date: string) => {
      try {
        const systemClipboard = await navigator.clipboard.readText()
        if (systemClipboard) {
          updateEntry(date, systemClipboard)
          return
        }
      } catch {}
      if (clipboard) {
        updateEntry(date, clipboard)
      }
    },
    [clipboard, updateEntry]
  )

  const handleQuickInput = useCallback(
    (date: string, newStamp: string) => {
      const currentText = getEntryText(date)

      // 現在のテキストにスタンプがあるか確認
      const stampMatch = currentText.match(/^\[([^\]]+)\]/)

      if (stampMatch) {
        const currentStamp = stampMatch[0]
        if (currentStamp === newStamp) {
          // 同じスタンプなら除去（トグル）
          updateEntry(date, currentText.replace(currentStamp, '').trim())
        } else {
          // 違うスタンプなら置換
          updateEntry(date, currentText.replace(currentStamp, newStamp))
        }
      } else {
        // スタンプがない場合は先頭に追加
        updateEntry(date, currentText ? `${newStamp}${currentText}` : newStamp)
      }
    },
    [getEntryText, updateEntry]
  )

  const handleEmojiSelect = useCallback(
    (date: string, emoji: string) => {
      const currentText = getEntryText(date)
      // 絵文字は排他ではなく、末尾に追加
      updateEntry(date, currentText + emoji)
    },
    [getEntryText, updateEntry]
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
        text: getEntryText(dateString),
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
        {daysToShow.map(({ date, dateString, text, isSelected }) => (
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
              text={text}
              isSelected={isSelected}
              onTextChange={updateEntry}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onQuickInput={handleQuickInput}
              onEmojiSelect={handleEmojiSelect}
              onSelect={setSelectedDate}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
