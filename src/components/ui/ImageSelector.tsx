import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { AppThemeColors } from '../../lib/types'
import { processImageFile } from '../../lib/image'

interface ImageSelectorProps {
  value: string | null
  onChange: (value: string | null) => void
  theme: AppThemeColors
  previewSize?: 'small' | 'medium'
  previewFit?: 'contain' | 'cover'
}

export function ImageSelector({
  value,
  onChange,
  theme,
  previewSize = 'medium',
  previewFit = 'cover',
}: ImageSelectorProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const webpDataUrl = await processImageFile(file)
      onChange(webpDataUrl)
    } catch (error) {
      console.error('Failed to process image:', error)
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onChange(null)
  }

  const sizeClass = previewSize === 'small' ? 'h-12 w-12' : 'h-16 w-16'
  const fitClass = previewFit === 'contain' ? 'object-contain' : 'object-cover'

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleSelect}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded px-3 py-2 text-sm transition-opacity hover:opacity-80"
          style={{
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.textMuted}`,
          }}
        >
          {t('settings.selectImage')}
        </button>
        {value && (
          <button
            onClick={handleRemove}
            className="flex items-center gap-1 rounded px-3 py-2 text-sm transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
          >
            <FontAwesomeIcon icon={faTrash} />
            {t('settings.removeImage')}
          </button>
        )}
      </div>
      {value && (
        <div className="mt-2">
          <img
            src={value}
            alt="Preview"
            className={`${sizeClass} ${fitClass} rounded`}
            style={{ border: `1px solid ${theme.textMuted}` }}
          />
        </div>
      )}
    </div>
  )
}
