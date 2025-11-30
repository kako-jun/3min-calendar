/**
 * カレンダーを正方形画像としてキャプチャするユーティリティ
 * 画面表示と完全一致させるため、要素をそのままキャプチャしてスケールアップ
 */

/**
 * HTML要素をBlobとしてキャプチャ（Instagram用1080x1080）
 * 画面表示を2倍にスケールアップして高解像度化
 */
export async function captureElementAsBlob(element: HTMLElement): Promise<Blob | null> {
  try {
    const html2canvas = (await import('html2canvas')).default

    // 要素の背景色を取得
    const computedStyle = window.getComputedStyle(element)
    const bgColor = computedStyle.backgroundColor || '#1f2937'

    // 要素をそのままキャプチャ（scale: 2で1080px相当に）
    const canvas = await html2canvas(element, {
      backgroundColor: bgColor,
      scale: 2, // 500px * 2 = 1000px（≒1080px）
      logging: false,
      useCORS: true,
      allowTaint: true,
      removeContainer: true,
    })

    // Blobに変換
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  } catch (error) {
    console.error('キャプチャに失敗:', error)
    return null
  }
}

/**
 * 画像をダウンロード
 */
export async function downloadImage(element: HTMLElement, filename: string): Promise<void> {
  const blob = await captureElementAsBlob(element)
  if (!blob) return

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
 * 画像をクリップボードにコピー
 */
export async function copyImageToClipboard(element: HTMLElement): Promise<void> {
  const blob = await captureElementAsBlob(element)
  if (!blob) throw new Error('キャプチャに失敗')

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': blob,
    }),
  ])
}

/**
 * 画像をWeb Share APIで共有（モバイル用）
 */
export async function shareImage(element: HTMLElement, filename: string): Promise<void> {
  const blob = await captureElementAsBlob(element)
  if (!blob) throw new Error('キャプチャに失敗')

  // Web Share API がサポートされているか確認
  if (!navigator.share || !navigator.canShare) {
    // サポートされていない場合はクリップボードにコピー
    await copyImageToClipboard(element)
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
