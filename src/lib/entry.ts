// DayEntry関連のユーティリティ

import type { DayEntry } from './types'

/** コピー/ペースト用にエントリをシリアライズ */
export function serializeEntry(entry: Partial<DayEntry>): string {
  return JSON.stringify({
    symbol: entry.symbol,
    stamp: entry.stamp,
    timeFrom: entry.timeFrom,
    timeTo: entry.timeTo,
    text: entry.text,
  })
}

/** コピー/ペースト用にエントリをデシリアライズ */
export function deserializeEntry(str: string): Partial<DayEntry> | null {
  try {
    const data = JSON.parse(str)
    return {
      symbol: data.symbol ?? null,
      stamp: data.stamp ?? null,
      timeFrom: data.timeFrom ?? '',
      timeTo: data.timeTo ?? '',
      text: data.text ?? '',
    }
  } catch {
    // JSONでない場合は従来のテキストとして扱う
    return { text: str }
  }
}
