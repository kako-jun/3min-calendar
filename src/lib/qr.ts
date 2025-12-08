// QRコード関連の定数と型定義

export const QR_SIZES = [128, 256, 512] as const
export const QR_STYLES = ['squares', 'dots', 'fluid'] as const
export const EYE_STYLES = ['square', 'rounded', 'circle'] as const

export type QRSize = (typeof QR_SIZES)[number]
export type QRStyle = (typeof QR_STYLES)[number]
export type EyeStyle = (typeof EYE_STYLES)[number]

// サイズに応じてeyeRadiusを自動計算
export const getEyeRadius = (size: number, style: EyeStyle): number => {
  const moduleSize = size / 21 // Version 1想定
  const eyeSize = moduleSize * 7
  switch (style) {
    case 'square':
      return 0
    case 'rounded':
      return eyeSize * 0.2 // 軽く丸める
    case 'circle':
      return eyeSize / 2 // 完全な円
  }
}

// ロゴサイズを計算（アスペクト比を維持）
export const getLogoSize = (
  qrSize: number,
  aspectRatio: number
): { width: number; height: number } => {
  const maxSize = qrSize * 0.25
  if (aspectRatio >= 1) {
    return { width: maxSize, height: maxSize / aspectRatio }
  }
  return { width: maxSize * aspectRatio, height: maxSize }
}

// 任天堂風ホワンホワンアニメーション
export const qrAnimation = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 15,
    },
  },
  exit: { scale: 0.8, opacity: 0 },
}
