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
  inline?: boolean
}

export function ImageSelector({
  value,
  onChange,
  theme,
  previewSize = 'medium',
  previewFit = 'cover',
  inline = false,
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
  const inlineSizeClass = 'h-8 w-8'
  const fitClass = previewFit === 'contain' ? 'object-contain' : 'object-cover'

  return (
    <div className={inline ? 'flex items-center gap-2' : ''}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleSelect}
          className="hidden"
        />
        {inline && value && (
          <img
            src={value}
            alt="Preview"
            className={`${inlineSizeClass} ${fitClass} rounded`}
            style={{ border: `1px solid ${theme.textMuted}` }}
          />
        )}
        <button
          onClick={() => inputRef.current?.click()}
          className={`rounded text-sm transition-opacity hover:opacity-80 ${inline ? 'px-2 py-1' : 'px-3 py-2'}`}
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
            className={`flex items-center gap-1 rounded text-sm transition-opacity hover:opacity-80 ${inline ? 'px-2 py-1' : 'px-3 py-2'}`}
            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
          >
            <FontAwesomeIcon icon={faTrash} />
            {!inline && t('settings.removeImage')}
          </button>
        )}
      </div>
      {!inline && value && (
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
