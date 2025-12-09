import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGear,
  faXmark,
  faPalette,
  faSun,
  faMoon,
  faLanguage,
  faCalendarWeek,
  faCalendarDay,
  faGlobe,
  faStore,
  faImage,
  faFileExport,
  faFileImport,
  faQrcode,
  faHeart,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { useCalendarStore } from '../lib/store'
import { SUPPORTED_COUNTRIES, type CountryCode } from '../lib/holidays'
import { APP_THEMES, type AppTheme, type Settings } from '../lib/types'
import { SUPPORTED_LANGUAGES } from '../lib/i18n'
import { exportData, importData, type ExportData } from '../lib/storage'
import { ToggleSwitch } from './ui/ToggleSwitch'
import { ImageSelector } from './ui/ImageSelector'

const APP_THEME_IDS: AppTheme[] = ['light', 'dark']

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { t, i18n } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const updateSettings = useCalendarStore((state) => state.updateSettings)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 店名入力用のローカルstate（IME対策）
  const [shopNameLocal, setShopNameLocal] = useState(settings.shopName)
  const isComposingRef = useRef(false)

  // 設定が外部から変更された場合に同期
  useEffect(() => {
    setShopNameLocal(settings.shopName)
  }, [settings.shopName])

  // 店名変更ハンドラ（IME入力中は保存しない）
  const handleShopNameChange = (value: string) => {
    setShopNameLocal(value)
    if (!isComposingRef.current) {
      updateSettings({ shopName: value })
    }
  }

  // エクスポート処理
  const handleExport = async () => {
    try {
      const data = await exportData()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `3min-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // インポート処理
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text) as ExportData

      // 簡易バリデーション
      if (!data.calendar?.entries || !data.calendar?.settings) {
        alert(t('dataManagement.invalidFile'))
        return
      }

      if (!confirm(t('dataManagement.importConfirm'))) {
        return
      }

      await importData(data)
      alert(t('dataManagement.importSuccess'))
      window.location.reload()
    } catch (error) {
      console.error('Import failed:', error)
      alert(t('dataManagement.invalidFile'))
    } finally {
      // ファイル選択をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // モーダルが開いている間、背景のスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const appTheme = APP_THEMES[settings.appTheme]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg p-6"
        style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <FontAwesomeIcon icon={faGear} />
            {t('actions.settings')}
          </h2>
          <button
            onClick={onClose}
            style={{ color: appTheme.textMuted }}
            className="hover:opacity-70"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="space-y-6">
          {/* QRコード予定地 */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed"
              style={{ borderColor: appTheme.textMuted }}
            >
              <FontAwesomeIcon
                icon={faQrcode}
                className="text-3xl"
                style={{ color: appTheme.textMuted }}
              />
            </div>
            <p className="text-center text-xs" style={{ color: appTheme.textMuted }}>
              {t('settings.qrCodeComingSoon')}
            </p>
          </div>

          <hr style={{ borderColor: appTheme.textMuted, opacity: 0.3 }} />

          {/* アプリ設定 */}
          <div className="space-y-3">
            {/* アプリの外観 */}
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faPalette} className="w-4" />
                {t('settings.appTheme')}
              </span>
              <div className="flex gap-2">
                {APP_THEME_IDS.map((themeId) => (
                  <button
                    key={themeId}
                    onClick={() => updateSettings({ appTheme: themeId })}
                    className={`flex items-center gap-1 rounded px-3 py-1 text-sm transition-colors ${
                      settings.appTheme === themeId ? 'ring-2' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: APP_THEMES[themeId].bg,
                      color: APP_THEMES[themeId].text,
                      // @ts-expect-error CSS custom property
                      '--tw-ring-color': appTheme.accent,
                    }}
                  >
                    <FontAwesomeIcon icon={themeId === 'light' ? faSun : faMoon} />
                    {t(`appThemes.${themeId}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* 言語設定 */}
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faLanguage} className="w-4" />
                {t('settings.language')}
              </span>
              <select
                value={settings.language}
                onChange={(e) =>
                  updateSettings({ language: e.target.value as Settings['language'] })
                }
                className="rounded border px-3 py-1 text-sm"
                style={{
                  backgroundColor: appTheme.bg,
                  borderColor: appTheme.textMuted,
                  color: appTheme.text,
                }}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {t(`languages.${lang}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr style={{ borderColor: appTheme.textMuted, opacity: 0.3 }} />

          {/* カレンダー設定 */}
          <div className="space-y-3">
            {/* 週の開始日 */}
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faCalendarWeek} className="w-4" />
                {t('settings.weekStart')}
              </span>
              <ToggleSwitch
                checked={settings.weekStartsOn === 1}
                onChange={(checked) => updateSettings({ weekStartsOn: checked ? 1 : 0 })}
                theme={appTheme}
                leftLabel={t('settings.sunday')}
                rightLabel={t('settings.monday')}
              />
            </div>

            {/* 祝日表示 */}
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faCalendarDay} className="w-4" />
                {t('settings.showHolidays')}
              </span>
              <ToggleSwitch
                checked={settings.showHolidays}
                onChange={(checked) => updateSettings({ showHolidays: checked })}
                theme={appTheme}
              />
            </div>

            {/* 国/地域設定 */}
            <div
              className={`flex items-center justify-between transition-opacity ${settings.showHolidays ? '' : 'pointer-events-none opacity-40'}`}
            >
              <span
                className="flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faGlobe} className="w-4" />
                {t('settings.country')}
              </span>
              <select
                value={settings.country}
                onChange={(e) => updateSettings({ country: e.target.value as CountryCode })}
                disabled={!settings.showHolidays}
                className="rounded border px-3 py-1 text-sm"
                style={{
                  backgroundColor: appTheme.bg,
                  borderColor: appTheme.textMuted,
                  color: appTheme.text,
                }}
              >
                {SUPPORTED_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {i18n.language === 'ja' ? country.name : country.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* 六曜表示 */}
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faCalendarDay} className="w-4" />
                {t('settings.showRokuyo')}
              </span>
              <ToggleSwitch
                checked={settings.showRokuyo}
                onChange={(checked) => updateSettings({ showRokuyo: checked })}
                theme={appTheme}
              />
            </div>

            {/* 和暦表示 */}
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faCalendarDay} className="w-4" />
                {t('settings.useWareki')}
              </span>
              <ToggleSwitch
                checked={settings.useWareki}
                onChange={(checked) => updateSettings({ useWareki: checked })}
                theme={appTheme}
              />
            </div>
          </div>

          <hr style={{ borderColor: appTheme.textMuted, opacity: 0.3 }} />

          {/* 表示設定 */}
          <div className="space-y-3">
            {/* 店名設定 */}
            <div className="flex items-center justify-between gap-4">
              <span
                className="flex shrink-0 items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faStore} className="w-4" />
                {t('settings.shopName')}
              </span>
              <input
                type="text"
                value={shopNameLocal}
                onChange={(e) => handleShopNameChange(e.target.value)}
                onCompositionStart={() => (isComposingRef.current = true)}
                onCompositionEnd={(e) => {
                  isComposingRef.current = false
                  updateSettings({ shopName: e.currentTarget.value })
                }}
                className="min-w-0 flex-1 rounded border px-3 py-1 text-sm"
                style={{
                  backgroundColor: appTheme.bg,
                  borderColor: appTheme.textMuted,
                  color: appTheme.text,
                }}
                placeholder={t('settings.shopName')}
              />
            </div>

            {/* 店名ロゴ設定 */}
            <div className="flex items-center justify-between">
              <span
                className="flex shrink-0 items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faImage} className="w-4" />
                {t('settings.shopLogo')}
              </span>
              <ImageSelector
                value={settings.shopLogo}
                onChange={(value) => updateSettings({ shopLogo: value })}
                theme={appTheme}
                previewFit="contain"
                inline
              />
            </div>

            {/* 背景画像設定 */}
            <div className="flex items-center justify-between">
              <span
                className="flex shrink-0 items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faImage} className="w-4" />
                {t('settings.backgroundImage')}
              </span>
              <ImageSelector
                value={settings.backgroundImage}
                onChange={(value) => updateSettings({ backgroundImage: value })}
                theme={appTheme}
                inline
              />
            </div>

            {/* 背景の濃さ */}
            <div
              className={`flex items-center justify-between gap-4 transition-opacity ${settings.backgroundImage ? '' : 'pointer-events-none opacity-40'}`}
            >
              <span
                className="flex shrink-0 items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                {t('settings.backgroundOpacity')}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={settings.backgroundOpacity}
                  onChange={(e) =>
                    updateSettings({ backgroundOpacity: parseFloat(e.target.value) })
                  }
                  disabled={!settings.backgroundImage}
                  className="min-w-0 flex-1"
                />
                <span className="w-8 text-right text-xs" style={{ color: appTheme.textMuted }}>
                  {Math.round(settings.backgroundOpacity * 100)}%
                </span>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: appTheme.textMuted, opacity: 0.3 }} />

          {/* データ管理 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: appTheme.textMuted }}>
              {t('dataManagement.title')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex flex-1 items-center justify-center gap-2 rounded px-4 py-2 text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: appTheme.bg, color: appTheme.text }}
              >
                <FontAwesomeIcon icon={faFileExport} />
                {t('dataManagement.export')}
              </button>
              <label
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded px-4 py-2 text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: appTheme.bg, color: appTheme.text }}
              >
                <FontAwesomeIcon icon={faFileImport} />
                {t('dataManagement.import')}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <hr style={{ borderColor: appTheme.textMuted, opacity: 0.3 }} />

          {/* About & Sponsor */}
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-center text-sm" style={{ color: appTheme.textMuted }}>
              {t('about.author')}: <strong>kako-jun</strong>
              <a
                href="https://github.com/kako-jun/3min"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center hover:opacity-70"
                style={{ color: appTheme.text }}
              >
                <FontAwesomeIcon icon={faGithub} />
              </a>
            </p>
            <a
              href="https://github.com/sponsors/kako-jun"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-all hover:opacity-80"
              style={{
                backgroundColor: appTheme.bg,
                borderColor: appTheme.textMuted,
                color: appTheme.text,
              }}
            >
              <FontAwesomeIcon icon={faHeart} className="text-pink-500" />
              <span>Sponsor on GitHub</span>
            </a>
          </div>
        </div>

        {/* バージョン表示 */}
        <div className="mt-4 text-right text-xs opacity-60" style={{ color: appTheme.textMuted }}>
          v{__BUILD_DATE__}
        </div>
      </div>
    </div>
  )
}
