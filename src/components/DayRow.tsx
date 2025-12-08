import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
