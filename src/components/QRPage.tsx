import { useState, useRef } from 'react'
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
import {
  QR_SIZES,
  QR_STYLES,
  EYE_STYLES,
  QRSize,
  QRStyle,
  EyeStyle,
  getEyeRadius,
  getLogoSize,
  qrAnimation,
} from '../lib/qr'
import { useLogoImage } from '../hooks/useLogoImage'
import { AppHeader } from './AppHeader'
import { SettingsPanel } from './SettingsPanel'
import { SegmentedControl } from './ui/SegmentedControl'
import { ColorInput } from './ui/ColorInput'

export function QRPage() {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]

  const [url, setUrl] = useState('')
  const [size, setSize] = useState<QRSize>(256)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // カスタマイズオプション
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [isTransparent, setIsTransparent] = useState(false)
  const [qrStyle, setQrStyle] = useState<QRStyle>('squares')
  const [eyeStyle, setEyeStyle] = useState<EyeStyle>('square')

  const {
    logoImage,
    logoAspectRatio,
    inputRef: logoInputRef,
    handleSelect: handleLogoSelect,
    handleRemove: handleRemoveLogo,
  } = useLogoImage()

  const qrRef = useRef<HTMLDivElement>(null)
  const isValidUrl = url.trim().length > 0
  const logoSize = getLogoSize(size, logoAspectRatio)

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = canvas.toDataURL('image/png')
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
          await navigator.share({ files: [file], title: '3 min. QR' })
          return
        }
      }

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      alert(t('messages.copied'))
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleInvertColors = () => {
    setFgColor(bgColor)
    setBgColor(fgColor)
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
        {/* サイズ */}
        <div>
          <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
            {t('qr.sizeLabel')}
          </label>
          <SegmentedControl options={QR_SIZES} value={size} onChange={setSize} theme={appTheme} />
        </div>

        {/* 色設定 */}
        <div className="flex items-end gap-2">
          <ColorInput
            label={t('qr.fgColor')}
            value={fgColor}
            onChange={setFgColor}
            theme={appTheme}
          />
          <button
            onClick={handleInvertColors}
            className="mb-1 rounded px-2 py-1 text-xs transition-opacity hover:opacity-70"
            style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
            title={t('qr.invert')}
          >
            ⇄
          </button>
          <ColorInput
            label={t('qr.bgColor')}
            value={bgColor}
            onChange={setBgColor}
            disabled={isTransparent}
            displayValue={isTransparent ? 'transparent' : undefined}
            theme={appTheme}
          />
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

        {/* スタイル & 目の形 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
              {t('qr.style')}
            </label>
            <SegmentedControl
              options={QR_STYLES}
              value={qrStyle}
              onChange={setQrStyle}
              getLabel={(style) => t(`qr.styles.${style}`)}
              theme={appTheme}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
              {t('qr.eyeStyle')}
            </label>
            <SegmentedControl
              options={EYE_STYLES}
              value={eyeStyle}
              onChange={setEyeStyle}
              getLabel={(style) => t(`qr.eyeStyles.${style}`)}
              theme={appTheme}
            />
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
                key={`${url}-${fgColor}-${bgColor}-${isTransparent}-${qrStyle}-${eyeStyle}-${logoImage}`}
                variants={qrAnimation}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <QRCode
                  value={url}
                  size={size}
                  ecLevel="H"
                  bgColor={isTransparent ? 'transparent' : bgColor}
                  fgColor={fgColor}
                  qrStyle={qrStyle}
                  eyeRadius={getEyeRadius(size, eyeStyle)}
                  logoImage={logoImage || undefined}
                  logoWidth={logoSize.width}
                  logoHeight={logoSize.height}
                  removeQrCodeBehindLogo
                  logoPaddingStyle="square"
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
                style={{ width: size, height: size, color: appTheme.textMuted }}
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
          style={{ backgroundColor: appTheme.accent, color: '#ffffff' }}
        >
          <FontAwesomeIcon icon={faShareNodes} />
          {t('actions.share')}
        </button>
        <button
          onClick={handleDownload}
          disabled={!isValidUrl}
          className="flex flex-1 items-center justify-center gap-2 rounded py-3 text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
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

      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
