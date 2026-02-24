import Link from 'next/link'

export const metadata = {
  title: 'Papope',
  description: 'Mon coin sur internet.',
}

export default function PapopePage() {
  return (
    <main className="min-h-screen grid-bg flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background code decoration */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.025]">
        {['01101100', 'function()', '/* todo */', '0xDEAD', 'git push', 'sudo !!', '> _', 'null', '[]', 'void'].map((s, i) => (
          <div key={i} className="absolute font-mono text-xs text-chalk"
            style={{ top: `${(i * 9.7 + 3) % 92}%`, left: `${(i * 11.3 + 5) % 88}%` }}>
            {s}
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Logo */}
        <div className="mb-2">
          <div className="font-display text-[7rem] sm:text-[9rem] font-black tracking-tighter text-chalk leading-none select-none">
            PA<span className="text-accent">PO</span>PE
          </div>
          <div className="font-mono text-xs text-ash tracking-[0.4em] uppercase mt-1">
            v0.1.0-alpha &middot; personal build
          </div>
        </div>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 border-t border-steel" />
          <span className="text-zinc font-mono text-xs">// projects</span>
          <div className="flex-1 border-t border-steel" />
        </div>

        <div className="space-y-3 mb-10">
          <Link href="/keeppushing" className="group block border border-zinc hover:border-accent bg-slate hover:bg-accent hover:bg-opacity-5 transition-all p-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💪</span>
                <div>
                  <div className="font-display text-lg font-bold text-chalk tracking-wide group-hover:text-accent transition-colors">KEEP PUSHING</div>
                  <div className="text-ash text-xs font-mono">Sport &middot; Nutrition &middot; Coach IA &middot; Escalade</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs font-mono text-zinc border border-zinc px-1.5 py-0.5">🔒</span>
                <span className="text-accent text-xs font-mono group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </div>
          </Link>

          <div className="border border-zinc border-dashed p-4 text-left opacity-30 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔮</span>
              <div>
                <div className="font-display text-lg font-bold text-ash tracking-wide">???</div>
                <div className="text-zinc text-xs font-mono">En construction &middot; maybe &middot; bientot™</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-zinc font-mono text-xs">
          fait avec du café &amp; de la curiosité &middot; {new Date().getFullYear()}
        </div>
      </div>
    </main>
  )
}
