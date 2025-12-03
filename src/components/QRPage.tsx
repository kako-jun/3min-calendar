import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCode } from 'react-qrcode-logo'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDownload,
  faShareNodes,
  faGear,
  faShieldHalved,
  faImage,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { useCalendarStore } from '../lib/store'
import { APP_THEMES } from '../lib/types'
import { AppHeader } from './AppHeader'
import { SettingsPanel } from './SettingsPanel'

const QR_SIZES = [128, 256, 512] as const
const ERROR_LEVELS = ['L', 'M', 'Q', 'H'] as const
const QR_STYLES = ['squares', 'dots', 'fluid'] as const
const EYE_RADIUS_OPTIONS = [0, 5, 10, 15] as const

type ErrorLevel = (typeof ERROR_LEVELS)[number]
type QRStyle = (typeof QR_STYLES)[number]

// 任天堂風ホワンホワンアニメーション
const qrAnimation = {
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

export function QRPage() {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]

  const [url, setUrl] = useState('')
  const [size, setSize] = useState<(typeof QR_SIZES)[number]>(256)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // カスタマイズオプション
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('H')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [isTransparent, setIsTransparent] = useState(false)
  const [qrStyle, setQrStyle] = useState<QRStyle>('squares')
  const [eyeRadius, setEyeRadius] = useState<(typeof EYE_RADIUS_OPTIONS)[number]>(0)
  const [logoImage, setLogoImage] = useState<string | null>(null)

  const qrRef = useRef<HTMLDivElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const isValidUrl = url.trim().length > 0

  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRemoveLogo = useCallback(() => {
    setLogoImage(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }, [])

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
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      alert(t('messages.copied'))
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  // 色反転ボタン
  const handleInvertColors = () => {
    const tempFg = fgColor
    setFgColor(bgColor)
    setBgColor(tempFg)
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
        <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
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

      {/* カスタマイズオプション */}
      <div className="mb-4 space-y-3">
        {/* サイズ & 誤り訂正レベル */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
              {t('qr.sizeLabel')}
            </label>
            <div className="flex gap-1">
              {QR_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
                    size === s ? 'ring-2' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: appTheme.surface,
                    color: appTheme.text,
                    // @ts-expect-error CSS custom property for Tailwind ring color
                    '--tw-ring-color': appTheme.accent,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
              {t('qr.errorLevel')}
            </label>
            <div className="flex gap-1">
              {ERROR_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setErrorLevel(level)}
                  className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
                    errorLevel === level ? 'ring-2' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: appTheme.surface,
                    color: appTheme.text,
                    // @ts-expect-error CSS custom property for Tailwind ring color
                    '--tw-ring-color': appTheme.accent,
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 色設定 */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
              {t('qr.fgColor')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border-0"
              />
              <input
                type="text"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-full rounded border px-2 py-1 text-xs"
                style={{
                  backgroundColor: appTheme.surface,
                  borderColor: appTheme.textMuted,
                  color: appTheme.text,
                }}
              />
            </div>
          </div>
          <button
            onClick={handleInvertColors}
            className="mb-1 rounded px-2 py-1 text-xs transition-opacity hover:opacity-70"
            style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
            title={t('qr.invert')}
          >
            ⇄
          </button>
          <div className="flex-1">
            <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
              {t('qr.bgColor')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                disabled={isTransparent}
                className="h-8 w-12 cursor-pointer rounded border-0 disabled:opacity-50"
              />
              <input
                type="text"
                value={isTransparent ? 'transparent' : bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                disabled={isTransparent}
                className="w-full rounded border px-2 py-1 text-xs disabled:opacity-50"
                style={{
                  backgroundColor: appTheme.surface,
                  borderColor: appTheme.textMuted,
                  color: appTheme.text,
                }}
              />
            </div>
          </div>
        </div>

        {/* 透過チェックボックス */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isTransparent}
            onChange={(e) => setIsTransparent(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm" style={{ color: appTheme.text }}>
            {t('qr.transparent')}
          </span>
        </label>

        {/* スタイル & 角丸 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
              {t('qr.style')}
            </label>
            <div className="flex gap-1">
              {QR_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setQrStyle(style)}
                  className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
                    qrStyle === style ? 'ring-2' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: appTheme.surface,
                    color: appTheme.text,
                    // @ts-expect-error CSS custom property for Tailwind ring color
                    '--tw-ring-color': appTheme.accent,
                  }}
                >
                  {t(`qr.styles.${style}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
              {t('qr.eyeRadius')}
            </label>
            <div className="flex gap-1">
              {EYE_RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setEyeRadius(r)}
                  className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
                    eyeRadius === r ? 'ring-2' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: appTheme.surface,
                    color: appTheme.text,
                    // @ts-expect-error CSS custom property for Tailwind ring color
                    '--tw-ring-color': appTheme.accent,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ロゴ設定 */}
        <div>
          <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
            {t('qr.logo')}
          </label>
          <div className="flex items-center gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
              id="logo-input"
            />
            <label
              htmlFor="logo-input"
              className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
            >
              <FontAwesomeIcon icon={faImage} />
              {t('qr.selectLogo')}
            </label>
            {logoImage && (
              <>
                <img src={logoImage} alt="Logo" className="h-8 w-8 rounded object-contain" />
                <button
                  onClick={handleRemoveLogo}
                  className="rounded p-1 text-red-500 transition-opacity hover:opacity-70"
                  title={t('qr.removeLogo')}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* QRコード表示 */}
      <div
        className="relative mb-4 flex items-center justify-center rounded p-4"
        style={{
          backgroundColor: isTransparent
            ? `repeating-conic-gradient(${appTheme.textMuted}22 0% 25%, ${appTheme.surface} 0% 50%) 50% / 16px 16px`
            : appTheme.surface,
        }}
      >
        <div ref={qrRef} style={{ width: size, height: size }}>
          <AnimatePresence mode="wait">
            {isValidUrl ? (
              <motion.div
                key={`${url}-${fgColor}-${bgColor}-${isTransparent}-${qrStyle}-${eyeRadius}-${logoImage}`}
                variants={qrAnimation}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <QRCode
                  value={url}
                  size={size}
                  ecLevel={errorLevel}
                  bgColor={isTransparent ? 'transparent' : bgColor}
                  fgColor={fgColor}
                  qrStyle={qrStyle}
                  eyeRadius={eyeRadius}
                  logoImage={logoImage || undefined}
                  logoWidth={size * 0.25}
                  logoHeight={size * 0.25}
                  removeQrCodeBehindLogo
                  logoPaddingStyle="circle"
                />
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                variants={qrAnimation}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center justify-center"
                style={{
                  width: size,
                  height: size,
                  color: appTheme.textMuted,
                }}
              >
                <span className="text-sm">{t('qr.urlPlaceholder')}</span>
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* 安全性アピール */}
      <div
        className="mb-4 rounded p-3 text-center text-xs"
        style={{ backgroundColor: appTheme.surface, color: appTheme.textMuted }}
      >
        <div className="mb-2 flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faShieldHalved} className="text-green-500" />
          <span>{t('qr.safety')}</span>
        </div>
        <a
          href="https://github.com/kako-jun/3min-calendar"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline transition-opacity hover:opacity-70"
          style={{ color: appTheme.accent }}
        >
          <FontAwesomeIcon icon={faGithub} />
          {t('qr.openSource')}
        </a>
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
