import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ja from './ja.json'
import en from './en.json'
import zh from './zh.json'
import ko from './ko.json'
import ne from './ne.json'
import th from './th.json'
import vi from './vi.json'
import tl from './tl.json'
import es from './es.json'
import pt from './pt.json'
import fr from './fr.json'

// サポートされている言語
export const SUPPORTED_LANGUAGES = [
  'ja',
  'en',
  'zh',
  'ko',
  'ne',
  'th',
  'vi',
  'tl',
  'es',
  'pt',
  'fr',
] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

// ブラウザの言語を検出
const detectLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage
  }
  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
    zh: { translation: zh },
    ko: { translation: ko },
    ne: { translation: ne },
    th: { translation: th },
    vi: { translation: vi },
    tl: { translation: tl },
    es: { translation: es },
    pt: { translation: pt },
    fr: { translation: fr },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
