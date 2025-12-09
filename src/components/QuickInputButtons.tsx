import { useTranslation } from 'react-i18next'
import { SYMBOL_STYLES, STAMP_STYLES } from '../lib/types'
import { STAMP_ICONS } from './ui/StampIcons'

interface QuickInputButtonsProps {
  selectedSymbol: string | null
  selectedStamp: string | null
  onSymbolSelect: (symbolKey: string | null) => void
  onStampSelect: (stampKey: string | null) => void
}

/**
 * 定型入力ボタン（◯/△/✕ | 満/休）
 * 記号系（背景表示）とスタンプ系（左上表示）は排他ではない
 */
export function QuickInputButtons({
  selectedSymbol,
  selectedStamp,
  onSymbolSelect,
  onStampSelect,
}: QuickInputButtonsProps) {
  const { t } = useTranslation()

  const renderSymbolButton = (style: (typeof SYMBOL_STYLES)[0]) => {
    const IconComponent = STAMP_ICONS[style.key]
    const displayValue = IconComponent ? null : t(`quickInput.${style.key}`)
    const isSelected = selectedSymbol === style.key
    return (
      <button
        key={style.key}
        onClick={() => onSymbolSelect(isSelected ? null : style.key)}
        className={`rounded px-2 py-1 text-sm transition-all ${
          isSelected ? 'shadow-inner ring-2 ring-offset-1' : 'hover:opacity-80'
        }`}
        style={{
          backgroundColor: style.bgColor,
          color: style.textColor,
          opacity: isSelected ? 1 : 0.7,
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          // @ts-expect-error ring-offset-color
          '--tw-ring-color': style.bgColor,
          '--tw-ring-offset-color': 'white',
        }}
      >
        {IconComponent ? <IconComponent /> : displayValue}
      </button>
    )
  }

  const renderStampButton = (style: (typeof STAMP_STYLES)[0]) => {
    const IconComponent = STAMP_ICONS[style.key]
    const displayValue = IconComponent ? null : t(`quickInput.${style.key}`)
    const isSelected = selectedStamp === style.key
    return (
      <button
        key={style.key}
        onClick={() => onStampSelect(isSelected ? null : style.key)}
        className={`rounded px-2 py-1 text-sm transition-all ${
          isSelected ? 'shadow-inner ring-2 ring-offset-1' : 'hover:opacity-80'
        }`}
        style={{
          backgroundColor: style.bgColor,
          color: style.textColor,
          opacity: isSelected ? 1 : 0.7,
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          // @ts-expect-error ring-offset-color
          '--tw-ring-color': style.bgColor,
          '--tw-ring-offset-color': 'white',
        }}
      >
        {IconComponent ? <IconComponent /> : displayValue}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {/* 記号系: ◯ △ ✕ */}
      {SYMBOL_STYLES.map(renderSymbolButton)}
      {/* スペーサー */}
      <div className="w-3" />
      {/* スタンプ系: 満 休 */}
      {STAMP_STYLES.map(renderStampButton)}
    </div>
  )
}
