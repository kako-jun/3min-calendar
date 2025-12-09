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
  const file = new File([blob], `${filename}.png`, { type: 'image/png' })
  const shareData = { files: [file], title: filename }

  // Web Share APIでファイル共有を試行
  if (navigator.share) {
    // canShareがある場合はチェック、ない場合は直接試行
    if (!navigator.canShare || navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (e) {
        // AbortError（ユーザーキャンセル）は再スロー
        if (e instanceof Error && e.name === 'AbortError') {
          throw e
        }
        // その他のエラーはフォールバック
      }
    }
  }

  // フォールバック: クリップボードにコピー
  await copyCanvasImageToClipboard(dataURL)
  throw new Error('Web Share API is not supported')
}
