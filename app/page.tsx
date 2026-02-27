'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const GLITCH_CHARS = '!@#$%&*?/\\|<>[]{}~'
function glitch(str: string, intensity = 0.3) {
  return str.split('').map(c =>
    Math.random() < intensity ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : c
  ).join('')
}

const FLOATING_THINGS = [
  { x: 8, y: 12, text: '404', rot: -15, size: 11, op: 0.65 },
  { x: 82, y: 7, text: 'NaN', rot: 8, size: 10, op: 0.6 },
  { x: 3, y: 55, text: 'undefined', rot: 90, size: 9, op: 0.6 },
  { x: 91, y: 44, text: '¯\\_(ツ)_/¯', rot: -5, size: 10, op: 0.65 },
  { x: 15, y: 85, text: 'todo: fix later', rot: 12, size: 9, op: 0.6 },
  { x: 75, y: 78, text: 'it works on my machine', rot: -20, size: 8, op: 0.6 },
  { x: 50, y: 4, text: '0xDEADBEEF', rot: 0, size: 9, op: 0.6 },
  { x: 88, y: 90, text: 'wip', rot: 45, size: 14, op: 0.65 },
  { x: 42, y: 92, text: '// TODO', rot: -8, size: 10, op: 0.6 },
  { x: 6, y: 30, text: '∞', rot: 0, size: 20, op: 0.6 },
]

const LINKS = [
  { href: '#', label: 'jeux inutiles', emoji: '🎮', desc: 'bientôt™', disabled: true },
  { href: '#', label: 'pensées aléatoires', emoji: '💭', desc: 'probablement pas', disabled: true },
  { href: '#', label: 'trucs & machins', emoji: '🔧', desc: 'en construction permanente', disabled: true },
]

