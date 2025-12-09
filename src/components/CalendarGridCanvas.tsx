import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect, Text, Group, Circle, Line, Image as KonvaImage } from 'react-konva'
import { useTranslation } from 'react-i18next'
import Konva from 'konva'
import { useCalendarStore } from '../lib/store'
import { getCalendarDays, getWeekdayHeaders, getYearMonthParams } from '../lib/calendar'
import { isHoliday } from '../lib/holidays'
import { getRokuyoName } from '../lib/rokuyo'
import { getWarekiYear } from '../lib/wareki'
import { THEMES, QUICK_INPUT_STYLES } from '../lib/types'

/** Canvas のベースサイズ（論理ピクセル） */
const BASE_SIZE = 500
const PADDING = 12
const HEADER_HEIGHT = 32
const WEEKDAY_HEADER_HEIGHT = 28
const GAP = 4
const CELL_RADIUS = 4

/** フォントファミリー（index.cssと同じ） */
const FONT_FAMILY =
  'Inter, "Zen Kaku Gothic Antique", "Noto Sans SC", system-ui, Avenir, Helvetica, Arial, sans-serif'

/** スタンプキーからスタイルを取得 */
function getStampStyle(stampKey: string | null | undefined) {
  if (!stampKey) return null
  return QUICK_INPUT_STYLES.find((s) => s.key === stampKey) ?? null
}

/** 画像をロードする */
function useLoadImage(src: string | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!src) {
      setImage(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImage(img)
    img.onerror = () => setImage(null)
    img.src = src
  }, [src])

  return image
}

export interface CalendarGridCanvasHandle {
  toDataURL: (pixelRatio?: number) => string
}

interface CalendarGridCanvasProps {
  comment?: string
}

