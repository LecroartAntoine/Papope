'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import styles from './profile.module.css'
import Stars from '@/components/Chronicle/Stars'

// ─── Types ──────────────────────────────────────────────────────────────────

type UserTrace = {
  id: number
  book_id: number
  book_title: string
  book_author: string
  book_image_url: string | null
  book_categories: string[]
  date_read: string | null
  rating: string | null
  recommendation: string
  created_at: string
  language_read?: string | null
}

type UserProfile = {
  username: string
  avatar_url: string | null
  joined_at: string | null
  bio: string | null
  traces: UserTrace[]
  favorites: {
    id: number
    title: string
    author: string
    image_url: string | null
    categories: string[]
  }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LANG_LABELS: Record<string, string> = { fr: '🇫🇷', en: '🇬🇧', de: '🇩🇪' }

function BookMini({ book }: { book: { id: number; title: string; author: string; image_url: string | null; categories: string[] } }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <Link href={`/chronicle/book/${book.id}`} className={styles.bookMini}>
      <div className={styles.bookMiniCover}>
        {book.image_url && !imgErr
          ? <img src={book.image_url} alt={book.title} onError={() => setImgErr(true)} />
          : <div className={styles.bookMiniPlaceholder}><span>༒︎</span></div>
        }
      </div>
      <div className={styles.bookMiniInfo}>
        <div className={styles.bookMiniTitle}>{book.title}</div>
        <div className={styles.bookMiniAuthor}>{book.author}</div>
      </div>
    </Link>
  )
}

function TraceRow({ trace, isOwner, t }: { trace: UserTrace; isOwner: boolean; t: (k: string) => string }) {
  const [imgErr, setImgErr] = useState(false)
  const ratingNum = trace.rating ? parseFloat(trace.rating) : null

  // FIXED: Fallback to created_at only if date_read is not set
  const displayDateStr = trace.date_read || trace.created_at
  const dateObj = parseISO(displayDateStr)

  return (
    <Link href={`/chronicle/book/${trace.book_id}`} className={styles.traceRow}>
      <div className={styles.traceRowCover}>
        {trace.book_image_url && !imgErr
          ? <img src={trace.book_image_url} alt={trace.book_title} onError={() => setImgErr(true)} />
          : <div className={styles.traceRowCoverPlaceholder}><span>༒︎</span></div>
        }
      </div>
      <div className={styles.traceRowBody}>
        <div className={styles.traceRowBook}>{trace.book_title}</div>
        <div className={styles.traceRowAuthor}>{trace.book_author}</div>
        <div className={styles.traceRowMeta}>
          <Stars rating={ratingNum} />
          {trace.language_read && <span className={styles.traceRowLang}>{LANG_LABELS[trace.language_read] ?? trace.language_read}</span>}
          {/* Render the correctly parsed reading date */}
          <span className={styles.traceRowDate}>{format(dateObj, 'MMM yyyy', { locale: fr })}</span>
        </div>
        {trace.recommendation && (
          <p className={styles.traceRowText}>"{trace.recommendation.slice(0, 120)}{trace.recommendation.length > 120 ? '…' : ''}"</p>
        )}
      </div>
    </Link>
  )
}

// ─── Avatar Upload ────────────────────────────────────────────────────────────

function AvatarSection({ profile, isOwner, onUpdated, t }: {
  profile: UserProfile; isOwner: boolean; onUpdated: () => void; t: (k: string) => string
}) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      await fetch('/api/chronicle/user/avatar', { method: 'POST', body: formData })
      onUpdated()
    } catch {} finally { setUploading(false) }
  }
  console.log(profile)
  return (
    <div className={styles.avatarSection}>
      <div className={styles.avatarRing}>
        {profile.avatar_url
          ? <img src={profile.avatar_url} alt={profile.username} className={styles.avatarImg} />
          : <div className={styles.avatarPlaceholder}>{profile.username.slice(0, 2).toUpperCase()}</div>
        }
        {isOwner && (
          <label className={styles.avatarEditBtn} title={t('chronicle.changeAvatar')}>
            {uploading ? '…' : '✎'}
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>
        )}
      </div>
    </div>
  )
}

// ─── Bio Edit ────────────────────────────────────────────────────────────────

function BioSection({ profile, isOwner, onUpdated, t }: {
  profile: UserProfile; isOwner: boolean; onUpdated: () => void; t: (k: string) => string
}) {
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/chronicle/user/bio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      })
      onUpdated(); setEditing(false)
    } catch {} finally { setSaving(false) }
  }

  if (editing) return (
    <div className={styles.bioEdit}>
      <textarea className={styles.bioTextarea} value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder={t('chronicle.bioPlaceholder')} />
      <div className={styles.bioActions}>
        <button className={styles.bioCancel} onClick={() => setEditing(false)}>{t('chronicle.cancel')}</button>
        <button className={styles.bioSave} onClick={save} disabled={saving}>{saving ? '…' : t('chronicle.saveWhisper')}</button>
      </div>
    </div>
  )

  return (
    <div className={styles.bioDisplay}>
      {profile.bio
        ? <p className={styles.bioText}>{profile.bio}</p>
        : isOwner && <p className={styles.bioEmpty} onClick={() => setEditing(true)}>{t('chronicle.addBioPrompt')}</p>
      }
      {isOwner && profile.bio && (
        <button className={styles.bioEditBtn} onClick={() => setEditing(true)}>✎</button>
      )}
    </div>
  )
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = 'traces' | 'favorites'

