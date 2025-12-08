import { useState, useRef, useCallback } from 'react'

interface UseLogoImageReturn {
  logoImage: string | null
  logoAspectRatio: number
  inputRef: React.RefObject<HTMLInputElement>
  handleSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemove: () => void
}

export function useLogoImage(): UseLogoImageReturn {
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [logoAspectRatio, setLogoAspectRatio] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null!)

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 次回同じファイルも選択可能にするためリセット
    if (inputRef.current) {
      inputRef.current.value = ''
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return

      const img = new Image()
      const currentFile = file.name + file.lastModified

      img.onload = () => {
        if (inputRef.current?.dataset.pending !== currentFile) return
        setLogoAspectRatio(img.width / img.height)
        setLogoImage(dataUrl)
        delete inputRef.current?.dataset.pending
      }

      img.onerror = () => {
        console.error('Failed to load logo image')
        delete inputRef.current?.dataset.pending
      }

      if (inputRef.current) {
        inputRef.current.dataset.pending = currentFile
      }
      img.src = dataUrl
    }

    reader.onerror = () => {
      console.error('Failed to read file')
    }

    reader.readAsDataURL(file)
  }, [])

  const handleRemove = useCallback(() => {
    setLogoImage(null)
    setLogoAspectRatio(1)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  return {
    logoImage,
    logoAspectRatio,
    inputRef,
    handleSelect,
    handleRemove,
  }
}
