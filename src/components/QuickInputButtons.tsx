import { useTranslation } from 'react-i18next'
import { QUICK_INPUT_STYLES, formatStampTag } from '../lib/types'

interface QuickInputButtonsProps {
  onSelect: (value: string) => void
}

/**
 * 定型入力ボタン（[休]/[◯]/[△]/[✕]/[満]）
 * クリックするとタグ形式で値を返す
 */
export function QuickInputButtons({ onSelect }: QuickInputButtonsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {QUICK_INPUT_STYLES.map((style) => {
        const displayValue = t(`quickInput.${style.key}`)
        const tagValue = formatStampTag(style.key, t)
        return (
          <button
            key={style.key}
            onClick={() => onSelect(tagValue)}
            className="rounded px-2 py-1 text-sm transition-opacity hover:opacity-80"
            style={{
              backgroundColor: style.bgColor,
              color: style.textColor,
            }}
          >
            {displayValue}
          </button>
        )
      })}
    </div>
  )
}
