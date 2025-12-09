interface IconProps {
  size?: number
}

export function CircleIcon({ size = 14 }: IconProps) {
  const strokeWidth = size > 10 ? 2 : 1.5
  const r = (size - strokeWidth * 2) / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      <circle cx={size / 2} cy={size / 2} r={r} />
    </svg>
  )
}

export function TriangleIcon({ size = 14 }: IconProps) {
  const strokeWidth = size > 10 ? 2 : 1.5
  const margin = strokeWidth
  // 正三角形: 辺の長さ s に対して高さ h = s * √3 / 2
  const sideLength = size - margin * 2
  const height = (sideLength * Math.sqrt(3)) / 2
  const centerX = size / 2
  const centerY = size / 2
  // 頂点座標
  const topY = centerY - height / 2
  const bottomY = centerY + height / 2
  const leftX = centerX - sideLength / 2
  const rightX = centerX + sideLength / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      <path d={`M${centerX} ${topY}L${rightX} ${bottomY}H${leftX}Z`} strokeLinejoin="round" />
    </svg>
  )
}

export function XIcon({ size = 14 }: IconProps) {
  const strokeWidth = size > 10 ? 2 : 1.5
  const margin = size * 0.2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      <path
        d={`M${margin} ${margin}L${size - margin} ${size - margin}M${size - margin} ${margin}L${margin} ${size - margin}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

// キーに応じたアイコンコンポーネントを返す
export const STAMP_ICONS: Record<string, React.ComponentType<IconProps>> = {
  available: CircleIcon,
  few: TriangleIcon,
  reserved: XIcon,
}
