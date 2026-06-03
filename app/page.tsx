'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSelector } from '@/components/LanguageSelector'

export default function HomePage() {
  const { t } = useI18n()
  const { status, data: session } = useSession()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const ALL_SECTIONS  = [
    {
      href: '/oracle',
      emoji: '🔮',
      title: t('homepage.oracleTitle'),
      desc: t('homepage.oracleDescription'),
      section: null, // public
    },
    {
      href: '/games',
      emoji: '🎮',
      title: t('homepage.gamesTitle'),
      desc: t('homepage.gamesDescription'),
      section: null, // public
    },
    {
      href: '/chronicle',
      emoji: '📖',
      title: t('homepage.chronicleTitle'),
      desc: t('homepage.chronicleDescription'),
      section: 'chronicle',
    },
    {
      href: '/keeppushing/dashboard',
      emoji: '📈',
      title: t('homepage.keeppushingTitle'),
      desc: t('homepage.keeppushingDescription'),
      section: 'keeppushing',
    },
    {
      href: '/ionickel',
      emoji: '🚗',
      title: t('homepage.ionickelTitle'),
      desc: t('homepage.ionickelDescription'),
      section: 'ionickel',
    },
  ]

  const isAuthenticated = status === 'authenticated'

  const hasAccess = (section: string | null) => {
    if (section === null) return true
    if (!isAuthenticated) return false
    return session?.user?.sections?.includes(section) ?? false
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&display=swap');

        .home-root {
          min-height: 100vh;
          background: #141414;
          color: #F0EDE6;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
        }

        .home-content {
          width: 100%;
          max-width: 900px;
        }

        .home-header {
          text-align: center;
          margin-bottom: 3rem;
          animation: fadeInUp 0.6s ease-out;
          flex: 1;
        }

        .home-title {
          font-family: 'Lilita One', cursive;
          font-size: clamp(2.5rem, 8vw, 4rem);
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          width: 100%;
          margin-bottom: 3rem;
          animation: fadeInUp 0.6s ease-out;
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }

        .card {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(200, 241, 53, 0.4);
          transform: translateY(-2px);
        }

        .card-emoji {
          font-size: 2rem;
          margin-bottom: 1rem;
          line-height: 1;
        }

        .card-title {
          font-family: 'Lilita One', cursive;
          font-size: 1.1rem;
          margin: 0 0 0.5rem;
          line-height: 1.2;
        }

        .card-desc {
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          color: rgba(240, 237, 230, 0.7);
          margin: 0;
          line-height: 1.5;
          flex: 1;
        }

        .card-locked {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          color: rgba(240, 237, 230, 0.35);
          cursor: not-allowed;
          position: relative;
        }

        .card-locked .card-emoji {
          opacity: 0.4;
        }

        .card-locked .card-title {
          opacity: 0.4;
        }

        .card-locked .card-desc {
          opacity: 0.4;
          color: rgba(240, 237, 230, 0.35);
        }

        .locked-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 0.85rem;
          opacity: 0.5;
        }

        .home-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
          animation: fadeInUp 0.6s ease-out;
          animation-delay: 0.4s;
          animation-fill-mode: both;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          background: #C8F135;
          color: #141414;
          border: none;
          border-radius: 4px;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .btn:hover {
          background: #d4ff47;
          transform: translateY(-1px);
        }

        .btn.secondary {
          background: transparent;
          color: #C8F135;
          border: 1px solid rgba(200, 241, 53, 0.5);
        }

        .btn.secondary:hover {
          border-color: #C8F135;
          background: rgba(200, 241, 53, 0.1);
        }

        .home-footer {
          text-align: center;
          margin-top: 1rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          color: rgba(240, 237, 230, 0.4);
          animation: fadeInUp 0.6s ease-out;
          animation-delay: 0.6s;
          animation-fill-mode: both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }

          .home-header {
            margin-bottom: 2rem;
          }
        }
      `}</style>

      <div className="home-root">
        <div className="home-content">
          {/* Header with Language Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div className="home-header" style={{ margin: 0 }}>
              <h1 className="home-title">PAPOPE</h1>
            </div>
            <LanguageSelector />
          </div>

          {/* All Sections */}
          <div className="cards-grid">
            {ALL_SECTIONS.map((section) => {
              const accessible = hasAccess(section.section)
              if (accessible) {
                return (
                  <Link key={section.href} href={section.href} className="card">
                    <div className="card-emoji">{section.emoji}</div>
                    <h2 className="card-title">{section.title}</h2>
                    <p className="card-desc">{section.desc}</p>
                  </Link>
                )
              }
              // Not accessible (either not authenticated or no access)
              return (
                <div key={section.section} className="card-locked">
                  <div className="locked-badge">🔒</div>
                  <div className="card-emoji">{section.emoji}</div>
                  <h2 className="card-title">{section.title}</h2>
                  <p className="card-desc">{section.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Login CTA for unauthenticated users */}
          {!isAuthenticated && (
            <div className="home-actions">
              <Link href="/login" className="btn">
                {t('login.signIn')}
              </Link>
            </div>
          )}

          {/* Admin link */}
          {isAuthenticated && session?.user?.isAdmin && (
            <div className="home-actions">
              <Link href="/admin" className="btn secondary">
                Administration
              </Link>
            </div>
          )}

          <div className="home-footer">
            {t('homepage.footer')}
          </div>
        </div>
      </div>
    </>
  )
}
