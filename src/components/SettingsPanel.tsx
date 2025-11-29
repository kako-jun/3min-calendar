import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '../lib/store'
import { SUPPORTED_COUNTRIES, type CountryCode } from '../lib/holidays'
import type { ThemeId } from '../lib/types'

const THEME_IDS: ThemeId[] = ['dark', 'light', 'cafe', 'nature', 'ocean', 'sunset']
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

  const handleLanguageChange = (lang: 'ja' | 'en') => {
    updateSettings({ language: lang })
  }

  const handleCountryChange = (country: CountryCode) => {
    updateSettings({ country })
  }

  const handleThemeChange = (theme: ThemeId) => {
    updateSettings({ theme })
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-gray-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t('actions.settings')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* 言語設定 */}
          <div>
            <label className="mb-1 block text-sm text-gray-300">{t('settings.language')}</label>
            <select
              value={settings.language}
              onChange={(e) => handleLanguageChange(e.target.value as 'ja' | 'en')}
              className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {t(`languages.${lang}`)}
                </option>
              ))}
            </select>
          </div>

          {/* 国/地域設定 */}
          <div>
            <label className="mb-1 block text-sm text-gray-300">{t('settings.country')}</label>
            <select
              value={settings.country}
              onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
              className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
            >
              {SUPPORTED_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {i18n.language === 'ja' ? country.name : country.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* 祝日表示 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{t('settings.showHolidays')}</span>
            <button
              onClick={() => handleShowHolidaysChange(!settings.showHolidays)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.showHolidays ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.showHolidays ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* テーマ設定 */}
          <div>
            <label className="mb-1 block text-sm text-gray-300">{t('settings.theme')}</label>
            <div className="grid grid-cols-3 gap-2">
              {THEME_IDS.map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`rounded px-3 py-2 text-sm transition-colors ${
                    settings.theme === theme
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t(`themes.${theme}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 店名設定 */}
          <div>
            <label className="mb-1 block text-sm text-gray-300">{t('settings.shopName')}</label>
            <input
              type="text"
              value={settings.shopName}
              onChange={(e) => handleShopNameChange(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400"
              placeholder={t('settings.shopName')}
            />
          </div>

          {/* 週の開始日 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{t('settings.weekStart')}</span>
            <div className="flex items-center gap-2">
              <span className={settings.weekStartsOn === 0 ? 'text-white' : 'text-gray-500'}>
                {t('settings.sunday')}
              </span>
              <button
                onClick={() =>
                  updateSettings({ weekStartsOn: settings.weekStartsOn === 0 ? 1 : 0 })
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.weekStartsOn === 1 ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    settings.weekStartsOn === 1 ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={settings.weekStartsOn === 1 ? 'text-white' : 'text-gray-500'}>
                {t('settings.monday')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
