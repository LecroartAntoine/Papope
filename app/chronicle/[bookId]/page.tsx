'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { format, parseISO, parse } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useI18n } from '@/lib/i18n/context'
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";


type Review = {
    id: number
    reviewer_name: string
    date_read: string | null
    rating: string | null
    recommendation: string
    created_at: string
  }

type EditingTraceId = number | null

type BookDetail = {
  id: number
  title: string
  author: string
  image_url: string | null
  categories: string[]
  added_by: string
  added_at: string
  reviews: Review[]
}

// Safely converts YYYY-MM string to a Date object for react-datepicker
const getSafeDateValue = (dateStr: string) => {
  if (!dateStr) return null;
  try {
    return parse(dateStr.substring(0, 7), 'yyyy-MM', new Date());
  } catch {
    return null;
  }
};


function Stars({ rating, quantity, interactive = false, onSet }: {
    rating: number | null
    quantity?: number | null
    interactive?: boolean
    onSet?: (n: number) => void
  }) {
    const [hovered, setHovered] = useState<number | null>(null)
    const display = hovered ?? rating ?? 0
    
    return (
      <span style={{ letterSpacing: 3, cursor: interactive ? 'pointer' : 'default' }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ display: 'inline-block', position: 'relative' }}>
            {/* Full stars */}
            <span
              onClick={() => interactive && onSet?.(i + 1)}
              onMouseEnter={() => interactive && setHovered(i + 1)}
              onMouseLeave={() => interactive && setHovered(null)}
              style={{
                color: i < display ? '#F59E0B' : 'rgba(232,220,190,0.25)',
                fontSize: interactive ? 22 : 14,
                transition: 'color 0.1s',
                cursor: interactive ? 'pointer' : 'default',
                textShadow: i < display ? '0 0 4px rgba(217,119,6,0.6)' : 'none'
              }}
            >★</span>
            
            {/* Half-star overlay for decimal ratings */}
            {interactive && (
              <span
                onClick={() => onSet?.(i + 0.5)}
                onMouseEnter={() => setHovered(i + 0.5)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '50%',
                  height: '100%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  color: i + 0.5 <= display ? '#F59E0B' : 'rgba(232,220,190,0.25)',
                  fontSize: interactive ? 22 : 14,
                  transition: 'color 0.1s',
                  textShadow: i + 0.5 <= display ? '0 0 4px rgba(217,119,6,0.6)' : 'none'
                }}>★</span>
              </span>
            )}
        </span>
      ))}
      {quantity && (`(${quantity})`)}
    </span>
  )
}

function formatReadDate(date: string | null, t: (key: string) => string): string {
   if (!date) return t('chronicle.readingDateUnknown')
   try {
     // For month/year input, we need to handle it differently
     // The date comes as YYYY-MM format
     if (date.length === 7) { // YYYY-MM
       const [year, month] = date.split('-')
       return format(new Date(parseInt(year), parseInt(month) - 1), "MMMM yyyy", { locale: fr })
     }
     // For full dates, keep existing behavior
     const parsed = parseISO(date)
     return format(parsed, "MMMM yyyy", { locale: fr })
   } catch {
     return date
   }
 }

