import { useEffect } from 'react'
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
} from '@fortawesome/free-solid-svg-icons'
import { useCalendarStore } from '../lib/store'
import { SUPPORTED_COUNTRIES, type CountryCode } from '../lib/holidays'
import { APP_THEMES, type AppTheme } from '../lib/types'
import { ToggleSwitch } from './ui/ToggleSwitch'
import { ImageSelector } from './ui/ImageSelector'

const APP_THEME_IDS: AppTheme[] = ['light', 'dark']
const LANGUAGES = ['ja', 'en'] as const

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { t, i18n } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const updateSettings = useCalendarStore((state) => state.updateSettings)

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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg p-6"
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
            <div>
              <label
                className="mb-1 flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faLanguage} className="w-4" />
                {t('settings.language')}
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value as 'ja' | 'en' })}
                className="w-full rounded border px-3 py-2"
                style={{
                  backgroundColor: appTheme.bg,
                  borderColor: appTheme.textMuted,
                  color: appTheme.text,
                }}
              >
                {LANGUAGES.map((lang) => (
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
              className={`transition-opacity ${settings.showHolidays ? '' : 'pointer-events-none opacity-40'}`}
            >
              <label
                className="mb-1 flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faGlobe} className="w-4" />
                {t('settings.country')}
              </label>
              <select
                value={settings.country}
                onChange={(e) => updateSettings({ country: e.target.value as CountryCode })}
                disabled={!settings.showHolidays}
                className="w-full rounded border px-3 py-2"
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
          </div>

          <hr style={{ borderColor: appTheme.textMuted, opacity: 0.3 }} />

          {/* 表示設定 */}
          <div className="space-y-3">
            {/* 店名設定 */}
            <div>
              <label
                className="mb-1 flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faStore} className="w-4" />
                {t('settings.shopName')}
              </label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) => updateSettings({ shopName: e.target.value })}
                className="w-full rounded border px-3 py-2"
                style={{
                  backgroundColor: appTheme.bg,
                  borderColor: appTheme.textMuted,
                  color: appTheme.text,
                }}
                placeholder={t('settings.shopName')}
              />
            </div>

            {/* 店名ロゴ設定 */}
            <div>
              <label
                className="mb-1 flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faImage} className="w-4" />
                {t('settings.shopLogo')}
              </label>
              <ImageSelector
                value={settings.shopLogo}
                onChange={(value) => updateSettings({ shopLogo: value })}
                theme={appTheme}
                previewFit="contain"
              />
            </div>

            {/* 背景画像設定 */}
            <div>
              <label
                className="mb-1 flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                <FontAwesomeIcon icon={faImage} className="w-4" />
                {t('settings.backgroundImage')}
              </label>
              <ImageSelector
                value={settings.backgroundImage}
                onChange={(value) => updateSettings({ backgroundImage: value })}
                theme={appTheme}
              />
            </div>

            {/* 背景の濃さ */}
            <div
              className={`transition-opacity ${settings.backgroundImage ? '' : 'pointer-events-none opacity-40'}`}
            >
              <label
                className="mb-1 flex items-center gap-2 text-sm"
                style={{ color: appTheme.textMuted }}
              >
                {t('settings.backgroundOpacity')}
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={settings.backgroundOpacity}
                onChange={(e) => updateSettings({ backgroundOpacity: parseFloat(e.target.value) })}
                disabled={!settings.backgroundImage}
                className="w-full"
              />
              <div className="mt-1 text-right text-xs" style={{ color: appTheme.textMuted }}>
                {Math.round(settings.backgroundOpacity * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
