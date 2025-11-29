import Holidays from 'date-holidays'

let hd: Holidays | null = null
let currentCountry: string | null = null

/**
 * 祝日ライブラリを初期化
 */
export function initHolidays(country: string): void {
  if (currentCountry !== country) {
    hd = new Holidays(country)
    currentCountry = country
  }
}

/**
 * 指定日が祝日かどうかを判定
 */
export function isHoliday(date: Date): boolean {
  if (!hd) return false
  const result = hd.isHoliday(date)
  return Array.isArray(result) ? result.length > 0 : !!result
}

/**
 * 指定日の祝日名を取得
 */
export function getHolidayName(date: Date): string | null {
  if (!hd) return null
  const result = hd.isHoliday(date)
  if (Array.isArray(result) && result.length > 0) {
    return result[0]?.name ?? null
  }
  return null
}

/**
 * 対応している国のリスト（主要なもの）
 */
export const SUPPORTED_COUNTRIES = [
  { code: 'JP', name: '日本', nameEn: 'Japan' },
  { code: 'US', name: 'アメリカ', nameEn: 'United States' },
  { code: 'GB', name: 'イギリス', nameEn: 'United Kingdom' },
  { code: 'DE', name: 'ドイツ', nameEn: 'Germany' },
  { code: 'FR', name: 'フランス', nameEn: 'France' },
  { code: 'IT', name: 'イタリア', nameEn: 'Italy' },
  { code: 'ES', name: 'スペイン', nameEn: 'Spain' },
  { code: 'CN', name: '中国', nameEn: 'China' },
  { code: 'KR', name: '韓国', nameEn: 'South Korea' },
  { code: 'TW', name: '台湾', nameEn: 'Taiwan' },
  { code: 'TH', name: 'タイ', nameEn: 'Thailand' },
  { code: 'VN', name: 'ベトナム', nameEn: 'Vietnam' },
  { code: 'AU', name: 'オーストラリア', nameEn: 'Australia' },
  { code: 'CA', name: 'カナダ', nameEn: 'Canada' },
  { code: 'BR', name: 'ブラジル', nameEn: 'Brazil' },
  { code: 'MX', name: 'メキシコ', nameEn: 'Mexico' },
  { code: 'IN', name: 'インド', nameEn: 'India' },
  { code: 'SG', name: 'シンガポール', nameEn: 'Singapore' },
  { code: 'HK', name: '香港', nameEn: 'Hong Kong' },
  { code: 'NZ', name: 'ニュージーランド', nameEn: 'New Zealand' },
] as const

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]['code']