function ReviewCard({ 
  review, 
  t, 
  currentUser,
  onEdit,
  onDelete
}: { 
  review: Review
  t: (key: string, vars?: Record<string, unknown>) => string
  currentUser?: string | null
  onEdit?: (review: Review) => void
  onDelete?: (reviewId: number) => void
}) {
    const isOwner = currentUser && currentUser === review.reviewer_name

    return (
      <div className="review-card">
        <div className="review-header">
          <div className="review-avatar">
            {review.reviewer_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="review-meta">
            <span className="review-name">{review.reviewer_name}</span>
            <span className="review-date">
              {review.date_read
                ? t('chronicle.readOn', { date: formatReadDate(review.date_read, t) })
                : t('chronicle.readingDateUnknown')}
            </span>
          </div>
          <div className="review-right">
            <Stars rating={parseFloat(review.rating ?? "0")} />
            {isOwner && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button
                  onClick={() => onEdit?.(review)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(217,119,6,0.7)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    padding: '2px 4px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(217,119,6,1)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(217,119,6,0.7)')}
                >
                  ✎
                </button>
                <button
                  onClick={() => onDelete?.(review.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(239,68,68,0.7)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    padding: '2px 4px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(239,68,68,1)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.7)')}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
        {review.recommendation && (
          <blockquote className="review-text">
            "{review.recommendation}"
          </blockquote>
        )}
        <div className="review-footer">
          <span className="review-inscribed">
            {t('chronicle.inscribedOn', { date: format(parseISO(review.created_at), "d MMM yyyy", { locale: fr }) })}
          </span>
        </div>
      </div>
     )
}

const ALL_CATEGORIES = [
  'Novel', 'Essay', 'Sci-Fi', 'Fantasy', 'Thriller', 'Poetry', 'Manga', 'Comics', 
  'Young Adult', 'Mystery', 'Romance', 'Historical', 'Horror', 'Graphic Novel', 'Other'
]

function EditBookModal({ book, onClose, onSaved, t }: { 
  book: BookDetail
  onClose: () => void
  onSaved: () => void
  t: (key: string) => string 
}) {
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    image_url: book.image_url || '',
    categories: book.categories,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat]
    }))
  }

  const handleSubmit = async () => {
    if (!form.title || !form.author || form.categories.length === 0) {
      setError(t('chronicle.titleAuthorNameRequired'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/chronicle/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      onSaved()
      onClose()
    } catch {
      setError(t('chronicle.spellFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#06040C',
        border: '1px solid rgba(232,220,190,0.1)',
        borderRadius: '4px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        color: '#E8DCBE',
        fontFamily: "'IM Fell English', serif"
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>✎ Edit Book</h2>

        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>
          <span style={{ color: 'rgba(217,119,6,0.75)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{t('chronicle.bookTitle')}</span>
          <input 
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(232,220,190,0.18)',
              color: '#E8DCBE',
              padding: '8px',
              marginTop: '4px',
              borderRadius: '2px'
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>
          <span style={{ color: 'rgba(217,119,6,0.75)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{t('chronicle.author')}</span>
          <input 
            value={form.author}
            onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(232,220,190,0.18)',
              color: '#E8DCBE',
              padding: '8px',
              marginTop: '4px',
              borderRadius: '2px'
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>
          <span style={{ color: 'rgba(217,119,6,0.75)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{t('chronicle.coverUrl')}</span>
          <input 
            value={form.image_url}
            onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(232,220,190,0.18)',
              color: '#E8DCBE',
              padding: '8px',
              marginTop: '4px',
              borderRadius: '2px'
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>
          <span style={{ color: 'rgba(217,119,6,0.75)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{t('chronicle.categories')}</span>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '8px',
            marginTop: '8px'
          }}>
            {ALL_CATEGORIES.map(cat => (
              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={form.categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </label>

        {error && <p style={{ color: 'rgba(220,80,80,0.9)', fontSize: '0.9rem', marginBottom: '12px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(232,220,190,0.1)',
              color: 'rgba(232,220,190,0.7)',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            {t('chronicle.cancel')}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #D97706, #92400E)',
              border: 'none',
              color: '#06040C',
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: '2px',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? t('chronicle.submitting') : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddReviewForm({ bookId, onAdded, t, username }: { bookId: number; onAdded: () => void; t: (key: string) => string; username?: string }) {
   const [open, setOpen] = useState(false)
    const [form, setForm] = useState({
      date_read: '',
      rating: 0,
      recommendation: '',
    })
    const [loading, setLoading] = useState(false)
    const [enriching, setEnriching] = useState(false)
    const [error, setError] = useState('')
    const [done, setDone] = useState(false)

    const enrichTrace = async () => {
      if (!form.recommendation.trim()) {
        setError(t('chronicle.recommendation') + ' is required')
        return
      }
      setEnriching(true)
      setError('')
      try {
        const res = await fetch('/api/chronicle/enrich-trace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendation: form.recommendation,
          }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setForm(f => ({ ...f, recommendation: data.enrichedRecommendation }))
      } catch (err) {
        setError('Failed to enrich trace')
        console.error('Enrichment error:', err)
      } finally {
        setEnriching(false)
      }
    }

    const submit = async () => {
      if (!username) { setError(t('chronicle.nameRequired')); return }
     setLoading(true)
     setError('')
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
         }),
       })
       if (!res.ok) throw new Error()
       setDone(true)
       onAdded()
       setTimeout(() => { setDone(false); setOpen(false); setForm({ date_read: '', rating: 0, recommendation: '' }) }, 1800)
      } catch {
        setError(t('chronicle.spellFailed'))
      } finally {
       setLoading(false)
     }
    }

   if (!open) {
     return (
       <button className="add-review-btn" onClick={() => setOpen(true)}>
         {t('chronicle.leaveTrace')}
       </button>
     )
   }

   return (
     <div className="review-form-wrap">
       <h3 className="review-form-title">{t('chronicle.carveyourReading')}</h3>

        {done ? (
          <div className="review-done">{t('chronicle.traceInscribed')}</div>
        ) : (
          <>
            <div className="form-grid">
              <div>
                <label className="field-label">{t('chronicle.readingDate')}</label>
                <DatePicker
                  selected={getSafeDateValue(form.date_read)}
                  onChange={(date: Date | null) => {
                    const dateString = date ? format(date, 'yyyy-MM') : '';
                    setForm(f => ({ ...f, date_read: dateString }));
                  }}
                  showMonthYearPicker
                  dateFormat="MMMM yyyy"
                  className="field-input"
                  placeholderText="Select month..."
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">{t('chronicle.rating')}</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Stars rating={form.rating} interactive onSet={n => setForm(f => ({ ...f, rating: n }))} />
                  <input 
                    className="field-input" 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="5"
                    placeholder="0.0"
                    value={form.rating || ''} 
                    onChange={e => setForm(f => ({ ...f, rating: e.target.value ? parseFloat(e.target.value) : 0 }))}
                    style={{ width: '80px' }}
                  />
                </div>
              </div>
            </div>

           <div style={{ marginBottom: 16 }}>
              <label className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t('chronicle.recommendation')}</span>
                <button 
                  type="button"
                  onClick={enrichTrace}
                  disabled={enriching || !form.recommendation.trim()}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    background: enriching ? 'rgba(217,119,6,0.3)' : 'rgba(217,119,6,0.6)',
                    border: '1px solid rgba(217,119,6,0.5)',
                    color: '#E8DCBE',
                    cursor: enriching ? 'wait' : !form.recommendation.trim() ? 'not-allowed' : 'pointer',
                    borderRadius: '2px',
                    transition: 'all 0.2s',
                    opacity: !form.recommendation.trim() ? 0.5 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!enriching && form.recommendation.trim()) {
                      e.currentTarget.style.background = 'rgba(217,119,6,0.8)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = enriching ? 'rgba(217,119,6,0.3)' : 'rgba(217,119,6,0.6)'
                  }}
                >
                  {enriching ? '✨ Enriching...' : '✨ Enrich'}
                </button>
              </label>
              <textarea className="field-textarea"
                placeholder={t('chronicle.whatYouThought')}
                value={form.recommendation}
                onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              <button className="modal-cancel" onClick={() => setOpen(false)}>{t('chronicle.cancel')}</button>
              <button className="modal-submit" onClick={submit} disabled={loading || enriching}>
                {loading ? t('chronicle.submitting') : t('chronicle.carveInTome')}
              </button>
            </div>
         </>
       )}
     </div>
    )
}

// — EditTraceModal ————————————————————————————————————————————————————————————————————————————

function EditTraceModal({ 
  review, 
  onClose, 
  onSaved, 
  t 
}: { 
  review: Review
  onClose: () => void
  onSaved: () => void
  t: (key: string) => string
}) {
  const [form, setForm] = useState({
  date_read: review.date_read ? review.date_read.substring(0, 7) : '', 
  rating: review.rating || 0,
  recommendation: review.recommendation || '',
})
  const [loading, setLoading] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [error, setError] = useState('')

  const enrichTrace = async () => {
    if (!form.recommendation.trim()) {
      setError(t('chronicle.recommendation') + ' is required')
      return
    }
    setEnriching(true)
    setError('')
    try {
      const res = await fetch('/api/chronicle/enrich-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: form.recommendation,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setForm(f => ({ ...f, recommendation: data.enrichedRecommendation }))
    } catch (err) {
      setError('Failed to enrich trace')
      console.error('Enrichment error:', err)
    } finally {
      setEnriching(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/chronicle/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_read: form.date_read || null,
          rating: form.rating || null,
          recommendation: form.recommendation,
        }),
      })
      if (!res.ok) throw new Error()
      onSaved()
      onClose()
    } catch {
      setError(t('chronicle.spellFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#06040C',
        border: '1px solid rgba(232,220,190,0.1)',
        borderRadius: '4px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        color: '#E8DCBE',
        fontFamily: "'IM Fell English', serif"
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>✎ Edit Trace</h2>

        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>
          <span style={{ color: 'rgba(217,119,6,0.75)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{t('chronicle.readingDate')}</span>
          <div style={{ marginTop: '4px' }}>
            <DatePicker 
              selected={getSafeDateValue(form.date_read)}
              onChange={(date: Date | null) => {
                const dateString = date ? format(date, 'yyyy-MM') : '';
                setForm(f => ({ ...f, date_read: dateString }));
              }}
              showMonthYearPicker
              dateFormat="MMMM yyyy"
              className="field-input"
              placeholderText="Select month..."
            />
          </div>
        </label>

        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>
          <span style={{ color: 'rgba(217,119,6,0.75)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{t('chronicle.rating')}</span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
            <Stars rating={parseFloat(form.rating.toString() ?? "0") } interactive onSet={n => setForm(f => ({ ...f, rating: n }))} />
            <input 
              type="number" 
              step="0.1" 
              min="0" 
              max="5"
              placeholder="0.0"
              value={form.rating || ''} 
              onChange={e => setForm(f => ({ ...f, rating: e.target.value ? parseFloat(e.target.value) : 0 }))}
              style={{
                width: '80px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(232,220,190,0.18)',
                color: '#E8DCBE',
                padding: '8px',
                borderRadius: '2px'
              }}
            />
          </div>
        </label>

         <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
             <span style={{ color: 'rgba(217,119,6,0.75)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{t('chronicle.recommendation')}</span>
             <button 
               type="button"
               onClick={enrichTrace}
               disabled={enriching || !form.recommendation.trim()}
               style={{
                 padding: '4px 12px',
                 fontSize: '0.75rem',
                 background: enriching ? 'rgba(217,119,6,0.3)' : 'rgba(217,119,6,0.6)',
                 border: '1px solid rgba(217,119,6,0.5)',
                 color: '#E8DCBE',
                 cursor: enriching ? 'wait' : !form.recommendation.trim() ? 'not-allowed' : 'pointer',
                 borderRadius: '2px',
                 transition: 'all 0.2s',
                 opacity: !form.recommendation.trim() ? 0.5 : 1,
               }}
               onMouseEnter={e => {
                 if (!enriching && form.recommendation.trim()) {
                   e.currentTarget.style.background = 'rgba(217,119,6,0.8)'
                 }
               }}
               onMouseLeave={e => {
                 e.currentTarget.style.background = enriching ? 'rgba(217,119,6,0.3)' : 'rgba(217,119,6,0.6)'
               }}
             >
               {enriching ? '✨ Enriching...' : '✨ Enrich'}
             </button>
           </div>
           <textarea 
             value={form.recommendation}
             onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))}
             style={{
               width: '100%',
               background: 'rgba(255,255,255,0.03)',
               border: '1px solid rgba(232,220,190,0.18)',
               color: '#E8DCBE',
               padding: '8px',
               marginTop: '4px',
               borderRadius: '2px',
               fontFamily: "'IM Fell English', serif",
               minHeight: '90px',
               resize: 'vertical'
             }}
           />
          </label>

         {error && <p style={{ color: 'rgba(220,80,80,0.9)', fontSize: '0.9rem', marginBottom: '12px' }}>{error}</p>}

         <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
           <button 
             onClick={onClose}
             style={{
               padding: '8px 16px',
               background: 'transparent',
               border: '1px solid rgba(232,220,190,0.1)',
               color: 'rgba(232,220,190,0.7)',
               cursor: 'pointer',
               borderRadius: '2px'
             }}
           >
             {t('chronicle.cancel')}
           </button>
           <button 
             onClick={handleSubmit}
             disabled={loading || enriching}
             style={{
               padding: '8px 20px',
               background: 'linear-gradient(135deg, #D97706, #92400E)',
               border: 'none',
               color: '#06040C',
               cursor: loading || enriching ? 'not-allowed' : 'pointer',
               borderRadius: '2px',
               opacity: loading || enriching ? 0.5 : 1
             }}
           >
             {loading ? t('chronicle.submitting') : 'Save'}
           </button>
         </div>
       </div>
     </div>
   )
 }

 // — Main —————————————————————————————————————————————————————————————————————————————————————————

export default function BookPage() {
   const { t } = useI18n()
    const { status, data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const bookId = Number(params?.bookId)

  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgErr, setImgErr] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTrace, setEditingTrace] = useState<Review | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const handleDeleteTrace = async (reviewId: number) => {
    if (!confirm(t('chronicle.confirmDeleteTrace'))) return
    try {
      const res = await fetch(`/api/chronicle/reviews/${reviewId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      fetchBook()
    } catch {
      alert(t('chronicle.spellFailed'))
    }
  }

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/chronicle/books/${bookId}`)
      if (!res.ok) { router.push('/chronicle'); return }
      const data = await res.json()
      setBook(data.book)
    } catch { router.push('/chronicle') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (status === 'authenticated' && bookId) fetchBook()
  }, [status, bookId])

  if (status === 'loading' || status === 'unauthenticated') return null

const validReviews = book?.reviews.filter(r => 
    r.rating != null && r.rating !== '' && !isNaN(parseFloat(r.rating))
) || [];
const avgRating = validReviews.length
    ? validReviews.reduce((sum, r) => sum + parseFloat(r.rating ?? "0"), 0) / validReviews.length
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=Inconsolata:wght@400;500&display=swap');
        * { box-sizing: border-box; }

        .book-root {
          min-height: 100vh;
          background: #06040C;
          color: #E8DCBE;
          font-family: 'IM Fell English', serif;
          padding-bottom: 5rem;
          position: relative;
          overflow-x: hidden;
        }

        .book-mist {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 60% 40% at 30% 10%, rgba(76,29,149,0.12) 0%, transparent 65%),
            radial-gradient(ellipse 40% 30% at 80% 80%, rgba(217,119,6,0.06) 0%, transparent 60%);
        }

        /* Stars */
        .book-stars {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .bstar {
          position: absolute;
          border-radius: 50%;
          background: #e8dfc0;
          animation: btwinkle ease-in-out infinite alternate;
        }
        @keyframes btwinkle {
          from { opacity: var(--op); }
          to   { opacity: calc(var(--op) * 0.15); }
        }

        .back-link {
          position: relative;
          z-index: 10;
          display: inline-block;
          padding: 1.4rem 2rem 0;
          font-family: 'Inconsolata', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(232,220,190,0.6);
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover { color: rgba(232,220,190,0.7); }

        .book-hero {
          position: relative;
          z-index: 5;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 2.5rem;
          max-width: 900px;
          margin: 1.5rem auto 0;
          padding: 0 2rem;
          align-items: start;
        }

        .cover-col {
          flex-shrink: 0;
        }

        .book-cover-hero {
          width: 180px;
          aspect-ratio: 2/3;
          background: rgba(76,29,149,0.2);
          border: 1px solid rgba(232,220,190,0.1);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,220,190,0.05);
        }
        .book-cover-hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cover-placeholder-hero {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 20px;
          background: linear-gradient(160deg, rgba(76,29,149,0.3), rgba(6,4,12,0.8));
        }
        .cover-placeholder-hero .p-sigil { font-size: 3rem; opacity: 0.75; }
        .cover-placeholder-hero .p-title {
          font-family: 'IM Fell English', serif;
          font-size: 0.72rem;
          font-style: italic;
          color: rgba(232,220,190,0.75);
          text-align: center;
          line-height: 1.5;
        }

        .info-col {
          padding-top: 0.5rem;
        }

        .book-category-badge {
          font-family: 'Inconsolata', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(217,119,6,0.8);
          margin-bottom: 0.75rem;
        }

        .book-hero-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(1.4rem, 4vw, 2.4rem);
          font-weight: 600;
          color: #E8DCBE;
          line-height: 1.2;
          letter-spacing: 0.04em;
          margin: 0 0 0.4rem;
        }

        .book-hero-author {
          font-size: 1.1rem;
          font-style: italic;
          color: rgba(232,220,190,0.75);
          margin: 0 0 1.2rem;
        }

        .hero-avg {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.2rem;
        }

        .hero-avg-num {
          font-family: 'Cinzel', serif;
          font-size: 1.4rem;
          color: #D97706;
        }

        .hero-avg-label {
          font-family: 'Inconsolata', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(232,220,190,0.6);
        }

        .hero-readers {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 1.2rem;
        }

        .hero-reader-label {
          font-family: 'Inconsolata', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(232,220,190,0.6);
          margin-right: 4px;
        }

        .reader-bubble-lg {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(109,40,217,0.25);
          border: 1px solid rgba(109,40,217,0.45);
          font-family: 'Inconsolata', monospace;
          font-size: 0.65rem;
          font-weight: 500;
          color: rgba(232,220,190,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: 0;
          title: attr(title);
        }

        .hero-added {
          font-family: 'Inconsolata', monospace;
          font-size: 0.65rem;
          color: rgba(232,220,190,0.5);
          letter-spacing: 0.1em;
        }

        /* Divider */
        .section-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 900px;
          margin: 2.5rem auto 0;
          padding: 0 2rem;
          opacity: 0.6;
        }
        .section-divider::before, .section-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c8a840, transparent);
        }
        .section-divider span {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.3em;
          color: #c8a840;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* Reviews section */
        .reviews-section {
          position: relative;
          z-index: 5;
          max-width: 900px;
          margin: 0 auto;
          padding: 1.5rem 2rem 0;
        }

        .reviews-title {
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(232,220,190,0.75);
          margin: 0 0 1.5rem;
        }

        /* Review card */
        .review-card {
          border: 1px solid rgba(232,220,190,0.12);
          padding: 1.5rem;
          margin-bottom: 1rem;
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
          position: relative;
          transition: border-color 0.2s;
        }
        .review-card::before {
           content: '✦';
           position: absolute;
           top: 12px;
          right: 16px;
          font-size: 9px;
          color: rgba(217,119,6,0.3);
        }
        .review-card:hover { border-color: rgba(232,220,190,0.14); }

        .review-header {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .review-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(109,40,217,0.3);
          border: 1px solid rgba(109,40,217,0.5);
          font-family: 'Inconsolata', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(232,220,190,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .review-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .review-name {
          font-family: 'Cinzel', serif;
          font-size: 0.88rem;
          color: #E8DCBE;
          letter-spacing: 0.05em;
        }

        .review-date {
          font-family: 'Inconsolata', monospace;
          font-size: 0.65rem;
          color: rgba(232,220,190,0.6);
          letter-spacing: 0.1em;
        }

        .review-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .review-pages {
          font-family: 'Inconsolata', monospace;
          font-size: 0.6rem;
          color: rgba(232,220,190,0.55);
          letter-spacing: 0.1em;
        }

        .review-text {
          font-style: italic;
          font-size: 1rem;
          line-height: 1.7;
          color: rgba(232,220,190,0.75);
          margin: 0;
          padding: 0.6rem 0 0.6rem 1rem;
          border-left: 2px solid rgba(217,119,6,0.25);
        }

        .review-footer {
          margin-top: 10px;
        }

        .review-inscribed {
          font-family: 'Inconsolata', monospace;
          font-size: 0.6rem;
          color: rgba(232,220,190,0.45);
          letter-spacing: 0.1em;
        }

        .no-reviews {
          font-style: italic;
          color: rgba(232,220,190,0.6);
          font-size: 0.92rem;
          padding: 1rem 0;
        }

        /* Add review */
        .add-review-btn {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          color: #06040C;
          background: linear-gradient(135deg, #D97706, #92400E);
          border: none;
          padding: 11px 24px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          text-transform: uppercase;
          border-radius: 2px;
          display: block;
          margin-bottom: 1.5rem;
        }
        .add-review-btn:hover { opacity: 0.85; transform: translateY(-1px); }

        .review-form-wrap {
          border: 1px solid rgba(217,119,6,0.18);
          padding: 1.8rem;
          background: rgba(217,119,6,0.03);
          margin-bottom: 2rem;
          border-radius: 4px;
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .review-form-title {
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          letter-spacing: 0.25em;
          color: rgba(232,220,190,0.88);
          text-align: center;
          margin: 0 0 1.5rem;
          text-transform: uppercase;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }

        .field-label {
          display: block;
          font-family: 'Inconsolata', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(217,119,6,0.75);
          margin-bottom: 5px;
        }

        .field-input, .field-textarea {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(232,220,190,0.18);
          color: #E8DCBE;
          font-family: 'IM Fell English', serif;
          font-size: 0.9rem;
          padding: 8px 11px;
          outline: none;
          transition: border-color 0.2s;
          border-radius: 2px;
        }
        .field-input::placeholder { color: rgba(232,220,190,0.4); font-style: italic; }
        .field-input[type="date"], 
        .field-input[type="month"], 
        .field-input[type="time"] { 
          color-scheme: dark; 
        }

        .field-input::-webkit-datetime-edit,
        .field-input::-webkit-datetime-edit-fields-wrapper,
        .field-input::-webkit-datetime-edit-text,
        .field-input::-webkit-datetime-edit-month-field,
        .field-input::-webkit-datetime-edit-year-field {
          color: #E8DCBE !important;
        }
        .field-input:focus, .field-textarea:focus { border-color: rgba(217,119,6,0.45); }
        .field-textarea { resize: vertical; min-height: 90px; width: 100%; }

        .form-error {
          font-family: 'Inconsolata', monospace;
          font-size: 0.7rem;
          color: rgba(220,80,80,0.9);
          margin: 0 0 12px;
          padding: 7px 11px;
          border: 1px solid rgba(220,80,80,0.2);
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 14px;
        }

        .modal-cancel {
          font-family: 'Inconsolata', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.15em;
          color: rgba(232,220,190,0.7);
          background: transparent;
          border: 1px solid rgba(232,220,190,0.1);
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          border-radius: 2px;
        }
        .modal-cancel:hover { border-color: rgba(232,220,190,0.25); color: rgba(232,220,190,0.65); }

        .modal-submit {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          color: #06040C;
          background: linear-gradient(135deg, #D97706, #92400E);
          border: none;
          padding: 8px 20px;
          cursor: pointer;
          transition: opacity 0.2s;
          text-transform: uppercase;
          border-radius: 2px;
        }
        .modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-submit:not(:disabled):hover { opacity: 0.85; }

        .review-done {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.25em;
          color: rgba(217,119,6,0.8);
          text-align: center;
          padding: 1rem;
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .loading-state {
          text-align: center;
          padding: 5rem;
          font-style: italic;
          color: rgba(232,220,190,0.6);
          font-size: 0.85rem;
          font-family: 'Inconsolata', monospace;
          letter-spacing: 0.15em;
          position: relative;
          z-index: 5;
        }

        @media (max-width: 600px) {
          .book-hero { grid-template-columns: 1fr; gap: 1.5rem; }
          .book-cover-hero { width: 140px; }
          .form-grid { grid-template-columns: 1fr; }
          .book-hero, .reviews-section { padding: 0 1.2rem; }
        }

        /* --- React Datepicker Mystical Style Overrides --- */
        .react-datepicker-wrapper {
          width: 100% !important;
        }

        .react-datepicker {
          background-color: #0D0914 !important;
          border: 1px solid rgba(232, 220, 190, 0.18) !important;
          font-family: 'IM Fell English', serif !important;
          color: #E8DCBE !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8) !important;
        }

        .react-datepicker__header {
          background-color: #0D0914 !important;
          border-bottom: 1px solid rgba(232, 220, 190, 0.15) !important;
          padding-top: 10px !important;
        }

        .react-datepicker__current-month, 
        .react-datepicker-year-header {
          color: #F59E0B !important; /* Amber gold */
          font-family: 'Cinzel', serif !important;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.8rem !important;
        }

        .react-datepicker__month-container {
          background-color: #0D0914 !important;
        }

        .react-datepicker__month-text {
          color: #E8DCBE !important;
          font-family: 'Inconsolata', monospace !important;
          font-size: 0.75rem !important;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 8px 0 !important;
          transition: all 0.2s ease !important;
        }

        .react-datepicker__month-text:hover {
          background-color: rgba(217, 119, 6, 0.2) !important;
          color: #F59E0B !important;
          border-radius: 2px !important;
        }

        .react-datepicker__month--selected,
        .react-datepicker__month-text--keyboard-selected,
        .react-datepicker__month--selected:hover {
          background-color: #D97706 !important;
          color: #06040C !important;
          font-weight: bold !important;
          border-radius: 2px !important;
          box-shadow: 0 0 8px rgba(217, 119, 6, 0.4) !important;
        }

        .react-datepicker__navigation {
          top: 6px !important;
        }

        .react-datepicker__navigation-icon::before {
          border-color: #F59E0B !important;
          border-width: 2px 2px 0 0 !important;
        }
      `}</style>

      <div className="book-root">
        {/* Background */}
        <div className="book-stars">
          {Array.from({ length: 60 }, (_, i) => ({
            x: (i * 137.5 + 23) % 100,
            y: (i * 97.3 + 11) % 100,
            size: i % 5 === 0 ? 1.5 : 1,
            op: 0.12 + (i % 7) * 0.07,
            dur: 2.5 + (i % 5),
          })).map((s, i) => (
            <div key={i} className="bstar" style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size,
              ['--op' as string]: s.op,
              animationDuration: `${s.dur}s`,
              animationDelay: `${(i * 0.4) % 5}s`,
            }} />
          ))}
        </div>
        <div className="book-mist" />

        <a href="/chronicle" className="back-link">{t('chronicle.backToChronicle')}</a>

        {loading || !book ? (
           <div className="loading-state">{t('chronicle.openingTome')}</div>
         ) : (
          <>
            {/* Hero */}
            <div className="book-hero">
              <div className="cover-col">
                <div className="book-cover-hero">
                  {book.image_url && !imgErr
                    ? <img src={book.image_url} alt={book.title} onError={() => setImgErr(true)} />
                    : (
                      <div className="cover-placeholder-hero">
                        <span className="p-sigil">༒︎</span>
                        <span className="p-title">{book.title}</span>
                      </div>
                    )
                  }
                </div>
              </div>

              <div className="info-col">
                <div className="book-category-badge">✦ {book.categories.join(', ')} ✦</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <h1 className="book-hero-title" style={{ marginBottom: 0 }}>{book.title}</h1>
                  <button
                    onClick={() => setShowEditModal(true)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(232,220,190,0.2)',
                      color: 'rgba(232,220,190,0.7)',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      borderRadius: '2px'
                    }}
                  >
                    ✎ Edit
                  </button>
                </div>
                <p className="book-hero-author">{book.author}</p>

{validReviews.length > 0 && (
          <div className="hero-avg">
            <span className="hero-avg-num">{avgRating?.toFixed(1)}</span>
            <div>
              <Stars rating={Math.round(avgRating ?? 0)} quantity={validReviews.length}/>
            </div>
          </div>
        )}

                {book.reviews.length > 0 && (
                  <div className="hero-readers">
                    <span className="hero-reader-label">{t('chronicle.readBy')}</span>
                    {[...new Set(book.reviews.map(r => r.reviewer_name))].map((name, i) => (
                      <div key={i} className="reader-bubble-lg" title={name}>
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}

                <div className="hero-added">
                  {t('chronicle.inscribedBy')} {book.added_by}
                </div>
              </div>
            </div>

             {/* Divider */}
             <div className="section-divider">
               <span>{t('chronicle.thoseTraces')}</span>
             </div>

{/* Reviews */}
              <div className="reviews-section">
                <AddReviewForm bookId={book.id} onAdded={fetchBook} t={t} username={session?.user?.name || undefined} />

               {book.reviews.length === 0 ? (
                  <p className="no-reviews">
                    {t('chronicle.noTraces')}
                  </p>
                 ) : (
                   book.reviews.map(review => (
                     <ReviewCard 
                       key={review.id} 
                       review={review} 
                       t={t as (key: string, vars?: Record<string, unknown>) => string}
                       currentUser={session?.user?.name}
                       onEdit={setEditingTrace}
                       onDelete={handleDeleteTrace}
                     />
                   ))
                  )}
               </div>
               
               {showEditModal && book && (
                 <EditBookModal 
                   book={book} 
                   onClose={() => setShowEditModal(false)} 
                   onSaved={fetchBook} 
                   t={t}
                 />
               )}

               {editingTrace && (
                 <EditTraceModal 
                   review={editingTrace}
                   onClose={() => setEditingTrace(null)}
                   onSaved={fetchBook}
                   t={t}
                 />
               )}
           </>
         )}
       </div>
     </>
   )
 }