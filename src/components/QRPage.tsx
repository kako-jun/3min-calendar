import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeCanvas } from 'qrcode.react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faShareNodes, faGear } from '@fortawesome/free-solid-svg-icons'
import { useCalendarStore } from '../lib/store'
import { APP_THEMES } from '../lib/types'
import { AppHeader } from './AppHeader'
import { SettingsPanel } from './SettingsPanel'

const QR_SIZES = [128, 256, 512] as const

export function QRPage() {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]

  const [url, setUrl] = useState('')
  const [size, setSize] = useState<(typeof QR_SIZES)[number]>(256)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const isValidUrl = url.trim().length > 0

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = dataUrl
    link.click()
  }

  const handleShare = async () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) return

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'qrcode.png', { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: '3 min. QR',
          })
          return
        }
      }

      // フォールバック: クリップボードにコピー
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      alert(t('messages.copied'))
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between">
        <AppHeader />
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="rounded p-2 transition-opacity hover:opacity-70"
          style={{ color: appTheme.textMuted }}
        >
          <FontAwesomeIcon icon={faGear} />
        </button>
      </div>

      {/* URL入力 */}
      <div className="mb-4">
        <label
          className="mb-1 block text-sm"
          style={{ color: appTheme.textMuted }}
        >
          {t('qr.urlLabel')}
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('qr.urlPlaceholder')}
          className="w-full rounded border px-3 py-2"
          style={{
            backgroundColor: appTheme.surface,
            borderColor: appTheme.textMuted,
            color: appTheme.text,
          }}
        />
      </div>

      {/* サイズ選択 */}
      <div className="mb-4">
        <label
          className="mb-1 block text-sm"
          style={{ color: appTheme.textMuted }}
        >
          {t('qr.sizeLabel')}
        </label>
        <div className="flex gap-2">
          {QR_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                size === s ? 'ring-2' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: appTheme.surface,
                color: appTheme.text,
                // @ts-expect-error CSS custom property for Tailwind ring color
                '--tw-ring-color': appTheme.accent,
              }}
            >
              {s}px
            </button>
          ))}
        </div>
      </div>

      {/* QRコード表示 */}
      <div
        className="mb-4 flex items-center justify-center rounded p-4"
        style={{ backgroundColor: appTheme.surface }}
      >
        <div ref={qrRef}>
          {isValidUrl ? (
            <QRCodeCanvas
              value={url}
              size={size}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{
                width: size,
                height: size,
                color: appTheme.textMuted,
              }}
            >
              <span className="text-sm">{t('qr.urlPlaceholder')}</span>
            </div>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={handleShare}
          disabled={!isValidUrl}
          className="flex flex-1 items-center justify-center gap-2 rounded py-3 text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{
            backgroundColor: appTheme.accent,
            color: '#ffffff',
          }}
        >
          <FontAwesomeIcon icon={faShareNodes} />
          {t('actions.share')}
        </button>
        <button
          onClick={handleDownload}
          disabled={!isValidUrl}
          className="flex flex-1 items-center justify-center gap-2 rounded py-3 text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{
            backgroundColor: appTheme.surface,
            color: appTheme.text,
          }}
        >
          <FontAwesomeIcon icon={faDownload} />
          {t('actions.download')}
        </button>
      </div>

      {/* 商標表記 */}
      <footer className="text-center text-xs" style={{ color: appTheme.textMuted }}>
        {t('qr.trademark')}
      </footer>

      {/* 設定パネル */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
