import type { CountryCode } from './holidays'

/** 日ごとのテキストデータ */
export interface DayEntry {
  date: string // YYYY-MM-DD
  text: string
}

/** テーマ定義 */
export type ThemeId = 'dark' | 'light' | 'cafe' | 'nature' | 'ocean' | 'sunset'

export interface ThemeColors {
  bg: string
  surface: string
  text: string
  textMuted: string
  accent: string
  sunday: string
  saturday: string
  holiday: string
}

export const THEMES: Record<ThemeId, ThemeColors> = {
  dark: {
    bg: '#1f2937',
    surface: '#374151',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#3b82f6',
    sunday: '#f87171',
    saturday: '#60a5fa',
    holiday: '#f87171',
  },
  light: {
    bg: '#ffffff',
    surface: '#f3f4f6',
    text: '#1f2937',
    textMuted: '#6b7280',
    accent: '#3b82f6',
    sunday: '#dc2626',
    saturday: '#2563eb',
    holiday: '#dc2626',
  },
  cafe: {
    bg: '#3d2c29',
    surface: '#5c4742',
    text: '#f5f0eb',
    textMuted: '#c4b5a8',
    accent: '#d4a574',
    sunday: '#e57373',
    saturday: '#7db8c9',
    holiday: '#e57373',
  },
  nature: {
    bg: '#2d3b2d',
    surface: '#3d4d3d',
    text: '#e8f0e8',
    textMuted: '#a8c0a8',
    accent: '#7cb97c',
    sunday: '#e57373',
    saturday: '#7db8c9',
    holiday: '#e57373',
  },
  ocean: {
    bg: '#1a3a4a',
    surface: '#2a4a5a',
    text: '#e0f0f8',
    textMuted: '#90c0d8',
    accent: '#4da6c9',
    sunday: '#e57373',
    saturday: '#7db8c9',
    holiday: '#e57373',
  },
  sunset: {
    bg: '#4a2a2a',
    surface: '#5a3a3a',
    text: '#f8e8e0',
    textMuted: '#d8b0a0',
    accent: '#e8a070',
    sunday: '#e57373',
    saturday: '#7db8c9',
    holiday: '#e57373',
  },
}

/** テンプレート（定休日パターン） */
export interface Template {
  id: string
  name: string
  // 曜日ごとのデフォルト値（0=日曜〜6=土曜）
  weekdayDefaults: Record<number, string>
}

/** アプリ設定 */
export interface Settings {
  weekStartsOn: 0 | 1 // 0: 日曜, 1: 月曜
  theme: ThemeId
  language: 'ja' | 'en'
  country: CountryCode
  shopName: string
  showHolidays: boolean
}

/** カレンダーの表示状態 */
export interface CalendarView {
  year: number
  month: number // 0-11
}

/** ストア全体の状態 */
export interface CalendarState {
  // 表示状態
  view: CalendarView
  // データ
  entries: DayEntry[]
  templates: Template[]
  settings: Settings
  // 初期化状態
  initialized: boolean
}

/** デフォルト設定 */
export const defaultSettings: Settings = {
  weekStartsOn: 0,
  theme: 'dark',
  language: 'ja',
  country: 'JP',
  shopName: '',
  showHolidays: true,
}
