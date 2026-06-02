"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface ScoreEntry {
  id: number;
  playerName: string;
  score: number;
  createdAt: string;
}

interface LeaderboardProps {
  playerName: string;
  highlightScore: number; // score de la partie qui vient de se terminer
  isNewBest: boolean;     // vrai si highlightScore est un nouveau record personnel
}

const MEDALS = ["🥇", "🥈", "🥉"];

const DARK    = "#1A1614";
const DARK_70 = "rgba(26,22,20,0.70)";
const DARK_40 = "rgba(26,22,20,0.40)";
const DARK_08 = "rgba(26,22,20,0.08)";
const ACCENT  = "#C8F135"; // vert record
const NEUTRAL = "rgba(26,22,20,0.06)"; // tinte douce pour "ton record précédent"

export default function Leaderboard({ playerName, highlightScore, isNewBest }: LeaderboardProps) {
   const { t } = useI18n();
   const [entries, setEntries] = useState<ScoreEntry[]>([]);
   const [loading, setLoading] = useState(true);
   const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/games/scores?game=papope`)
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

  // Index de la ligne du joueur dans le classement (son meilleur score)
  const currentIdx = entries.findIndex((e) => e.playerName === playerName);

  return (
    <div
      className="overflow-hidden"
      style={{
        border: `2px solid ${DARK}`,
        borderRadius: 12,
        boxShadow: `5px 5px 0 ${DARK}`,
      }}
    >
       {/* ── Header ──────────────────────────────────────────────────────── */}
       <div
         className="px-5 py-3 flex items-center justify-between"
         style={{ background: DARK }}
       >
         <span
           className="font-display text-xs tracking-[0.22em] uppercase"
           style={{ color: "#F5F0E8" }}
         >
           🏆 {t('keeppushing.globalLeaderboard')}
         </span>
         <span className="font-display text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>
           {t('keeppushing.top10')}
         </span>
       </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ background: "#F5F0E8" }}>

         {loading && (
           <div className="px-5 py-7 text-center">
             <span className="font-display text-xs tracking-widest animate-pulse" style={{ color: DARK_40 }}>
               {t('common.loading')}
             </span>
           </div>
         )}

         {error && (
           <div className="px-5 py-7 text-center">
             <span className="font-display text-xs" style={{ color: DARK_40 }}>
               {t('keeppushing.connectionError')}
             </span>
           </div>
         )}

         {!loading && !error && entries.length === 0 && (
           <div className="px-5 py-7 text-center">
             <span className="font-display text-xs italic" style={{ color: DARK_40 }}>
               {t('keeppushing.noScoresYet')}
             </span>
           </div>
         )}

        {!loading && !error && entries.map((entry, idx) => {
          const isPlayer = idx === currentIdx;
          const isTop3   = idx < 3;

          // ─── Fond de ligne ──────────────────────────────────────────
          // · Nouveau record → vert citron vif (tu as progressé 🎉)
          // · Ton ancien record affiché sans amélioration → gris très doux
          //   avec une bordure gauche colorée pour indiquer "c'est toi"
          // · Autre joueur → transparent
          const rowBg = isPlayer
            ? isNewBest ? ACCENT : NEUTRAL
            : "transparent";

          const leftBorderStyle = isPlayer && !isNewBest
            ? { borderLeft: `3px solid rgba(26,22,20,0.25)` }
            : {};

          return (
            <div
              key={entry.id}
              className="flex items-center justify-between px-5 py-3"
              style={{
                background: rowBg,
                borderTop: idx === 0 ? "none" : `1px solid ${DARK_08}`,
                ...leftBorderStyle,
              }}
            >
              {/* Rang + nom */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-display text-sm w-7 text-center flex-shrink-0">
                  {isTop3
                    ? MEDALS[idx]
                    : <span style={{ color: DARK_40, fontSize: "0.75rem" }}>#{idx + 1}</span>
                  }
                </span>

                <div className="flex flex-col min-w-0">
                   <span
                     className="font-display text-sm truncate"
                     style={{ color: DARK, fontWeight: isPlayer ? 800 : 500 }}
                   >
                     {entry.playerName}
                     {isPlayer && (
                       <span
                         className="ml-1.5 text-xs"
                         style={{ color: DARK_70, fontWeight: 400 }}
                       >
                         {t('keeppushing.you')}
                       </span>
                     )}
                   </span>

                   {/* Sous-titre uniquement si la partie courante est moins bonne */}
                   {isPlayer && !isNewBest && (
                     <span
                       className="font-display text-xs mt-0.5"
                       style={{ color: DARK_40 }}
                     >
                       {t('keeppushing.thisRunYourRecord', { thisRun: highlightScore, record: entry.score })}
                     </span>
                   )}
                </div>
              </div>

              {/* Score — le meilleur score du classement, toujours */}
              <span
                className="font-display font-black text-sm flex-shrink-0 ml-4"
                style={{
                  color: isPlayer
                    ? DARK
                    : isTop3
                    ? "#5D9C00"
                    : DARK_70,
                }}
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
