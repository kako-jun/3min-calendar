import { THEMES, type ThemeId, type ThemeColors } from './types'

/**
 * テーマIDからテーマカラーを取得
 */
export function getTheme(themeId: ThemeId): ThemeColors {
  return THEMES[themeId]
}

/**
 * CSS変数としてテーマを適用
 */
export function applyThemeToDocument(themeId: ThemeId): void {
  const theme = getTheme(themeId)
  const root = document.documentElement
  root.style.setProperty('--color-bg', theme.bg)
  root.style.setProperty('--color-surface', theme.surface)
  root.style.setProperty('--color-text', theme.text)
  root.style.setProperty('--color-text-muted', theme.textMuted)
  root.style.setProperty('--color-accent', theme.accent)
  root.style.setProperty('--color-sunday', theme.sunday)
  root.style.setProperty('--color-saturday', theme.saturday)
  root.style.setProperty('--color-holiday', theme.holiday)
}

/**
 * テーマ名の翻訳キー
 */
export const THEME_NAMES: Record<ThemeId, string> = {
  dark: 'themes.dark',
  light: 'themes.light',
  cafe: 'themes.cafe',
  nature: 'themes.nature',
  ocean: 'themes.ocean',
  sunset: 'themes.sunset',
}
