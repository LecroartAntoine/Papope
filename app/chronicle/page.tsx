'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { useI18n } from '@/lib/i18n/context'
import styles from './chronicle.module.css'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import Stars from '@/components/Chronicle/Stars'

// ─── Types ──────────────────────────────────────────────────────────────────

type Book = {
  id: number
  title: string
  author: string
  image_url: string | null
  categories: string[]
  added_by: string
  added_at: string
  review_count: number
  avg_rating: string | null
  readers: string[]
  last_traced_at: string | null
  currently_reading: string[] // usernames currently reading
  favorite_count: number
  is_favorited_by_me: boolean
}

// ─── Global Avatar Cache & Hook ─────────────────────────────────────────────

const avatarCache: Record<string, string | null> = {}
const avatarPending: Record<string, Promise<string | null>> = {}

export function useUserAvatar(username: string | null | undefined) {
  const { data: session } = useSession()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return

    // Immediately resolve current user if available in local session
    if (username === session?.user?.name && session?.user?.image) {
      setAvatarUrl(session.user.image)
      return
    }
    
    if (username in avatarCache) {
      setAvatarUrl(avatarCache[username])
      return
    }

    if (username in avatarPending) {
      avatarPending[username].then(url => setAvatarUrl(url))
      return
    }

    // Create a new promise since one doesn't exist
    const promise = (async () => {
      try {
        const resUser = await fetch(`/api/chronicle/user/${encodeURIComponent(username)}`)
        if (resUser.ok) {
          const data = await resUser.json()
          const url = data.profile?.avatar_url || data.avatar_url || data.user?.avatar_url || null
          avatarCache[username] = url
          return url
        }
      } catch (err) {
        // Fallback silently on error
      }
      avatarCache[username] = null
      return null
    })()

    avatarPending[username] = promise
    promise.then(url => {
      setAvatarUrl(url)
      delete avatarPending[username]
    })
  }, [username, session])

  return avatarUrl
}

// ─── Categories ──────────────────────────────────────────────────────────────

export const CATEGORY_GROUPS: Record<string, string[]> = {
  'chronicle.catGroup.form': ['Novel', 'Short Story', 'Novella', 'Essay', 'Poetry', 'Play', 'Graphic Novel', 'Manga', 'Comics', 'Illustrated'],
  'chronicle.catGroup.genre': ['Fantasy', 'Sci-Fi', 'Horror', 'Thriller', 'Mystery', 'Romance', 'Historical Fiction', 'Literary Fiction', 'Dystopia', 'Mythology'],
  'chronicle.catGroup.knowledge': ['Philosophy', 'History', 'Science', 'Politics', 'Biography', 'Memoir', 'Psychology', 'Sociology', 'Economics', 'Self-Help'],
  'chronicle.catGroup.audience': ['Young Adult', 'Middle Grade', 'Children'],
  'chronicle.catGroup.other': ['Anthology', 'Travel', 'Cooking', 'Art & Design', 'Other'],
}

export const ALL_CATEGORIES = Object.values(CATEGORY_GROUPS).flat()


// ─── User Badges Component ──────────────────────────────────────────────────

function UserBadgeItem({ name, titlePrefix }: { name: string; titlePrefix: string }) {
  const avatarUrl = useUserAvatar(name)
  return (
    <Link
      href={`/chronicle/user/${encodeURIComponent(name)}`}
      className={styles.readerBubble}
      title={`${titlePrefix} ${name}`}
      onClick={e => e.stopPropagation()}
      style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </Link>
  )
}

function UserBadges({ users, titlePrefix }: { users: string[]; titlePrefix: string }) {
  if (!users || users.length === 0) return null
  return (
    <div className={styles.bookReaders}>
      {users.slice(0, 3).map((name, i) => (
        <UserBadgeItem key={i} name={name} titlePrefix={titlePrefix} />
      ))}
      {users.length > 3 && (
        <div className={`${styles.readerBubble} ${styles.readerMore}`}>
          +{users.length - 4}
        </div>
      )}
    </div>
  )
}

// ─── AddBookPanel ─────────────────────────────────────────────────────────────

