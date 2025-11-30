import { useTranslation } from 'react-i18next'
import { QUICK_INPUT_STYLES } from '../lib/types'

interface QuickInputButtonsProps {
  onSelect: (value: string) => void
}

/**
 * 定型入力ボタン（休/◯/△/✕/満）
 */
export function QuickInputButtons({ onSelect }: QuickInputButtonsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {QUICK_INPUT_STYLES.map((style) => {
        const value = t(`quickInput.${style.key}`)
        return (
          <button
            key={style.key}
            onClick={() => onSelect(value)}
            className="rounded px-2 py-1 text-sm transition-opacity hover:opacity-80"
            style={{
              backgroundColor: style.bgColor,
              color: style.textColor,
            }}
          >
            {value}
          </button>
        )
      })}
    </div>
  )
}
