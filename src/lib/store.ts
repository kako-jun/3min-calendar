import { create } from 'zustand'
import i18n from './i18n'
import type { DayEntry, CalendarState, Settings, CalendarThemeId } from './types'
import { defaultSettings } from './types'
import {
  loadEntries,
  loadSettings,
  loadCalendarComments,
  loadCalendarThemes,
  saveEntry,
  saveSettings,
  saveCalendarComments,
  saveCalendarThemes,
  StorageError,
} from './storage'
import { initHolidays } from './holidays'

interface CalendarActions {
  // 初期化
  initialize: () => Promise<void>
  initError: string | null

  // 表示制御
  setView: (year: number, month: number) => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  goToToday: () => void

  // 選択日
  setSelectedDate: (date: string | null) => void

  // エントリ操作
  updateEntry: (date: string, updates: Partial<Omit<DayEntry, 'date'>>) => Promise<void>
  getEntry: (date: string) => DayEntry | undefined
  getEntryText: (date: string) => string

  // 先月からコピー
  copyFromPreviousMonth: () => Promise<void>

  // 設定
  updateSettings: (settings: Partial<Settings>) => Promise<void>

  // カレンダーコメント
  getCalendarComment: (year: number, month: number) => string
  updateCalendarComment: (year: number, month: number, comment: string) => Promise<void>

  // カレンダーテーマ
  getCalendarTheme: (year: number, month: number) => CalendarThemeId
  updateCalendarTheme: (year: number, month: number, theme: CalendarThemeId) => Promise<void>
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
  calendarComments: {},
  calendarThemes: {},
  settings: defaultSettings,
  initialized: false,
  selectedDate: null,
  initError: null,

  // 初期化
  initialize: async () => {
    if (get().initialized) return

    try {
      const [entries, calendarComments, calendarThemes, settings] = await Promise.all([
        loadEntries(),
        loadCalendarComments(),
        loadCalendarThemes(),
        loadSettings(),
      ])

      // データの整合性チェック - 有効なデータのみ使用
      const validEntries = Array.isArray(entries) ? entries : []
      const validCalendarComments =
        calendarComments && typeof calendarComments === 'object' ? calendarComments : {}
      const validCalendarThemes =
        calendarThemes && typeof calendarThemes === 'object' ? calendarThemes : {}
      const validSettings = settings && typeof settings === 'object' ? settings : defaultSettings

      // 言語を設定
      i18n.changeLanguage(validSettings.language)

      // 祝日ライブラリを初期化
      initHolidays(validSettings.country)

      set({
        entries: validEntries,
        calendarComments: validCalendarComments,
        calendarThemes: validCalendarThemes,
        settings: validSettings,
        initialized: true,
        initError: null,
      })

      console.log(`Storage loaded: ${validEntries.length} entries`)
    } catch (error) {
      console.error('Failed to initialize storage:', error)

      // StorageErrorの場合はユーザーに通知
      const errorMessage =
        error instanceof StorageError
          ? error.message
          : 'データの読み込みに失敗しました。ブラウザを再起動してください。'

      // エラー状態を設定（空データで上書きせず、エラーを表示）
      set({
        initError: errorMessage,
        initialized: true, // 初期化済みフラグは立てるが、データは空のまま
      })

      // ユーザーに警告
      alert(errorMessage)
    }
  },

  // 表示制御
  setView: (year, month) => {
    set({ view: { year, month } })
  },

  goToPrevMonth: () => {
    const { year, month } = get().view
    // 令和元年5月（2019年5月）より前には戻れない
    if (year === 2019 && month <= 4) return
    if (year < 2019) return
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
  updateEntry: async (date, updates) => {
    const existing = get().entries.find((e) => e.date === date)
    const entry: DayEntry = {
      date,
      text: updates.text ?? existing?.text ?? '',
      stamp: updates.stamp !== undefined ? updates.stamp : existing?.stamp,
      timeFrom: updates.timeFrom !== undefined ? updates.timeFrom : existing?.timeFrom,
      timeTo: updates.timeTo !== undefined ? updates.timeTo : existing?.timeTo,
    }
    await saveEntry(entry)
    set((state) => {
      const existingEntry = state.entries.find((e) => e.date === date)
      if (existingEntry) {
        return {
          entries: state.entries.map((e) => (e.date === date ? entry : e)),
        }
      }
      return { entries: [...state.entries, entry] }
    })
  },

  getEntry: (date) => {
    return get().entries.find((e) => e.date === date)
  },

  getEntryText: (date) => {
    const entry = get().entries.find((e) => e.date === date)
    return entry?.text ?? ''
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
    return get().calendarComments[key] ?? ''
  },

  updateCalendarComment: async (year, month, comment) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    const calendarComments = { ...get().calendarComments }
    if (comment.trim()) {
      calendarComments[key] = comment
    } else {
      delete calendarComments[key]
    }
    await saveCalendarComments(calendarComments)
    set({ calendarComments })
  },

  // カレンダーテーマ
  getCalendarTheme: (year, month) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    return get().calendarThemes[key] ?? get().settings.calendarTheme
  },

  updateCalendarTheme: async (year, month, theme) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    const calendarThemes = { ...get().calendarThemes }
    calendarThemes[key] = theme
    await saveCalendarThemes(calendarThemes)
    set({ calendarThemes })
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
        await get().updateEntry(dateString, { text: defaultText })
      }
    }
  },
}))
