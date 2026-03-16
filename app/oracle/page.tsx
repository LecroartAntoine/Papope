'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const STARS = Array.from({ length: 120 }, (_, i) => ({
  x: (i * 137.508 + 23) % 100,
  y: (i * 97.3 + 11) % 100,
  size: (i % 3 === 0) ? 1.5 : (i % 5 === 0) ? 2 : 1,
  opacity: 0.2 + (i % 7) * 0.1,
  dur: 2 + (i % 5),
  delay: (i % 11) * 0.3,
}))

// ─── Free APIs ────────────────────────────────────────────────────────────────

async function fetchIngredients() {
  const [advice, fact, bored] = await Promise.allSettled([
    fetch('/api/oracle-ingredients?type=advice')
      .then(r => r.json()).then(d => d.value ?? ''),
    fetch('/api/oracle-ingredients?type=fact')
      .then(r => r.json()).then(d => d.value ?? ''),
    fetch('/api/oracle-ingredients?type=bored')
      .then(r => r.json()).then(d => d.value ?? ''),
  ])
  return {
    advice: advice.status === 'fulfilled' ? advice.value : 'existence precedes essence',
    fact: fact.status === 'fulfilled' ? fact.value : 'the universe is mostly empty space',
    activity: bored.status === 'fulfilled' ? bored.value : 'contemplate the void',
  }
}

async function callOracle(question: string, ingredients: { advice: string; fact: string; activity: string }): Promise<string> {

  const res = await fetch(new Request('/api/oracle-prediction', {
      method: 'POST',
      body: JSON.stringify({
        ingredients,
        question
      })
    }))
  
  return await res.json()
}

// ─── Components ───────────────────────────────────────────────────────────────

