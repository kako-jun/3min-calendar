import { useTranslation } from 'react-i18next'

interface QuickInputButtonsProps {
  onSelect: (value: string) => void
}

/**
 * 定型入力ボタン（休/◯/△/✕/満）
 */
export function QuickInputButtons({ onSelect }: QuickInputButtonsProps) {
  const { t } = useTranslation()

  const buttons = [
    { key: 'closed', value: t('quickInput.closed'), color: 'bg-gray-600 hover:bg-gray-500' },
    {
      key: 'available',
      value: t('quickInput.available'),
      color: 'bg-green-600 hover:bg-green-500',
    },
    { key: 'few', value: t('quickInput.few'), color: 'bg-yellow-600 hover:bg-yellow-500' },
    { key: 'reserved', value: t('quickInput.reserved'), color: 'bg-red-600 hover:bg-red-500' },
    { key: 'full', value: t('quickInput.full'), color: 'bg-purple-600 hover:bg-purple-500' },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {buttons.map((btn) => (
        <button
          key={btn.key}
          onClick={() => onSelect(btn.value)}
          className={`rounded px-2 py-1 text-sm text-white transition-colors ${btn.color}`}
        >
          {btn.value}
        </button>
      ))}
    </div>
  )
}
