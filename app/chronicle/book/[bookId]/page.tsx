'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { format, parseISO, parse } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useI18n } from '@/lib/i18n/context'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Link from 'next/link'
import styles from './book.module.css'
import { useUserAvatar } from '@/app/chronicle/page'
import Stars from '@/components/Chronicle/Stars'

// ─── Types ──────────────────────────────────────────────────────────────────

type Reply = {
  id: number
  trace_id: number
  author_name: string
  content: string
  created_at: string
}

type TraceReaction = {
  trace_id: number
  user_name: string
}

type DimensionRatings = {
  readability: number | null   // 1=complicated … 5=easy
  writing: number | null       // 1=poorly written … 5=well written
  length: number | null        // 1=short … 5=long
  pacing: number | null        // 1=boring … 5=riveting
  originality: number | null   // 1=conventional … 5=original
  emotion: number | null       // 1=cold … 5=moving
}

type Trace = {
  id: number
  reviewer_name: string
  date_read: string | null
  rating: string | null
  recommendation: string
  created_at: string
  language_read?: string | null
  dimensions?: DimensionRatings | null
  replies?: Reply[]
  reactions?: TraceReaction[]
}

type BookDetail = {
  id: number
  title: string
  author: string
  image_url: string | null
  categories: string[]
  added_by: string
  added_at: string
  reviews: Trace[]
  currently_reading?: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'de', label: '🇩🇪 Deutsch' },
]

// ─── LanguageSelector ──────────────────────────────────────────────────────

