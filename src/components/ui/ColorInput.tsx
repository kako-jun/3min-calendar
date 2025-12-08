import { AppThemeColors } from '../../lib/types'

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  displayValue?: string
  theme: AppThemeColors
}

export function ColorInput({
  label,
  value,
  onChange,
  disabled = false,
  displayValue,
  theme,
}: ColorInputProps) {
  return (
    <div className="flex-1">
      <label className="mb-1 block text-sm" style={{ color: theme.textMuted }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-8 w-12 cursor-pointer rounded border-0 disabled:opacity-50"
        />
        <input
          type="text"
          value={displayValue ?? value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded border px-2 py-1 text-xs disabled:opacity-50"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.textMuted,
            color: theme.text,
          }}
        />
      </div>
    </div>
  )
}
