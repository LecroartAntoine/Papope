"use client";

import { useEffect, useState } from "react";

interface ScoreEntry {
  id: number;
  playerName: string;
  score: number;
  createdAt: string;
}

interface LeaderboardProps {
  playerName: string;
  highlightScore: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ playerName, highlightScore }: LeaderboardProps) {
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/scores?game=papope`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.top10 ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [playerName, highlightScore]);

  return (
    <div className="border-2 border-ink rounded-xl overflow-hidden" style={{ boxShadow: "4px 4px 0 #1A1614" }}>
      {/* Header */}
      <div className="bg-ink px-4 py-3 flex items-center justify-between">
        <span className="font-display text-cream text-xs tracking-[0.2em] uppercase">
          🏆 Classement mondial
        </span>
        <span className="font-display text-cream/40 text-xs">Top 10</span>
      </div>

      {/* Content */}
      <div className="bg-cream divide-y divide-ink/8">
        {loading && (
          <div className="px-4 py-6 text-center">
            <div className="font-display text-muted text-xs tracking-widest animate-pulse">
              Chargement…
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-6 text-center">
            <div className="font-display text-muted text-xs">
              Erreur de connexion. Le classement dort.
            </div>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="px-4 py-6 text-center">
            <div className="font-display text-muted text-xs italic">
              Aucun score encore. Sois le premier.
            </div>
          </div>
        )}

        {!loading &&
          entries.map((entry, idx) => {
            const isCurrentPlayer =
              entry.playerName === playerName && entry.score === highlightScore;
            const isTop3 = idx < 3;

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-4 py-3 transition-colors ${
                  isCurrentPlayer
                    ? "bg-accent"
                    : isTop3
                    ? "bg-ink/5"
                    : ""
                }`}
              >
                {/* Rank + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-display text-sm w-6 text-center flex-shrink-0">
                    {isTop3 ? MEDALS[idx] : (
                      <span className="text-muted text-xs">#{idx + 1}</span>
                    )}
                  </span>
                  <span
                    className={`font-display text-sm truncate ${
                      isCurrentPlayer ? "text-ink font-bold" : "text-ink"
                    }`}
                  >
                    {entry.playerName}
                    {isCurrentPlayer && (
                      <span className="ml-1 text-xs opacity-70">(toi)</span>
                    )}
                  </span>
                </div>

                {/* Score */}
                <span
                  className={`font-display font-bold text-sm flex-shrink-0 ml-4 ${
                    isCurrentPlayer ? "text-ink" : isTop3 ? "text-papope" : "text-muted"
                  }`}
                >
                  {entry.score}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
