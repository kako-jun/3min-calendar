import type { CountryCode } from './holidays'

/** 日ごとのテキストデータ */
export interface DayEntry {
  date: string // YYYY-MM-DD
  text: string // 自由テキストのみ
  stamp?: string | null // スタンプキー: 'closed', 'available', etc.
  timeFrom?: string // 開始時刻: '10:00'
  timeTo?: string // 終了時刻: '18:00'
}

/** アプリテーマ（ライト/ダーク） */
export type AppTheme = 'light' | 'dark'

/** カレンダーテーマ定義 */
export type CalendarThemeId =
  // 明るい系（上段）
  | 'light'
  | 'light-red'
  | 'light-orange'
  | 'light-yellow'
  | 'light-green'
  | 'light-blue'
  | 'light-purple'
  // 暗い系（下段）
  | 'dark'
  | 'dark-red'
  | 'dark-orange'
  | 'dark-yellow'
  | 'dark-green'
  | 'dark-blue'
  | 'dark-purple'

/** グリッド表示スタイル */
export type GridStyle = 'rounded' | 'lined'

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
  // 明るい系（上段）
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
  'light-red': {
    bg: '#fef2f2',
    surface: '#fee2e2',
    text: '#7f1d1d',
    textMuted: '#b91c1c',
    accent: '#dc2626',
    sunday: '#dc2626',
    saturday: '#2563eb',
    holiday: '#dc2626',
  },
  'light-orange': {
    bg: '#fff7ed',
    surface: '#ffedd5',
    text: '#7c2d12',
    textMuted: '#c2410c',
    accent: '#ea580c',
    sunday: '#dc2626',
    saturday: '#2563eb',
    holiday: '#dc2626',
  },
  'light-yellow': {
    bg: '#fefce8',
    surface: '#fef9c3',
    text: '#713f12',
    textMuted: '#a16207',
    accent: '#ca8a04',
    sunday: '#dc2626',
    saturday: '#2563eb',
    holiday: '#dc2626',
  },
  'light-green': {
    bg: '#f0fdf4',
    surface: '#dcfce7',
    text: '#14532d',
    textMuted: '#15803d',
    accent: '#16a34a',
    sunday: '#dc2626',
    saturday: '#2563eb',
    holiday: '#dc2626',
  },
  'light-blue': {
    bg: '#eff6ff',
    surface: '#dbeafe',
    text: '#1e3a8a',
    textMuted: '#1d4ed8',
    accent: '#2563eb',
    sunday: '#dc2626',
    saturday: '#2563eb',
    holiday: '#dc2626',
  },
  'light-purple': {
    bg: '#faf5ff',
    surface: '#f3e8ff',
    text: '#581c87',
    textMuted: '#7c3aed',
    accent: '#9333ea',
    sunday: '#dc2626',
    saturday: '#2563eb',
    holiday: '#dc2626',
  },
  // 暗い系（下段）
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
  'dark-red': {
    bg: '#450a0a',
    surface: '#7f1d1d',
    text: '#fef2f2',
    textMuted: '#fca5a5',
    accent: '#f87171',
    sunday: '#f87171',
    saturday: '#60a5fa',
    holiday: '#f87171',
  },
  'dark-orange': {
    bg: '#431407',
    surface: '#7c2d12',
    text: '#fff7ed',
    textMuted: '#fdba74',
    accent: '#fb923c',
    sunday: '#f87171',
    saturday: '#60a5fa',
    holiday: '#f87171',
  },
  'dark-yellow': {
    bg: '#3d3a04',
    surface: '#5c5512',
    text: '#fefce8',
    textMuted: '#fde047',
    accent: '#facc15',
    sunday: '#f87171',
    saturday: '#60a5fa',
    holiday: '#f87171',
  },
  'dark-green': {
    bg: '#052e16',
    surface: '#14532d',
    text: '#f0fdf4',
    textMuted: '#86efac',
    accent: '#4ade80',
    sunday: '#f87171',
    saturday: '#60a5fa',
    holiday: '#f87171',
  },
  'dark-blue': {
    bg: '#172554',
    surface: '#1e3a8a',
    text: '#eff6ff',
    textMuted: '#93c5fd',
    accent: '#60a5fa',
    sunday: '#f87171',
    saturday: '#60a5fa',
    holiday: '#f87171',
  },
  'dark-purple': {
    bg: '#3b0764',
    surface: '#581c87',
    text: '#faf5ff',
    textMuted: '#d8b4fe',
    accent: '#c084fc',
    sunday: '#f87171',
    saturday: '#60a5fa',
    holiday: '#f87171',
  },
}

/** アプリ設定 */
export interface Settings {
  weekStartsOn: 0 | 1 // 0: 日曜, 1: 月曜
  appTheme: AppTheme // アプリ全体のテーマ（ライト/ダーク）
  calendarTheme: CalendarThemeId // カレンダー画像のテーマ
  gridStyle: GridStyle // グリッド表示スタイル（角丸/罫線）
  language: 'ja' | 'en' | 'zh' | 'ko' | 'ne' | 'th' | 'vi' | 'tl' | 'es' | 'pt' | 'fr'
  country: CountryCode
  shopName: string
  shopLogo: string | null // 店名ロゴ画像（Base64）
  showHolidays: boolean
  showRokuyo: boolean // 六曜を表示
  useWareki: boolean // 和暦を使用
  backgroundImage: string | null // Base64エンコードされた背景画像
  backgroundOpacity: number // 背景画像の透明度 (0-1)
}

/** 月ごとのコメント（キー: "YYYY-MM"） */
export type CalendarComments = Record<string, string>

/** 月ごとのカレンダーテーマ（キー: "YYYY-MM"） */
export type CalendarThemes = Record<string, CalendarThemeId>

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
  calendarComments: CalendarComments
  calendarThemes: CalendarThemes
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
  calendarTheme: 'light',
  gridStyle: 'rounded',
  language: 'ja',
  country: 'JP',
  shopName: '',
  shopLogo: null,
  showHolidays: true,
  showRokuyo: false,
  useWareki: false,
  backgroundImage: null,
  backgroundOpacity: 0.15,
}

/** アプリテーマの色定義 */
export interface AppThemeColors {
  bg: string
  surface: string
  text: string
  textMuted: string
  accent: string
}

export const APP_THEMES: Record<AppTheme, AppThemeColors> = {
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
