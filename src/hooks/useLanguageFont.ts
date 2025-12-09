import { useEffect } from 'react'
import type { Settings } from '../lib/types'

/**
 * 言語に応じたWebフォントを動的に読み込むフック
 * 各言語を選択した時のみフォントがダウンロードされる
 */
export function useLanguageFont(language: Settings['language']) {
  useEffect(() => {
    // フォントURL（Google Fonts）
    const fontUrls: Partial<Record<Settings['language'], string>> = {
      ko: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap',
      th: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;700&display=swap',
      ne: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;700&display=swap',
      vi: 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&display=swap',
    }

    const fontUrl = fontUrls[language]
    if (!fontUrl) return

    // 既に読み込み済みかチェック
    const linkId = `lang-font-${language}`
    if (document.getElementById(linkId)) return

    // link要素を作成してheadに追加
    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = fontUrl
    document.head.appendChild(link)

    // クリーンアップは不要（一度読み込んだフォントはそのまま保持）
  }, [language])
}

/**
 * 言語に応じたフォントファミリーを返す
 */
export function getFontFamily(language: Settings['language']): string {
  const baseFonts = "Inter, 'Zen Kaku Gothic Antique', system-ui, sans-serif"

  switch (language) {
    case 'ja':
      return `Inter, 'Zen Kaku Gothic Antique', system-ui, sans-serif`
    case 'zh':
      return `Inter, 'Noto Sans SC', 'Zen Kaku Gothic Antique', system-ui, sans-serif`
    case 'ko':
      return `Inter, 'Noto Sans KR', system-ui, sans-serif`
    case 'th':
      return `Inter, 'Noto Sans Thai', system-ui, sans-serif`
    case 'ne':
      return `Inter, 'Noto Sans Devanagari', system-ui, sans-serif`
    case 'vi':
      return `Inter, 'Noto Sans', system-ui, sans-serif`
    default:
      return baseFonts
  }
}
