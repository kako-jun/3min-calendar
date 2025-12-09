import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareFromSquare, faDownload } from '@fortawesome/free-solid-svg-icons'
import { shareCanvasImage, downloadCanvasImage, copyCanvasImageToClipboard } from '../lib/capture'
import { useCalendarStore } from '../lib/store'
import { APP_THEMES } from '../lib/types'
import type { CalendarGridCanvasHandle } from './CalendarGridCanvas'

interface ActionButtonsProps {
  calendarRef: React.RefObject<CalendarGridCanvasHandle>
  filename: string
}

export function ActionButtons({ calendarRef, filename }: ActionButtonsProps) {
  const { t } = useTranslation()
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const showMessage = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(null), 2000)
  }

  const handleShare = async () => {
    if (!calendarRef.current || isProcessing) return
    setIsProcessing(true)

    try {
      const dataURL = calendarRef.current.toDataURL(2)
      if (!dataURL) throw new Error('Failed to get image')
      await shareCanvasImage(dataURL, filename)
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'Web Share API is not supported') {
          showMessage(t('messages.copied'))
        } else if (error.name !== 'AbortError') {
          try {
            const dataURL = calendarRef.current?.toDataURL(2)
            if (dataURL) {
              await copyCanvasImageToClipboard(dataURL)
              showMessage(t('messages.copied'))
            } else {
              showMessage(t('messages.shareFailed'))
            }
          } catch {
            showMessage(t('messages.shareFailed'))
          }
        }
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!calendarRef.current || isProcessing) return
    setIsProcessing(true)

    try {
      const dataURL = calendarRef.current.toDataURL(2)
      if (!dataURL) throw new Error('Failed to get image')
      downloadCanvasImage(dataURL, filename)
      showMessage(t('messages.downloaded'))
    } catch {
      showMessage(t('messages.downloadFailed'))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* シェアボタン */}
      <button
        onClick={handleShare}
        disabled={isProcessing}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: appTheme.accent }}
        title={t('actions.share')}
      >
        <FontAwesomeIcon icon={faShareFromSquare} />
      </button>

      {/* ダウンロードボタン */}
      <button
        onClick={handleDownload}
        disabled={isProcessing}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
        title={t('actions.download')}
      >
        <FontAwesomeIcon icon={faDownload} />
      </button>

      {/* メッセージ表示（ポップアップ） */}
      {message && (
        <div
          className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded px-3 py-1 text-xs shadow-lg"
          style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
        >
          {message}
        </div>
      )}
    </div>
  )
}
