'use client'

import { useState, useEffect, useCallback } from 'react'
import { ActivityDef, ActivityCategory, CATEGORY_META } from '@/types'

interface TableStat {
  table: string; count: number; oldest: string | null; newest: string | null
}

const TABLE_META: Record<string, { label: string; emoji: string; desc: string; color: string }> = {
  sessions:       { label: 'Séances',            emoji: '💪', desc: 'Exercices cochés, notes, douleur bras', color: '#C8F135' },
  day_plans:      { label: 'Plans personnalisés', emoji: '📋', desc: 'Journées éditées ou générées par le Coach', color: '#4EA8FF' },
  nutrition_logs: { label: 'Nutrition',           emoji: '🥗', desc: 'Protéines, créatine, eau, collagène',    color: '#64D8FF' },
  wellbeing_logs: { label: 'Bien-être',           emoji: '🌡', desc: 'Humeur, fatigue, sommeil, alcool, stress', color: '#A78BFA' },
  lift_logs:      { label: 'Performances force',  emoji: '🏋', desc: 'Sets, reps, poids par exercice',        color: '#F5A623' },
  climb_logs:     { label: 'Logs escalade',       emoji: '🧗', desc: 'Voies, cotations, style, complétées',   color: '#4EA8FF' },
  chat_history:   { label: 'Chat Coach IA',       emoji: '🤖', desc: 'Historique conversations avec Gemini',  color: '#C8F135' },
  body_metrics:   { label: 'Poids corporel',      emoji: '⚖',  desc: 'Mesures de poids quotidiennes',        color: '#F5A623' },
  activities:     { label: 'Activités',           emoji: '🏃', desc: 'Catalogue activités canoniques',        color: '#A78BFA' },
  supplements:    { label: 'Suppléments',          emoji: '💊', desc: 'Définitions suppléments/nutrition',       color: '#FF9F43' },
  supplement_logs:{ label: 'Logs nutrition',        emoji: '🧪', desc: 'Valeurs quotidiennes suppléments',        color: '#64D8FF' },
}

// Free Gemini models with quota info
const GEMINI_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'RECOMMANDÉ',
    badgeColor: '#C8F135',
    desc: 'Meilleur rapport qualité/vitesse. Raisonnement adaptatif.',
    quota: '500 req/jour · 1M tokens/min',
    tier: 'Gratuit',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    badge: 'RECOMMANDÉ',
    badgeColor: '#C8F135',
    desc: 'Meilleur rapport qualité/vitesse. Raisonnement adaptatif.',
    quota: '500 req/jour · 1M tokens/min',
    tier: 'Gratuit',
  }
]

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateInput(d: Date) { return d.toISOString().split('T')[0] }

function ConfirmModal({ message, onConfirm, onCancel, danger = false }: {
  message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon bg-opacity-80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate border border-steel p-6 max-w-md w-full z-10 shadow-2xl">
        <div className={`text-xs font-mono uppercase tracking-[0.2em] mb-3 ${danger ? 'text-crit' : 'text-warn'}`}>
          {danger ? '⚠ Action irréversible' : '⚠ Confirmation'}
        </div>
        <p className="text-chalk text-sm font-mono leading-relaxed mb-5 whitespace-pre-wrap">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-mono text-ash border border-zinc hover:border-ghost transition-all uppercase tracking-wider">Annuler</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${danger ? 'bg-crit text-chalk hover:bg-opacity-80' : 'bg-warn text-carbon hover:bg-opacity-80'}`}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 text-xs font-mono border shadow-lg whitespace-nowrap ${type === 'success' ? 'bg-slate border-accent text-accent' : 'bg-slate border-crit text-crit'}`}>
      {type === 'success' ? '✓ ' : '✕ '}{message}
    </div>
  )
}

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

// ─── Activities manager ───────────────────────────────────────────────────────

