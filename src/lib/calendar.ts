import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'

export interface CalendarDay {
  date: Date
  dateString: string // YYYY-MM-DD
  day: number
  isCurrentMonth: boolean
  isToday: boolean
}

/**
 * 指定した年月のカレンダーグリッド用の日付配列を生成
 * @param year 年
 * @param month 月 (0-11)
 * @param weekStartsOn 週の開始日 (0: 日曜, 1: 月曜)
 */
export function getCalendarDays(
  year: number,
  month: number,
  weekStartsOn: 0 | 1 = 0
): CalendarDay[] {
  const targetDate = new Date(year, month, 1)
  const monthStart = startOfMonth(targetDate)
  const monthEnd = endOfMonth(targetDate)

  const calendarStart = startOfWeek(monthStart, { weekStartsOn })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return days.map((date) => ({
    date,
    dateString: format(date, 'yyyy-MM-dd'),
    day: date.getDate(),
    isCurrentMonth: isSameMonth(date, targetDate),
    isToday: isToday(date),
  }))
}

export interface WeekdayHeader {
  labelKey: string // i18nキー
  dayOfWeek: number // 0: 日曜, 6: 土曜
}

/**
 * 曜日ヘッダーを取得
 * @param weekStartsOn 週の開始日 (0: 日曜, 1: 月曜)
 */
export function getWeekdayHeaders(weekStartsOn: 0 | 1 = 0): WeekdayHeader[] {
  const weekdays: WeekdayHeader[] = [
    { labelKey: 'weekdays.sun', dayOfWeek: 0 },
    { labelKey: 'weekdays.mon', dayOfWeek: 1 },
    { labelKey: 'weekdays.tue', dayOfWeek: 2 },
    { labelKey: 'weekdays.wed', dayOfWeek: 3 },
    { labelKey: 'weekdays.thu', dayOfWeek: 4 },
    { labelKey: 'weekdays.fri', dayOfWeek: 5 },
    { labelKey: 'weekdays.sat', dayOfWeek: 6 },
  ]
  if (weekStartsOn === 1) {
    return [...weekdays.slice(1), weekdays[0]!]
  }
  return weekdays
}

/**
 * 年月の表示用パラメータを取得（i18n用）
 */
export function getYearMonthParams(year: number, month: number): { year: number; month: number } {
  return { year, month: month + 1 }
}

/**
 * 2つの日付が同じ日かどうか
 */
export function isSameDayUtil(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2)
}
