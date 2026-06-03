'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useI18n } from '@/lib/i18n/context'
import { BookOpen } from 'lucide-react'
import styles from './chronicle.module.css'

// --- Types ----------------------------------------------------------------

type Book = {
  id: number
  title: string
  author: string
  image_url: string | null
  categories: string[]
  added_by: string
  added_at: string
  review_count: number
  avg_rating: number | null
  readers: string[]
}

type SortBy = 'title' | 'author' | 'date_added' | 'rating' | 'readers'

const ALL_CATEGORIES = [
  'Novel', 'Essay', 'Sci-Fi', 'Fantasy', 'Thriller', 'Poetry', 'Manga', 'Comics', 
  'Young Adult', 'Mystery', 'Romance', 'Historical', 'Horror', 'Graphic Novel', 'Other'
]

const CATEGORY_SIGILS: Record<string, string> = {
  'Novel':         '📖',
  'Essay':         '🧠',
  'Sci-Fi':        '🚀',
  'Fantasy':       '🔮',
  'Thriller':      '🕵️',
  'Poetry':        '✍️',
  'Manga':         '🎨',
  'Comics':        '💭',
  'Young Adult':   '⚡',
  'Mystery':       '🔍',
  'Romance':       '💕',
  'Historical':    '📜',
  'Horror':        '👻',
  'Graphic Novel': '🎭',
  'Other':         '📑',
}

// --- Stars ----------------------------------------------------------------

function Stars({ rating, size = 11 }: { rating: number | null; size?: number }) {
  if (!rating) return <span style={{ color: 'rgba(232,220,190,0.2)', fontSize: size }}>★ ★ ★ ★ ★</span>
  const full = Math.round(rating)
  return (
    <span style={{ fontSize: size, letterSpacing: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < full ? '#D97706' : 'rgba(232,220,190,0.18)' }}>
          ★
        </span>
      ))}
    </span>
  )
}

