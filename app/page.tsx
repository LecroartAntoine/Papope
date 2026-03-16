'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

const GLITCH_CHARS = '!@#$%&*?/\\|<>[]{}~'
function glitch(str: string, intensity = 0.3) {
  return str.split('').map(c =>
    Math.random() < intensity ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : c
  ).join('')
}

const FLOATING_THINGS = [
  { x: 8,  y: 12, text: '404',                    rot: -15, size: 11, op: 0.65 },
  { x: 82, y: 7,  text: 'NaN',                    rot: 8,   size: 10, op: 0.6  },
  { x: 3,  y: 55, text: 'undefined',              rot: 90,  size: 9,  op: 0.6  },
  { x: 91, y: 44, text: '¯\\_(ツ)_/¯',            rot: -5,  size: 10, op: 0.65 },
  { x: 15, y: 85, text: 'todo: fix later',        rot: 12,  size: 9,  op: 0.6  },
  { x: 75, y: 78, text: 'it works on my machine', rot: -20, size: 8,  op: 0.6  },
  { x: 50, y: 4,  text: '0xDEADBEEF',             rot: 0,   size: 9,  op: 0.6  },
  { x: 88, y: 90, text: 'wip',                    rot: 45,  size: 14, op: 0.65 },
  { x: 42, y: 92, text: '// TODO',                rot: -8,  size: 10, op: 0.6  },
  { x: 6,  y: 30, text: '∞',                      rot: 0,   size: 20, op: 0.6  },
  { x: 60, y: 20, text: 'NULL',                   rot: 33,  size: 13, op: 0.5  },
  { x: 22, y: 42, text: 'why',                    rot: -30, size: 16, op: 0.55 },
  { x: 70, y: 60, text: 'SEGFAULT',               rot: 5,   size: 9,  op: 0.5  },
  { x: 35, y: 70, text: ':(){ :|:& };:',          rot: -12, size: 8,  op: 0.5  },
  { x: 55, y: 50, text: 'rm -rf /',               rot: 20,  size: 9,  op: 0.45 },
  { x: 18, y: 8,  text: 'HTTP 418',               rot: -8,  size: 10, op: 0.55 },
  { x: 93, y: 22, text: '...',                    rot: 0,   size: 18, op: 0.4  },
]

const LINKS = [
  { href: '/games',  label: 'jeux inutiles',        emoji: '🎮', desc: 'Divertissement de faible paroxysme',       disabled: false },
  { href: '/oracle', label: "l'oracle existentiel", emoji: '🔮', desc: 'Navigation existentielle · En Partie inoffensif', disabled: false },
]

// WTF fake console errors that pop up in the corner
const FAKE_ERRORS = [
  '⚠ Warning: Soul not found',
  '✗ Error: Reality.exe has stopped',
  '⚠ TypeError: life is undefined',
  '✗ FATAL: too many feelings',
  '⚠ ReferenceError: motivation not defined',
  '✗ SyntaxError: unexpected token "why"',
  '⚠ Warning: Deprecated use of hope',
  '✗ Error: Cannot read property of void',
  '⚠ Uncaught: existential_crisis.js:42',
  '✗ StackOverflow in brain.ts',
  '⚠ Warning: Deprecated API called (life)',
]

// Easter egg parade animals
const PARADE = ['🐈‍⬛','🐸','🦆','🦀','🐡','🐧','🦭','🐊','🦖','🐙']

