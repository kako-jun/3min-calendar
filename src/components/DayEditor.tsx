import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useCalendarStore } from '../lib/store'
import { format, addDays, getDaysInMonth } from 'date-fns'
import { APP_THEMES } from '../lib/types'
import type { DayEntry } from '../lib/types'
import { serializeEntry, deserializeEntry } from '../lib/entry'
import { DayRow } from './DayRow'

interface DayEditorProps {
  showAllDays?: boolean
}

export function DayEditor({ showAllDays = false }: DayEditorProps) {
  const { t } = useTranslation()
  const view = useCalendarStore((state) => state.view)
  const getEntry = useCalendarStore((state) => state.getEntry)
  const updateEntry = useCalendarStore((state) => state.updateEntry)
  const selectedDate = useCalendarStore((state) => state.selectedDate)
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate)
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]
  const [clipboard, setClipboard] = useState<Partial<DayEntry>>({})
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedRowRef = useRef<HTMLDivElement>(null)

  // アニメーション方向を追跡
  const prevSelectedDateRef = useRef<string | null>(null)

  let direction = 0
  if (selectedDate && prevSelectedDateRef.current && selectedDate !== prevSelectedDateRef.current) {
    const prev = new Date(prevSelectedDateRef.current).getTime()
    const curr = new Date(selectedDate).getTime()
    direction = curr > prev ? 1 : -1
  }

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

  const currentMonthPrefix = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
  const isValidSelection = selectedDate && selectedDate.startsWith(currentMonthPrefix)

  // showAllDaysモード: 月の全日を生成
  const allDaysOfMonth = showAllDays
    ? Array.from({ length: getDaysInMonth(new Date(view.year, view.month)) }, (_, i) => {
        const date = new Date(view.year, view.month, i + 1)
        const dateString = format(date, 'yyyy-MM-dd')
        return {
          date,
          dateString,
          entry: getEntry(dateString),
          isSelected: dateString === selectedDate,
        }
      })
    : []

  // 通常モード: 選択日の前後1日を含む3日分
  const selectedDateObj = selectedDate ? new Date(selectedDate) : new Date(view.year, view.month, 1)
  const daysToShow = showAllDays
    ? allDaysOfMonth
    : [-1, 0, 1]
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

  // 選択日が変わったらスクロール（showAllDaysモードのみ）
  useEffect(() => {
    if (showAllDays && selectedRowRef.current && scrollContainerRef.current) {
      selectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [showAllDays, selectedDate])

  // 選択された日がない場合（通常モードのみ）
  if (!showAllDays && !isValidSelection) {
    return (
      <div
        className="rounded p-4 text-center text-sm"
        style={{ backgroundColor: appTheme.surface, color: appTheme.textMuted }}
      >
        {t('editor.selectDay')}
      </div>
    )
  }

  // アニメーションバリアント
  const rowVariants = {
    initial: (dir: number) => ({ y: dir * 20, opacity: 0 }),
    animate: {
      y: 0,
      opacity: 1,
      transition: { type: 'tween' as const, duration: 0.15, ease: 'easeOut' as const },
    },
    exit: (dir: number) => ({
      y: dir * -20,
      opacity: 0,
      transition: { type: 'tween' as const, duration: 0.15, ease: 'easeIn' as const },
    }),
  }

  // showAllDaysモード: スクロール可能なリスト
  if (showAllDays) {
    return (
      <div ref={scrollContainerRef} className="flex max-h-[500px] flex-col gap-1 overflow-y-auto">
        {daysToShow.map(({ date, dateString, entry, isSelected }) => (
          <div key={dateString} ref={isSelected ? selectedRowRef : undefined}>
            <DayRow
              date={date}
              entry={entry}
              isSelected={isSelected}
              onUpdate={updateEntry}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onSelect={setSelectedDate}
            />
          </div>
        ))}
      </div>
    )
  }

  // 通常モード: アニメーション付き3日表示
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
