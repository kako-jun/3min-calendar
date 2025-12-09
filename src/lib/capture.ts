/**
 * カレンダーを画像としてキャプチャするユーティリティ
 * デスクトップ: Screen Capture APIを使用
 * モバイル: html2canvasを使用（Screen Capture APIがサポートされていないため）
 */

import html2canvas from 'html2canvas'

/** キャプチャ時の拡大倍率 */
const CAPTURE_SCALE = 2

/** モバイルデバイスかどうかを判定 */
function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/** Screen Capture APIがサポートされているか判定 */
function isScreenCaptureSupported(): boolean {
  return !!(navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) && !isMobile()
}

/**
 * html2canvasを使用して要素をキャプチャ（モバイル向け）
 */
async function captureWithHtml2Canvas(element: HTMLElement): Promise<Blob | null> {
  try {
    // キャプチャ前に選択枠を非表示にする
    const selectionElement = element.querySelector('[data-selection-frame]') as HTMLElement | null
    if (selectionElement) {
      selectionElement.style.display = 'none'
    }

    const canvas = await html2canvas(element, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    })

    // 選択枠を復元
    if (selectionElement) {
      selectionElement.style.display = ''
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  } catch (error) {
    console.error('html2canvas キャプチャに失敗:', error)
    return null
  }
}

/**
 * Screen Capture APIを使用して要素をキャプチャ（デスクトップ向け）
 * CSS zoomで拡大して高解像度化、要素以外は黒背景で隠す
 */
async function captureWithScreenCapture(element: HTMLElement): Promise<Blob | null> {
  let stream: MediaStream | null = null
  let overlay: HTMLDivElement | null = null
  const originalBodyOverflow = document.body.style.overflow
  const originalElementStyle = {
    position: element.style.position,
    top: element.style.top,
    left: element.style.left,
    zIndex: element.style.zIndex,
    zoom: element.style.zoom,
    margin: element.style.margin,
    cursor: element.style.cursor,
  }
  const originalBodyCursor = document.body.style.cursor

  try {
    // キャプチャ前に選択枠を非表示にする
    const selectionElement = element.querySelector('[data-selection-frame]') as HTMLElement | null
    if (selectionElement) {
      selectionElement.style.display = 'none'
    }

    // 要素の現在のサイズを取得
    const rect = element.getBoundingClientRect()

    // 画面サイズに収まる最大のzoom倍率を計算（最大CAPTURE_SCALE倍）
    const maxZoomX = window.innerWidth / rect.width
    const maxZoomY = window.innerHeight / rect.height
    const actualScale = Math.min(CAPTURE_SCALE, maxZoomX, maxZoomY)

    // 黒背景オーバーレイを作成（要素以外を隠す）
    overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: black;
      z-index: 999998;
      cursor: none;
    `
    document.body.appendChild(overlay)

    // カーソルを非表示にする
    document.body.style.cursor = 'none'
    element.style.cursor = 'none'

    // 要素を左上に固定配置してzoomで拡大
    element.style.position = 'fixed'
    element.style.top = '0'
    element.style.left = '0'
    element.style.zIndex = '999999'
    element.style.zoom = `${actualScale}`
    element.style.margin = '0'

    // スクロールを防止
    document.body.style.overflow = 'hidden'

    // レイアウトが確定するのを待つ
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Screen Capture APIで画面をキャプチャ（カーソル非表示）
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser',
        cursor: 'never',
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

    // オーバーレイを削除、スタイルを復元
    if (overlay) {
      document.body.removeChild(overlay)
      overlay = null
    }
    element.style.position = originalElementStyle.position
    element.style.top = originalElementStyle.top
    element.style.left = originalElementStyle.left
    element.style.zIndex = originalElementStyle.zIndex
    element.style.zoom = originalElementStyle.zoom
    element.style.margin = originalElementStyle.margin
    element.style.cursor = originalElementStyle.cursor
    document.body.style.overflow = originalBodyOverflow
    document.body.style.cursor = originalBodyCursor

    // 選択枠を復元
    if (selectionElement) {
      selectionElement.style.display = ''
    }

    // キャプチャした画像から要素部分を切り出す
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')

    // キャプチャ画像のスケールを計算（ビデオサイズとウィンドウサイズの比率）
    const videoScale = tempCanvas.width / window.innerWidth

    // zoomで拡大された要素のサイズ（左上から）
    const zoomedWidth = rect.width * actualScale
    const zoomedHeight = rect.height * actualScale

    // ソース領域（左上(0,0)からzoomされたサイズ分）
    const sourceWidth = zoomedWidth * videoScale
    const sourceHeight = zoomedHeight * videoScale

    // 出力サイズ
    canvas.width = sourceWidth
    canvas.height = sourceHeight

    // 切り出して描画
    ctx.drawImage(tempCanvas, 0, 0, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)

    // Blobに変換
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  } catch (error) {
    // ストリームを停止
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    // オーバーレイを削除
    if (overlay && overlay.parentNode) {
      document.body.removeChild(overlay)
    }

    // スタイルを復元
    element.style.position = originalElementStyle.position
    element.style.top = originalElementStyle.top
    element.style.left = originalElementStyle.left
    element.style.zIndex = originalElementStyle.zIndex
    element.style.zoom = originalElementStyle.zoom
    element.style.margin = originalElementStyle.margin
    element.style.cursor = originalElementStyle.cursor
    document.body.style.overflow = originalBodyOverflow
    document.body.style.cursor = originalBodyCursor

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
 * 要素を画像としてキャプチャ
 * デスクトップではScreen Capture API、モバイルではhtml2canvasを使用
 */
export async function captureElementAsBlob(element: HTMLElement): Promise<Blob | null> {
  if (isScreenCaptureSupported()) {
    return captureWithScreenCapture(element)
  } else {
    return captureWithHtml2Canvas(element)
  }
}

/**
 * 画像をダウンロード
 */
export async function downloadImage(element: HTMLElement, filename: string): Promise<void> {
  const blob = await captureElementAsBlob(element)
  if (!blob) throw new Error('キャプチャに失敗')

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
