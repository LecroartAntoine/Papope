"use client";

import Link from "next/link";
import { useState } from "react";

const GAMES = [
  {
    id: "papope",
    name: "PAPOPE",
    emoji: "💥",
    description: "Clique sur la tête. Encore. Encore.",
    color: "bg-papope",
    textColor: "text-cream",
    href: "/game/papope",
    locked: false,
  },
  {
    id: "cassoulet",
    name: "LE CASSOULET",
    emoji: "🫘",
    description: "???",
    color: "bg-ink",
    textColor: "text-cream",
    href: "#",
    locked: true,
    hint: "Quand le haricot sera prêt.",
  },
  {
    id: "baguette",
    name: "BAGUETTE RUN",
    emoji: "🥖",
    description: "???",
    color: "bg-accent",
    textColor: "text-ink",
    href: "#",
    locked: true,
    hint: "Tu ne mérites pas encore de pain.",
  },
  {
    id: "mystere",
    name: "???",
    emoji: "👁",
    description: "???",
    color: "bg-muted",
    textColor: "text-cream",
    href: "#",
    locked: true,
    hint: "Il regarde. Il attend.",
  },
];

export default function HomePage() {
  const [hoveredHint, setHoveredHint] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="px-6 pt-12 pb-8 md:px-12 md:pt-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline gap-4 mb-2">
            <h1
              className="font-display text-5xl md:text-7xl font-bold tracking-tighter glitch-text text-ink"
              data-text="PAPOPE"
            >
              PAPOPE
            </h1>
            <span className="font-display text-xs md:text-sm text-muted tracking-widest uppercase">
              by LeBonCassoulet
            </span>
          </div>
          <p className="font-body text-muted text-sm md:text-base max-w-md">
            Des expériences absurdes. Des scores inutiles. Une raison de vivre.
          </p>
          <div className="mt-4 h-px bg-ink/10" />
        </div>
      </header>

      {/* Game Grid */}
      <section className="px-6 pb-16 md:px-12">
        <div className="max-w-5xl mx-auto">
          <p className="font-display text-xs tracking-[0.2em] text-muted mb-6 uppercase">
            — Jeux disponibles
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
            {GAMES.map((game) =>
              game.locked ? (
                // Locked card
                <div
                  key={game.id}
                  className="game-card-locked relative border-2 border-ink/10 rounded-xl p-6 cursor-not-allowed overflow-hidden group"
                  onMouseEnter={() => setHoveredHint(game.id)}
                  onMouseLeave={() => setHoveredHint(null)}
                >
                  {/* Faded background */}
                  <div className={`absolute inset-0 ${game.color} opacity-5 rounded-xl`} />

                  <div className="relative flex items-start justify-between">
                    <div>
                      <div className="text-3xl mb-2 opacity-30 grayscale">{game.emoji}</div>
                      <h2 className="font-display font-bold text-xl text-ink/30 tracking-tight">
                        {game.name}
                      </h2>
                      <p className="font-body text-sm text-muted/50 mt-1">{game.description}</p>
                    </div>
                    {/* Lock icon */}
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-8 h-8 border-2 border-ink/20 rounded-full flex items-center justify-center">
                        <span className="text-sm opacity-30">🔒</span>
                      </div>
                    </div>
                  </div>

                  {/* Hint on hover */}
                  {hoveredHint === game.id && game.hint && (
                    <div className="mt-3 pt-3 border-t border-ink/10">
                      <p className="font-display text-xs text-muted italic">
                        ↳ {game.hint}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Unlocked card
                <Link
                  key={game.id}
                  href={game.href}
                  className={`game-card relative border-2 border-ink rounded-xl p-6 block overflow-hidden group`}
                  style={{ boxShadow: "4px 4px 0 #1A1614" }}
                >
                  <div className={`absolute inset-0 ${game.color} rounded-[10px]`} />
                  <div className="relative">
                    <div className="text-3xl mb-3 group-hover:animate-bounce">
                      {game.emoji}
                    </div>
                    <h2
                      className={`font-display font-bold text-2xl md:text-3xl tracking-tight ${game.textColor}`}
                    >
                      {game.name}
                    </h2>
                    <p className={`font-body text-sm mt-2 ${game.textColor} opacity-80`}>
                      {game.description}
                    </p>
                    <div className={`mt-4 font-display text-xs tracking-widest ${game.textColor} opacity-60 uppercase flex items-center gap-1`}>
                      Jouer <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10 px-6 py-6 md:px-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="font-display text-xs text-muted">
            © {new Date().getFullYear()} LeBonCassoulet
          </p>
          <p className="font-display text-xs text-muted">
            fait avec amour et mauvais goût
          </p>
        </div>
      </footer>
    </main>
  );
}
