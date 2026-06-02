'use client'

import { useState, useRef, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'

export function LanguageSelector() {
  const { language, setLanguage } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectLanguage = (lang: 'en' | 'fr') => {
    setLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '6px 12px',
          background: 'transparent',
          border: '1px solid rgba(240,237,230,0.25)',
          color: 'rgba(240,237,230,0.7)',
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'border-color 0.2s, color 0.2s',
          borderRadius: '4px',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,241,53,0.5)'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#F0EDE6'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(240,237,230,0.25)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(240,237,230,0.7)'
        }}
        aria-label="Select language"
      >
        <span>{language.toUpperCase()}</span>
        <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            background: '#1E1E1E',
            border: '1px solid rgba(240,237,230,0.15)',
            borderRadius: '4px',
            zIndex: 50,
            minWidth: 120,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {(['en', 'fr'] as const).map((lang, i) => (
            <button
              key={lang}
              onClick={() => handleSelectLanguage(lang)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                background: language === lang ? 'rgba(200,241,53,0.1)' : 'transparent',
                border: 'none',
                borderTop: i > 0 ? '1px solid rgba(240,237,230,0.08)' : 'none',
                color: language === lang ? '#C8F135' : '#F0EDE6',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'background 0.15s',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={e => {
                if (language !== lang)
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  language === lang ? 'rgba(200,241,53,0.1)' : 'transparent'
              }}
            >
              {lang === 'en' ? '🇬🇧 English' : '🇫🇷 Français'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
