'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

const AVAILABLE_SECTIONS = ['chronicle', 'keeppushing', 'ionickel']

type User = {
  id: number
  username: string
  is_admin: boolean
  created_at: string
}

export default function AdminPage() {
   const { t } = useI18n()
   const { status, data: session } = useSession()
   const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newIsAdmin, setNewIsAdmin] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [userSections, setUserSections] = useState<string[]>([])
  const [savingAccess, setSavingAccess] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.isAdmin) {
      fetchUsers()
    }
  }, [status, session])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.users)
    } catch {
       setError('Error loading users.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      setError('Le nom d\'utilisateur et le mot de passe sont requis.')
      return
    }

    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          isAdmin: newIsAdmin,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }

      setNewUsername('')
      setNewPassword('')
      setNewIsAdmin(false)
      setShowCreateForm(false)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la crÃ©ation.')
    } finally {
      setCreating(false)
    }
  }

  const handleSelectUser = async (userId: number) => {
    setSelectedUserId(userId)
    try {
      const res = await fetch(`/api/admin/access?userId=${userId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUserSections(data.sections)
    } catch {
      setError('Erreur lors du chargement des accÃ¨s.')
      setUserSections([])
    }
  }

  const handleToggleSection = (section: string) => {
    setUserSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    )
  }

  const handleSaveAccess = async () => {
    if (selectedUserId === null) return

    setSavingAccess(true)
    setError('')

    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          sections: userSections,
        }),
      })

      if (!res.ok) throw new Error()
      setSelectedUserId(null)
      setUserSections([])
    } catch {
      setError('Erreur lors de la sauvegarde des accÃ¨s.')
    } finally {
      setSavingAccess(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }

      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression.')
    }
  }

  if (status === 'loading' || status === 'unauthenticated' || !session?.user?.isAdmin) {
    return null
  }

  return (
    <>
      <style>{`
        .admin-root {
          min-height: 100vh;
          background: #141414;
          color: #F0EDE6;
          padding: 2rem 1.5rem;
        }

        .admin-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .admin-title {
          font-family: 'Lilita One', cursive;
          font-size: 1.8rem;
          margin: 0;
        }

        .admin-actions {
          display: flex;
          gap: 1rem;
        }

        .admin-btn {
          padding: 0.6rem 1.2rem;
          background: #C8F135;
          color: #141414;
          border: none;
          border-radius: 4px;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .admin-btn:hover {
          background: #d4ff47;
          transform: translateY(-1px);
        }

        .admin-btn.secondary {
          background: transparent;
          color: #C8F135;
          border: 1px solid #C8F135;
        }

        .admin-btn.secondary:hover {
          background: rgba(200, 241, 53, 0.1);
        }

        .admin-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-family: 'Space Mono', monospace;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(240, 237, 230, 0.75);
          margin-bottom: 1rem;
        }

        .error-banner {
          padding: 1rem;
          background: rgba(255, 59, 165, 0.1);
          border: 1px solid rgba(255, 59, 165, 0.3);
          border-radius: 4px;
          color: #FF3EA5;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(240, 237, 230, 0.7);
          margin-bottom: 0.5rem;
        }

        .form-input,
        .form-checkbox-group {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          color: #F0EDE6;
          font-family: 'Space Mono', monospace;
          font-size: 0.9rem;
        }

        .form-input:focus {
          outline: none;
          border-color: rgba(200, 241, 53, 0.4);
          background: rgba(255, 255, 255, 0.06);
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
        }

        .form-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .users-table th {
          background: rgba(255, 255, 255, 0.04);
          padding: 1rem;
          text-align: left;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(240, 237, 230, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .users-table td {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .users-table tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .user-row-btn {
          padding: 0.4rem 0.8rem;
          background: transparent;
          color: #C8F135;
          border: 1px solid rgba(200, 241, 53, 0.3);
          border-radius: 3px;
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-right: 0.5rem;
          text-transform: uppercase;
        }

        .user-row-btn:hover {
          border-color: #C8F135;
          background: rgba(200, 241, 53, 0.1);
        }

        .user-row-btn.danger {
          color: #FF3EA5;
          border-color: rgba(255, 59, 165, 0.3);
        }

        .user-row-btn.danger:hover {
          border-color: #FF3EA5;
          background: rgba(255, 59, 165, 0.1);
        }

        .access-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .form-actions button {
          flex: 1;
        }

        .link-btn {
          color: #C8F135;
          text-decoration: none;
          transition: color 0.2s;
        }

        .link-btn:hover {
          color: #d4ff47;
        }

        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .admin-actions {
            width: 100%;
          }

          .admin-actions button {
            flex: 1;
          }

          .users-table {
            font-size: 0.85rem;
          }

          .users-table th,
          .users-table td {
            padding: 0.7rem;
          }
        }
      `}</style>

      <div className="admin-root">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <h1 className="admin-title">{t("admin.title")}</h1>
            <div className="admin-actions">
              <button className="admin-btn secondary" onClick={() => router.push('/')}>
                {t("admin.welcome")}
              </button>
              <button className="admin-btn secondary" onClick={() => signOut()}>
                {t("admin.disconnect")}
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {/* Users Section */}
          <div className="admin-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="section-title">{t("admin.users")}</h2>
              <button
                className="admin-btn"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? t("admin.cancel") : t("admin.create")}
              </button>
            </div>

            {showCreateForm && (
              <div className="access-panel">
                <div className="form-group">
                  <label className="form-label">{t("admin.username")}</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Nouveau nom"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("admin.password")}</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={newIsAdmin}
                    onChange={(e) => setNewIsAdmin(e.target.checked)}
                    disabled={creating}
                    className="form-checkbox"
                  />
                  <label htmlFor="isAdmin" style={{ margin: 0, cursor: 'pointer' }}>
                    {t("admin.admin")}
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    className="admin-btn"
                    onClick={handleCreateUser}
                    disabled={creating || !newUsername || !newPassword}
                  >
                    {creating ? 'CrÃ©ation...' : 'CrÃ©er'}
                  </button>
                  <button
                    className="admin-btn secondary"
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <p style={{ color: 'rgba(240, 237, 230, 0.4)' }}>Chargement...</p>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Admin</th>
                    <th>CrÃ©Ã© le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.is_admin ? 'âœ“' : 'â€“'}</td>
                      <td style={{ fontSize: '0.85rem', color: 'rgba(240, 237, 230, 0.6)' }}>
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <button
                          className="user-row-btn"
                          onClick={() => handleSelectUser(user.id)}
                        >
                          AccÃ¨s
                        </button>
                        {session?.user?.id !== String(user.id) && (
                          <button
                            className="user-row-btn danger"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Access Section */}
          {selectedUserId !== null && (
            <div className="admin-section">
              <h2 className="section-title">ðŸ” GÃ©rer les accÃ¨s</h2>
              <div className="access-panel">
                <p style={{ marginBottom: '1rem', color: 'rgba(240, 237, 230, 0.7)' }}>
                  Utilisateur: <strong>{users.find((u) => u.id === selectedUserId)?.username}</strong>
                </p>

                <label className="form-label">Sections disponibles</label>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '4px' }}>
                  {AVAILABLE_SECTIONS.map((section) => (
                    <div key={section} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={`section-${section}`}
                        checked={userSections.includes(section)}
                        onChange={() => handleToggleSection(section)}
                        disabled={savingAccess}
                        className="form-checkbox"
                      />
                      <label
                        htmlFor={`section-${section}`}
                        style={{ margin: 0, cursor: 'pointer', textTransform: 'capitalize' }}
                      >
                        {section}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  <button
                    className="admin-btn"
                    onClick={handleSaveAccess}
                    disabled={savingAccess}
                  >
                    {savingAccess ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  <button
                    className="admin-btn secondary"
                    onClick={() => setSelectedUserId(null)}
                    disabled={savingAccess}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

