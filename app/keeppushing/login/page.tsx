'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function KPLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { username, password, redirect: false })
    if (result?.error) {
      setError('Identifiants incorrects')
      setLoading(false)
    } else {
      router.push('/keeppushing/dashboard')
    }
  }

  return (
    <main className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-2 text-center">
          <Link href="/" className="text-xs font-mono text-ash hover:text-chalk transition-colors tracking-wider">← papope</Link>
        </div>
        <div className="mb-10 text-center mt-6">
          <div className="font-display text-5xl font-black tracking-tighter text-chalk mb-1 leading-tight">
            KEEP<br />PUSHING !
          </div>
          <div className="text-xs font-mono text-ash tracking-[0.3em] mt-2">ACCÈS PRIVÉ</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-ash tracking-[0.2em] uppercase mb-2">Identifiant</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-steel border border-zinc text-chalk px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="identifiant" autoComplete="username" />
          </div>
          <div>
            <label className="block text-xs text-ash tracking-[0.2em] uppercase mb-2">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-steel border border-zinc text-chalk px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••" autoComplete="current-password" />
          </div>

          {error && (
            <div className="text-crit text-xs tracking-wider py-2 border border-crit border-opacity-30 px-3">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-accent text-carbon font-display font-bold text-lg tracking-widest py-3 uppercase hover:bg-opacity-90 transition-all disabled:opacity-50 mt-2">
            {loading ? 'CONNEXION...' : 'ACCÉDER'}
          </button>
        </form>
      </div>
    </main>
  )
}
