import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '../lib/store'
import { SUPPORTED_COUNTRIES, type CountryCode } from '../lib/holidays'
import { APP_THEMES, type AppTheme } from '../lib/types'

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

  if (!isOpen) return null

  const appTheme = APP_THEMES[settings.appTheme]

  const handleLanguageChange = (lang: 'ja' | 'en') => {
    updateSettings({ language: lang })
  }

  const handleCountryChange = (country: CountryCode) => {
    updateSettings({ country })
  }

  const handleAppThemeChange = (theme: AppTheme) => {
    updateSettings({ appTheme: theme })
  }

  const handleShopNameChange = (shopName: string) => {
    updateSettings({ shopName })
  }

  const handleShowHolidaysChange = (show: boolean) => {
    updateSettings({ showHolidays: show })
  }

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('actions.settings')}</h2>
          <button
            onClick={onClose}
            style={{ color: appTheme.textMuted }}
            className="hover:opacity-70"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* アプリ設定 */}
          <div className="space-y-3">
            {/* アプリの外観 */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: appTheme.textMuted }}>
                {t('settings.appTheme')}
              </span>
              <div className="flex gap-2">
                {APP_THEME_IDS.map((themeId) => (
                  <button
                    key={themeId}
                    onClick={() => handleAppThemeChange(themeId)}
                    className={`rounded px-3 py-1 text-sm transition-colors ${
                      settings.appTheme === themeId ? 'ring-2' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: APP_THEMES[themeId].bg,
                      color: APP_THEMES[themeId].text,
                      // @ts-expect-error CSS custom property for Tailwind ring color
                      '--tw-ring-color': appTheme.accent,
                    }}
                  >
                    {t(`appThemes.${themeId}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* 言語設定 */}
            <div>
              <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
                {t('settings.language')}
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleLanguageChange(e.target.value as 'ja' | 'en')}
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

          {/* 区切り線 */}
          <hr style={{ borderColor: appTheme.textMuted, opacity: 0.3 }} />

          {/* カレンダー設定 */}
          <div className="space-y-3">
            {/* 週の開始日 */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: appTheme.textMuted }}>
                {t('settings.weekStart')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    color: settings.weekStartsOn === 0 ? appTheme.text : appTheme.textMuted,
                  }}
                >
                  {t('settings.sunday')}
                </span>
                <button
                  onClick={() =>
                    updateSettings({ weekStartsOn: settings.weekStartsOn === 0 ? 1 : 0 })
                  }
                  className="relative h-6 w-11 rounded-full transition-colors"
                  style={{
                    backgroundColor: settings.weekStartsOn === 1 ? appTheme.accent : appTheme.bg,
                  }}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      settings.weekStartsOn === 1 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span
                  style={{
                    color: settings.weekStartsOn === 1 ? appTheme.text : appTheme.textMuted,
                  }}
                >
                  {t('settings.monday')}
                </span>
              </div>
            </div>

            {/* 祝日表示 */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: appTheme.textMuted }}>
                {t('settings.showHolidays')}
              </span>
              <button
                onClick={() => handleShowHolidaysChange(!settings.showHolidays)}
                className="relative h-6 w-11 rounded-full transition-colors"
                style={{
                  backgroundColor: settings.showHolidays ? appTheme.accent : appTheme.bg,
                }}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    settings.showHolidays ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 国/地域設定（祝日表示がオンの場合のみ有効） */}
            <div
              className={`transition-opacity ${settings.showHolidays ? '' : 'pointer-events-none opacity-40'}`}
            >
              <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
                {t('settings.country')}
              </label>
              <select
                value={settings.country}
                onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
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

          {/* 区切り線 */}
          <hr style={{ borderColor: appTheme.textMuted, opacity: 0.3 }} />

          {/* 表示設定 */}
          <div className="space-y-3">
            {/* 店名設定 */}
            <div>
              <label className="mb-1 block text-sm" style={{ color: appTheme.textMuted }}>
                {t('settings.shopName')}
              </label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) => handleShopNameChange(e.target.value)}
                className="w-full rounded border px-3 py-2"
                style={{
                  backgroundColor: appTheme.bg,
                  borderColor: appTheme.textMuted,
                  color: appTheme.text,
                }}
                placeholder={t('settings.shopName')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
