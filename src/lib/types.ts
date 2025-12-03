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
  shopLogo: string | null // 店名ロゴ画像（Base64）
  showHolidays: boolean
  backgroundImage: string | null // Base64エンコードされた背景画像
  backgroundOpacity: number // 背景画像の透明度 (0-1)
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
 * @deprecated parseStampedText を使用してください
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

/** パース結果のセグメント */
export type TextSegment =
  | { type: 'stamp'; style: QuickInputStyle; text: string }
  | { type: 'text'; text: string }

/**
 * スタンプタグのパターン: [休], [◯], [△], [✕], [満] など
 */
const STAMP_TAG_REGEX = /\[([^\]]+)\]/g

/**
 * スタンプキーからタグ形式の文字列を生成
 * 例: 'closed' → '[休]' (日本語) / '[Closed]' (英語)
 */
export function formatStampTag(stampKey: string, t: (key: string) => string): string {
  const value = t(`quickInput.${stampKey}`)
  return `[${value}]`
}

/**
 * タグ内のテキストからスタンプスタイルを取得
 */
export function getStampStyleByText(
  innerText: string,
  t: (key: string) => string
): QuickInputStyle | null {
  for (const style of QUICK_INPUT_STYLES) {
    const value = t(`quickInput.${style.key}`)
    if (innerText === value) {
      return style
    }
  }
  return null
}

/**
 * テキストをスタンプタグと通常テキストに分解
 * 例: "[休]10:00-18:00" → [{ type: 'stamp', ... }, { type: 'text', text: '10:00-18:00' }]
 */
export function parseStampedText(text: string, t: (key: string) => string): TextSegment[] {
  const segments: TextSegment[] = []
  let lastIndex = 0

  // マッチを探す
  const matches = text.matchAll(STAMP_TAG_REGEX)

  for (const match of matches) {
    const matchStart = match.index ?? 0
    const matchEnd = matchStart + match[0].length
    const innerText = match[1] ?? ''

    // マッチ前のテキスト
    if (matchStart > lastIndex) {
      const beforeText = text.slice(lastIndex, matchStart)
      if (beforeText) {
        segments.push({ type: 'text', text: beforeText })
      }
    }

    // スタンプタグの処理
    const style = innerText ? getStampStyleByText(innerText, t) : null
    if (style) {
      segments.push({ type: 'stamp', style, text: innerText })
    } else {
      // 未知のタグは通常テキストとして扱う
      segments.push({ type: 'text', text: match[0] })
    }

    lastIndex = matchEnd
  }

  // 残りのテキスト
  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return segments
}

/** デフォルト設定 */
export const defaultSettings: Settings = {
  weekStartsOn: 0,
  appTheme: 'dark',
  calendarTheme: 'dark',
  language: 'ja',
  country: 'JP',
  shopName: '',
  shopLogo: null,
  showHolidays: true,
  backgroundImage: null,
  backgroundOpacity: 0.15,
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