export default function PapopePage() {
  const [title, setTitle] = useState('PAPOPE')
  const [blink, setBlink] = useState(true)
  const [counter, setCounter] = useState(1337)
  const [clicks, setClicks] = useState(0)
  const [easterEgg, setEasterEgg] = useState(false)
  const [version, setVersion] = useState('?.?.?-unstable')
  const [clock, setClock] = useState('')
  const [year, setYear] = useState('')
  const [mounted, setMounted] = useState(false)

  // Client-only values — avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    setVersion(`v${Math.floor(Math.random()*3+1)}.${Math.floor(Math.random()*9)}.${Math.floor(Math.random()*99)}-unstable`)
    setYear(String(new Date().getFullYear()))
    const tick = () => setClock(new Date().toLocaleString('fr-FR', { hour12: false }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Occasional title glitch
  useEffect(() => {
    let glitching = false
    const run = () => {
      const delay = Math.random() * 8000 + 3000
      setTimeout(() => {
        if (glitching) return
        glitching = true
        let count = 0
        const flicker = setInterval(() => {
          setTitle(count % 2 === 0 ? glitch('PAPOPE', 0.4) : 'PAPOPE')
          count++
          if (count > 7) { clearInterval(flicker); setTitle('PAPOPE'); glitching = false; run() }
        }, 80)
      }, delay)
    }
    run()
  }, [])

  // Blink cursor
  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 530)
    return () => clearInterval(t)
  }, [])

  // Fake visitor counter
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() < 0.1) setCounter(c => c + Math.floor(Math.random() * 3) + 1)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  if (!mounted) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Oswald:wght@700;800;900&family=IBM+Plex+Mono:wght@400;700&display=swap');

        .papope-root {
          min-height: 100vh;
          background: #0a0a0a;
          color: #e8e4dd;
          font-family: 'IBM Plex Mono', monospace;
          overflow-x: hidden;
          position: relative;
          cursor: crosshair;
        }

        /* Scanline overlay */
        .papope-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.08) 2px,
            rgba(0,0,0,0.08) 4px
          );
          pointer-events: none;
          z-index: 9999;
        }

        /* Noise texture */
        .papope-root::after {
          content: '';
          position: fixed;
          inset: 0;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 9998;
        }

        .title-font { font-family: 'Oswald', sans-serif; }
        .vt-font { font-family: 'VT323', monospace; }
        .mono-font { font-family: 'IBM Plex Mono', monospace; }

        .papope-title {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(5rem, 20vw, 14rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 0.85;
          color: #e8e4dd;
          position: relative;
          text-transform: uppercase;
          user-select: none;
        }

        .papope-title .accent { color: #c8f135; }

        .papope-title::before {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          color: #ff2d55;
          clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
          transform: translate(3px, -2px);
          opacity: 0;
          animation: glitch-clip 6s infinite;
        }

        .papope-title::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          color: #00d4ff;
          clip-path: polygon(0 66%, 100% 66%, 100% 100%, 0 100%);
          transform: translate(-3px, 2px);
          opacity: 0;
          animation: glitch-clip 6s infinite 0.3s;
        }

        @keyframes glitch-clip {
          0%, 90%, 100% { opacity: 0; transform: translate(0); }
          91% { opacity: 0.7; transform: translate(3px, -2px); }
          93% { opacity: 0.7; transform: translate(-3px, 2px); }
          95% { opacity: 0.7; transform: translate(2px, -1px); }
          97% { opacity: 0; }
        }

        .status-bar {
          background: #111;
          border: 1px solid #222;
          padding: 8px 16px;
          font-size: 11px;
          color: #a3a3a3; /* BRIGHTENED */
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #c8f135;
          display: inline-block;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .link-card {
          background: #111;
          border: 1px solid #333; /* BRIGHTENED BORDER */
          padding: 18px 20px;
          cursor: not-allowed;
          opacity: 0.65; /* BRIGHTENED from 0.4 */
          transition: all 0.15s;
          position: relative;
          overflow: hidden;
        }

        .link-card::before {
          content: 'SOON';
          position: absolute;
          top: 6px; right: 8px;
          font-family: 'VT323', monospace;
          font-size: 14px;
          color: #888; /* BRIGHTENED */
          letter-spacing: 0.1em;
        }

        .marquee-wrap {
          overflow: hidden;
          border-top: 1px solid #1a1a1a;
          border-bottom: 1px solid #1a1a1a;
          background: #0d0d0d;
          padding: 6px 0;
        }

        .marquee-inner {
          display: inline-flex;
          gap: 0;
          animation: marquee 25s linear infinite;
          white-space: nowrap;
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .marquee-item {
          font-family: 'VT323', monospace;
          font-size: 16px; /* slightly larger */
          color: #888; /* BRIGHTENED */
          padding: 0 24px;
          letter-spacing: 0.1em;
        }

        .visitor-box {
          background: #0d0d0d;
          border: 1px solid #222;
          padding: 8px 14px;
          text-align: center;
          display: inline-block;
        }

        .click-zone {
          cursor: pointer;
          transition: all 0.1s;
        }
        .click-zone:active { transform: scale(0.97); }

        .hidden-link {
          color: #333; /* BRIGHTENED slightly so it's not totally invisible */
          font-size: 12px;
          text-decoration: none;
          font-family: 'IBM Plex Mono', monospace;
          transition: color 0.3s;
          letter-spacing: 0;
        }
        .hidden-link:hover { color: #888; }

        .egg-flash {
          position: fixed;
          inset: 0;
          background: rgba(200, 241, 53, 0.03);
          pointer-events: none;
          z-index: 100;
          animation: egg-fade 0.4s ease-out forwards;
        }
        @keyframes egg-fade {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .floating-text {
          position: fixed;
          font-family: 'IBM Plex Mono', monospace;
          pointer-events: none;
          user-select: none;
          color: #e8e4dd;
        }

        .badge {
          display: inline-block;
          background: #0d0d0d;
          border: 1px solid #333;
          font-family: 'VT323', monospace;
          font-size: 14px;
          color: #aaa; /* BRIGHTENED */
          padding: 2px 8px;
          letter-spacing: 0.08em;
        }
      `}</style>

      <div className="papope-root">
        {/* Floating background ghosts */}
        {FLOATING_THINGS.map((f, i) => (
          <div key={i} className="floating-text" style={{
            left: `${f.x}%`, top: `${f.y}%`,
            fontSize: `${f.size}px`,
            opacity: f.op,
            transform: `rotate(${f.rot}deg)`,
          }}>
            {f.text}
          </div>
        ))}

        {easterEgg && <div className="egg-flash" onAnimationEnd={() => setEasterEgg(false)} />}

        {/* Status bar */}
        <div className="status-bar">
          <span><span className="status-dot" style={{ display: 'inline-block', marginRight: 6 }} />online</span>
          <span style={{ color: '#444' }}>|</span>
          <span style={{ fontFamily: 'VT323, monospace', fontSize: 16, color: '#888', letterSpacing: '0.05em' }}>
            papope.com/{version}
          </span>
          <span style={{ color: '#444' }}>|</span>
          <div className="visitor-box">
            <div style={{ fontFamily: 'VT323, monospace', fontSize: 10, color: '#888', letterSpacing: '0.2em', marginBottom: 1 }}>VISITORS</div>
            <div style={{ fontFamily: 'VT323, monospace', fontSize: 18, color: '#e8e4dd', letterSpacing: '0.1em' }}>
              {String(counter).padStart(6, '0')}
            </div>
          </div>
          <span style={{ marginLeft: 'auto', fontFamily: 'VT323, monospace', fontSize: 14, color: '#888' }}>
            {clock}
          </span>
        </div>

        {/* Marquee */}
        <div className="marquee-wrap">
          <div className="marquee-inner">
            {Array.from({ length: 2 }, (_, rep) =>
              ['bienvenue sur papope.com', '★ work in progress ★', 'pas de cookies ici', '★ fait avec ce bon vieux Claude', 'contenu 100% non certifié', '★ responsabilité nulle', 'javascript enabled', '★ optimisé pour les écrans', 'aucun tracking aucune pub', '★ mise à jour quand j\'ai envie'].map((t, i) => (
                <span key={`${rep}-${i}`} className="marquee-item">{t.toUpperCase()}</span>
              ))
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 2rem 6rem' }}>

          {/* Giant title */}
          <div style={{ marginBottom: '1rem' }} className="click-zone" onClick={() => { setClicks(c => c+1); if (clicks >= 4) setEasterEgg(true) }}>
            <h1
              className="papope-title text-center"
              data-text={title}
            >
              PA<span className="accent">PO</span>PE
            </h1>
            {/* BRIGHTENED SUBTITLE */}
            <div style={{ fontFamily: 'VT323, monospace', fontSize: 18, color: '#888', letterSpacing: '0.35em', marginTop: '0.25rem' }} className="text-center">
              INTERNET PERSONNNEL{blink ? ' _' : '  '}
            </div>
          </div>

          {/* Description */}
          <div style={{ borderLeft: '2px solid #333', paddingLeft: '1.25rem', marginBottom: '3rem', marginTop: '2rem' }}>
            {/* BRIGHTENED DESCRIPTION TEXT */}
            <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.7, maxWidth: 420 }}>
              {'>'} site personnel. contenu varié. qualité non garantie.<br />
              {'>'} pas de licorne ici.<br />
              {'>'} made by one person at night probably.
            </p>
          </div>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ height: 1, flex: 1, background: '#333' }} />
            {/* BRIGHTENED HEADER TEXT */}
            <span style={{ fontFamily: 'VT323, monospace', fontSize: 15, color: '#888', letterSpacing: '0.3em' }}>// TRUCS</span>
            <div style={{ height: 1, flex: 1, background: '#333' }} />
          </div>

          {/* Link cards */}
          <div style={{ display: 'grid', gap: 8 }}>
            {LINKS.map((link, i) => (
              <div key={i} className="link-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, opacity: 0.8 }}>{link.emoji}</span>
                  <div>
                    {/* BRIGHTENED CARD TEXT */}
                    <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', color: '#e8e4dd', textTransform: 'uppercase' }}>{link.label}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2, fontFamily: 'VT323, monospace', letterSpacing: '0.08em' }}>{link.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Badges row */}
          <div style={{ display: 'flex', gap: 6, marginTop: '2.5rem', flexWrap: 'wrap' }}>
            {['best viewed in any browser', 'AI slop guarantee™', 'W3C non-compliant', 'mobile: probably fine', '©forever papope'].map((b, i) => (
              <span key={i} className="badge">{b}</span>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
              {/* BRIGHTENED FOOTER TEXT */}
              <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
                <div>fait avec du café et ce bon vieux claudius</div>
                <div style={{ marginTop: 2 }}>{year} — papope.com — tous droits réservés probablement</div>
              </div>
              {/* The hidden link */}
              <Link href="/keeppushing" className="hidden-link" title="">
                ·
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}