function AddBookPanel({ onAdded, t, username }: { onAdded: () => void; t: (k: string) => string; username: string }) {
   const [open, setOpen] = useState(false)
   const [form, setForm] = useState({ title: '', author: '', image_url: '', categories: [] as string[] })
   const [loading, setLoading] = useState(false)
   const [uploading, setUploading] = useState(false)
   const [error, setError] = useState('')
   const [coverPreview, setCoverPreview] = useState<string | null>(null)

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
     if (form.categories.length === 0) { setError(t('chronicle.categoryRequired')); return }
     setLoading(true); setError('')
     try {
       const res = await fetch('/api/chronicle/books', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...form, added_by: username }),
       })
       if (!res.ok) throw new Error()
       setOpen(false)
       setForm({ title: '', author: '', image_url: '', categories: [] })
       setCoverPreview(null)
       onAdded()
     } catch { setError(t('chronicle.spellFailed')) }
     finally { setLoading(false) }
   }

  if (!open) return (
    <button className={styles.addBtn} onClick={() => setOpen(true)}>{t('chronicle.inscribeVolume')}</button>
  )

  return (
    <div className={styles.inlinePanel}>
      <div className={styles.inlinePanelHeader}>
        <span className={styles.inlinePanelRune}>✦</span>
        <h3 className={styles.inlinePanelTitle}>{t('chronicle.bindNewTome')}</h3>
        <button className={styles.inlinePanelClose} onClick={() => setOpen(false)}>✕</button>
      </div>

       <div className={styles.inlinePanelBody}>
         <div className={styles.fieldRow2}>
           <div>
             <label className={styles.fieldLabel}>{t('chronicle.bookTitle')}</label>
             <input className={styles.fieldInput} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t('chronicle.bookTitlePlaceholder')} />
           </div>
           <div>
             <label className={styles.fieldLabel}>{t('chronicle.author')}</label>
             <input className={styles.fieldInput} value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder={t('chronicle.authorPlaceholder')} />
           </div>
         </div>
         <div>
           <label className={styles.fieldLabel}>{t('chronicle.coverUrl')}</label>
           <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <label className={styles.fieldInput} style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(232,220,190,0.05)', padding: '8px 12px', minHeight: '40px' }}>
               {uploading ? '⏳ Uploading...' : coverPreview ? '✓ Cover selected' : '📁 Choose cover image'}
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
          <button className={styles.modalCancel} onClick={() => setOpen(false)}>{t('chronicle.cancel')}</button>
          <button className={styles.modalSubmit} onClick={submit} disabled={loading}>
            {loading ? t('chronicle.submitting') : t('chronicle.sealTheTome')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReadingChipAvatar({ username }: { username: string }) {
  const avatarUrl = useUserAvatar(username)
  
  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        alt={username} 
        title={username}
        style={{ 
          width: 16, 
          height: 16, 
          borderRadius: '50%', 
          objectFit: 'cover', 
          display: 'inline-block' 
        }} 
      />
    )
  }
  
  return <span title={username}>{username.slice(0, 2).toUpperCase()}</span>
}

// ─── BookCard ─────────────────────────────────────────────────────────────────

