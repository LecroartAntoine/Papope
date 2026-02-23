'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableStat {
  table: string
  count: number
  oldest: string | null
  newest: string | null
}

const TABLE_META: Record<string, { label: string; emoji: string; desc: string; color: string }> = {
  sessions:       { label: 'Séances',         emoji: '💪', desc: 'Exercices cochés, notes, douleur bras', color: '#C8F135' },
  day_plans:      { label: 'Plans personnalisés', emoji: '📋', desc: 'Journées éditées ou générées par le Coach', color: '#4EA8FF' },
  nutrition_logs: { label: 'Nutrition',        emoji: '🥗', desc: 'Protéines, créatine, eau, collagène', color: '#64D8FF' },
  wellbeing_logs: { label: 'Bien-être',        emoji: '🌡', desc: 'Humeur, fatigue, sommeil, alcool, stress', color: '#A78BFA' },
  lift_logs:      { label: 'Performances force', emoji: '🏋', desc: 'Sets, reps, poids par exercice', color: '#F5A623' },
  climb_logs:     { label: 'Logs escalade',    emoji: '🧗', desc: 'Voies, cotations, style, complétées', color: '#4EA8FF' },
  chat_history:   { label: 'Chat Coach IA',    emoji: '🤖', desc: 'Historique conversations avec Gemini', color: '#C8F135' },
  body_metrics:   { label: 'Poids corporel',   emoji: '⚖',  desc: 'Mesures de poids quotidiennes', color: '#F5A623' },
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateInput(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel, danger = false }: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon bg-opacity-80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate border border-steel p-6 max-w-md w-full z-10 shadow-2xl">
        <div className={`text-xs font-mono uppercase tracking-[0.2em] mb-3 ${danger ? 'text-crit' : 'text-warn'}`}>
          {danger ? '⚠ Action irréversible' : '⚠ Confirmation'}
        </div>
        <p className="text-chalk text-sm font-mono leading-relaxed mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-mono text-ash border border-zinc hover:border-ghost transition-all uppercase tracking-wider"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              danger
                ? 'bg-crit text-chalk hover:bg-opacity-80'
                : 'bg-warn text-carbon hover:bg-opacity-80'
            }`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Result toast ─────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 text-xs font-mono border shadow-lg ${
      type === 'success'
        ? 'bg-slate border-accent text-accent'
        : 'bg-slate border-crit text-crit'
    }`}>
      {type === 'success' ? '✓ ' : '✕ '}{message}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="border border-steel bg-slate">
      <div className="px-5 py-4 border-b border-steel">
        <div className="font-mono text-chalk font-bold tracking-wide">{title}</div>
        <div className="text-ash text-xs font-mono mt-0.5">{subtitle}</div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AdminPanel() {
  const [stats, setStats] = useState<TableStat[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  // Date range state
  const today = new Date()
  const oneMonthAgo = new Date(today)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const [fromDate, setFromDate] = useState(fmtDateInput(oneMonthAgo))
  const [toDate, setToDate] = useState(fmtDateInput(today))
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set(Object.keys(TABLE_META)))
  const [deleting, setDeleting] = useState(false)

  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void; danger?: boolean } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [migrating, setMigrating] = useState(false)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/admin?action=stats')
      const data = await res.json()
      if (Array.isArray(data)) setStats(data)
    } catch {
      showToast('Impossible de charger les stats', 'error')
    }
    setStatsLoading(false)
  }, [showToast])

  useEffect(() => { loadStats() }, [loadStats])

  const totalRows = stats.reduce((s, t) => s + t.count, 0)

  // ── Delete range ──────────────────────────────────────────────────────────

  const handleDeleteRange = () => {
    if (selectedTables.size === 0) { showToast('Sélectionne au moins une table', 'error'); return }
    const labels = [...selectedTables].map(t => TABLE_META[t]?.label ?? t).join(', ')
    setConfirm({
      danger: true,
      message: `Supprimer toutes les données du ${fmtDate(fromDate)} au ${fmtDate(toDate)} dans :\n\n${labels}\n\nCette action est irréversible.`,
      onConfirm: async () => {
        setConfirm(null)
        setDeleting(true)
        try {
          const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_range', from: fromDate, to: toDate, tables: [...selectedTables] }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          const total = Object.values(data.deleted as Record<string, number>).reduce((s, n) => s + n, 0)
          showToast(`${total} ligne${total > 1 ? 's' : ''} supprimée${total > 1 ? 's' : ''}`, 'success')
          loadStats()
        } catch (err: any) {
          showToast(err.message, 'error')
        }
        setDeleting(false)
      },
    })
  }

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const url = `/api/admin?action=export&from=${fromDate}&to=${toDate}`
    const a = document.createElement('a')
    a.href = url
    a.download = `keep-pushing-${fromDate}-${toDate}.json`
    a.click()
    showToast('Export téléchargé', 'success')
  }

  // ── Truncate single table ─────────────────────────────────────────────────

  const handleTruncate = (table: string) => {
    const meta = TABLE_META[table]
    setConfirm({
      danger: true,
      message: `Supprimer TOUTES les données de "${meta?.label ?? table}" sans restriction de date ?\n\nCette action vide entièrement la table.`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'truncate_table', table }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          showToast(`Table vidée (${data.deleted} lignes)`, 'success')
          loadStats()
        } catch (err: any) {
          showToast(err.message, 'error')
        }
      },
    })
  }

  // ── Run migrations ────────────────────────────────────────────────────────

  const handleMigrate = () => {
    setConfirm({
      message: 'Exécuter les migrations SQL pour créer ou mettre à jour les tables ?',
      onConfirm: async () => {
        setConfirm(null)
        setMigrating(true)
        try {
          const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'run_migrations' }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          showToast('Migrations exécutées', 'success')
          loadStats()
        } catch (err: any) {
          showToast(err.message, 'error')
        }
        setMigrating(false)
      },
    })
  }

  const toggleTable = (t: string) => {
    setSelectedTables(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
  }

  const selectAll = () => setSelectedTables(new Set(Object.keys(TABLE_META)))
  const selectNone = () => setSelectedTables(new Set())

  return (
    <div className="space-y-6 pb-20">
      {/* Modals */}
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
      {toast && <Toast {...toast} />}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-display text-5xl font-black tracking-tight text-chalk mb-1">ADMIN</div>
          <div className="text-ash font-mono text-sm">Gestion des données · Accès restreint</div>
        </div>
        <button
          onClick={loadStats}
          className="text-xs font-mono text-ash border border-zinc px-3 py-1.5 hover:border-accent hover:text-accent transition-all"
        >
          ↻ Actualiser
        </button>
      </div>

      {/* ── Stats ── */}
      <Section title="État de la base de données" subtitle={`${totalRows} lignes au total`}>
        {statsLoading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-steel animate-pulse rounded" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map(stat => {
              const meta = TABLE_META[stat.table]
              return (
                <div key={stat.table} className="flex items-center gap-3 px-3 py-2.5 bg-carbon border border-zinc rounded">
                  <span className="text-lg flex-shrink-0">{meta?.emoji ?? '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-chalk text-sm font-mono font-bold">{meta?.label ?? stat.table}</span>
                      <span className="text-zinc text-xs font-mono">{stat.table}</span>
                    </div>
                    <div className="text-ash text-xs font-mono">{meta?.desc}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-sm font-mono font-bold"
                      style={{ color: stat.count > 0 ? (meta?.color ?? '#C8F135') : '#444' }}
                    >
                      {stat.count.toLocaleString('fr-FR')}
                    </div>
                    {stat.oldest && (
                      <div className="text-zinc text-xs font-mono whitespace-nowrap">
                        {fmtDate(stat.oldest)} → {fmtDate(stat.newest)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleTruncate(stat.table)}
                    disabled={stat.count === 0}
                    title="Vider entièrement cette table"
                    className="text-zinc hover:text-crit transition-colors text-xs flex-shrink-0 disabled:opacity-20 px-1"
                  >
                    🗑
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── Date range ── */}
      <Section title="Plage de dates" subtitle="Sélectionne la période pour les actions ci-dessous">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1.5">Du</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1.5">Au</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Quick date presets */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Cette semaine', days: 7 },
            { label: '30 derniers jours', days: 30 },
            { label: '90 derniers jours', days: 90 },
            { label: 'Cette année', days: 365 },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => {
                const end = new Date()
                const start = new Date()
                start.setDate(start.getDate() - preset.days)
                setFromDate(fmtDateInput(start))
                setToDate(fmtDateInput(end))
              }}
              className="text-xs font-mono text-ash border border-zinc px-2 py-1 hover:border-accent hover:text-accent transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Table selection ── */}
      <Section title="Tables concernées" subtitle="Choisis quelles tables inclure dans les opérations">
        <div className="flex gap-2 mb-3">
          <button onClick={selectAll} className="text-xs font-mono text-ash border border-zinc px-2 py-1 hover:border-accent hover:text-accent transition-all">Tout sélectionner</button>
          <button onClick={selectNone} className="text-xs font-mono text-ash border border-zinc px-2 py-1 hover:border-zinc hover:text-chalk transition-all">Tout désélectionner</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(TABLE_META).map(([table, meta]) => {
            const selected = selectedTables.has(table)
            const stat = stats.find(s => s.table === table)
            return (
              <button
                key={table}
                onClick={() => toggleTable(table)}
                className={`flex items-center gap-3 px-3 py-2.5 text-left border transition-all ${
                  selected
                    ? 'border-accent bg-accent bg-opacity-5 text-chalk'
                    : 'border-zinc bg-carbon text-ash hover:border-steel'
                }`}
              >
                <span className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 text-xs font-bold ${selected ? 'border-accent bg-accent text-carbon' : 'border-zinc'}`}>
                  {selected ? '✓' : ''}
                </span>
                <span className="text-base flex-shrink-0">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono leading-tight truncate">{meta.label}</div>
                </div>
                {stat && (
                  <span className="text-xs font-mono flex-shrink-0" style={{ color: stat.count > 0 ? meta.color : '#444' }}>
                    {stat.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── Actions ── */}
      <Section title="Actions" subtitle="Opérations sur la plage et les tables sélectionnées">
        <div className="space-y-3">
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-carbon border border-zinc rounded">
            <div>
              <div className="text-chalk text-sm font-mono font-bold">📥 Exporter les données</div>
              <div className="text-ash text-xs font-mono mt-0.5">
                Télécharge un fichier JSON avec toutes les données de la plage sélectionnée
              </div>
            </div>
            <button
              onClick={handleExport}
              className="text-xs font-mono font-bold px-4 py-2 border border-accent text-accent hover:bg-accent hover:text-carbon transition-all flex-shrink-0 ml-4"
            >
              Exporter
            </button>
          </div>

          {/* Delete range */}
          <div className="flex items-center justify-between p-4 bg-carbon border border-crit border-opacity-30 rounded">
            <div>
              <div className="text-crit text-sm font-mono font-bold">🗑 Supprimer la plage</div>
              <div className="text-ash text-xs font-mono mt-0.5">
                Supprime toutes les lignes des tables sélectionnées entre les dates choisies
              </div>
            </div>
            <button
              onClick={handleDeleteRange}
              disabled={deleting || selectedTables.size === 0}
              className="text-xs font-mono font-bold px-4 py-2 border border-crit text-crit hover:bg-crit hover:text-chalk transition-all flex-shrink-0 ml-4 disabled:opacity-40"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-crit border-t-transparent rounded-full animate-spin" />
                  Suppression…
                </span>
              ) : 'Supprimer'}
            </button>
          </div>
        </div>
      </Section>

      {/* ── System ── */}
      <Section title="Système" subtitle="Maintenance de la base de données">
        <div className="flex items-center justify-between p-4 bg-carbon border border-zinc rounded">
          <div>
            <div className="text-chalk text-sm font-mono font-bold">⚙ Exécuter les migrations</div>
            <div className="text-ash text-xs font-mono mt-0.5">
              Crée les tables manquantes et applique les mises à jour de schéma (opération sûre et additive)
            </div>
          </div>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="text-xs font-mono font-bold px-4 py-2 border border-steel text-ash hover:border-accent hover:text-accent transition-all flex-shrink-0 ml-4 disabled:opacity-40"
          >
            {migrating ? 'En cours…' : 'Migrer'}
          </button>
        </div>
      </Section>

      {/* ── Danger zone ── */}
      <div className="border border-crit border-opacity-40 bg-crit bg-opacity-5 p-5 space-y-2">
        <div className="text-crit text-xs font-mono uppercase tracking-[0.2em] mb-3">⚠ Zone de danger</div>
        <p className="text-ghost text-xs font-mono">
          Les boutons 🗑 sur chaque table dans les stats permettent de vider entièrement une table, sans restriction de date.
          Exporte toujours tes données avant toute suppression massive.
        </p>
      </div>
    </div>
  )
}