// --- BookCard -------------------------------------------------------------

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const [imgErr, setImgErr] = useState(false)
  const primaryCat = book.categories[0] || 'Other'
  const catSigil = CATEGORY_SIGILS[primaryCat] ?? '📑'

  return (
    <button className={styles['book-card']} onClick={onClick}>
      <div className={styles['book-cover']}>
        {book.image_url && !imgErr
          ? <img src={book.image_url} alt={book.title} onError={() => setImgErr(true)} />
          : (
            <div className={styles['book-cover-placeholder']}>
              <span className={styles['placeholder-sigil']}>{catSigil}</span>
              <span className={styles['placeholder-title']}>{book.title}</span>
            </div>
          )
        }
        <div className={styles['book-cover-shine']} />
        <div className={styles['book-overlay']}>
          <span className={styles['book-category']}>{book.categories.join(', ')}</span>
        </div>
      </div>

      <div className={styles['book-info']}>
        <Stars rating={book.avg_rating} size={10} />
        <div className={styles['book-title']}>{book.title}</div>
        <div className={styles['book-author']}>{book.author}</div>

        {book.readers.length > 0 && (
          <div className={styles['book-readers']}>
            {book.readers.slice(0, 4).map((r, i) => (
              <div key={i} className={styles['reader-bubble']} title={r}>
                {r.slice(0, 2).toUpperCase()}
              </div>
            ))}
            {book.readers.length > 4 && (
              <div className={styles['reader-more']}>+{book.readers.length - 4}</div>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

// --- AddBookModal ---------------------------------------------------------

function AddBookModal({ onClose, onAdded, t, username }: { onClose: () => void; onAdded: () => void; t: (key: string, vars?: Record<string, string | number>) => string; username?: string }) {
   const [form, setForm] = useState({
     title: '', author: '', image_url: '', categories: ['Novel']
   })
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState('')

   const handleSubmit = async () => {
     if (!form.title || !form.author || form.categories.length === 0) {
       setError(t('chronicle.titleAuthorNameRequired'))
       return
     }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/chronicle/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          added_by: username || 'Unknown',
        }),
      })
      if (!res.ok) throw new Error()
      onAdded()
      onClose()
     } catch {
       setError(t('chronicle.errorInscribingGrimoire'))
     } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat]
    }))
  }

   return (
      <div className={styles['modal-backdrop']}>
        <div className={styles['modal-box']} onClick={e => e.stopPropagation()}>
          <div className={styles['modal-rune']}>✨</div>
          <h2 className={styles['modal-title']}>{t('chronicle.inscribeGrimoire')}</h2>
          <p className={styles['modal-sub']}>{t('chronicle.eachBookIsSpell')}</p>

          <div className={styles['modal-fields']}>
            <label className={styles['field-label']}>{t('chronicle.bookTitle')}</label>
            <input 
              className={styles['field-input']} 
              placeholder={t('chronicle.tomeNamePlaceholder')}
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
            />

            <label className={styles['field-label']}>{t('chronicle.author')}</label>
            <input 
              className={styles['field-input']} 
              placeholder={t('chronicle.authorPlaceholder')}
              value={form.author} 
              onChange={e => setForm({ ...form, author: e.target.value })} 
            />

            <label className={styles['field-label']}>{t('chronicle.categories')}</label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px',
              marginBottom: '12px'
            }}>
              {ALL_CATEGORIES.map(cat => (
                <label key={cat} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}>
                  <input 
                    type="checkbox" 
                    checked={form.categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    style={{ cursor: 'pointer' }}
                  />
                  {cat}
                </label>
              ))}
            </div>

            <label className={styles['field-label']}>{t('chronicle.coverUrl')} <span style={{ opacity: 0.5 }}>({t('chronicle.coverUrlOptional')})</span></label>
            <input 
              className={styles['field-input']} 
              placeholder={t('chronicle.coverUrlPlaceholder')}
              value={form.image_url} 
              onChange={e => setForm({ ...form, image_url: e.target.value })} 
            />
          </div>

          {error && <p className={styles['modal-error']}>{error}</p>}

          <div className={styles['modal-actions']}>
            <button className={styles['modal-cancel']} onClick={onClose}>{t('chronicle.cancel')}</button>
            <button className={styles['modal-submit']} onClick={handleSubmit} disabled={loading}>
              {loading ? t('chronicle.inscribingInProgress') : t('chronicle.carveInTome')}
            </button>
          </div>

         <button className={styles['modal-close']} onClick={onClose}>×</button>
       </div>
     </div>
   )
}

// --- Main -----------------------------------------------------------------

