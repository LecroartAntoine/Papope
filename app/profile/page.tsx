'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import Link from 'next/link'
import styles from './profile.module.css'

type UserProfile = {
  username: string
  avatar_url: string | null
  bio: string | null
  email: string | null
  joined_at: string | null
}

export default function ProfilePage() {
  const { t } = useI18n()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.name) {
      fetchProfile()
    }
  }, [status, session])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setBio(data.profile?.bio || '')
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/chronicle/user/avatar', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        fetchProfile()
      }
    } catch {}
    finally {
      setUploadingAvatar(false)
    }
  }

  const handleBioSave = async () => {
    try {
      await fetch('/api/chronicle/user/bio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      })
      fetchProfile()
      setEditingBio(false)
    } catch {}
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return null
  }

  if (loading) {
    return (
      <div className={styles.profileRoot}>
        <div className={styles.loadingState}>{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className={styles.profileRoot}>
      <div className={styles.profileContent}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {profile?.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <button 
                className={styles.avatarEditBtn}
                onClick={() => setEditingAvatar(true)}
                title={t('chronicle.changeAvatar')}
              >
                ✎
              </button>
            </div>
            
            {editingAvatar && (
              <div className={styles.avatarModal}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  style={{ display: 'none' }}
                />
                <div className={styles.avatarModalOverlay} onClick={() => setEditingAvatar(false)}>
                  <div className={styles.avatarModalContent}>
                    <h3>{t('profile.uploadAvatar')}</h3>
                    <label htmlFor="avatar-input" className={styles.avatarModalLabel}>
                      {uploadingAvatar ? '⏳ ' + t('common.loading') : t('profile.selectAvatar')}
                    </label>
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      style={{ display: 'none' }}
                    />
                    <button className={styles.avatarModalCancel} onClick={() => setEditingAvatar(false)}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <h1 className={styles.profileName}>{profile?.username || session?.user?.name}</h1>
          <p className={styles.principalEmail}>{profile?.email || ''}</p>
        </div>

        <div className={styles.divider}>
          <span>✦ {t('profile.privacy')} ✦</span>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('profile.account')}</h2>
          
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{t('profile.username')}</span>
            <span className={styles.infoValue}>{profile?.username || session?.user?.name}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{t('profile.joined')}</span>
            <span className={styles.infoValue}>
              {profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString('fr-FR') : '—'}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{t('profile.sections')}</span>
            <span className={styles.infoValue}>
              {session?.user?.sections?.join(', ') || t('profile.noSections')}
            </span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('profile.personal')}</h2>
          
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{t('profile.bio')}</span>
            {editingBio ? (
              <textarea
                className={styles.bioEdit}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            ) : (
              <span className={styles.infoValue}>{profile?.bio || t('profile.noBio')}</span>
            )}
          </div>
          
          {editingBio && (
            <div className={styles.bioActions}>
              <button className={styles.bioCancel} onClick={() => setEditingBio(false)}>
                {t('common.cancel')}
              </button>
              <button className={styles.bioSave} onClick={handleBioSave}>
                {t('common.save')}
              </button>
            </div>
          )}
          
          {!editingBio && (
            <button 
              className={styles.editBioBtn} 
              onClick={() => setEditingBio(true)}
            >
              ✎ {t('profile.editBio')}
            </button>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('profile.navigation')}</h2>
          <div className={styles.navGrid}>
            <Link href="/chronicle" className={styles.navItem}>📖 {t('chronicle.title')}</Link>
            <Link href={`/chronicle/user/${encodeURIComponent(profile?.username || session?.user?.name || '')}`} className={styles.navItem}>👤 {t('chronicle.traces')}</Link>
            <Link href="/oracle" className={styles.navItem}>🔮 {t('oracle.title')}</Link>
            <Link href="/ionickel" className={styles.navItem}>🚗 {t('ionickel.title')}</Link>
            <Link href="/keeppushing/dashboard" className={styles.navItem}>📈 {t('keeppushing.title')}</Link>
            <Link href="/games" className={styles.navItem}>🎮 {t('games.title')}</Link>
          </div>
        </div>

        {session?.user?.isAdmin && (
          <>
            <div className={styles.divider}>
              <span>✦ {t('admin.title')} ✦</span>
            </div>

            <div className={styles.section}>
              <Link href="/admin" className={styles.adminNavItem}>
                {t('admin.manage')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}