export default function PapopePage() {
  const [title, setTitle]           = useState('PAPOPE')
  const [counter, setCounter]       = useState(0)
  const [version, setVersion]       = useState('?.?.?-unstable')
  const [clock, setClock]           = useState('')
  const [year, setYear]             = useState('')
  const [mounted, setMounted]       = useState(false)
  const [fakeError, setFakeError]   = useState<string | null>(null)
  const [memLeak, setMemLeak]       = useState(0)
  const [paradeActive, setParadeActive] = useState(false)

  // For rapid-click easter egg detection
  const clickTimestamps = useRef<number[]>([])
  const trailId = useRef(0)

  // Client-only init
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


  // Visitor counter — random every 700ms
  useEffect(() => {
    const t = setInterval(() => {
      setCounter(Math.floor(Math.random() * 10000))
    }, 700)
    return () => clearInterval(t)
  }, [])

  // WTF: Fake console errors popping in bottom-left every ~5–9s
  useEffect(() => {
    const show = () => {
      const msg = FAKE_ERRORS[Math.floor(Math.random() * FAKE_ERRORS.length)]
      setFakeError(msg)
      setTimeout(() => setFakeError(null), 3500)
      setTimeout(show, Math.random() * 4000 + 5000)
    }
    const t = setTimeout(show, 4000)
    return () => clearTimeout(t)
  }, [])

  // WTF: Fake memory leak counter
  useEffect(() => {
    const t = setInterval(() => {
      setMemLeak(m => m + Math.floor(Math.random() * 128 + 16))
    }, 800)
    return () => clearInterval(t)
  }, [])

  // 🎉 Easter egg: 10 clicks in < 2 seconds → animal parade
  const handleTitleClick = () => {
    const now = Date.now()
    clickTimestamps.current = [...clickTimestamps.current, now].filter(t => now - t < 2000)
    if (clickTimestamps.current.length >= 10) {
      clickTimestamps.current = []
      setParadeActive(true)
      setTimeout(() => setParadeActive(false), 4000)
    }
  }

  if (!mounted) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Oswald:wght@700;800;900&family=IBM+Plex+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

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
          position: fixed; inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
          pointer-events: none; z-index: 9999;
        }

        /* Noise texture */
        .papope-root::after {
          content: '';
          position: fixed; inset: 0; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 9998;
        }

        .papope-title {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(5rem, 20vw, 14rem);
          font-weight: 900; letter-spacing: -0.03em;
          line-height: 0.85; color: #e8e4dd;
          position: relative; text-transform: uppercase; user-select: none;
        }
        .papope-title .accent { color: #c8f135; }

        .papope-title::before {
          content: attr(data-text); position: absolute; inset: 0;
          color: #ff2d55;
          clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
          transform: translate(3px, -2px); opacity: 0;
          animation: glitch-clip 6s infinite;
        }
        .papope-title::after {
          content: attr(data-text); position: absolute; inset: 0;
          color: #00d4ff;
          clip-path: polygon(0 66%, 100% 66%, 100% 100%, 0 100%);
          transform: translate(-3px, 2px); opacity: 0;
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
          background: #111; border: 1px solid #222; padding: 8px 16px;
          font-size: 11px; color: #a3a3a3;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #c8f135; display: inline-block;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .link-card {
          background: #111; border: 1px solid #333;
          padding: 18px 20px; transition: all 0.15s;
          position: relative; overflow: hidden;
        }
        .link-card.disabled { cursor: not-allowed; opacity: 0.65; }
        .link-card:not(.disabled):hover { border-color: #666; transform: translateY(-2px); }
        .link-card.disabled::before {
          content: 'SOON'; position: absolute; top: 6px; right: 8px;
          font-family: 'VT323', monospace; font-size: 14px; color: #888; letter-spacing: 0.1em;
        }

        .marquee-wrap {
          overflow: hidden; border-top: 1px solid #1a1a1a; border-bottom: 1px solid #1a1a1a;
          background: #0d0d0d; padding: 6px 0;
        }
        .marquee-inner {
          display: inline-flex; animation: marquee 25s linear infinite; white-space: nowrap;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-item {
          font-family: 'VT323', monospace; font-size: 16px; color: #888; padding: 0 24px; letter-spacing: 0.1em;
        }

        .visitor-box {
          background: #0d0d0d; border: 1px solid #222; padding: 8px 14px; text-align: center; display: inline-block;
        }

        .click-zone { cursor: pointer; transition: all 0.1s; }
        .click-zone:active { transform: scale(0.97); }

        .hidden-link {
          color: #333; font-size: 12px; text-decoration: none;
          font-family: 'IBM Plex Mono', monospace; transition: color 0.3s; letter-spacing: 0;
        }
        .hidden-link:hover { color: #888; }

        .floating-text {
          position: fixed; font-family: 'IBM Plex Mono', monospace;
          pointer-events: none; user-select: none; color: #e8e4dd;
        }

        .badge {
          display: inline-block; background: #0d0d0d; border: 1px solid #333;
          font-family: 'VT323', monospace; font-size: 14px; color: #aaa;
          padding: 2px 8px; letter-spacing: 0.08em;
        }

        /* ────────────── FAKE ERROR TOAST ────────────── */
        .fake-error-toast {
          position: fixed; bottom: 24px; left: 24px; z-index: 5000;
          background: #100808; border: 1px solid #551111;
          padding: 10px 14px; font-family: 'IBM Plex Mono', monospace;
          font-size: 11px; color: #ff6b6b; max-width: 280px;
          animation: toast-in 0.2s ease-out;
          box-shadow: 0 0 20px rgba(255,0,0,0.1);
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ────────────── CURSOR TRAIL ────────────── */
        .cursor-dot {
          position: fixed; width: 4px; height: 4px; border-radius: 50%;
          background: #c8f135; pointer-events: none; z-index: 8000;
          transform: translate(-50%, -50%);
          transition: opacity 0.4s;
        }

        /* ────────────── SCREEN FLASH ────────────── */
        .screen-flash {
          position: fixed; inset: 0; background: rgba(255,255,255,0.04);
          pointer-events: none; z-index: 9997;
        }

        /* ────────────── MEM LEAK ────────────── */
        .mem-leak {
          font-family: 'VT323', monospace; font-size: 12px; color: #ff4444;
          opacity: 0.6; letter-spacing: 0.05em;
        }

        /* ────────────── ANIMAL PARADE ────────────── */
        .parade-track {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 9990; overflow: hidden;
        }
        .parade-animal {
          position: absolute;
          font-size: 42px;
          animation: parade-run 3.5s linear forwards;
          white-space: nowrap;
          z-index: -1;
        }
        @keyframes parade-run {
          from { transform: translateX(0px); }
          to   { transform: translateX(150vw); }
        }

        /* ────────────── WTF: FAKE LOADING BAR ────────────── */
        .fake-loading-bar {
          height: 2px; background: #111; position: relative; overflow: hidden;
        }
        .fake-loading-bar::after {
          content: '';
          position: absolute; height: 100%; width: 30%;
          background: linear-gradient(90deg, transparent, #c8f135, transparent);
          animation: fake-load 2.3s ease-in-out infinite;
        }
        @keyframes fake-load {
          0%   { left: -30%; }
          100% { left: 110%; }
        }

        /* ────────────── WTF: BLINK TEXT ────────────── */
        .wtf-blink {
          animation: wtf-blink-anim 1.1s step-start infinite;
        }
        @keyframes wtf-blink-anim {
          50% { opacity: 0; }
        }

        /* ────────────── WTF: WOBBLE BADGE ────────────── */
        .wobble-badge {
          display: inline-block;
          animation: wobble 4s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(0deg); }
          20%      { transform: rotate(-3deg); }
          40%      { transform: rotate(2deg); }
          60%      { transform: rotate(-1.5deg); }
          80%      { transform: rotate(1deg); }
        }
      `}</style>

      <div className="papope-root">


        {/* Fake error toast */}
        {fakeError && (
          <div className="fake-error-toast">
            {fakeError}
          </div>
        )}

        {/* 🎉 Animal parade easter egg */}
        {paradeActive && (
          <div className="parade-track">
            {PARADE.map((animal, i) => (
              <div key={i} className="parade-animal" style={{
                top: `${20 + i * 7}%`,
                animationDelay: `${i * 0.18}s`,
              }}>
                {animal}
              </div>
            ))}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: 'VT323, monospace', fontSize: 48,
              color: '#c8f135', letterSpacing: '0.2em',
              textShadow: '0 0 20px #c8f135',
              animation: 'wtf-blink-anim 0.5s step-start infinite',
              pointerEvents: 'none',
            }}>
              EASTER EGG FOUND
            </div>
          </div>
        )}

        {/* Floating background ghosts */}
        {FLOATING_THINGS.map((f, i) => (
          <div key={i} className="floating-text" style={{
            left: `${f.x}%`, top: `${f.y}%`,
            fontSize: `${f.size}px`, opacity: f.op,
            transform: `rotate(${f.rot}deg)`,
          }}>
            {f.text}
          </div>
        ))}

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
            <div style={{ fontFamily: 'VT323, monospace', fontSize: 18, color: '#c8f135', letterSpacing: '0.1em' }}>
              {String(counter).padStart(6, '0')}
            </div>
          </div>
          <span style={{ color: '#444' }}>|</span>
          {/* WTF: Fake memory leak */}
          <span className="mem-leak">MEM: {(memLeak / 1024).toFixed(1)} KB leaked</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'VT323, monospace', fontSize: 14, color: '#888' }}>
            {clock}
          </span>
        </div>

        {/* WTF: Fake loading bar */}
        <div className="fake-loading-bar" />

        {/* Marquee */}
        <div className="marquee-wrap">
          <div className="marquee-inner">
            {Array.from({ length: 2 }, (_, rep) =>
              [
                'bienvenue sur papope.com', '★ work in progress ★', 'pas de cookies ici',
                '★ fait avec ce bon vieux Claude', 'contenu 100% non certifié', '★ responsabilité nulle',
                'javascript enabled', '★ optimisé pour les écrans', 'aucun tracking aucune pub',
                '★ mise à jour quand j\'ai envie',
                '🐛 1 bug fixed, 3 created', '★ pas lu les CGU',
                'npm audit: 847 vulnerabilities',
                'git blame: moi', '★ déployé un vendredi',
              ].map((t, i) => (
                <span key={`${rep}-${i}`} className="marquee-item">{t.toUpperCase()}</span>
              ))
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 2rem 6rem' }}>

          {/* WTF: "You are being watched" blinking */}
          <div style={{ textAlign: 'right', marginBottom: '0.5rem' }}>
            <span className="wtf-blink" style={{ fontFamily: 'VT323, monospace', fontSize: 13, color: '#ff4444', letterSpacing: '0.2em' }}>
              ● BIG MOTHER IS WATCHING YOU
            </span>
          </div>

          {/* Giant title — click 10× in 2s for easter egg */}
          <div style={{ marginBottom: '1rem' }} className="click-zone" onClick={handleTitleClick}>
            <h1 className="papope-title text-center" data-text={title}>
              PA<span className="accent">PO</span>PE
            </h1>
          </div>

          {/* Description */}
          <div style={{ borderLeft: '2px solid #333', paddingLeft: '1.25rem', marginBottom: '3rem', marginTop: '2rem' }}>
            <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.7, maxWidth: 420 }}>
              {'>'} site personnel. contenu varié. qualité non garantie.<br />
              {'>'} pas de licorne ici.<br />
              {'>'} made by one person at night probably.<br />
              {/* NEW WTF LINES */}
              {'>'} aucun animal n'a été blessé pendant le dev.<br />
              {'>'} <span style={{ color: '#666' }}>dernière mise à jour: ça dépend.</span>
            </p>
          </div>

          {/* WTF: Fake "system" alert box */}
          <div style={{
            background: '#0d0d0d', border: '1px solid #2a1a00', marginBottom: '2rem',
            padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontFamily: 'VT323, monospace', fontSize: 15, color: '#c8a040', letterSpacing: '0.08em' }}>
              AVERTISSEMENT : Ce site peut provoquer une légère confusion ontologique. Consultez un philosophe.
            </span>
          </div>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div style={{ height: 1, flex: 1, background: '#333' }} />
            <span style={{ fontFamily: 'VT323, monospace', fontSize: 15, color: '#888', letterSpacing: '0.3em' }}>// TRUCS</span>
            <div style={{ height: 1, flex: 1, background: '#333' }} />
          </div>

          {/* Link cards */}
          <div style={{ display: 'grid', gap: 8 }}>
            {LINKS.map((link, i) => {
              const inner = (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, opacity: 0.8 }}>{link.emoji}</span>
                  <div>
                    <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', color: '#e8e4dd', textTransform: 'uppercase' }}>{link.label}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2, fontFamily: 'VT323, monospace', letterSpacing: '0.08em' }}>{link.desc}</div>
                  </div>
                </div>
              )
              return link.disabled ? (
                <div key={i} className="link-card disabled">{inner}</div>
              ) : (
                <Link key={i} href={link.href} className="link-card" style={{ textDecoration: 'none' }}>{inner}</Link>
              )
            })}
          </div>

          {/* Badges row */}
          <div style={{ display: 'flex', gap: 6, marginTop: '2.5rem', flexWrap: 'wrap' }}>
            {[
              'best viewed in any browser',
              'AI slop guarantee™',
              'W3C non-compliant',
              'mobile: probably fine',
              '©forever papope',
              // NEW WTF BADGES
              'no blockchain involved',
              'vibes-driven development',
            ].map((b, i) => (
              <span key={i} className={`badge${i === 6 ? ' wobble-badge' : ''}`}>{b}</span>
            ))}
          </div>


          {/* Footer */}
          <div style={{ marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
                <div>fait avec du café et ce bon vieux claudius</div>
                <div style={{ marginTop: 2 }}>{year} — papope.com — tous droits réservés probablement</div>
              </div>
              <Link href="/keeppushing" className="hidden-link" title="">·</Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}