export const CalendarGridCanvas = forwardRef<CalendarGridCanvasHandle, CalendarGridCanvasProps>(
  function CalendarGridCanvas({ comment: propComment }, ref) {
    const { t } = useTranslation()
    const stageRef = useRef<Konva.Stage>(null)
    const calendarLayerRef = useRef<Konva.Layer>(null)
    const selectionLayerRef = useRef<Konva.Layer>(null)

    const view = useCalendarStore((state) => state.view)
    const settings = useCalendarStore((state) => state.settings)
    const entries = useCalendarStore((state) => state.entries)
    const calendarComments = useCalendarStore((state) => state.calendarComments)
    const selectedDate = useCalendarStore((state) => state.selectedDate)
    const setSelectedDate = useCalendarStore((state) => state.setSelectedDate)
    const calendarThemes = useCalendarStore((state) => state.calendarThemes)

    const days = getCalendarDays(view.year, view.month, settings.weekStartsOn)
    const weekdays = getWeekdayHeaders(settings.weekStartsOn)
    const yearMonthParams = getYearMonthParams(view.year, view.month)
    const isLinedStyle = settings.gridStyle === 'lined'
    const rowCount = Math.ceil(days.length / 7)

    // 月ごとのカレンダーテーマ
    const monthKey = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
    const calendarThemeId = calendarThemes[monthKey] ?? settings.calendarTheme
    const theme = THEMES[calendarThemeId]

    // 罫線色
    const lineColor = `${theme.textMuted}60`

    // 月のコメント
    const commentKey = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
    const storedComment = calendarComments[commentKey] ?? ''
    const comment = propComment !== undefined ? propComment : storedComment

    // 背景画像
    const backgroundImage = useLoadImage(settings.backgroundImage)
    // 店名ロゴ
    const shopLogoImage = useLoadImage(settings.shopLogo)

    const getEntry = useCallback((date: string) => entries.find((e) => e.date === date), [entries])

    // コンテナのサイズに合わせてスケール
    const [containerSize, setContainerSize] = useState(BASE_SIZE)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const updateSize = () => {
        if (containerRef.current) {
          const width = containerRef.current.clientWidth
          setContainerSize(Math.min(width, BASE_SIZE))
        }
      }
      updateSize()
      window.addEventListener('resize', updateSize)
      return () => window.removeEventListener('resize', updateSize)
    }, [])

    const scale = containerSize / BASE_SIZE

    // エクスポート用メソッド
    useImperativeHandle(ref, () => ({
      toDataURL: (pixelRatio = 2) => {
        if (!stageRef.current || !selectionLayerRef.current) return ''
        // 選択枠を非表示にしてエクスポート
        selectionLayerRef.current.hide()
        const dataURL = stageRef.current.toDataURL({ pixelRatio })
        selectionLayerRef.current.show()
        return dataURL
      },
    }))

    // グリッド領域の計算（ヘッダーとの間隔を広げる）
    const gridTop = PADDING + HEADER_HEIGHT + WEEKDAY_HEADER_HEIGHT + 8 + (isLinedStyle ? 0 : GAP)
    const gridHeight = BASE_SIZE - gridTop - PADDING - (comment ? 24 : 0)
    const gridWidth = BASE_SIZE - PADDING * 2
    const cellWidth = isLinedStyle ? gridWidth / 7 : (gridWidth - GAP * 6) / 7
    const cellHeight = isLinedStyle
      ? gridHeight / rowCount
      : (gridHeight - GAP * (rowCount - 1)) / rowCount

    // 日付の色を決定
    const getDayColor = (day: ReturnType<typeof getCalendarDays>[0], holidayInfo: boolean) => {
      if (!day.isCurrentMonth) return theme.textMuted
      const dayOfWeek = day.date.getDay()
      if (holidayInfo || dayOfWeek === 0) return theme.sunday
      if (dayOfWeek === 6) return theme.saturday
      return theme.text
    }

    // セル位置の計算
    const getCellPosition = (index: number) => {
      const col = index % 7
      const row = Math.floor(index / 7)
      if (isLinedStyle) {
        return {
          x: PADDING + col * cellWidth,
          y: gridTop + row * cellHeight,
        }
      }
      return {
        x: PADDING + col * (cellWidth + GAP),
        y: gridTop + row * (cellHeight + GAP),
      }
    }

    return (
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: `${BASE_SIZE}px`,
          aspectRatio: '1 / 1',
        }}
      >
        <Stage
          ref={stageRef}
          width={containerSize}
          height={containerSize}
          scaleX={scale}
          scaleY={scale}
        >
          {/* カレンダー本体レイヤー */}
          <Layer ref={calendarLayerRef}>
            {/* 背景 */}
            <Rect
              x={0}
              y={0}
              width={BASE_SIZE}
              height={BASE_SIZE}
              fill={theme.surface}
              cornerRadius={8}
            />

            {/* 背景画像 */}
            {backgroundImage && (
              <KonvaImage
                image={backgroundImage}
                x={0}
                y={0}
                width={BASE_SIZE}
                height={BASE_SIZE}
                opacity={settings.backgroundOpacity}
              />
            )}

            {/* ヘッダー: 店名（左）と年月（右） */}
            <Group x={PADDING + 4} y={PADDING + 4}>
              {/* 店名ロゴ */}
              {shopLogoImage && (
                <KonvaImage image={shopLogoImage} x={0} y={0} width={20} height={20} />
              )}
              {/* 店名 */}
              {settings.shopName && (
                <Text
                  x={shopLogoImage ? 24 : 0}
                  y={2}
                  text={settings.shopName}
                  fontSize={14}
                  fontStyle="500"
                  fontFamily={FONT_FAMILY}
                  fill={theme.text}
                />
              )}
            </Group>

            {/* 年月（右寄せ） - 言語に応じて形式を変更、右端からの距離を固定 */}
            {(() => {
              const yearSuffix = t('calendar.yearSuffix')
              const monthNames = t('calendar.monthNames', { returnObjects: true }) as
                | string[]
                | string
              const yearValue = settings.useWareki
                ? getWarekiYear(new Date(view.year, view.month, 1))
                : yearMonthParams.year
              const monthValue = yearMonthParams.month

              // monthNamesが配列として存在する場合は「月名 年」形式（西洋言語）
              const hasMonthNames = Array.isArray(monthNames) && monthNames.length === 12
              const useMonthName = hasMonthNames && !yearSuffix

              // 右端の基準位置
              const rightEdge = BASE_SIZE - PADDING

              if (useMonthName) {
                // 「月名 年」形式: Dec 2025
                const monthName = (monthNames as string[])[view.month]
                const yearText = `${yearValue}`

                return (
                  <Group y={PADDING + 4}>
                    {/* 年 (16px, opacity 0.6) - 右端に配置 */}
                    <Text
                      x={rightEdge}
                      y={8}
                      text={yearText}
                      fontSize={16}
                      fontStyle="bold"
                      fontFamily={FONT_FAMILY}
                      fill={theme.text}
                      opacity={0.6}
                      align="right"
                      width={200}
                      offsetX={200}
                    />
                    {/* 月名 (24px) - 年の左に配置 */}
                    <Text
                      x={rightEdge - 50}
                      y={0}
                      text={monthName}
                      fontSize={24}
                      fontStyle="bold"
                      fontFamily={FONT_FAMILY}
                      fill={theme.text}
                      align="right"
                      width={200}
                      offsetX={200}
                    />
                  </Group>
                )
              } else {
                // 「年 月」形式: 2025年 12月（東アジア言語）
                const yearText = `${yearValue}${yearSuffix}`
                const monthText = `${monthValue}${t('calendar.monthSuffix')}`

                return (
                  <Group y={PADDING + 4}>
                    {/* 月 + suffix (24px) - 右端に配置 */}
                    <Text
                      x={rightEdge}
                      y={0}
                      text={monthText}
                      fontSize={24}
                      fontStyle="bold"
                      fontFamily={FONT_FAMILY}
                      fill={theme.text}
                      align="right"
                      width={200}
                      offsetX={200}
                    />
                    {/* 年 + suffix (16px, opacity 0.6) - 月の左に配置 */}
                    <Text
                      x={rightEdge - 60}
                      y={8}
                      text={yearText}
                      fontSize={16}
                      fontStyle="bold"
                      fontFamily={FONT_FAMILY}
                      fill={theme.text}
                      opacity={0.6}
                      align="right"
                      width={200}
                      offsetX={200}
                    />
                  </Group>
                )
              }
            })()}

            {/* 曜日ヘッダー */}
            {weekdays.map((day, index) => {
              const x = PADDING + index * (isLinedStyle ? cellWidth : cellWidth + GAP)
              const width = cellWidth
              const color =
                day.dayOfWeek === 0
                  ? theme.sunday
                  : day.dayOfWeek === 6
                    ? theme.saturday
                    : theme.textMuted

              return (
                <Group key={day.dayOfWeek}>
                  {isLinedStyle && (
                    <>
                      {/* 罫線スタイルの枠 */}
                      <Rect
                        x={x}
                        y={PADDING + HEADER_HEIGHT + 8}
                        width={width}
                        height={WEEKDAY_HEADER_HEIGHT}
                        stroke={lineColor}
                        strokeWidth={0.5}
                      />
                    </>
                  )}
                  <Text
                    x={x}
                    y={PADDING + HEADER_HEIGHT + 8 + (WEEKDAY_HEADER_HEIGHT - 14) / 2}
                    width={width}
                    text={t(day.labelKey)}
                    fontSize={14}
                    fontStyle="600"
                    fontFamily={FONT_FAMILY}
                    fill={color}
                    align="center"
                  />
                </Group>
              )
            })}

            {/* 日付グリッド */}
            {days.map((day, index) => {
              const pos = getCellPosition(index)
              const entry = getEntry(day.dateString)
              const holidayInfo =
                settings.showHolidays && day.isCurrentMonth ? isHoliday(day.date) : false
              const dayColor = getDayColor(day, holidayInfo)

              // エントリから値を取得
              const stampStyle = getStampStyle(entry?.stamp)
              const timeFrom = entry?.timeFrom ?? ''
              const timeTo = entry?.timeTo ?? ''
              const time = timeFrom || timeTo ? `${timeFrom}-${timeTo}` : ''
              const freeText = entry?.text ?? ''

              // 罫線モード用の背景色
              const cellBgColor = isLinedStyle
                ? day.isCurrentMonth
                  ? 'transparent'
                  : `${theme.bg}40`
                : day.isCurrentMonth
                  ? theme.bg
                  : `${theme.bg}80`

              return (
                <Group
                  key={day.dateString}
                  x={pos.x}
                  y={pos.y}
                  onClick={() => day.isCurrentMonth && setSelectedDate(day.dateString)}
                  onTap={() => day.isCurrentMonth && setSelectedDate(day.dateString)}
                >
                  {/* セル背景 */}
                  <Rect
                    width={cellWidth}
                    height={cellHeight}
                    fill={cellBgColor}
                    cornerRadius={isLinedStyle ? 0 : CELL_RADIUS}
                    stroke={isLinedStyle ? lineColor : undefined}
                    strokeWidth={isLinedStyle ? 0.5 : 0}
                  />

                  {/* スタンプ（左上） - padding: 4px, icon size: 10 */}
                  {stampStyle && (
                    <Group x={4} y={4}>
                      {/* アイコン系スタンプ */}
                      {(stampStyle.key === 'available' ||
                        stampStyle.key === 'few' ||
                        stampStyle.key === 'reserved') && (
                        <>
                          <Rect width={14} height={12} fill={stampStyle.bgColor} cornerRadius={2} />
                          {stampStyle.key === 'available' && (
                            <Circle
                              x={7}
                              y={6}
                              radius={3.5}
                              stroke={stampStyle.textColor}
                              strokeWidth={1.5}
                            />
                          )}
                          {stampStyle.key === 'few' && (
                            <Line
                              points={[7, 2, 11.5, 9.5, 2.5, 9.5]}
                              stroke={stampStyle.textColor}
                              strokeWidth={1.5}
                              closed
                              lineJoin="round"
                            />
                          )}
                          {stampStyle.key === 'reserved' && (
                            <Line
                              points={[3.5, 2.5, 10.5, 9.5, 7, 6, 3.5, 9.5, 10.5, 2.5]}
                              stroke={stampStyle.textColor}
                              strokeWidth={1.5}
                              lineCap="round"
                            />
                          )}
                        </>
                      )}
                      {/* テキスト系スタンプ（closed, full） */}
                      {(stampStyle.key === 'closed' || stampStyle.key === 'full') &&
                        (() => {
                          const stampText = t(`quickInput.${stampStyle.key}`)
                          // テキスト幅を推定: 日本語1文字=8px, 英語1文字=5px + 左右padding 4px
                          const isJapanese = /[\u3000-\u9fff]/.test(stampText)
                          const textWidth = isJapanese ? stampText.length * 8 : stampText.length * 5
                          const stampWidth = textWidth + 6
                          return (
                            <>
                              <Rect
                                width={stampWidth}
                                height={12}
                                fill={stampStyle.bgColor}
                                cornerRadius={2}
                              />
                              <Text
                                x={0}
                                y={1}
                                width={stampWidth}
                                text={stampText}
                                fontSize={8}
                                fontStyle="bold"
                                fontFamily={FONT_FAMILY}
                                fill={stampStyle.textColor}
                                align="center"
                              />
                            </>
                          )
                        })()}
                    </Group>
                  )}

                  {/* 六曜と日付（右上） - 日付は右揃え、六曜は日付の左 */}
                  {(() => {
                    const dayStr = String(day.day)
                    // 日付の幅を推定（六曜の位置決めに使用）
                    const dayWidth = dayStr.length === 1 ? 8 : 14
                    return (
                      <Group y={4}>
                        {/* 日付 - 右端から4pxの位置に右揃え */}
                        <Text
                          x={cellWidth - 4}
                          y={0}
                          text={dayStr}
                          fontSize={12}
                          fontStyle="bold"
                          fontFamily={FONT_FAMILY}
                          fill={dayColor}
                          align="right"
                          width={30}
                          offsetX={30}
                        />
                        {/* 六曜 - 日付の左に4pxの間隔で配置 */}
                        {settings.showRokuyo && day.isCurrentMonth && (
                          <Text
                            x={cellWidth - 4 - dayWidth - 4}
                            y={6}
                            text={getRokuyoName(day.date)}
                            fontSize={6}
                            fontFamily={FONT_FAMILY}
                            fill={dayColor}
                            align="right"
                            width={30}
                            offsetX={30}
                          />
                        )}
                      </Group>
                    )
                  })()}

                  {/* 時刻 - marginTop: 4px from first row (~18px) */}
                  {time && (
                    <Text
                      x={4}
                      y={22}
                      text={time}
                      fontSize={9}
                      fontStyle="bold"
                      fontFamily={FONT_FAMILY}
                      fill={theme.textMuted}
                    />
                  )}

                  {/* 予定コメント - marginTop: 4px from time or first row */}
                  {freeText && (
                    <Text
                      x={4}
                      y={time ? 36 : 22}
                      width={cellWidth - 8}
                      height={cellHeight - (time ? 40 : 26)}
                      text={freeText}
                      fontSize={10}
                      fontStyle="bold"
                      fontFamily={FONT_FAMILY}
                      fill={theme.text}
                      wrap="char"
                    />
                  )}
                </Group>
              )
            })}

            {/* コメント（右下） */}
            {comment && (
              <Text
                x={PADDING}
                y={BASE_SIZE - PADDING - 16}
                width={BASE_SIZE - PADDING * 2}
                text={comment}
                fontSize={12}
                fontFamily={FONT_FAMILY}
                fill={theme.text}
                align="right"
              />
            )}
          </Layer>

          {/* 選択枠レイヤー（エクスポート時は非表示） */}
          <Layer ref={selectionLayerRef}>
            {(() => {
              const selectedIndex = days.findIndex((d) => d.dateString === selectedDate)
              if (selectedIndex === -1) return null
              const pos = getCellPosition(selectedIndex)
              return (
                <Rect
                  x={pos.x}
                  y={pos.y}
                  width={cellWidth}
                  height={cellHeight}
                  stroke={theme.accent}
                  strokeWidth={2}
                  cornerRadius={isLinedStyle ? 0 : CELL_RADIUS}
                />
              )
            })()}
          </Layer>
        </Stage>
      </div>
    )
  }
)
