'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSelector } from '@/components/LanguageSelector'
import styles from './GlobalHeader.module.css'

const APPS = [
  { href: '/', label: 'common.home', emoji: '🏠', section: null, },
  { href: '/oracle', label: 'oracle.title', emoji: '🔮', section: null, },
  { href: '/chronicle', label: 'chronicle.title', emoji: '📖',section: 'chronicle', },
  { href: '/keeppushing/dashboard', label: 'keeppushing.title', emoji: '📈', section: 'keeppushing', },
  { href: '/ionickel', label: 'ionickel.title', emoji: '🚗', section: 'ionickel', },
  { href: '/games', label: 'games.title', emoji: '🎮', section: null, },
]

const HIDDEN_PATHS = ['/login', '/admin']

export function GlobalHeader() {
  const router = useRouter()
  const { t } = useI18n()
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const isAuthenticated = status === 'authenticated'
  const hasAccess = (section: string | null) => {
    if (section === null) return true
    if (!isAuthenticated) return false
    return session?.user?.sections?.includes(section) ?? false
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (status === 'loading') return null

  const isHiddenPath = HIDDEN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isHiddenPath) return null

  const userMenuItems = [
    { href: '/profile', label: t('profile.title'), icon: '👤' },
    { href: '/admin', label: t('admin.manage'), icon: '⚙️', adminOnly: true },
    { href: '#', label: t('common.logout'), icon: '🚪', onClick: () => signOut() },
  ]

  const visibleMenuItems = userMenuItems.filter(item => !item.adminOnly || session?.user?.isAdmin)

  return (
    <>
      <header className={styles.globalHeader}>
        <div className={styles.container}>
          <div className={styles.leftSection}>
            <button type="button" onClick={() => router.back()} className={styles.backBtn}>
              <span className={styles.backIcon}>←</span>
              <span className={styles.backText}>{t('common.backToHome')}</span>
            </button>

            <nav className={styles.appsNav}>
              {APPS.map((app) => {
                const accessible = hasAccess(app.section)
                if (accessible) {
                  const isActive = pathname === app.href || pathname.startsWith(app.href + '?') || pathname.startsWith(app.href + '#')
                  return (
                    <Link 
                      key={app.href} 
                      href={app.href} 
                      className={`${styles.appLink} ${isActive ? styles.active : ''}`}
                    >
                      <span className={styles.appEmoji}>{app.emoji}</span>
                      <span className={styles.appLabel}>{t(app.label)}</span>
                    </Link>
                  )
                }
              })}
            </nav>

            <button 
              type="button" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className={styles.mobileMenuBtn}
              aria-label="Toggle menu"
            >
              <span className={styles.hamburgerIcon}>☰</span>
            </button>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.langSelector}>
              <LanguageSelector />
            </div>
            
            {session?.user?.name ? (
              <div className={styles.userMenuWrapper}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={styles.profileBtn}
                  aria-label={t('profile.title')}
                >
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name} 
                      className={styles.profileAvatar}
                    />
                  ) : (
                    <div className={styles.profilePlaceholder}>
                      {session.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={styles.profileName}>{session.user.name}</span>
                  <span className={styles.chevron}>▼</span>
                </button>

                {userMenuOpen && (
                  <div ref={userMenuRef} className={styles.userMenu}>
                    {visibleMenuItems.map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        className={styles.userMenuItem}
                        onClick={item.onClick || (() => setUserMenuOpen(false))}
                      >
                        <span className={styles.menuIcon}>{item.icon}</span>
                        <span className={styles.menuLabel}>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={styles.loginBtn}>
                {t('login.signIn')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <div className={styles.mobileDropdownOverlay} onClick={() => setMobileMenuOpen(false)} />
          <div className={styles.mobileDropdown} ref={mobileDropdownRef}>
            <nav className={styles.mobileNav}>
              {APPS.map((app) => {
                const accessible = hasAccess(app.section)
                if (accessible) {
                  const isActive = pathname === app.href || pathname.startsWith(app.href + '?') || pathname.startsWith(app.href + '#')
                  return (
                    <Link
                      key={app.href}
                      href={app.href}
                      className={`${styles.mobileNavItem} ${isActive ? styles.active : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className={styles.appEmoji}>{app.emoji}</span>
                      <span className={styles.appLabel}>{t(app.label)}</span>
                    </Link>
                  )
                }
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}