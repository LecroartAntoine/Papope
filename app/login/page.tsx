'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (!result?.ok) {
        setError(t('login.invalidCredentials'))
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError('An error occurred.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .login-root {
          min-height: 100vh;
          background: #141414;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
        }

        .login-container {
          width: 100%;
          max-width: 320px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-title {
          font-family: 'Lilita One', cursive;
          font-size: 2.4rem;
          color: #F0EDE6;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: rgba(240, 237, 230, 0.4);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(240, 237, 230, 0.5);
        }

        .form-input {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          color: #F0EDE6;
          font-family: 'Space Mono', monospace;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: rgba(200, 241, 53, 0.4);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 2px rgba(200, 241, 53, 0.1);
        }

        .form-input::placeholder {
          color: rgba(240, 237, 230, 0.25);
        }

        .login-error {
          padding: 0.75rem 1rem;
          background: rgba(255, 59, 165, 0.1);
          border: 1px solid rgba(255, 59, 165, 0.3);
          border-radius: 4px;
          color: #FF3EA5;
          font-family: 'Space Mono', monospace;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .login-submit {
          padding: 0.85rem 1.5rem;
          background: #C8F135;
          color: #141414;
          border: none;
          border-radius: 4px;
          font-family: 'Space Mono', monospace;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
        }

        .login-submit:hover:not(:disabled) {
          background: #d4ff47;
          transform: translateY(-1px);
        }

        .login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          margin-top: 2rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: rgba(240, 237, 230, 0.3);
        }

        .login-footer a {
          color: #C8F135;
          text-decoration: none;
          transition: color 0.2s;
        }

        .login-footer a:hover {
          color: #d4ff47;
        }

        @media (max-width: 480px) {
          .login-title {
            font-size: 1.8rem;
          }
        }
      `}</style>

      <div className="login-root">
        <div className="login-container">
          <div className="login-header">
            <h1 className="login-title">PAPOPE</h1>
            <p className="login-subtitle">{t('login.signIn')}</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button
              className="login-submit"
              type="submit"
              disabled={loading || !username || !password}
            >
              {loading ? 'Signing in...' : t('login.signIn')}
            </button>
          </form>

          <div className="login-footer">
            <Link href="/">{t('login.backToHome')}</Link>
          </div>
        </div>
      </div>
    </>
  )
}
