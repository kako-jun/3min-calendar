import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '../lib/store'
import { format, getDaysInMonth, isToday } from 'date-fns'
import { QuickInputButtons } from './QuickInputButtons'
import { THEMES } from '../lib/types'

interface DayRowProps {
  date: Date
  text: string
  onTextChange: (date: string, text: string) => void
  onCopy: (text: string) => void
  onPaste: (date: string) => void
  onQuickInput: (date: string, value: string) => void
}

function DayRow({ date, text, onTextChange, onCopy, onPaste, onQuickInput }: DayRowProps) {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const theme = THEMES[settings.theme]
  const dayOfWeek = date.getDay()
  const isSunday = dayOfWeek === 0
  const isSaturday = dayOfWeek === 6
  const dateString = format(date, 'yyyy-MM-dd')
  const dayNumber = date.getDate()

  // 曜日名（言語対応）
  const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const weekdayName = t(`weekdays.${weekdayKeys[dayOfWeek]}`)

  return (
    <div
      className={`rounded p-2 ${isToday(date) ? 'ring-1' : ''}`}
      style={{
        backgroundColor: theme.surface,
        // @ts-expect-error CSS custom property for Tailwind ring color
        '--tw-ring-color': isToday(date) ? theme.accent : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        {/* 日付表示 */}
        <div
          className="w-14 shrink-0 text-center text-sm font-medium"
          style={{
            color: isSunday ? theme.sunday : isSaturday ? theme.saturday : theme.text,
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
            className="w-full rounded border py-1 pl-2 pr-7 text-sm focus:outline-none"
            style={{
              backgroundColor: theme.bg,
              borderColor: theme.textMuted,
              color: theme.text,
            }}
          />
          {text && (
            <button
              onClick={() => onTextChange(dateString, '')}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-1"
              style={{ color: theme.textMuted }}
              title={t('actions.clear')}
            >
              ✕
            </button>
          )}
        </div>

        {/* コピーボタン */}
        <button
          onClick={() => onCopy(text)}
          className="shrink-0 rounded px-2 py-1 text-xs transition-opacity hover:opacity-80"
          style={{ backgroundColor: theme.bg, color: theme.text }}
          title={t('actions.copy')}
        >
          📋
        </button>

        {/* ペーストボタン */}
        <button
          onClick={() => onPaste(dateString)}
          className="shrink-0 rounded px-2 py-1 text-xs transition-opacity hover:opacity-80"
          style={{ backgroundColor: theme.bg, color: theme.text }}
          title={t('actions.paste')}
        >
          📥
        </button>
      </div>

      {/* クイック入力ボタン */}
      <div className="mt-2">
        <QuickInputButtons onSelect={(value) => onQuickInput(dateString, value)} />
      </div>
    </div>
  )
}

export function DayEditor() {
  const view = useCalendarStore((state) => state.view)
  const entries = useCalendarStore((state) => state.entries)
  const updateEntry = useCalendarStore((state) => state.updateEntry)
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
          onTextChange={updateEntry}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onQuickInput={handleQuickInput}
        />
      ))}
    </div>
  )
}
