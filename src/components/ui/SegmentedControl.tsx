import { AppThemeColors } from '../../lib/types'

interface SegmentedControlProps<T extends string | number> {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  getLabel?: (option: T) => string
  theme: AppThemeColors
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  getLabel = (option) => String(option),
  theme,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex gap-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
            value === option ? 'ring-2' : 'opacity-70 hover:opacity-100'
          }`}
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            // @ts-expect-error CSS custom property for Tailwind ring color
            '--tw-ring-color': theme.accent,
          }}
        >
          {getLabel(option)}
        </button>
      ))}
    </div>
  )
}
