import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { useCalendarStore } from '../lib/store'
import { APP_THEMES } from '../lib/types'

const PAGES = [
  { path: '/calendar', titleKey: 'app.title' },
  { path: '/qr', titleKey: 'app.titleQR' },
] as const

export function AppHeader() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const settings = useCalendarStore((state) => state.settings)
  const appTheme = APP_THEMES[settings.appTheme]
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentPage = PAGES.find((p) => p.path === location.pathname) || PAGES[0]

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  return (
    <header className="text-left">
      <div className="flex">
        <img
          src="/logo.webp"
          alt=""
          className="mt-[5px] h-9 w-9"
          style={{
            filter: settings.appTheme === 'light' ? 'brightness(0)' : 'brightness(0) invert(1)',
          }}
        />
        <div>
          <div className="relative inline-block" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 text-sm font-bold leading-tight transition-opacity hover:opacity-80"
              style={{ color: appTheme.text }}
            >
              {t(currentPage.titleKey)}
              <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
            </button>

            {isOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1 min-w-max rounded shadow-lg"
                style={{ backgroundColor: appTheme.surface }}
              >
                {PAGES.map((page) => (
                  <button
                    key={page.path}
                    onClick={() => handleSelect(page.path)}
                    className="block w-full px-4 py-2 text-left text-sm transition-opacity hover:opacity-70"
                    style={{
                      color: appTheme.text,
                      backgroundColor: page.path === currentPage.path ? appTheme.bg : 'transparent',
                    }}
                  >
                    {t(page.titleKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-0.5 text-[10px] leading-tight" style={{ color: appTheme.textMuted }}>
            {t('app.tagline')}
          </p>
        </div>
      </div>
    </header>
  )
}
