import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSmile } from '@fortawesome/free-solid-svg-icons'
import { APP_THEMES, type AppTheme } from '../lib/types'

/** 絵文字カテゴリ定義 */
const EMOJI_CATEGORIES = {
  events: ['🎉', '🎊', '🎁', '🎂', '🎃', '🎄', '🎅', '🐰', '🐣', '🎍', '🎋', '🎇', '🎆'],
  food: ['☕', '🍵', '🍻', '🍺', '🍷', '🍴', '🍽️', '🍜', '🍕', '🍔', '🍰', '🍩', '🍦'],
  beauty: ['💈', '💇', '💆', '💅', '✂️', '🪮', '💄', '👗', '👠', '👜', '💍', '🎀'],
  nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🍀', '🌴', '🌈', '☀️', '🌙', '⭐'],
  symbols: ['❤️', '💕', '✨', '🔥', '💯', '⭐', '⚡', '💡', '📢', '📌', '📍', '🆕'],
  status: ['⭕', '❌', '⚠️', '🚫', '✅', '🔴', '🟢', '🟡', '🔵', '⬛', '⬜', 'ℹ️'],
  faces: ['😊', '😄', '🥰', '😍', '🤗', '😋', '🤤', '😎', '🥳', '😴', '🤔', '👋'],
  hands: ['👍', '👎', '👏', '🙏', '🤝', '✌️', '🤞', '👌', '✋', '👊', '💪', '🙌'],
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  appTheme: AppTheme
}

export function EmojiPicker({ onSelect, appTheme }: EmojiPickerProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('events')
  const containerRef = useRef<HTMLDivElement>(null)
  const theme = APP_THEMES[appTheme]

  // クリック外側で閉じる
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const categoryKeys = Object.keys(EMOJI_CATEGORIES) as (keyof typeof EMOJI_CATEGORIES)[]

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* トリガーボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded px-2 py-0.5 text-sm transition-opacity hover:opacity-80"
        style={{ backgroundColor: theme.bg, color: theme.text }}
        title={t('emoji.title')}
      >
        <FontAwesomeIcon icon={faSmile} />
      </button>

      {/* ポップアップ */}
      {isOpen && (
        <div
          className="absolute bottom-full right-0 z-50 mb-1 w-64 rounded-lg shadow-xl"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.textMuted}` }}
        >
          {/* カテゴリタブ */}
          <div
            className="flex flex-wrap gap-1 border-b p-2"
            style={{ borderColor: theme.textMuted }}
          >
            {categoryKeys.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="rounded px-2 py-1 text-xs transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: selectedCategory === cat ? theme.accent : theme.bg,
                  color: selectedCategory === cat ? '#ffffff' : theme.text,
                }}
              >
                {t(`emoji.categories.${cat}`)}
              </button>
            ))}
          </div>

          {/* 絵文字グリッド */}
          <div className="grid max-h-40 grid-cols-6 gap-1 overflow-y-auto p-2">
            {EMOJI_CATEGORIES[selectedCategory].map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className="rounded p-1 text-xl transition-colors hover:bg-opacity-50"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.bg)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
