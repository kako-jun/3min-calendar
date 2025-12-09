/**
 * カレンダーを画像としてキャプチャするユーティリティ
 * Canvas版: Konva Stage.toDataURL()を使用（表示と出力が完全一致）
 */

/**
 * dataURLをBlobに変換
 */
function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',')
  const mime = parts[0]?.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bstr = atob(parts[1] ?? '')
  const n = bstr.length
  const u8arr = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Canvas画像をダウンロード
 */
export function downloadCanvasImage(dataURL: string, filename: string): void {
  const blob = dataURLToBlob(dataURL)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Canvas画像をクリップボードにコピー
 */
export async function copyCanvasImageToClipboard(dataURL: string): Promise<void> {
  const blob = dataURLToBlob(dataURL)
  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': blob,
    }),
  ])
}

/**
 * Canvas画像をWeb Share APIで共有（モバイル用）
 */
export async function shareCanvasImage(dataURL: string, filename: string): Promise<void> {
  const blob = dataURLToBlob(dataURL)

  // Web Share API がサポートされているか確認
  if (!navigator.share || !navigator.canShare) {
    // サポートされていない場合はクリップボードにコピー
    await copyCanvasImageToClipboard(dataURL)
    throw new Error('Web Share API is not supported')
  }

  const file = new File([blob], `${filename}.png`, { type: 'image/png' })
  const shareData = { files: [file], title: filename }

  if (navigator.canShare(shareData)) {
    await navigator.share(shareData)
  } else {
    throw new Error('Cannot share this content')
  }
}