function LanguageSelector({ value, onChange, t }: { value: string; onChange: (val: string) => void; t: (k: string) => string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const selectedLabel = LANGUAGES.find(l => l.value === value)?.label || t('chronicle.languagePlaceholder')

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <button
        className={styles.languageTrigger}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'Inconsolata, monospace',
          fontSize: '0.9rem',
          padding: '8px 11px',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid rgba(232,220,190,0.18)`,
          borderRadius: '2px',
          color: '#E8DCBE',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <span>{selectedLabel}</span>
        <span style={{ opacity: 0.5, fontSize: '0.65em', marginLeft: '8px' }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#0D0914',
            border: '1px solid rgba(232,220,190,0.18)',
            borderRadius: '2px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            zIndex: 200,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
        >
          <button
            onClick={() => {
              onChange('')
              setIsExpanded(false)
            }}
            style={{
              fontFamily: 'Inconsolata, monospace',
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: value === '' ? '#F59E0B' : 'rgba(232, 220, 190, 0.75)',
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (value !== '') e.currentTarget.style.background = 'rgba(232, 220, 190, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = value === '' ? 'rgba(217, 119, 6, 0.12)' : 'transparent'
            }}
          >
            {t('chronicle.languagePlaceholder')}
          </button>
          {LANGUAGES.map(lang => (
            <button
              key={lang.value}
              onClick={() => {
                onChange(lang.value)
                setIsExpanded(false)
              }}
              style={{
                fontFamily: 'Inconsolata, monospace',
                fontSize: '0.72rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '8px 12px',
                background: value === lang.value ? 'rgba(217, 119, 6, 0.12)' : 'transparent',
                border: 'none',
                color: value === lang.value ? '#F59E0B' : 'rgba(232, 220, 190, 0.75)',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (value !== lang.value) e.currentTarget.style.background = 'rgba(232, 220, 190, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = value === lang.value ? 'rgba(217, 119, 6, 0.12)' : 'transparent'
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const DIMENSION_DEFS = [
  { 
    key: 'readability', 
    nameKey: 'chronicle.dimension.readability', 
    leftLabelKey: 'chronicle.dimensionReadabilityLeft', 
    rightLabelKey: 'chronicle.dimensionReadabilityRight', 
    icon: '📖' 
  },
  { 
    key: 'writing', 
    nameKey: 'chronicle.dimension.writing', 
    leftLabelKey: 'chronicle.dimensionWritingLeft', 
    rightLabelKey: 'chronicle.dimensionWritingRight', 
    icon: '✒️' 
  },
  { 
    key: 'length', 
    nameKey: 'chronicle.dimension.length', 
    leftLabelKey: 'chronicle.dimensionLengthLeft', 
    rightLabelKey: 'chronicle.dimensionLengthRight', 
    icon: '📜' 
  },
  { 
    key: 'pacing', 
    nameKey: 'chronicle.dimension.pacing', 
    leftLabelKey: 'chronicle.dimensionPacingLeft', 
    rightLabelKey: 'chronicle.dimensionPacingRight', 
    icon: '🕯️' 
  },
  { 
    key: 'originality', 
    nameKey: 'chronicle.dimension.originality', 
    leftLabelKey: 'chronicle.dimensionOriginalityLeft', 
    rightLabelKey: 'chronicle.dimensionOriginalityRight', 
    icon: '🔮' 
  },
  { 
    key: 'emotion', 
    nameKey: 'chronicle.dimension.emotion', 
    leftLabelKey: 'chronicle.dimensionEmotionLeft', 
    rightLabelKey: 'chronicle.dimensionEmotionRight', 
    icon: '🌙' 
  },
] as const

const getSafeDateValue = (dateStr: string) => {
  if (!dateStr) return null
  try { return parse(dateStr.substring(0, 7), 'yyyy-MM', new Date()) } catch { return null }
}

function formatReadDate(date: string | null, t: (k: string) => string): string {
  if (!date) return t('chronicle.readingDateUnknown')
  try {
    if (date.length === 7) {
      const [year, month] = date.split('-')
      return format(new Date(parseInt(year), parseInt(month) - 1), "MMMM yyyy", { locale: fr })
    }
    return format(parseISO(date), "MMMM yyyy", { locale: fr })
  } catch { return date }
}

// ─── DimensionSlider ─────────────────────────────────────────────────────────

function DimensionSlider({ label, leftLabel, rightLabel, leftLabelKey, rightLabelKey, icon, value, onChange, t }: {
  label: string; leftLabel?: string; rightLabel?: string; leftLabelKey?: string; rightLabelKey?: string; icon: string; value: number | null; onChange: (v: number) => void; t?: (k: string) => string
}) {
  const displayLeftLabel = leftLabelKey && t ? t(leftLabelKey) : leftLabel
  const displayRightLabel = rightLabelKey && t ? t(rightLabelKey) : rightLabel
  
  // Track leaning states for active labels
  const isLeftDominant = value !== null && value < 3
  const isRightDominant = value !== null && value > 3
  const isBalanced = value !== null && value === 3

  return (
    <div className={styles.dimRow}>
      {/* Dimension Title & Current Selection Badge */}
      {label && (
        <div className={styles.dimTitleRow}>
          <span className={styles.dimIcon}>{icon}</span>
          <span className={styles.dimTitleText}>{label}</span>
          {value !== null && <span className={styles.dimCurrentValue}>({value}/5)</span>}
        </div>
      )}

      <div className={styles.dimHeader}>
        {/* Left Label */}
        <span className={`${styles.dimLabel} ${styles.dimLeftLabel} ${
          isLeftDominant ? styles.active : isBalanced ? styles.balanced : ''
        }`}>
          {displayLeftLabel}
        </span>

        {/* Interactive spectrum track */}
        <div className={styles.dimTrack}>
          {/* Subtle Midpoint Guide Notch */}
          <div className={styles.dimCenterGuide} />

          {[1, 2, 3, 4, 5].map(n => {
            const isSelected = value === n
            return (
              <button
                key={n}
                type="button" // Prevents unexpected form submissions
                className={`${styles.dimPip} ${isSelected ? styles.active : ''}`}
                onClick={() => onChange(n)}
                title={`Select ${n}`}
              >
                {/* Visual node scaled via CSS transitions */}
                <div className={styles.dimPipVisual} />
              </button>
            )
          })}
        </div>

        {/* Right Label */}
        <span className={`${styles.dimLabel} ${styles.dimRightLabel} ${
          isRightDominant ? styles.active : isBalanced ? styles.balanced : ''
        }`}>
          {displayRightLabel}
        </span>
      </div>
    </div>
  )
}

// ─── DimensionDisplay ────────────────────────────────────────────────────────

function DimensionDisplay({ dims, t }: { dims: DimensionRatings; t: (k: string) => string }) {
  const filled = DIMENSION_DEFS.filter(d => dims[d.key] != null)
  if (!filled.length) return null

  return (
    <div className={styles.dimDisplayGrid}>
      {/* Individual Dimensions List */}
      <div className={styles.dimDisplayList}>
        {filled.map(d => {
          const value = dims[d.key] ?? 3
          const percentage = ((value - 1) / 4) * 100
          const isLeftDominant = value < 3
          const isRightDominant = value > 3
          const isBalanced = value === 3

          return (
            <div key={d.key} className={styles.dimDisplayItem}>
              <span className={styles.dimDisplayIcon} title={t(d.nameKey)}>{d.icon}</span>
              
              <div className={styles.dimDisplayBarWrap}>
                <span className={`${styles.dimDisplayLabel} ${styles.dimDisplayLabelLeft} ${
                  isLeftDominant ? styles.active : isBalanced ? styles.balanced : ''
                }`}>
                  {t(d.leftLabelKey)}
                </span>

                <div className={styles.dimDisplayTrack}>
                  <div className={styles.dimDisplayCenterNotch} />
                  <div 
                    className={styles.dimDisplayIndicator} 
                    style={{ left: `${percentage}%` }}
                    title={`${t(d.nameKey)}: ${value}`}
                  />
                </div>

                <span className={`${styles.dimDisplayLabel} ${styles.dimDisplayLabelRight} ${
                  isRightDominant ? styles.active : isBalanced ? styles.balanced : ''
                }`}>
                  {t(d.rightLabelKey)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Runic Translation Legend */}
      <div className={styles.dimLegend}>
        <span className={styles.dimLegendSigil}>✧</span>
        <div className={styles.dimLegendList}>
          {filled.map((d, index) => (
            <span key={d.key} className={styles.dimLegendItem}>
              <span className={styles.dimLegendIcon}>{d.icon}</span>
              <span className={styles.dimLegendText}>{t(d.nameKey)}</span>
              {index < filled.length - 1 && <span className={styles.dimLegendSeparator}>·</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
// ─── AddTraceForm ─────────────────────────────────────────────────────────────

function AddTraceForm({ bookId, onAdded, t, username }: {
  bookId: number; onAdded: () => void; t: (k: string) => string; username?: string
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    date_read: '',
    rating: 0,
    recommendation: '',
    language_read: '',
    dimensions: {
      readability: null, writing: null, length: null,
      pacing: null, originality: null, emotion: null,
    } as DimensionRatings,
  })
  const [loading, setLoading] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const enrichTrace = async () => {
    if (!form.recommendation.trim()) { setError('Écris d\'abord ta trace'); return }
    setEnriching(true); setError('')
    try {
      const res = await fetch('/api/chronicle/enrich-trace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recommendation: form.recommendation }) })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setForm(f => ({ ...f, recommendation: data.enrichedRecommendation }))
    } catch { setError('Failed to enrich trace') }
    finally { setEnriching(false) }
  }

  const submit = async () => {
    if (!username) { setError(t('chronicle.nameRequired')); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/chronicle/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: bookId,
          reviewer_name: username,
          date_read: form.date_read || null,
          rating: form.rating || null,
          recommendation: form.recommendation,
          language_read: form.language_read || null,
          dimensions: form.dimensions,
        }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
      onAdded()
      setTimeout(() => {
        setDone(false); setOpen(false)
        setForm({ date_read: '', rating: 0, recommendation: '', language_read: '', dimensions: { readability: null, writing: null, length: null, pacing: null, originality: null, emotion: null } })
      }, 1800)
    } catch { setError(t('chronicle.spellFailed')) }
    finally { setLoading(false) }
  }

  if (!open) return (
    <button className={styles.addReviewBtn} onClick={() => setOpen(true)}>{t('chronicle.leaveTrace')}</button>
  )

  return (
    <div className={styles.reviewFormWrap}>
      <h3 className={styles.reviewFormTitle}>{t('chronicle.carveyourReading')}</h3>

      {done ? (
        <div className={styles.reviewDone}>{t('chronicle.traceInscribed')}</div>
      ) : (
        <>
          <div className={styles.formGrid2}>
            <div>
              <label className={styles.fieldLabel}>{t('chronicle.readingDate')}</label>
              <DatePicker
                selected={getSafeDateValue(form.date_read)}
                onChange={(date: Date | null) => setForm(f => ({ ...f, date_read: date ? format(date, 'yyyy-MM') : '' }))}
                showMonthYearPicker dateFormat="MMMM yyyy"
                className={styles.fieldInput} placeholderText={t('chronicle.selectMonth')}
              />
            </div>
            <div>
               <label className={styles.fieldLabel}>{t('chronicle.languageRead')}</label>
               <LanguageSelector value={form.language_read} onChange={lang => setForm(f => ({ ...f, language_read: lang }))} t={t} />
             </div>
          </div>

          <div>
            <label className={styles.fieldLabel}>{t('chronicle.overallRating')}</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Stars rating={form.rating} interactive onSet={n => setForm(f => ({ ...f, rating: n }))} size={24} />
              <input className={styles.fieldInput} type="number" step="0.1" min="0" max="5" placeholder="0.0"
                value={form.rating || ''} onChange={e => setForm(f => ({ ...f, rating: e.target.value ? parseFloat(e.target.value) : 0 }))}
                style={{ width: 70 }} />
            </div>
          </div>

          {/* Dimensional ratings */}
          <div>
            <label className={styles.fieldLabel}>{t('chronicle.dimensionalEchoes')}</label>
            <div className={styles.dimFormGrid}>
           {DIMENSION_DEFS.map(d => (
                 <DimensionSlider
                   key={d.key}
                   label={d.key}
                   leftLabelKey={d.leftLabelKey}
                   rightLabelKey={d.rightLabelKey}
                   icon={d.icon}
                   value={form.dimensions[d.key]}
                   onChange={v => setForm(f => ({ ...f, dimensions: { ...f.dimensions, [d.key]: v } }))}
                   t={t}
                 />
               ))}
            </div>
          </div>

          <div>
            <label className={styles.fieldLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('chronicle.recommendation')}</span>
              <button type="button" onClick={enrichTrace} disabled={enriching || !form.recommendation.trim()}
                className={styles.enrichBtn}>{enriching ? '✨ ' + t('chronicle.enriching') : '✨ ' + t('chronicle.enrich')}</button>
            </label>
            <textarea className={styles.fieldTextarea} placeholder={t('chronicle.whatYouThought')} value={form.recommendation}
              onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))} />
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          <div className={styles.formActions}>
            <button className={styles.modalCancel} onClick={() => setOpen(false)}>{t('chronicle.cancel')}</button>
            <button className={styles.modalSubmit} onClick={submit} disabled={loading || enriching}>
              {loading ? t('chronicle.submitting') : t('chronicle.carveInTome')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── EditTracePanel ───────────────────────────────────────────────────────────

function EditTracePanel({ trace, onClose, onSaved, t }: { trace: Trace; onClose: () => void; onSaved: () => void; t: (k: string) => string }) {
   const [form, setForm] = useState({
     date_read: trace.date_read ? trace.date_read.substring(0, 7) : '',
     rating: trace.rating ? parseFloat(trace.rating) : 0,
     recommendation: trace.recommendation || '',
     language_read: trace.language_read || '',
     dimensions: trace.dimensions ?? { readability: null, writing: null, length: null, pacing: null, originality: null, emotion: null },
   })
   const [loading, setLoading] = useState(false)
   const [enriching, setEnriching] = useState(false)
   const [error, setError] = useState('')

   const enrichTrace = async () => {
     if (!form.recommendation.trim()) { setError('Écris d\'abord ta trace'); return }
     setEnriching(true); setError('')
     try {
       const res = await fetch('/api/chronicle/enrich-trace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recommendation: form.recommendation }) })
       if (!res.ok) throw new Error()
       const data = await res.json()
       setForm(f => ({ ...f, recommendation: data.enrichedRecommendation }))
     } catch { setError('Failed to enrich trace') }
     finally { setEnriching(false) }
   }

   const submit = async () => {
     setLoading(true); setError('')
     try {
       const res = await fetch(`/api/chronicle/reviews/${trace.id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...form, date_read: form.date_read || null, rating: form.rating || null }),
       })
       if (!res.ok) throw new Error()
       onSaved(); onClose()
     } catch { setError(t('chronicle.spellFailed')) }
     finally { setLoading(false) }
   }

  return (
    <div className={styles.reviewFormWrap} style={{ border: '1px solid rgba(109,40,217,0.25)', background: 'rgba(109,40,217,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 className={styles.reviewFormTitle} style={{ margin: 0 }}>✎ {t('chronicle.amendTrace')}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(232,220,190,0.4)', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
      </div>
      <div className={styles.formGrid2}>
        <div>
          <label className={styles.fieldLabel}>{t('chronicle.readingDate')}</label>
          <DatePicker selected={getSafeDateValue(form.date_read)}
            onChange={(date: Date | null) => setForm(f => ({ ...f, date_read: date ? format(date, 'yyyy-MM') : '' }))}
            showMonthYearPicker dateFormat="MMMM yyyy" className={styles.fieldInput} />
        </div>
        <div>
           <label className={styles.fieldLabel}>{t('chronicle.languageRead')}</label>
           <LanguageSelector value={form.language_read} onChange={lang => setForm(f => ({ ...f, language_read: lang }))} t={t} />
         </div>
      </div>
      <div>
        <label className={styles.fieldLabel}>{t('chronicle.overallRating')}</label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Stars rating={form.rating} interactive onSet={n => setForm(f => ({ ...f, rating: n }))} size={22} />
          <input className={styles.fieldInput} type="number" step="0.1" min="0" max="5" placeholder="0.0"
              value={form.rating || ''} onChange={e => setForm(f => ({ ...f, rating: e.target.value ? parseFloat(e.target.value) : 0 }))}
              style={{ width: 70 }} />
        </div>
      </div>
      <div>
        <label className={styles.fieldLabel}>{t('chronicle.dimensionalEchoes')}</label>
         <div className={styles.dimFormGrid}>
           {DIMENSION_DEFS.map(d => (
             <DimensionSlider key={d.key} label={d.key} leftLabelKey={d.leftLabelKey} rightLabelKey={d.rightLabelKey} icon={d.icon}
               value={(form.dimensions as DimensionRatings)[d.key]}
               onChange={v => setForm(f => ({ ...f, dimensions: { ...f.dimensions, [d.key]: v } }))} t={t} />
           ))}
         </div>
      </div>
       <div>
         <label className={styles.fieldLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <span>{t('chronicle.recommendation')}</span>
           <button type="button" onClick={enrichTrace} disabled={enriching || !form.recommendation.trim()}
             className={styles.enrichBtn}>{enriching ? '✨ ' + t('chronicle.enriching') : '✨ ' + t('chronicle.enrich')}</button>
         </label>
         <textarea className={styles.fieldTextarea} value={form.recommendation} onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))} />
       </div>
       {error && <p className={styles.formError}>{error}</p>}
       <div className={styles.formActions}>
         <button className={styles.modalCancel} onClick={onClose}>{t('chronicle.cancel')}</button>
         <button className={styles.modalSubmit} onClick={submit} disabled={loading || enriching}>{loading ? t('chronicle.submitting') : t('chronicle.sealTheTome')}</button>
       </div>
     </div>
   )
 }