function Starfield() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {STARS.map((s, i) => (
        <div key={i} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          opacity: s.opacity,
          animationDuration: `${s.dur}s`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  )
}

function CosmicEye({ state }: { state: 'idle' | 'thinking' | 'done' }) {
  return (
    <div className={`cosmic-eye-wrap ${state}`}>
      <svg viewBox="0 0 200 200" width="180" height="180" className="cosmic-eye-svg">
        {/* Outer rings */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(180,140,80,0.12)" strokeWidth="1" className="ring ring-3" />
        <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(180,140,80,0.18)" strokeWidth="1" className="ring ring-2" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(180,140,80,0.25)" strokeWidth="0.5" className="ring ring-1" />
        {/* Glyphs on outer ring */}
        {[0,45,90,135,180,225,270,315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const x = 100 + 82 * Math.cos(rad)
          const y = 100 + 82 * Math.sin(rad)
          return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fill="rgba(180,140,80,0.35)" fontFamily="serif">
            {['∞','Ω','✦','⊕','∴','⊗','✧','⊙'][i]}
          </text>
        })}
        {/* Eye shape */}
        <path d="M 100 65 Q 145 100 100 135 Q 55 100 100 65 Z"
          fill="rgba(0,0,0,0.8)" stroke="rgba(180,140,80,0.5)" strokeWidth="1" />
        {/* Iris */}
        <circle cx="100" cy="100" r="20" fill="rgba(15,10,5,1)"
          stroke="rgba(200,160,80,0.7)" strokeWidth="1.5" className="iris" />
        {/* Pupil */}
        <circle cx="100" cy="100" r="8" fill="rgba(200,160,80,0.15)" className="pupil" />
        {/* Inner light */}
        <circle cx="100" cy="100" r="3" fill="rgba(220,180,80,0.9)" className="inner-light" />
        {/* Reflection */}
        <circle cx="94" cy="95" r="2" fill="rgba(255,255,255,0.3)" />
      </svg>
    </div>
  )
}

function TypewriterText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const idx = useRef(0)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    idx.current = 0
    if (!text) return
    const interval = setInterval(() => {
      if (idx.current >= text.length) { clearInterval(interval); setDone(true); return }
      setDisplayed(text.slice(0, idx.current + 1))
      idx.current++
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span>
      {displayed}
      {!done && <span className="cursor-blink">▌</span>}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'thinking' | 'result' | 'error'

export default function OraclePage() {
  const [question, setQuestion] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [prophecy, setProphecy] = useState('')
  const [ingredients, setIngredients] = useState<{ advice: string; fact: string; activity: string } | null>(null)
  const [consultCount, setConsultCount] = useState(0)
  const [thinkingMsg, setThinkingMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const THINKING_MSGS = [
    'Consultation de 7.5 million années de sagesse',
    'Pause café',
    "Évaluation de la rétrogradicité de Mercure",
    "Lecture de l'astronomie pour les nuls",
    'Recherche approfondi de la recette du Gloubi-boulga',
    'Fabrication du cerceuil lunaire',
    'Probablement bientôt fini si je veux',
  ]


  useEffect(() => {
    if (phase !== 'thinking') return
    let i = 0
    setThinkingMsg(THINKING_MSGS[0])
    const t = setInterval(() => {
      i = (i + 1) % THINKING_MSGS.length
      setThinkingMsg(THINKING_MSGS[i])
    }, 1800)
    return () => clearInterval(t)
  }, [phase])

  const consult = useCallback(async () => {
    if (phase === 'thinking') return
    setPhase('thinking')
    setProphecy('')
    try {
      const ing = ingredients ?? await fetchIngredients()
      setIngredients(ing)
      const answer = await callOracle(question.trim(), ing)
      setProphecy(answer)
      setPhase('result')
      setConsultCount(c => c + 1)
      // Pre-fetch next ingredients
      fetchIngredients().then(setIngredients).catch(() => {})
    } catch (e) {
      console.error(e)
      setPhase('error')
    }
  }, [question, ingredients, phase])

  const reset = () => {
    setPhase('idle')
    setProphecy('')
    setQuestion('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phase === 'idle') consult()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Inconsolata:wght@400;700&display=swap');

        .oracle-root {
          min-height: 100vh;
          background: #050407;
          color: #c8b887;
          font-family: 'IM Fell English', serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem 4rem;
          position: relative;
          overflow: hidden;
          cursor: default;
        }

        .star {
          position: absolute;
          border-radius: 50%;
          background: #e8dfc0;
          animation: twinkle ease-in-out infinite alternate;
        }

        @keyframes twinkle {
          from { opacity: var(--op, 0.3); transform: scale(1); }
          to   { opacity: calc(var(--op, 0.3) * 0.3); transform: scale(0.6); }
        }

        /* Radial glow behind eye */
        .glow-orb {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -60%);
          width: 500px;
          height: 500px;
          background: radial-gradient(ellipse, rgba(180,130,40,0.06) 0%, transparent 70%);
          pointer-events: none;
          transition: opacity 1s;
        }
        .glow-orb.active { background: radial-gradient(ellipse, rgba(200,150,50,0.12) 0%, transparent 70%); }

        /* Eye wrapper */
        .cosmic-eye-wrap {
          position: relative;
          width: 180px;
          height: 180px;
          margin-bottom: 1.5rem;
        }

        .cosmic-eye-svg { overflow: visible; }

        .ring { transform-origin: 100px 100px; }
        .ring-1 { animation: spin-slow 20s linear infinite; }
        .ring-2 { animation: spin-slow 35s linear infinite reverse; }
        .ring-3 { animation: spin-slow 55s linear infinite; }

        @keyframes spin-slow { to { transform: rotate(360deg); } }

        .iris { transform-origin: 100px 100px; transition: all 0.5s; }
        .thinking .iris { animation: iris-pulse 0.8s ease-in-out infinite alternate; }
        .done .iris { stroke: rgba(200,180,80,1); }

        @keyframes iris-pulse {
          from { r: 20; stroke-opacity: 0.7; }
          to   { r: 26; stroke-opacity: 1; }
        }

        .inner-light {
          transform-origin: 100px 100px;
          animation: light-breathe 3s ease-in-out infinite alternate;
        }
        .thinking .inner-light { animation: light-breathe 0.4s ease-in-out infinite alternate; }

        @keyframes light-breathe {
          from { opacity: 0.6; r: 3; }
          to   { opacity: 1; r: 5; }
        }

        .pupil {
          transform-origin: 100px 100px;
          animation: pupil-breathe 4s ease-in-out infinite alternate;
        }
        @keyframes pupil-breathe {
          from { r: 8; }
          to   { r: 11; }
        }

        /* Title */
        .oracle-title {
          font-size: clamp(2.2rem, 7vw, 4rem);
          font-weight: normal;
          letter-spacing: 0.12em;
          text-align: center;
          color: #d4c090;
          margin: 0 0 0.25rem;
          line-height: 1.1;
        }

        .oracle-subtitle {
          font-family: 'Inconsolata', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.35em;
          color: rgba(180,150,80,0.9);
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        /* Divider */
        .divider {
          width: 100%;
          max-width: 420px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 1.5rem 0;
          opacity: 0.3;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c8a840, transparent);
        }
        .divider span { font-size: 10px; letter-spacing: 0.2em; white-space: nowrap; }

        /* Input area */
        .question-area {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: center;
        }

        .question-label {
          font-size: 1rem;
          color: rgba(200,180,100,0.9);
          text-align: center;
          font-style: italic;
          letter-spacing: 0.05em;
        }

        .question-input {
          width: 100%;
          background: rgba(15,10,5,0.6);
          border: 1px solid rgba(180,140,60,0.3);
          color: #d4c090;
          font-family: 'IM Fell English', serif;
          font-size: 1rem;
          padding: 12px 16px;
          text-align: center;
          outline: none;
          transition: border-color 0.3s, box-shadow 0.3s;
          letter-spacing: 0.03em;
        }
        .question-input::placeholder { color: rgba(180,140,60,0.25); font-style: italic; }
        .question-input:focus {
          border-color: rgba(200,160,60,0.85);
          box-shadow: 0 0 20px rgba(200,150,40,0.08), inset 0 0 10px rgba(200,150,40,0.03);
        }

        .consult-btn {
          font-family: 'IM Fell English', serif;
          font-size: 1rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #050407;
          background: linear-gradient(135deg, #c8a840, #a07820);
          border: none;
          padding: 13px 36px;
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
        }
        .consult-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .consult-btn:hover::before { opacity: 1; }
        .consult-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 30px rgba(200,160,40,0.3); }
        .consult-btn:active { transform: translateY(0); }
        .consult-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* Thinking state */
        .thinking-msg {
          font-family: 'Inconsolata', monospace;
          font-size: 0.75rem;
          color: rgba(200,170,80,0.90);
          text-align: center;
          letter-spacing: 0.1em;
          animation: fade-cycle 1.8s ease-in-out;
          min-height: 1.2em;
        }
        @keyframes fade-cycle {
          0% { opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; }
        }

        /* Prophecy box */
        .prophecy-wrap {
          width: 100%;
          max-width: 520px;
          border: 1px solid rgba(180,140,60,0.25);
          padding: 28px 32px;
          background: rgba(10,7,3,0.7);
          position: relative;
          animation: prophecy-appear 0.8s ease-out forwards;
        }
        @keyframes prophecy-appear {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .prophecy-wrap::before, .prophecy-wrap::after {
          content: '✦';
          position: absolute;
          font-size: 10px;
          color: rgba(200,160,60,0.85);
        }
        .prophecy-wrap::before { top: 8px; left: 12px; }
        .prophecy-wrap::after  { bottom: 8px; right: 12px; }

        .prophecy-label {
          font-family: 'Inconsolata', monospace;
          font-size: 0.9rem;
          letter-spacing: 0.4em;
          color: rgba(180,140,60,0.9);
          text-transform: uppercase;
          margin-bottom: 16px;
          text-align: center;
        }

        .prophecy-text {
          font-size: 1.2rem;
          line-height: 1.75;
          color: #d8ca98;
          text-align: center;
          font-style: italic;
        }

        .cursor-blink {
          animation: blink 0.7s step-end infinite;
          color: rgba(200,160,60,0.8);
        }
        @keyframes blink { 50% { opacity: 0; } }

        .prophecy-footer {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ingredient-chips {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        .chip {
          font-family: 'Inconsolata', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          border: 1px solid rgba(180,140,60,0.2);
          color: rgba(180,140,60,0.35);
          background: rgba(180,140,60,0.04);
        }

        .again-btn {
          font-family: 'Inconsolata', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(200,160,60,0.9);
          background: transparent;
          border: 1px solid rgba(200,160,60,0.2);
          padding: 5px 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .again-btn:hover { color: rgba(220,180,80,0.9); border-color: rgba(220,180,80,1); }

        /* Counter */
        .consult-counter {
          font-family: 'Inconsolata', monospace;
          font-size: 0.8rem;
          letter-spacing: 0.2em;
          color: rgba(150,120,60,0.85);
          margin-top: 2rem;
          text-align: center;
        }

        /* Error */
        .error-msg {
          font-family: 'Inconsolata', monospace;
          font-size: 0.75rem;
          color: rgba(200,100,80,0.9);
          text-align: center;
          letter-spacing: 0.05em;
          border: 1px solid rgba(200,100,80,0.2);
          padding: 12px 24px;
          max-width: 400px;
        }

        /* Bottom nav */
        .bottom-nav {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Inconsolata', monospace;
          font-size: 0.9rem;
          letter-spacing: 0.2em;
          color: rgba(150,120,60,0.9);
          text-decoration: none;
          transition: color 0.2s;
        }
        .bottom-nav:hover { color: rgba(180,140,60,1); }

        @media (max-width: 480px) {
          .prophecy-wrap { padding: 20px 18px; }
          .oracle-title { font-size: 2rem; }
        }
      `}</style>

      <div className="oracle-root">
        <Starfield />
        <div className={`glow-orb ${phase !== 'idle' ? 'active' : ''}`} />

        {/* Eye */}
        <CosmicEye state={phase === 'thinking' ? 'thinking' : phase === 'result' ? 'done' : 'idle'} />

        {/* Title */}
        <h1 className="oracle-title">L'Oracle</h1>

        {/* Idle state */}
        {phase === 'idle' && (
          <div className="question-area">
            <p className="question-label">
              Poses ta question à l'univers.<br />
              <span style={{ fontSize: '0.95rem', opacity: 0.6 }}>Ou pas. L'univers s'en fout royalement.</span>
            </p>
            <input
              ref={inputRef}
              className="question-input"
              type="text"
              maxLength={200}
              placeholder="Quel est le but de l'existence ?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
            />
            <button className="consult-btn" onClick={consult}>
              Consulter l'oracle
            </button>
          </div>
        )}

        {/* Thinking state */}
        {phase === 'thinking' && (
          <div style={{ textAlign: 'center' }}>
            <div className="divider"><span>⊕ Calculs ⊕</span></div>
            <div key={thinkingMsg} className="thinking-msg">{thinkingMsg}</div>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <>
            {question && (
              <div style={{ fontFamily: 'Inconsolata, monospace', fontSize: '0.85rem',
                color: 'rgba(180,140,60,0.9)', letterSpacing: '0.1em',
                marginBottom: '1rem', fontStyle: 'italic', textAlign: 'center',
                maxWidth: 420 }}>
                re: "{question.length > 80 ? question.slice(0, 80) + '…' : question}"
              </div>
            )}
            <div className="prophecy-wrap">
              <div className="prophecy-label">∴ Lecture de l'Oracle #{consultCount} ∴</div>
              <p className="prophecy-text">
                <TypewriterText text={prophecy} speed={16} />
              </p>
              {ingredients && (
                <div className="prophecy-footer">
                  <button className="again-btn" onClick={reset}>Nouvelle lecture →</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div className="error-msg">
              L'Oracle exécute son droit de grêve.<br />
              <span style={{ opacity: 0.6 }}>Oui, la CGT de l'espace quantique est réelle.</span>
            </div>
            <button className="again-btn" style={{ marginTop: 16 }} onClick={reset}>Voir s'il est revenu bosser</button>
          </div>
        )}

        {consultCount > 0 && (
          <div className="consult-counter">
            {consultCount} âme{consultCount !== 1 ? 's' : ''} consultée{consultCount !== 1 ? 's' : ''} · {42 + consultCount} questions posées à travers le Multivers Marvel.
          </div>
        )}

        <a href="/" className="bottom-nav">← sors moi de là</a>
      </div>
    </>
  )
}
