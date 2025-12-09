/**
 * カレンダーを画像としてキャプチャするユーティリティ
 * Screen Capture APIを使用してブラウザの実際の表示をそのままキャプチャ
 */

/**
 * Screen Capture APIを使用して要素をキャプチャ
 */
export async function captureElementAsBlob(element: HTMLElement): Promise<Blob | null> {
  let stream: MediaStream | null = null

  try {
    // キャプチャ前に選択枠を非表示にする
    const selectionElement = element.querySelector('[data-selection-frame]') as HTMLElement | null
    if (selectionElement) {
      selectionElement.style.display = 'none'
    }

    // 要素の位置とサイズを取得
    const rect = element.getBoundingClientRect()

    // Screen Capture APIで画面をキャプチャ
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser',
      },
      preferCurrentTab: true,
    } as DisplayMediaStreamOptions)

    // ビデオトラックを取得
    const track = stream.getVideoTracks()[0]
    if (!track) throw new Error('No video track available')

    // VideoElementを使ってフレームを取得
    const video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    await video.play()

    // フレームが安定するまで少し待つ
    await new Promise((resolve) => setTimeout(resolve, 100))

    // ビデオからCanvasにキャプチャ
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = video.videoWidth
    tempCanvas.height = video.videoHeight
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) throw new Error('Canvas context not available')
    tempCtx.drawImage(video, 0, 0)

    // ストリームを停止
    track.stop()
    video.srcObject = null
    stream = null

    // 選択枠を復元
    if (selectionElement) {
      selectionElement.style.display = ''
    }

    // キャプチャした画像から要素部分を切り出す
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')

    // 出力サイズ（元のサイズの2倍）
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2

    // キャプチャ画像のスケールを計算（ビデオサイズとウィンドウサイズの比率）
    const scaleX = tempCanvas.width / window.innerWidth
    const scaleY = tempCanvas.height / window.innerHeight

    // 要素の位置（viewportからの相対位置）
    const sourceX = rect.left * scaleX
    const sourceY = rect.top * scaleY
    const sourceWidth = rect.width * scaleX
    const sourceHeight = rect.height * scaleY

    // 切り出して描画（2倍に拡大）
    ctx.drawImage(
      tempCanvas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    )

    // Blobに変換
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  } catch (error) {
    // ストリームを停止
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    // 選択枠を復元
    const selectionElement = element.querySelector('[data-selection-frame]') as HTMLElement | null
    if (selectionElement) {
      selectionElement.style.display = ''
    }

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