export default function ChroniclePage() {
   const { t } = useI18n()
   const router = useRouter()
   const { data: session } = useSession()
   const [books, setBooks] = useState<Book[]>([])
   const [loading, setLoading] = useState(true)
   const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
   const [showAdd, setShowAdd] = useState(false)
   const [search, setSearch] = useState('')
   const [sortBy, setSortBy] = useState<SortBy>('date_added')

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/chronicle/books')
      const data = await res.json()
      setBooks(data.books ?? [])
    } catch {
      // Log or handle empty state fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const filtered = books.filter(b => {
    const matchCat = selectedCategory === null || b.categories.includes(selectedCategory)
    const matchSearch = !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }).sort((a, b) => {
    switch(sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'author':
        return a.author.localeCompare(b.author)
      case 'date_added':
        return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      case 'rating':
        return (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
      case 'readers':
        return b.readers.length - a.readers.length
      default:
        return 0
    }
  })

  return (
    <>
      <div className={styles['chronicle-root']}>
        {/* Moon background */}
        <div 
          className={styles.moon}
          style={{
            backgroundImage: 'url(/images/moon.png)',
          }}
        />

        {/* Stars background */}
        <div className={styles['chronicle-stars']}>
          {Array.from({ length: 120 }, (_, i) => {
            // Better random distribution using seeded pseudo-random
            const seed = i * 73856093 ^ 19349663;
            const x = ((seed ^ (seed >> 16)) % 10000) / 100;
            const y = (((seed * 73) ^ (seed >> 24)) % 10000) / 100;
            const size = (seed % 7 < 2) ? 1.8 : (seed % 7 < 5) ? 1.2 : 0.8;
            const op = 0.1 + ((seed % 13) / 20);
            const dur = 2 + ((seed % 6) / 2);
            
            return (
              <div 
                key={i} 
                className={styles.cstar} 
                style={{
                  left: `${x}%`, 
                  top: `${y}%`,
                  width: size, 
                  height: size,
                  ['--op' as string]: op,
                  animationDuration: `${dur}s`,
                  animationDelay: `${(seed % 50) / 10}s`,
                }} 
              />
            );
          })}
        </div>

        <div className={styles.mist} />

        {/* Back link */}
        <Link href="/" className={styles['back-nav']}>
          {t('chronicle.backToHome')}
        </Link>

        {/* Header */}
        <header className={styles['chronicle-header']}>
          <h1 className={styles['chronicle-wordmark']}>{t('chronicle.theChronicle')}</h1>
          <div className={styles['chronicle-divider']}>
            <span>{t('chronicle.collectiveGrimoire')}</span>
          </div>
        </header>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles['search-wrap']}>
            <span className={styles['search-icon']}>🔍</span>
            <input
              className={styles['search-input']}
              placeholder={t('chronicle.searchTome')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles['sort-wrap']}>
            <label className={styles['sort-label']}>{t('chronicle.sortBy') || 'Sort'}</label>
            <select 
              className={styles['sort-select']}
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
            >
              <option value="date_added">📅 {t('chronicle.dateAdded') || 'Date Added'}</option>
              <option value="title">📖 {t('chronicle.bookTitle') || 'Title'}</option>
              <option value="author">✍️ {t('chronicle.author') || 'Author'}</option>
              <option value="rating">⭐ {t('chronicle.rating') || 'Rating'}</option>
              <option value="readers">👥 {t('chronicle.readers') || 'Most Read'}</option>
            </select>
          </div>
          <button className={styles['add-btn']} onClick={() => setShowAdd(true)}>
            {t('chronicle.registerBook')}
          </button>
        </div>

        {/* Category filter */}
        <div className={styles['cat-filter']}>
          <button
            className={[
              styles['cat-pill'],
              selectedCategory === null ? styles.active : null
            ].filter(Boolean).join(' ')}
            onClick={() => setSelectedCategory(null)}
          >
            ⭐ All
          </button>
          {ALL_CATEGORIES.map(c => (
            <button
              key={c}
              className={[
                styles['cat-pill'],
                selectedCategory === c ? styles.active : null
              ].filter(Boolean).join(' ')}
              onClick={() => setSelectedCategory(c)}
            >
              {CATEGORY_SIGILS[c] ? `${CATEGORY_SIGILS[c]} ` : ''}{c}
            </button>
          ))}
        </div>

        {/* Books grid */}
        {loading
          ? <div className={styles['loading-text']}>{t('chronicle.grimoireOpens')}</div>
          : filtered.length === 0
            ? (
              <div className={styles['empty-state']}>
                <div className={styles['empty-glyph']}>📖</div>
                <p className={styles['empty-text']}>
                  {books.length === 0
                    ? t('chronicle.emptyGrimoire')
                    : t('chronicle.noResults')}
                </p>
              </div>
            )
          : (
            <div className={styles['books-grid']}>
              {filtered.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => router.push(`/chronicle/${book.id}`)}
                />
              ))}
            </div>
          )
      }

          {/* Add book modal */}
          {showAdd && (
            <AddBookModal
              onClose={() => setShowAdd(false)}
              onAdded={fetchBooks}
              t={t}
              username={session?.user?.name || undefined}
            />
          )}

          {/* Floating Librarian Button */}
          <Link href="/chronicle/librarian" className={styles['librarian-fab']}>
            <BookOpen size={20} />
            <span className={styles['fab-label']}>{t('librarian.title')}</span>
          </Link>
      </div>
    </>
  )
}