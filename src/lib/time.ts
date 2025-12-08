// 時刻関連のユーティリティ

/** 30分刻みの時刻オプションを生成 */
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const minutes = (i % 2) * 30
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
})

/** 時刻から時間帯の色を取得 */
export function getTimeColor(time: string | undefined): string {
  if (!time) return ''
  const [hourStr] = time.split(':')
  if (!hourStr) return ''
  const hour = parseInt(hourStr, 10)
  if (hour >= 5 && hour < 10) return '#f59e0b' // 朝: オレンジ
  if (hour >= 10 && hour < 12) return '#84cc16' // 午前: ライム
  if (hour >= 12 && hour < 17) return '#22c55e' // 午後: グリーン
  if (hour >= 17 && hour < 21) return '#f97316' // 夕方: ディープオレンジ
  if (hour >= 21 || hour < 5) return '#8b5cf6' // 夜/深夜: パープル
  return ''
}
