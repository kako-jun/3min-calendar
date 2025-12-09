import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faClipboard } from '@fortawesome/free-solid-svg-icons'
import { format } from 'date-fns'
import { useCalendarStore } from '../lib/store'
import { APP_THEMES, THEMES } from '../lib/types'
import type { DayEntry } from '../lib/types'
import { isHoliday } from '../lib/holidays'
import { TIME_OPTIONS, getTimeColor } from '../lib/time'
import { QuickInputButtons } from './QuickInputButtons'
import { EmojiPicker } from './EmojiPicker'

interface DayRowProps {
  date: Date
  entry: DayEntry | undefined
  isSelected: boolean
  onUpdate: (date: string, updates: Partial<Omit<DayEntry, 'date'>>) => void
  onCopy: (entry: Partial<DayEntry>) => void
  onPaste: (date: string) => void
  onSelect: (date: string) => void
}

export function DayRow({
  date,
  entry,
  isSelected,
  onUpdate,
  onCopy,
  onPaste,
  onSelect,
}: DayRowProps) {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const view = useCalendarStore((state) => state.view)
  const calendarThemes = useCalendarStore((state) => state.calendarThemes)
  const appTheme = APP_THEMES[settings.appTheme]
  const monthKey = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
  const calendarThemeId = calendarThemes[monthKey] ?? settings.calendarTheme
  const calendarTheme = THEMES[calendarThemeId]
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
  const entrySymbol = entry?.symbol ?? null
  const entryStamp = entry?.stamp ?? null
  const entryTimeFrom = entry?.timeFrom ?? ''
  const entryTimeTo = entry?.timeTo ?? ''
  const freeText = entry?.text ?? ''

  // IME入力中フラグ（Android日本語入力対応）
  const isComposingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [localFreeText, setLocalFreeText] = useState(freeText)
  const [localSymbol, setLocalSymbol] = useState(entrySymbol)
  const [localStamp, setLocalStamp] = useState(entryStamp)
  const [localTimeFrom, setLocalTimeFrom] = useState(entryTimeFrom)
  const [localTimeTo, setLocalTimeTo] = useState(entryTimeTo)

  // 親からの変更を反映
  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalFreeText(freeText)
    }
  }, [freeText])

  useEffect(() => {
    setLocalSymbol(entrySymbol)
  }, [entrySymbol])

  useEffect(() => {
    setLocalStamp(entryStamp)
  }, [entryStamp])

  useEffect(() => {
    setLocalTimeFrom(entryTimeFrom)
  }, [entryTimeFrom])

  useEffect(() => {
    setLocalTimeTo(entryTimeTo)
  }, [entryTimeTo])

  // 入力欄やボタンにフォーカス/クリックしたらこの日を選択
  const handleFocus = () => onSelect(dateString)

  // 記号変更ハンドラ（背景表示用）
  const handleSymbolChange = (symbolKey: string | null) => {
    handleFocus()
    setLocalSymbol(symbolKey)
    onUpdate(dateString, { symbol: symbolKey })
  }

  // スタンプ変更ハンドラ（左上表示用）
  const handleStampChange = (stampKey: string | null) => {
    handleFocus()
    setLocalStamp(stampKey)
    onUpdate(dateString, { stamp: stampKey })
  }

  // 時刻変更ハンドラ
  const handleTimeChange = (type: 'from' | 'to', value: string) => {
    handleFocus()
    if (type === 'from') {
      setLocalTimeFrom(value)
      onUpdate(dateString, { timeFrom: value })
    } else {
      setLocalTimeTo(value)
      onUpdate(dateString, { timeTo: value })
    }
  }

  // 自由テキスト変更ハンドラ
  const handleFreeTextChange = (newFreeText: string) => {
    onUpdate(dateString, { text: newFreeText })
  }

  // 絵文字追加ハンドラ（カーソル位置に挿入）
  const handleEmojiSelect = (emoji: string) => {
    handleFocus()
    const input = inputRef.current
    if (input) {
      const start = input.selectionStart ?? localFreeText.length
      const end = input.selectionEnd ?? localFreeText.length
      const newFreeText = localFreeText.slice(0, start) + emoji + localFreeText.slice(end)
      setLocalFreeText(newFreeText)
      handleFreeTextChange(newFreeText)
      // カーソル位置を絵文字の後ろに移動
      requestAnimationFrame(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length)
        input.focus()
      })
    } else {
      const newFreeText = localFreeText + emoji
      setLocalFreeText(newFreeText)
      handleFreeTextChange(newFreeText)
    }
  }

  return (
    <div
      className="relative cursor-pointer rounded p-2"
      style={{ backgroundColor: appTheme.surface }}
      onClick={handleFocus}
    >
      {/* 選択枠（アニメーション付き） */}
      {isSelected && (
        <motion.div
          layoutId="editor-selection"
          className="pointer-events-none absolute inset-0 rounded"
          style={{
            boxShadow: `inset 0 0 0 2px ${appTheme.accent}`,
          }}
          transition={{
            type: 'tween',
            duration: 0.15,
            ease: 'easeOut',
          }}
        />
      )}
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
            ref={inputRef}
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
            onCopy({
              symbol: localSymbol,
              stamp: localStamp,
              timeFrom: localTimeFrom,
              timeTo: localTimeTo,
              text: localFreeText,
            })
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
        <QuickInputButtons
          selectedSymbol={localSymbol}
          selectedStamp={localStamp}
          onSymbolSelect={handleSymbolChange}
          onStampSelect={handleStampChange}
        />

        {/* 時刻入力 */}
        <div className="flex items-center gap-1">
          <select
            value={localTimeFrom}
            onChange={(e) => handleTimeChange('from', e.target.value)}
            className="rounded border px-1 py-0.5 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: getTimeColor(localTimeFrom) || appTheme.text,
            }}
            title={t('time.from')}
          >
            <option value="">{t('time.none')}</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time} style={{ color: getTimeColor(time) || undefined }}>
                {time}
              </option>
            ))}
          </select>
          <span style={{ color: appTheme.textMuted }}>-</span>
          <select
            value={localTimeTo}
            onChange={(e) => handleTimeChange('to', e.target.value)}
            className="rounded border px-1 py-0.5 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: appTheme.bg,
              borderColor: appTheme.textMuted,
              color: getTimeColor(localTimeTo) || appTheme.text,
            }}
            title={t('time.to')}
          >
            <option value="">{t('time.none')}</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time} style={{ color: getTimeColor(time) || undefined }}>
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
