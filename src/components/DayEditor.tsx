import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faClipboard } from '@fortawesome/free-solid-svg-icons'
import { useCalendarStore } from '../lib/store'
import { format, getDaysInMonth } from 'date-fns'
import { QuickInputButtons } from './QuickInputButtons'
import { APP_THEMES } from '../lib/types'

/** 30分刻みの時刻オプションを生成 */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const minutes = (i % 2) * 30
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
})

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
  onSelect,
}: DayRowProps) {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]
  const dayOfWeek = date.getDay()
  const isSunday = dayOfWeek === 0
  const isSaturday = dayOfWeek === 6
  const dateString = format(date, 'yyyy-MM-dd')
  const dayNumber = date.getDate()

  // 曜日名（言語対応）
  const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const weekdayName = t(`weekdays.${weekdayKeys[dayOfWeek]}`)

  // テキストから現在の時刻を解析
  const currentTime = useMemo(() => parseTimeFromText(text), [text])

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
      className={`rounded p-2 ${isSelected ? 'ring-2' : ''}`}
      style={{
        backgroundColor: appTheme.surface,
        // @ts-expect-error ringColor is a valid Tailwind CSS-in-JS property
        '--tw-ring-color': isSelected ? appTheme.accent : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        {/* 日付表示 */}
        <div
          className="w-14 shrink-0 text-center text-sm font-medium"
          style={{
            color: isSunday ? appTheme.accent : isSaturday ? appTheme.accent : appTheme.text,
          }}
        >
          <span className="text-lg">{dayNumber}</span>
          <span className="ml-1 text-xs">({weekdayName})</span>
        </div>

        {/* テキスト入力 */}
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => onTextChange(dateString, e.target.value)}
            onFocus={handleFocus}
            className="w-full rounded border py-1 pl-2 pr-7 text-sm focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: appTheme.text,
            }}
          />
          {text && (
            <button
              onClick={() => {
                handleFocus()
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
      <div className="mt-2 flex flex-wrap items-center gap-2">
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
            className="rounded border px-1 py-0.5 text-xs focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: appTheme.text,
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
            className="rounded border px-1 py-0.5 text-xs focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: appTheme.text,
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
      </div>
    </div>
  )
}

export function DayEditor() {
  const view = useCalendarStore((state) => state.view)
  const entries = useCalendarStore((state) => state.entries)
  const updateEntry = useCalendarStore((state) => state.updateEntry)
  const selectedDate = useCalendarStore((state) => state.selectedDate)
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate)
  const [clipboard, setClipboard] = useState('')

  const daysInMonth = getDaysInMonth(new Date(view.year, view.month))

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
    (date: string, value: string) => {
      updateEntry(date, value)
    },
    [updateEntry]
  )

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(view.year, view.month, i + 1)
    const dateString = format(date, 'yyyy-MM-dd')
    return {
      date,
      dateString,
      text: getEntryText(dateString),
    }
  })

  return (
    <div className="space-y-1">
      {days.map(({ date, dateString, text }) => (
        <DayRow
          key={dateString}
          date={date}
          text={text}
          isSelected={selectedDate === dateString}
          onTextChange={updateEntry}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onQuickInput={handleQuickInput}
          onSelect={setSelectedDate}
        />
      ))}
    </div>
  )
}
