import type { CountryCode } from './holidays'

/** 日ごとのテキストデータ */
export interface DayEntry {
  date: string // YYYY-MM-DD
  text: string
}

/** アプリテーマ（ライト/ダーク） */
export type AppTheme = 'light' | 'dark'

/** カレンダーテーマ定義 */
export type CalendarThemeId = 'dark' | 'light' | 'cafe' | 'nature' | 'ocean' | 'sunset'

/** @deprecated ThemeIdはCalendarThemeIdに置き換え予定 */
export type ThemeId = CalendarThemeId

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
  appTheme: AppTheme // アプリ全体のテーマ（ライト/ダーク）
  calendarTheme: CalendarThemeId // カレンダー画像のテーマ
  language: 'ja' | 'en'
  country: CountryCode
  shopName: string
  showHolidays: boolean
}

/** @deprecated 後方互換用 */
export interface LegacySettings extends Omit<Settings, 'appTheme' | 'calendarTheme'> {
  theme?: ThemeId
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

/** クイック入力のスタイル定義 */
export interface QuickInputStyle {
  key: string
  bgColor: string
  textColor: string
}

export const QUICK_INPUT_STYLES: QuickInputStyle[] = [
  { key: 'closed', bgColor: '#4b5563', textColor: '#ffffff' }, // gray-600
  { key: 'available', bgColor: '#16a34a', textColor: '#ffffff' }, // green-600
  { key: 'few', bgColor: '#ca8a04', textColor: '#ffffff' }, // yellow-600
  { key: 'reserved', bgColor: '#dc2626', textColor: '#ffffff' }, // red-600
  { key: 'full', bgColor: '#9333ea', textColor: '#ffffff' }, // purple-600
]

/**
 * テキストに対応するクイック入力スタイルを取得
 * マッチしない場合はnullを返す
 */
export function getQuickInputStyle(
  text: string,
  t: (key: string) => string
): QuickInputStyle | null {
  for (const style of QUICK_INPUT_STYLES) {
    const value = t(`quickInput.${style.key}`)
    if (text === value) {
      return style
    }
  }
  return null
}

/** デフォルト設定 */
export const defaultSettings: Settings = {
  weekStartsOn: 0,
  appTheme: 'dark',
  calendarTheme: 'dark',
  language: 'ja',
  country: 'JP',
  shopName: '',
  showHolidays: true,
}

/** アプリテーマの色定義 */
export const APP_THEMES: Record<
  AppTheme,
  { bg: string; surface: string; text: string; textMuted: string; accent: string }
> = {
  dark: {
    bg: '#111827',
    surface: '#1f2937',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#3b82f6',
  },
  light: {
    bg: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    textMuted: '#6b7280',
    accent: '#3b82f6',
  },
}