// ─── ReplyAvatar Component ───────────────────────────────────────────────────

function ReplyAvatar({ username }: { username: string }) {
  const avatarUrl = useUserAvatar(username)
  return (
    <div className={styles.replyAvatar} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        username.slice(0, 2).toUpperCase()
      )}
    </div>
  )
}

// ─── ReplyThread ─────────────────────────────────────────────────────────────

function ReplyThread({ traceId, replies, currentUser, onUpdate, t }: {
  traceId: number; replies: Reply[]; currentUser: string | undefined | null; onUpdate: () => void; t: (k: string) => string
}) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!content.trim() || !currentUser) return
    setLoading(true)
    try {
      await fetch('/api/chronicle/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trace_id: traceId, author_name: currentUser, content: content.trim() }),
      })
      setContent(''); setOpen(false); onUpdate()
    } catch {} finally { setLoading(false) }
  }

  const deleteReply = async (replyId: number) => {
    await fetch(`/api/chronicle/replies?id=${replyId}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <div className={styles.replyThread}>
      {replies.length > 0 && (
        <div className={styles.replyList}>
          {replies.map(r => (
            <div key={r.id} className={styles.replyItem}>
              <ReplyAvatar username={r.author_name} />
              <div className={styles.replyBody}>
                <div className={styles.replyMeta}>
                  <Link href={`/chronicle/user/${encodeURIComponent(r.author_name)}`} className={styles.replyAuthor}>{r.author_name}</Link>
                  <span className={styles.replyDate}>{format(parseISO(r.created_at), 'd MMM yyyy', { locale: fr })}</span>
                  {currentUser === r.author_name && (
                    <button className={styles.replyDelete} onClick={() => deleteReply(r.id)}>✕</button>
                  )}
                </div>
                <p className={styles.replyContent}>{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentUser && (
        open ? (
          <div className={styles.replyForm}>
            <textarea
              className={styles.replyInput}
              placeholder={t('chronicle.whisperYourEcho')}
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={2}
            />
            <div className={styles.replyActions}>
              <button className={styles.modalCancel} onClick={() => setOpen(false)} style={{ padding: '5px 12px', fontSize: '0.65rem' }}>{t('chronicle.cancel')}</button>
              <button className={styles.modalSubmit} onClick={submit} disabled={loading || !content.trim()} style={{ padding: '5px 14px', fontSize: '0.65rem' }}>
                {loading ? '…' : t('chronicle.echoTrace')}
              </button>
            </div>
          </div>
        ) : (
          <button className={styles.replyOpenBtn} onClick={() => setOpen(true)}>
            ↩ {t('chronicle.echoThisTrace')} {replies.length > 0 && `(${replies.length})`}
          </button>
        )
      )}
    </div>
  )
}

// ─── TraceAvatar Component ────────────────────────────────────────────────────

function TraceAvatar({ username }: { username: string }) {
  const avatarUrl = useUserAvatar(username)
  return (
    <div className={styles.reviewAvatar} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        username.slice(0, 2).toUpperCase()
      )}
    </div>
  )
}

// ─── TraceCard ───────────────────────────────────────────────────────────────

function TraceCard({ trace, t, currentUser, onEdit, onDelete, onUpdate }: {
  trace: Trace; t: (k: string, v?: Record<string, unknown>) => string
  currentUser?: string | null; onEdit?: (trace: Trace) => void; onDelete?: (id: number) => void; onUpdate: () => void
}) {
  const isOwner = currentUser && currentUser === trace.reviewer_name
  const myReaction = trace.reactions?.find(r => r.user_name === currentUser)
  const reactionCount = trace.reactions?.length ?? 0

  const toggleReaction = async () => {
    const method = myReaction ? 'DELETE' : 'POST'
    await fetch(`/api/chronicle/reactions?traceId=${trace.id}`, { method })
    onUpdate()
  }

  const langLabel = LANGUAGES.find(l => l.value === trace.language_read)?.label

  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <Link href={`/chronicle/user/${encodeURIComponent(trace.reviewer_name)}`} className={styles.reviewAvatarLink}>
          <TraceAvatar username={trace.reviewer_name} />
        </Link>
        <div className={styles.reviewMeta}>
          <Link href={`/chronicle/user/${encodeURIComponent(trace.reviewer_name)}`} className={styles.reviewName}>{trace.reviewer_name}</Link>
          <span className={styles.reviewDate}>
            {trace.date_read
              ? t('chronicle.readOn', { date: formatReadDate(trace.date_read, t) })
              : t('chronicle.readingDateUnknown')}
          </span>
          {langLabel && <span className={styles.reviewLang}>{langLabel}</span>}
        </div>
        <div className={styles.reviewRight}>
          <Stars rating={parseFloat(trace.rating ?? '0')} />
          {isOwner && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <button onClick={() => onEdit?.(trace)} className={styles.traceActionBtn} title={t('chronicle.amendTrace')}>✎</button>
              <button onClick={() => onDelete?.(trace.id)} className={`${styles.traceActionBtn} ${styles.danger}`} title={t('chronicle.deleteTrace')}>✕</button>
            </div>
          )}
        </div>
      </div>

      {trace.recommendation && (
        <blockquote className={styles.reviewText}>"{trace.recommendation}"</blockquote>
      )}

      {trace.dimensions && <DimensionDisplay dims={trace.dimensions} t={t} />}

      <div className={styles.reviewFooter}>
        <span className={styles.reviewInscribed}>
          {t('chronicle.inscribedOn', { date: format(parseISO(trace.created_at), "d MMM yyyy", { locale: fr }) })}
        </span>
        <button
          className={`${styles.reactionBtn} ${myReaction ? styles.reacted : ''}`}
          onClick={toggleReaction}
          disabled={!currentUser}
        >
          👍 {reactionCount > 0 && <span>{reactionCount}</span>}
        </button>
      </div>

      <ReplyThread
        traceId={trace.id}
        replies={trace.replies ?? []}
        currentUser={currentUser}
        onUpdate={onUpdate}
        t={t}
      />
    </div>
  )
}

// ─── EditBookPanel ────────────────────────────────────────────────────────────

import { CATEGORY_GROUPS, ALL_CATEGORIES } from '@/app/chronicle/page'

function EditBookPanel({ book, onClose, onSaved, t }: { book: BookDetail; onClose: () => void; onSaved: () => void; t: (k: string) => string }) {
   const [form, setForm] = useState({ title: book.title, author: book.author, image_url: book.image_url || '', categories: book.categories })
   const [loading, setLoading] = useState(false)
   const [uploading, setUploading] = useState(false)
   const [error, setError] = useState('')
   const [coverPreview, setCoverPreview] = useState<string | null>(book.image_url || null)

   const toggleCat = (c: string) =>
     setForm(f => ({ ...f, categories: f.categories.includes(c) ? f.categories.filter(x => x !== c) : [...f.categories, c] }))

   const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0]
     if (!file) return
     setUploading(true)
     try {
       const formData = new FormData()
       formData.append('cover', file)
       const res = await fetch('/api/chronicle/books/cover', { method: 'POST', body: formData })
       if (!res.ok) throw new Error()
       const data = await res.json()
       setForm(f => ({ ...f, image_url: data.url }))
       setCoverPreview(data.url)
     } catch { setError(t('chronicle.spellFailed')) }
     finally { setUploading(false) }
   }

  const submit = async () => {
    if (!form.title.trim() || !form.author.trim()) { setError(t('chronicle.titleAuthorRequired')); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/chronicle/books/${book.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      onSaved(); onClose()
    } catch { setError(t('chronicle.spellFailed')) }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.reviewFormWrap} style={{ border: '1px solid rgba(232,220,190,0.15)', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 className={styles.reviewFormTitle} style={{ margin: 0 }}>✎ {t('chronicle.amendVolume')}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(232,220,190,0.4)', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
      </div>
       <div className={styles.formGrid2}>
         <div>
           <label className={styles.fieldLabel}>{t('chronicle.bookTitle')}</label>
           <input className={styles.fieldInput} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
         </div>
         <div>
           <label className={styles.fieldLabel}>{t('chronicle.author')}</label>
           <input className={styles.fieldInput} value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
         </div>
       </div>
       <div>
         <label className={styles.fieldLabel}>{t('chronicle.coverUrl')}</label>
         <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
           <label className={styles.fieldInput} style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(232,220,190,0.05)', padding: '8px 12px', minHeight: '40px' }}>
             {uploading ? '⏳ Uploading...' : form.image_url ? '✓ Update cover' : '📁 Choose cover image'}
             <input type="file" accept="image/*" onChange={handleCoverChange} disabled={uploading} style={{ display: 'none' }} />
           </label>
           {coverPreview && (
             <img src={coverPreview} alt="Cover preview" style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: '4px' }} />
           )}
         </div>
       </div>
      <div>
        <label className={styles.fieldLabel}>{t('chronicle.categories')}</label>
        <div className={styles.catGroupGrid}>
          {Object.entries(CATEGORY_GROUPS).map(([groupKey, cats]) => (
            <div key={groupKey} className={styles.catGroup}>
              <div className={styles.catGroupLabel}>{t(groupKey)}</div>
              <div className={styles.catCheckboxGrid}>
                {cats.map(cat => (
                  <label key={cat} className={`${styles.catCheckbox} ${form.categories.includes(cat) ? styles.checked : ''}`}>
                    <input type="checkbox" checked={form.categories.includes(cat)} onChange={() => toggleCat(cat)} style={{ display: 'none' }} />
                    {cat}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {error && <p className={styles.formError}>{error}</p>}
      <div className={styles.formActions}>
        <button className={styles.modalCancel} onClick={onClose}>{t('chronicle.cancel')}</button>
        <button className={styles.modalSubmit} onClick={submit} disabled={loading}>{loading ? t('chronicle.submitting') : t('chronicle.sealTheTome')}</button>
      </div>
    </div>
  )
}

// ─── HeroReaderAvatar Component ───────────────────────────────────────────────

function HeroReaderAvatar({ username }: { username: string }) {
  const avatarUrl = useUserAvatar(username)
  return (
    <Link 
      href={`/chronicle/user/${encodeURIComponent(username)}`} 
      className={styles.readerBubbleLg} 
      title={username}
      style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        username.slice(0, 2).toUpperCase()
      )}
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookPage() {
  const { t } = useI18n()
  const { status, data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const bookId = Number(params?.bookId)

  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgErr, setImgErr] = useState(false)
  const [showEditBook, setShowEditBook] = useState(false)
  const [editingTrace, setEditingTrace] = useState<Trace | null>(null)
  const [isCurrentlyReading, setIsCurrentlyReading] = useState(false)

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])

  const fetchBook = useCallback(async () => {
    try {
      const res = await fetch(`/api/chronicle/books/${bookId}`)
      if (!res.ok) { router.push('/chronicle'); return }
      const data = await res.json()
      setBook(data.book)
      console.log(data, session?.user)
      setIsCurrentlyReading(data.book.currently_reading?.includes(session?.user?.name ?? '') ?? false)
    } catch { router.push('/chronicle') }
    finally { setLoading(false) }
  }, [bookId, router, session?.user?.name])

  useEffect(() => { if (status === 'authenticated' && bookId) fetchBook() }, [status, bookId, fetchBook])

  const handleDeleteTrace = async (reviewId: number) => {
    if (!confirm(t('chronicle.confirmDeleteTrace'))) return
    try {
      await fetch(`/api/chronicle/reviews/${reviewId}`, { method: 'DELETE' })
      fetchBook()
    } catch { alert(t('chronicle.spellFailed')) }
  }

  const toggleCurrentlyReading = async () => {
    const method = isCurrentlyReading ? 'DELETE' : 'POST'
    setIsCurrentlyReading(!isCurrentlyReading)
    await fetch(`/api/chronicle/currently-reading?bookId=${bookId}`, { method })
    fetchBook()
  }

  if (status === 'loading' || status === 'unauthenticated') return null

  const validReviews = book?.reviews.filter(r => r.rating != null && !isNaN(parseFloat(r.rating ?? ''))) ?? []
  const avgRating = validReviews.length
    ? validReviews.reduce((sum, r) => sum + parseFloat(r.rating ?? '0'), 0) / validReviews.length
    : null

  return (
    <div className={styles.bookRoot}>
      <div className={styles.bookStars}>
        {Array.from({ length: 60 }, (_, i) => ({ x: (i * 137.5 + 23) % 100, y: (i * 97.3 + 11) % 100, size: i % 5 === 0 ? 1.5 : 1, op: 0.12 + (i % 7) * 0.07, dur: 2.5 + (i % 5) })).map((s, i) => (
          <div key={i} className={styles.bstar} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, ['--op' as string]: s.op, animationDuration: `${s.dur}s`, animationDelay: `${(i * 0.4) % 5}s` }} />
        ))}
      </div>
      <div className={styles.bookMist} />

      <a href="/chronicle" className={styles.backLink}>{t('chronicle.backToChronicle')}</a>

      {loading || !book ? (
        <div className={styles.loadingState}>{t('chronicle.openingTome')}</div>
      ) : (
        <>
          {/* Hero */}
          <div className={styles.bookHero}>
            <div>
              <div className={styles.bookCoverHero}>
                {book.image_url && !imgErr
                  ? <img src={book.image_url} alt={book.title} onError={() => setImgErr(true)} />
                  : <div className={styles.coverPlaceholderHero}><span className={styles.pSigil}>༒︎</span><span className={styles.pTitle}>{book.title}</span></div>
                }
              </div>
            </div>

            <div className={styles.infoCol}>
              <div className={styles.bookCategoryBadge}>✦ {book.categories.join(' · ')} ✦</div>
              <div className={styles.bookTitleRow}>
                <h1 className={styles.bookHeroTitle}>{book.title}</h1>
                <button className={styles.editBookBtn} onClick={() => setShowEditBook(v => !v)}>✎ {t('chronicle.amendVolume')}</button>
              </div>
              <p className={styles.bookHeroAuthor}>{book.author}</p>

              <button
                className={`${styles.readingToggle} ${isCurrentlyReading ? styles.active : ''}`}
                onClick={toggleCurrentlyReading}
              >
                <span>◎</span>
                {isCurrentlyReading ? t('chronicle.currentlyReadingActive') : t('chronicle.markAsReading')}
              </button>

              <div className={styles.heroAvg}>
                <span className={styles.heroAvgNum}>{avgRating?.toFixed(1)}</span>
                <Stars rating={avgRating ?? 0} quantity={validReviews.length} />
              </div>

              {book.reviews.length > 0 && (
                <div className={styles.heroReaders}>
                  <span className={styles.heroReaderLabel}>{t('chronicle.readBy')}</span>
                  {[...new Set(book.reviews.map(r => r.reviewer_name))].map((name, i) => (
                    <HeroReaderAvatar key={i} username={name} />
                  ))}
                </div>
              )}

              <div className={styles.heroAdded}>{t('chronicle.inscribedBy')} {book.added_by}</div>
            </div>
          </div>

          {/* Edit book panel (inline, no modal) */}
          {showEditBook && (
            <div style={{ maxWidth: 900, margin: '1.5rem auto 0', padding: '0 2rem' }}>
              <EditBookPanel book={book} onClose={() => setShowEditBook(false)} onSaved={fetchBook} t={t} />
            </div>
          )}

          <div className={styles.sectionDivider}><span>{t('chronicle.thoseTraces')}</span></div>

          <div className={styles.reviewsSection}>
            <AddTraceForm bookId={book.id} onAdded={fetchBook} t={t} username={session?.user?.name || undefined} />

            {editingTrace && (
              <EditTracePanel
                trace={editingTrace}
                onClose={() => setEditingTrace(null)}
                onSaved={() => { fetchBook(); setEditingTrace(null) }}
                t={t}
              />
            )}

            {book.reviews.length === 0 ? (
              <p className={styles.noReviews}>{t('chronicle.noTraces')}</p>
            ) : (
              book.reviews.map(trace => (
                <TraceCard
                  key={trace.id}
                  trace={trace}
                  t={t as (k: string, v?: Record<string, unknown>) => string}
                  currentUser={session?.user?.name}
                  onEdit={setEditingTrace}
                  onDelete={handleDeleteTrace}
                  onUpdate={fetchBook}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}