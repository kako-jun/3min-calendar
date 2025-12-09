import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ja from './ja.json'
import en from './en.json'
import zh from './zh.json'

// ブラウザの言語を検出
const detectLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0]
  if (browserLang === 'ja') return 'ja'
  if (browserLang === 'zh') return 'zh'
  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