function BookCard({ book, currentUser, onFavoriteToggle, onClick }: {
  book: Book
  currentUser: string | null | undefined
  onFavoriteToggle: (bookId: number) => void
  onClick: () => void
}) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <div className={styles.bookCard} onClick={onClick} style={{ position: 'relative' }}>
      {/* Currently reading ribbon */}
      {book.currently_reading?.length > 0 && (
        <div className={styles.readingRibbon} title={book.currently_reading.join(', ')}>
          <span className={styles.readingEye}>◎</span>
        </div>
      )}

      {/* Favorite toggle button */}
      <button
        className={`${styles.favBtn} ${book.is_favorited_by_me ? styles.faved : ''}`}
        onClick={e => { e.stopPropagation(); onFavoriteToggle(book.id) }}
        title={book.is_favorited_by_me ? 'Remove from reliquary' : 'Add to reliquary'}
      >
        {book.is_favorited_by_me ? '♥' : '♡'}
        {book.favorite_count > 0 && <span className={styles.favCount}>{book.favorite_count}</span>}
      </button>

      <div className={styles.bookCover}>
        {book.image_url && !imgErr
          ? <img src={book.image_url} alt={book.title} onError={() => setImgErr(true)} />
          : (
            <div className={styles.bookCoverPlaceholder}>
              <span className={styles.placeholderSigil}>༒︎</span>
              <span className={styles.placeholderTitle}>{book.title}</span>
            </div>
          )
        }
        <div className={styles.bookOverlay}>
          <span className={styles.bookCategory}>{book.categories[0]}</span>
        </div>
        <div className={styles.bookCoverShine} />
      </div>

      <div className={styles.bookInfo}>
        <div className={styles.bookTitle}>{book.title}</div>
        <div className={styles.bookAuthor}>{book.author}</div>
        
        <div style={{ marginTop: 4 }}>
          <Stars rating={book.avg_rating ? parseFloat(book.avg_rating) : null} quantity={book.review_count} withNum />
        </div>

        {/* --- Favorites Indicator with Count --- */}
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'rgba(232, 220, 190, 0.7)' }}>
          <span style={{ color: book.is_favorited_by_me ? '#ef4444' : 'rgba(232, 220, 190, 0.4)' }}>♥</span>
          <span>{book.favorite_count} {book.favorite_count === 1 ? 'favorite' : 'favorites'}</span>
        </div> */}

        {/* --- Traces Indicator with User Badges --- */}
        {book.readers?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', alignSelf: "center", letterSpacing: '0.5px', color: '#f59e0b', marginRight: "2px" }}>
              ✍︎ Traces:
            </span>
            <UserBadges users={book.readers} titlePrefix="Traced by" />
          </div>
        )}

        {/* --- Currently Reading Indicator with User Badges --- */}
        {book.currently_reading?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', alignSelf: "center", letterSpacing: '0.5px', color: '#6d28d9cc', marginRight: "2px" }}>
              ◎ Reading:
            </span>
            <UserBadges users={book.currently_reading} titlePrefix="Currently reading:" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CategoryFilter ──────────────────────────────────────────────────────────

function CategoryFilter({ active, onToggle, t }: { active: string; onToggle: (c: string) => void; t: (k: string) => string }) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  return (
    <div className={styles.catFilter}>
      <button className={`${styles.catPill} ${active === 'All' ? styles.active : ''}`} onClick={() => onToggle('All')}>{t('chronicle.allTomes')}</button>
      {Object.entries(CATEGORY_GROUPS).map(([groupKey, cats]) => {
        const groupLabel = t(groupKey)
        const isGroupActive = cats.includes(active)
        const isExpanded = expandedGroup === groupKey
        return (
          <div key={groupKey} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className={`${styles.catPill} ${isGroupActive ? styles.active : ''}`}
              onClick={() => setExpandedGroup(isExpanded ? null : groupKey)}
            >
              {groupLabel} <span style={{ opacity: 0.6, fontSize: '0.6em' }}>{isExpanded ? '▲' : '▼'}</span>
            </button>
            {isExpanded && (
              <div className={styles.catSubmenu}>
                {cats.map(cat => (
                  <button
                    key={cat}
                    className={`${styles.catSubmenuItem} ${active === cat ? styles.active : ''}`}
                    onClick={() => { onToggle(cat); setExpandedGroup(null) }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── SortBy ──────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'lastTraced', labelKey: 'chronicle.sortLastTraced' },
  { value: 'added', labelKey: 'chronicle.sortAdded' },
  { value: 'rating', labelKey: 'chronicle.sortRating' },
  { value: 'title', labelKey: 'chronicle.sortTitle' },
] as const

function SortBy({ value, onChange, t }: {
  value: typeof SORT_OPTIONS[number]['value']
    onChange: (value: typeof SORT_OPTIONS[number]['value']) => void
    t: (k: string) => string
  }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Find the label for the currently selected value
  const activeOption = SORT_OPTIONS.find((opt) => opt.value === value)
  const activeLabel = activeOption ? t(activeOption.labelKey) : ''

  return (
    <div className={styles.sortWrap}>
      <button
        className={`${styles.sortTrigger} ${isExpanded ? styles.active : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={styles.sortLabel}>{t('chronicle.sortBy')}:</span>
        <span className={styles.sortValue}>{activeLabel}</span>
        <span style={{ opacity: 0.5, fontSize: '0.65em', marginLeft: '2px' }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div className={styles.sortSubmenu}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.sortSubmenuItem} ${value === opt.value ? styles.active : ''}`}
              onClick={() => {
                onChange(opt.value)
                setIsExpanded(false)
              }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChroniclePage() {
  const { t } = useI18n()
  const { data: session, status } = useSession()
  const router = useRouter()

  const [books, setBooks] = useState<Book[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sort, setSort] = useState<'lastTraced' | 'added' | 'rating' | 'title'>('lastTraced')

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/chronicle/books')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setBooks(data.books)
    } catch {} finally { setLoading(false) }
  }

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/chronicle/favorites')
      if (res.ok) {
        const data = await res.json()
        const raw = Array.isArray(data) ? data : (data.favorites || data.bookIds || [])
        const ids = raw.map((item: any) => typeof item === 'number' ? item : (item.book_id || item.id))
        setFavoriteIds(new Set(ids))
      }
    } catch {}
  }

  useEffect(() => { 
    if (status === 'authenticated') {
      fetchBooks()
      fetchFavorites()
    } 
  }, [status])

  const handleFavoriteToggle = async (bookId: number) => {
    const isFav = favoriteIds.has(bookId)
    const method = isFav ? 'DELETE' : 'POST'

    // Optimistically update favorite selection states locally
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(bookId)
      else next.add(bookId)
      return next
    })

    setBooks(prev => prev.map(b => b.id === bookId ? {
      ...b,
      favorite_count: b.favorite_count + (isFav ? -1 : 1)
    } : b))

    try {
      await fetch(`/api/chronicle/favorites?bookId=${bookId}`, { method })
    } catch {
      // Revert states locally in case the network fails
      setFavoriteIds(prev => {
        const next = new Set(prev)
        if (isFav) next.add(bookId)
        else next.delete(bookId)
        return next
      })
      setBooks(prev => prev.map(b => b.id === bookId ? {
        ...b,
        favorite_count: b.favorite_count + (isFav ? 1 : -1)
      } : b))
    }
  }

  const displayed = useMemo(() => {
    // Inject client-side verified favorite boolean state to display accurate selections
    let list = books.map(b => ({
      ...b,
      is_favorited_by_me: favoriteIds.has(b.id)
    }))

    if (activeCategory !== 'All') list = list.filter(b => b.categories.includes(activeCategory))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      if (sort === 'lastTraced') {
        const aT = (typeof a.last_traced_at === 'string' && a.last_traced_at.trim() !== '') ? a.last_traced_at : a.added_at
        const bT = (typeof b.last_traced_at === 'string' && b.last_traced_at.trim() !== '') ? b.last_traced_at : b.added_at
        
        const aTime = aT ? new Date(aT).getTime() : 0
        const bTime = bT ? new Date(bT).getTime() : 0
        
        const validA = isNaN(aTime) ? 0 : aTime
        const validB = isNaN(bTime) ? 0 : bTime
        
        return validB - validA
      }
      if (sort === 'added') return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      if (sort === 'rating') return parseFloat(b.avg_rating ?? '0') - parseFloat(a.avg_rating ?? '0')
      if (sort === 'title') return a.title.localeCompare(b.title)
      return 0
    })
    return list
  }, [books, favoriteIds, activeCategory, search, sort])

  const currentUserAvatar = useUserAvatar(session?.user?.name)

  if (status === 'loading' || status === 'unauthenticated') return null

  const currentlyReading = books.filter(b => b.currently_reading?.length > 0)
  
  return (
    <div className={styles.chronicleRoot}>
      <div 
          className={styles.moon}
          style={{
            backgroundImage: 'url(/images/moon.png)',
          }}
        />

      {/* Top Navigation Wrapper for Back Nav & Self Profile Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/" className={styles.backNav}>
          {t('chronicle.backToHome')}
        </Link>
        {session?.user?.name && (
          <Link 
            href={`/chronicle/user/${session.user.name}`} 
            className={styles.userProfileNav}
          >
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt={session.user.name} className={styles.userProfileAvatar} />
            ) : (
              <div className={styles.userProfilePlaceholder}>
                {session.user.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span>{session.user.name}</span>
          </Link>
        )}
      </div>

      {/* Header */}
      <div className={styles.chronicleHeader}>
        <h1 className={styles.chronicleWordmark}>{t('chronicle.title')}</h1>
        <div className={styles.chronicleDivider}><span>✦ {t('chronicle.divider')} ✦</span></div>
        <p className={styles.headerSub}>{t('chronicle.subtitle')}</p>
      </div>

      {/* Currently Reading Banner */}
      {currentlyReading.length > 0 && (
        <div className={styles.readingNowBanner}>
          <div className={styles.readingNowLabel}>◎ {t('chronicle.currentlyReading')}</div>
          <div className={styles.readingNowBooks}>
            {currentlyReading.map(book => (
              <div key={book.id} className={styles.readingChip} onClick={() => router.push(`/chronicle/book/${book.id}`)}>
                <span className={styles.readingChipEye}>◎</span>
                <span>{book.title}</span>
                <span className={styles.readingChipReaders} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {book.currently_reading.map((u, index) => (
                    <span key={u} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {index > 0 && <span style={{ opacity: 0.5 }}>·</span>}
                      <ReadingChipAvatar username={u} />
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <SortBy value={sort} onChange={setSort} t={t} />
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            placeholder={t('chronicle.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <AddBookPanel onAdded={fetchBooks} t={t} username={session?.user?.name ?? ''} />
      </div>

      {/* Category filter */}
      <div className={styles.catFilterWrapper}>
        <CategoryFilter active={activeCategory} onToggle={setActiveCategory} t={t} />
      </div>
      {/* Book grid */}
      {loading ? (
        <p className={styles.loadingText}>{t('chronicle.openingTome')}</p>
      ) : displayed.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyGlyph}>☽</div>
          <p className={styles.emptyText}>{t('chronicle.noTomes')}</p>
        </div>
      ) : (
        <div className={styles.booksGrid}>
          {displayed.map(book => (
            <BookCard
              key={book.id}
              book={book}
              currentUser={session?.user?.name}
              onFavoriteToggle={handleFavoriteToggle}
              onClick={() => router.push(`/chronicle/book/${book.id}`)}
            />
          ))}
        </div>
      )}
      {/* Floating Librarian Button */}
      <Link href="/chronicle/librarian" className={styles.librarianFab}>
        <BookOpen size={20} />
        <span className={styles.fabLabel}>{t('librarian.title')}</span>
      </Link>
    </div>
  )
}