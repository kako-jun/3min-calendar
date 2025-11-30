import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { shareImage, downloadImage, copyImageToClipboard } from '../lib/capture'
import { useCalendarStore } from '../lib/store'
import { APP_THEMES } from '../lib/types'

interface ActionButtonsProps {
  calendarRef: React.RefObject<HTMLDivElement>
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
      await shareImage(calendarRef.current, filename)
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'Web Share API is not supported') {
          showMessage(t('messages.copied'))
        } else if (error.name !== 'AbortError') {
          try {
            await copyImageToClipboard(calendarRef.current)
            showMessage(t('messages.copied'))
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
      await downloadImage(calendarRef.current, filename)
      showMessage(t('messages.downloaded'))
    } catch {
      showMessage(t('messages.downloadFailed'))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {/* シェアボタン */}
        <button
          onClick={handleShare}
          disabled={isProcessing}
          className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: appTheme.accent }}
        >
          <span>📤</span>
          <span>{t('actions.share')}</span>
        </button>

        {/* ダウンロードボタン */}
        <button
          onClick={handleDownload}
          disabled={isProcessing}
          className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
        >
          <span>💾</span>
          <span>{t('actions.download')}</span>
        </button>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div
          className="rounded px-3 py-1 text-sm"
          style={{ backgroundColor: appTheme.surface, color: appTheme.text }}
        >
          {message}
        </div>
      )}
    </div>
  )
}
