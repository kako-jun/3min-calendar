import { create } from 'zustand'
import i18n from './i18n'
import type { DayEntry, CalendarState, Settings, Template } from './types'
import { defaultSettings } from './types'
import {
  loadEntries,
  loadSettings,
  loadTemplates,
  saveEntry,
  saveSettings,
  saveTemplate,
  deleteTemplate,
} from './storage'
import { initHolidays } from './holidays'

interface CalendarActions {
  // 初期化
  initialize: () => Promise<void>

  // 表示制御
  setView: (year: number, month: number) => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  goToToday: () => void

  // 選択日
  setSelectedDate: (date: string | null) => void

  // エントリ操作
  updateEntry: (date: string, text: string) => Promise<void>
  getEntryText: (date: string) => string

  // テンプレート操作
  addTemplate: (template: Omit<Template, 'id'>) => Promise<void>
  removeTemplate: (id: string) => Promise<void>
  applyTemplate: (templateId: string, year: number, month: number) => Promise<void>

  // 先月からコピー
  copyFromPreviousMonth: () => Promise<void>

  // 設定
  updateSettings: (settings: Partial<Settings>) => Promise<void>

  // カレンダーコメント
  getCalendarComment: (year: number, month: number) => string
  updateCalendarComment: (year: number, month: number, comment: string) => Promise<void>
}

const now = new Date()

export const useCalendarStore = create<
  CalendarState & CalendarActions & { selectedDate: string | null }
>((set, get) => ({
  // 初期状態
  view: {
    year: now.getFullYear(),
    month: now.getMonth(),
  },
  entries: [],
  templates: [],
  settings: defaultSettings,
  initialized: false,
  selectedDate: null,

  // 初期化
  initialize: async () => {
    if (get().initialized) return
    const [entries, settings, templates] = await Promise.all([
      loadEntries(),
      loadSettings(),
      loadTemplates(),
    ])

    // 言語を設定
    i18n.changeLanguage(settings.language)

    // 祝日ライブラリを初期化
    initHolidays(settings.country)

    set({ entries, settings, templates, initialized: true })
  },

  // 表示制御
  setView: (year, month) => {
    set({ view: { year, month } })
  },

  goToPrevMonth: () => {
    const { year, month } = get().view
    if (month === 0) {
      set({ view: { year: year - 1, month: 11 } })
    } else {
      set({ view: { year, month: month - 1 } })
    }
  },

  goToNextMonth: () => {
    const { year, month } = get().view
    if (month === 11) {
      set({ view: { year: year + 1, month: 0 } })
    } else {
      set({ view: { year, month: month + 1 } })
    }
  },

  goToToday: () => {
    const today = new Date()
    set({ view: { year: today.getFullYear(), month: today.getMonth() } })
  },

  // 選択日
  setSelectedDate: (date) => {
    set({ selectedDate: date })
  },

  // エントリ操作
  updateEntry: async (date, text) => {
    const entry: DayEntry = { date, text }
    await saveEntry(entry)
    set((state) => {
      const existing = state.entries.find((e) => e.date === date)
      if (existing) {
        return {
          entries: state.entries.map((e) => (e.date === date ? entry : e)),
        }
      }
      return { entries: [...state.entries, entry] }
    })
  },

  getEntryText: (date) => {
    const entry = get().entries.find((e) => e.date === date)
    return entry?.text ?? ''
  },

  // テンプレート操作
  addTemplate: async (templateData) => {
    const template: Template = {
      ...templateData,
      id: crypto.randomUUID(),
    }
    await saveTemplate(template)
    set((state) => ({ templates: [...state.templates, template] }))
  },

  removeTemplate: async (id) => {
    await deleteTemplate(id)
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    }))
  },

  applyTemplate: async (templateId, year, month) => {
    const template = get().templates.find((t) => t.id === templateId)
    if (!template) return

    const { getDaysInMonth } = await import('date-fns')
    const { format } = await import('date-fns')

    const daysInMonth = getDaysInMonth(new Date(year, month))

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay()
      const defaultText = template.weekdayDefaults[dayOfWeek]
      if (defaultText) {
        const dateString = format(date, 'yyyy-MM-dd')
        await get().updateEntry(dateString, defaultText)
      }
    }
  },

  // 設定
  updateSettings: async (newSettings) => {
    const settings = { ...get().settings, ...newSettings }
    await saveSettings(settings)

    // 言語が変更された場合
    if (newSettings.language) {
      i18n.changeLanguage(newSettings.language)
    }

    // 国が変更された場合
    if (newSettings.country) {
      initHolidays(newSettings.country)
    }

    set({ settings })
  },

  // カレンダーコメント
  getCalendarComment: (year, month) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    return get().settings.calendarComments[key] ?? ''
  },

  updateCalendarComment: async (year, month, comment) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    const calendarComments = { ...get().settings.calendarComments }
    if (comment.trim()) {
      calendarComments[key] = comment
    } else {
      delete calendarComments[key]
    }
    await get().updateSettings({ calendarComments })
  },

  // 先月からコピー（曜日パターンを推測して適用）
  copyFromPreviousMonth: async () => {
    const { view, entries } = get()
    const { format, getDaysInMonth } = await import('date-fns')

    // 先月の年月を計算
    const prevYear = view.month === 0 ? view.year - 1 : view.year
    const prevMonth = view.month === 0 ? 11 : view.month - 1

    // 先月のエントリをフィルタリング
    const prevMonthPrefix = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-`
    const prevMonthEntries = entries.filter(
      (e) => e.date.startsWith(prevMonthPrefix) && e.text.trim() !== ''
    )

    if (prevMonthEntries.length === 0) {
      return // 先月のデータがなければ何もしない
    }

    // 曜日ごとにテキストを集計（0=日曜〜6=土曜）
    const weekdayCounts: Record<number, Record<string, number>> = {
      0: {},
      1: {},
      2: {},
      3: {},
      4: {},
      5: {},
      6: {},
    }

    for (const entry of prevMonthEntries) {
      const date = new Date(entry.date)
      const dayOfWeek = date.getDay()
      const text = entry.text
      const counts = weekdayCounts[dayOfWeek]
      if (counts) {
        counts[text] = (counts[text] || 0) + 1
      }
    }

    // 各曜日で最も多く使われたテキストを取得
    const weekdayDefaults: Record<number, string> = {}
    for (let dow = 0; dow < 7; dow++) {
      const counts = weekdayCounts[dow]
      if (!counts) continue
      let maxCount = 0
      let mostCommon = ''
      for (const [text, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count
          mostCommon = text
        }
      }
      if (mostCommon) {
        weekdayDefaults[dow] = mostCommon
      }
    }

    // 今月の各日に適用
    const daysInMonth = getDaysInMonth(new Date(view.year, view.month))

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(view.year, view.month, day)
      const dayOfWeek = date.getDay()
      const defaultText = weekdayDefaults[dayOfWeek]
      if (defaultText) {
        const dateString = format(date, 'yyyy-MM-dd')
        await get().updateEntry(dateString, defaultText)
      }
    }
  },
}))
