import { AppThemeColors } from '../../lib/types'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  theme: AppThemeColors
  leftLabel?: string
  rightLabel?: string
}

export function ToggleSwitch({
  checked,
  onChange,
  theme,
  leftLabel,
  rightLabel,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-2">
      {leftLabel && (
        <span style={{ color: !checked ? theme.text : theme.textMuted }}>{leftLabel}</span>
      )}
      <button
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 rounded-full transition-colors"
        style={{ backgroundColor: checked ? theme.accent : theme.bg }}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      {rightLabel && (
        <span style={{ color: checked ? theme.text : theme.textMuted }}>{rightLabel}</span>
      )}
    </div>
  )
}