// ─── Main ────────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const { t } = useI18n()
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const username = decodeURIComponent(params?.username as string ?? '')

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('traces')

  const isOwner = session?.user?.name === username

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/chronicle/user/${encodeURIComponent(username)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProfile(data.profile)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { if (status === 'authenticated' && username) fetchProfile() }, [status, username])

  const sortedTraces = useMemo(() => {
    if (!profile?.traces) return []
    return [...profile.traces].sort((a, b) => {
      const dateA = new Date(a.date_read || a.created_at).getTime()
      const dateB = new Date(b.date_read || b.created_at).getTime()
      return dateB - dateA
    })
  }, [profile])

  if (status === 'loading' || status === 'unauthenticated') return null

  const totalRatings = profile?.traces.filter(t => t.rating).length ?? 0
  const avgRating = totalRatings
    ? (profile!.traces.filter(t => t.rating).reduce((s, t) => s + parseFloat(t.rating!), 0) / totalRatings)
    : null

  return (
    <div className={styles.profileRoot}>
      <div className={styles.profileStars}>
        {Array.from({ length: 60 }, (_, i) => ({ x: (i * 137.5 + 23) % 100, y: (i * 97.3 + 11) % 100, size: i % 5 === 0 ? 1.5 : 1, op: 0.1 + (i % 7) * 0.06, dur: 2.5 + (i % 5) })).map((s, i) => (
          <div key={i} className={styles.pstar} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, ['--op' as string]: s.op, animationDuration: `${s.dur}s`, animationDelay: `${(i * 0.4) % 5}s` }} />
        ))}
      </div>
      <div className={styles.profileMist} />

      <a href="/chronicle" className={styles.backLink}> {t('chronicle.backToChronicle')}</a>

      {loading ? (
        <div className={styles.loadingState}>{t('chronicle.openingTome')}</div>
      ) : !profile ? (
        <div className={styles.loadingState}>{t('chronicle.profileNotFound')}</div>
      ) : (
        <>
          <div className={styles.profileHeader}>
            <AvatarSection profile={profile} isOwner={isOwner} onUpdated={fetchProfile} t={t} />
            <h1 className={styles.profileName}>{profile.username}</h1>
            {isOwner && <div className={styles.profileOwnerBadge}>✦ {t('chronicle.yourSanctum')} ✦</div>}
            <BioSection profile={profile} isOwner={isOwner} onUpdated={fetchProfile} t={t} />
          </div>

          <div className={styles.profileDivider}><span>✦</span></div>

          <div className={styles.profileStats}>
            <div className={styles.statItem}>
              <div className={styles.statNum}>{profile.traces.length}</div>
              <div className={styles.statLabel}>{t('chronicle.tracesLeft')}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNum}>{profile.favorites.length}</div>
              <div className={styles.statLabel}>{t('chronicle.reliquary')}</div>
            </div>
            {avgRating != null && (
              <div className={styles.statItem}>
                <div className={styles.statNum}>{avgRating.toFixed(1)}</div>
                <div className={styles.statLabel}>{t('chronicle.avgRating')}</div>
              </div>
            )}
          </div>

          <div className={styles.profileTabs}>
            <button className={`${styles.profileTab} ${tab === 'traces' ? styles.active : ''}`} onClick={() => setTab('traces')}>
              {t('chronicle.traces')} ({profile.traces.length})
            </button>
            <button className={`${styles.profileTab} ${tab === 'favorites' ? styles.active : ''}`} onClick={() => setTab('favorites')}>
              {t('chronicle.reliquary')} ({profile.favorites.length})
            </button>
          </div>

          <div className={styles.profileContent}>
            {tab === 'traces' && (
              // FIXED: Mapping over the sorted traces list instead of raw order
              sortedTraces.length === 0
                ? <p className={styles.profileEmpty}>{t('chronicle.noTracesYet')}</p>
                : sortedTraces.map(trace => <TraceRow key={trace.id} trace={trace} isOwner={isOwner} t={t} />)
            )}
            {tab === 'favorites' && (
              profile.favorites.length === 0
                ? <p className={styles.profileEmpty}>{t('chronicle.noFavoritesYet')}</p>
                : <div className={styles.favGrid}>{profile.favorites.map(book => <BookMini key={book.id} book={book} />)}</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}