function ActivitiesManager() {
  const [activities, setActivities] = useState<ActivityDef[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ActivityCategory | 'all'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/activities')
    const data = await res.json()
    if (Array.isArray(data)) setActivities(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (act: ActivityDef) => {
    if (!confirm(`Supprimer "${act.name}" du catalogue ?`)) return
    await fetch(`/api/activities?id=${act.id}`, { method: 'DELETE' })
    load()
  }

  const filtered = filter === 'all' ? activities : activities.filter(a => a.category === filter)

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {(['all', 'movement', 'strength', 'recovery', 'event'] as const).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`text-xs font-mono px-3 py-1.5 border transition-all ${filter === cat ? 'border-accent bg-accent bg-opacity-10 text-accent' : 'border-zinc text-ash hover:border-steel'}`}>
            {cat === 'all' ? `Toutes (${activities.length})` : `${CATEGORY_META[cat].emoji} ${CATEGORY_META[cat].label} (${activities.filter(a => a.category === cat).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-9 bg-steel animate-pulse rounded" />)}</div>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {filtered.map(act => {
            const catMeta = CATEGORY_META[act.category as ActivityCategory]
            return (
              <div key={act.id} className="flex items-center gap-3 px-3 py-2 bg-carbon border border-zinc rounded">
                <span className="text-lg">{act.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-chalk text-sm font-mono">{act.name}</span>
                  <span className="ml-2 text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${catMeta.color}20`, color: catMeta.color }}>
                    {catMeta.label}
                  </span>
                </div>
                <div className="flex gap-1 text-xs font-mono text-zinc">
                  {act.has_sets && <span title="Sets/reps">💪</span>}
                  {act.is_outdoor && <span title="Outdoor">🏔</span>}
                  {act.is_climbing && <span title="Escalade">🧗</span>}
                  {act.default_duration_min && <span>{act.default_duration_min}min</span>}
                </div>
                <button onClick={() => handleDelete(act)} className="text-zinc hover:text-crit transition-colors text-xs flex-shrink-0">✕</button>
              </div>
            )
          })}
        </div>
      )}

      <div className="text-xs text-ash font-mono pt-1">
        Les nouvelles activités sont créées automatiquement quand tu en ajoutes via l'éditeur de journée ou via le Coach IA.
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AdminPanel() {
  const [stats, setStats] = useState<TableStat[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [currentModel, setCurrentModel] = useState('gemini-2.5-flash')
  const [savingModel, setSavingModel] = useState(false)

  const today = new Date()
  const oneMonthAgo = new Date(today); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  const [fromDate, setFromDate] = useState(fmtDateInput(oneMonthAgo))
  const [toDate, setToDate] = useState(fmtDateInput(today))
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set(Object.keys(TABLE_META).filter(t => t !== 'activities')))
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void; danger?: boolean } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [adminTab, setAdminTab] = useState<'data' | 'model' | 'activities'>('data')

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const [statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin?action=stats'),
        fetch('/api/settings'),
      ])
      const statsData = await statsRes.json()
      const settingsData = await settingsRes.json()
      if (Array.isArray(statsData)) setStats(statsData)
      if (settingsData.gemini_model) setCurrentModel(settingsData.gemini_model)
    } catch { showToast('Impossible de charger', 'error') }
    setStatsLoading(false)
  }, [showToast])

  useEffect(() => { loadStats() }, [loadStats])

  const handleSaveModel = async (modelId: string) => {
    setSavingModel(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_model: modelId }),
      })
      if (!res.ok) throw new Error('Erreur')
      setCurrentModel(modelId)
      showToast(`Modèle mis à jour : ${modelId}`, 'success')
    } catch { showToast('Erreur lors de la sauvegarde', 'error') }
    setSavingModel(false)
  }

  const handleDeleteRange = () => {
    if (selectedTables.size === 0) { showToast('Sélectionne au moins une table', 'error'); return }
    const labels = [...selectedTables].map(t => TABLE_META[t]?.label ?? t).join(', ')
    setConfirm({
      danger: true,
      message: `Supprimer les données du ${fmtDate(fromDate)} au ${fmtDate(toDate)} dans :\n\n${labels}\n\nCette action est irréversible.`,
      onConfirm: async () => {
        setConfirm(null); setDeleting(true)
        try {
          const res = await fetch('/api/admin', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_range', from: fromDate, to: toDate, tables: [...selectedTables] }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          const total = Object.values(data.deleted as Record<string, number>).reduce((s, n) => s + n, 0)
          showToast(`${total} ligne${total > 1 ? 's' : ''} supprimée${total > 1 ? 's' : ''}`, 'success')
          loadStats()
        } catch (err: any) { showToast(err.message, 'error') }
        setDeleting(false)
      },
    })
  }

  const handleExport = () => {
    window.open(`/api/admin?action=export&from=${fromDate}&to=${toDate}`, '_blank')
    showToast('Export téléchargé', 'success')
  }

  const handleTruncate = (table: string) => {
    setConfirm({
      danger: true,
      message: `Vider ENTIÈREMENT la table "${TABLE_META[table]?.label ?? table}" ?\n\nAucune restriction de date — toutes les lignes seront supprimées.`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          const res = await fetch('/api/admin', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'truncate_table', table }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          showToast(`Table vidée (${data.deleted} lignes)`, 'success')
          loadStats()
        } catch (err: any) { showToast(err.message, 'error') }
      },
    })
  }

  const handleMigrate = () => {
    setConfirm({
      message: 'Exécuter les migrations SQL pour créer ou mettre à jour les tables ?',
      onConfirm: async () => {
        setConfirm(null); setMigrating(true)
        try {
          const res = await fetch('/api/admin', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'run_migrations' }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          showToast('Migrations exécutées', 'success')
          loadStats()
        } catch (err: any) { showToast(err.message, 'error') }
        setMigrating(false)
      },
    })
  }

  const toggleTable = (t: string) => setSelectedTables(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n })
  const totalRows = stats.reduce((s, t) => s + t.count, 0)

  const tabs = [
    { key: 'data' as const,       label: '🗄 Données' },
    { key: 'model' as const,      label: '🤖 Modèle IA' },
    { key: 'activities' as const, label: '🏃 Activités' },
  ]

  return (
    <div className="space-y-6 pb-20">
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
      {toast && <Toast {...toast} />}

      <div className="flex items-end justify-between">
        <div>
          <div className="font-display text-5xl font-black tracking-tight text-chalk mb-1">ADMIN</div>
          <div className="text-ash font-mono text-sm">Gestion · Configuration · Données</div>
        </div>
        <button onClick={loadStats} className="text-xs font-mono text-ash border border-zinc px-3 py-1.5 hover:border-accent hover:text-accent transition-all">↻ Actualiser</button>
      </div>

      {/* Admin tabs */}
      <div className="flex border-b border-steel">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setAdminTab(t.key)}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-all ${adminTab === t.key ? 'text-accent border-b-2 border-accent' : 'text-ash hover:text-chalk'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: DATA ── */}
      {adminTab === 'data' && (
        <div className="space-y-6">
          {/* Stats */}
          <Section title="État de la base" subtitle={`${totalRows.toLocaleString('fr-FR')} lignes au total`}>
            {statsLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-steel animate-pulse rounded" />)}</div>
            ) : (
              <div className="space-y-1.5">
                {stats.map(stat => {
                  const meta = TABLE_META[stat.table]
                  return (
                    <div key={stat.table} className="flex items-center gap-3 px-3 py-2.5 bg-carbon border border-zinc rounded">
                      <span className="text-lg flex-shrink-0">{meta?.emoji ?? '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-chalk text-sm font-mono font-bold">{meta?.label ?? stat.table}</div>
                        <div className="text-ash text-xs font-mono">{meta?.desc}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-mono font-bold" style={{ color: stat.count > 0 ? (meta?.color ?? '#C8F135') : '#444' }}>
                          {stat.count.toLocaleString('fr-FR')}
                        </div>
                        {stat.oldest && <div className="text-zinc text-xs font-mono whitespace-nowrap">{fmtDate(stat.oldest)} → {fmtDate(stat.newest)}</div>}
                      </div>
                      <button onClick={() => handleTruncate(stat.table)} disabled={stat.count === 0}
                        title="Vider cette table" className="text-zinc hover:text-crit transition-colors text-xs flex-shrink-0 disabled:opacity-20 px-1">🗑</button>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          {/* Date range */}
          <Section title="Plage de dates" subtitle="Sélectionne la période pour export et suppression">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1.5">Du</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-ash font-mono uppercase tracking-wider mb-1.5">Au</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="w-full bg-carbon border border-zinc text-chalk text-sm font-mono px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[{ label: '7 jours', days: 7 }, { label: '30 jours', days: 30 }, { label: '90 jours', days: 90 }, { label: 'Cette année', days: 365 }].map(p => (
                <button key={p.label} onClick={() => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - p.days); setFromDate(fmtDateInput(s)); setToDate(fmtDateInput(e)) }}
                  className="text-xs font-mono text-ash border border-zinc px-2 py-1 hover:border-accent hover:text-accent transition-all">{p.label}</button>
              ))}
            </div>
          </Section>

          {/* Table selection */}
          <Section title="Tables concernées" subtitle="Pour l'export et la suppression par plage">
            <div className="flex gap-2 mb-3">
              <button onClick={() => setSelectedTables(new Set(Object.keys(TABLE_META).filter(t => t !== 'activities')))} className="text-xs font-mono text-ash border border-zinc px-2 py-1 hover:border-accent hover:text-accent transition-all">Tout sélectionner</button>
              <button onClick={() => setSelectedTables(new Set())} className="text-xs font-mono text-ash border border-zinc px-2 py-1 transition-all">Aucune</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(TABLE_META).filter(([t]) => t !== 'activities').map(([table, meta]) => {
                const selected = selectedTables.has(table)
                const stat = stats.find(s => s.table === table)
                return (
                  <button key={table} onClick={() => toggleTable(table)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-left border transition-all ${selected ? 'border-accent bg-accent bg-opacity-5 text-chalk' : 'border-zinc bg-carbon text-ash hover:border-steel'}`}>
                    <span className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 text-xs font-bold ${selected ? 'border-accent bg-accent text-carbon' : 'border-zinc'}`}>{selected ? '✓' : ''}</span>
                    <span className="text-base flex-shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0"><div className="text-sm font-mono leading-tight truncate">{meta.label}</div></div>
                    {stat && <span className="text-xs font-mono flex-shrink-0" style={{ color: stat.count > 0 ? meta.color : '#444' }}>{stat.count}</span>}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Actions */}
          <Section title="Actions" subtitle="Sur la plage et les tables sélectionnées">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-carbon border border-zinc rounded">
                <div>
                  <div className="text-chalk text-sm font-mono font-bold">📥 Exporter les données</div>
                  <div className="text-ash text-xs font-mono mt-0.5">Fichier JSON avec toutes les données de la plage</div>
                </div>
                <button onClick={handleExport} className="text-xs font-mono font-bold px-4 py-2 border border-accent text-accent hover:bg-accent hover:text-carbon transition-all flex-shrink-0 ml-4">Exporter</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-carbon border border-crit border-opacity-30 rounded">
                <div>
                  <div className="text-crit text-sm font-mono font-bold">🗑 Supprimer la plage</div>
                  <div className="text-ash text-xs font-mono mt-0.5">Supprime les lignes des tables sélectionnées dans la plage</div>
                </div>
                <button onClick={handleDeleteRange} disabled={deleting || selectedTables.size === 0}
                  className="text-xs font-mono font-bold px-4 py-2 border border-crit text-crit hover:bg-crit hover:text-chalk transition-all flex-shrink-0 ml-4 disabled:opacity-40">
                  {deleting ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-carbon border border-zinc rounded">
                <div>
                  <div className="text-chalk text-sm font-mono font-bold">⚙ Migrations SQL</div>
                  <div className="text-ash text-xs font-mono mt-0.5">Crée les tables manquantes — opération sûre et additive</div>
                </div>
                <button onClick={handleMigrate} disabled={migrating}
                  className="text-xs font-mono font-bold px-4 py-2 border border-steel text-ash hover:border-accent hover:text-accent transition-all flex-shrink-0 ml-4 disabled:opacity-40">
                  {migrating ? 'En cours…' : 'Migrer'}
                </button>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── TAB: GEMINI MODEL ── */}
      {adminTab === 'model' && (
        <div className="space-y-4">
          <div className="border border-steel bg-slate p-4 text-xs font-mono text-ash space-y-1">
            <div className="text-chalk font-bold mb-2">ℹ Modèles disponibles (tous gratuits)</div>
            <div>• Quota partagé entre Coach IA et Bilan hebdomadaire</div>
            <div>• Aucune carte bancaire requise — clé API Google AI Studio</div>
            <div>• Gemini 2.5 Flash recommandé : meilleur raisonnement, même quota</div>
          </div>

          {GEMINI_MODELS.map(model => {
            const isSelected = currentModel === model.id
            return (
              <div key={model.id}
                className={`border p-5 transition-all cursor-pointer ${isSelected ? 'border-accent bg-accent bg-opacity-5' : 'border-steel bg-slate hover:border-ghost'}`}
                onClick={() => !savingModel && handleSaveModel(model.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-chalk font-mono font-bold text-sm">{model.name}</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5" style={{ background: `${model.badgeColor}20`, color: model.badgeColor }}>
                        {model.badge}
                      </span>
                      <span className="text-xs font-mono text-accent border border-accent border-opacity-30 px-1.5 py-0.5">{model.tier}</span>
                    </div>
                    <div className="text-ash text-xs font-mono mb-2">{model.desc}</div>
                    <div className="text-zinc text-xs font-mono">📊 {model.quota}</div>
                    <div className="text-zinc text-xs font-mono mt-1 opacity-60">{model.id}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${isSelected ? 'border-accent bg-accent' : 'border-zinc'}`}>
                    {isSelected && <div className="w-2 h-2 bg-carbon rounded-full" />}
                  </div>
                </div>
              </div>
            )
          })}

          {savingModel && (
            <div className="text-center text-xs font-mono text-ash animate-pulse">Sauvegarde du modèle…</div>
          )}
        </div>
      )}

      {/* ── TAB: ACTIVITIES ── */}
      {adminTab === 'activities' && (
        <Section title="Catalogue d'activités" subtitle="Activités canoniques — référencées par le Coach IA et l'éditeur de journée">
          <ActivitiesManager />
        </Section>
      )}
    </div>
  )
}
