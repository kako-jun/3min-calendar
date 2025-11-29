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

  // エントリ操作
  updateEntry: (date: string, text: string) => Promise<void>
  getEntryText: (date: string) => string

  // テンプレート操作
  addTemplate: (template: Omit<Template, 'id'>) => Promise<void>
  removeTemplate: (id: string) => Promise<void>
  applyTemplate: (templateId: string, year: number, month: number) => Promise<void>

  // 設定
  updateSettings: (settings: Partial<Settings>) => Promise<void>
}

const now = new Date()

export const useCalendarStore = create<CalendarState & CalendarActions>((set, get) => ({
  // 初期状態
  view: {
    year: now.getFullYear(),
    month: now.getMonth(),
  },
  entries: [],
  templates: [],
  settings: defaultSettings,
  initialized: false,

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
}))
