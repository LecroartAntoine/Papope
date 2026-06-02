"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import PapopeGame from "@/components/Games/PapopeGame";
import Leaderboard from "@/components/KeepPushing/Leaderboard";

// ─── Phase Types ─────────────────────────────────────────────────────────────
type Phase = "name-input" | "intro" | "playing" | "result";

// ─── Timing constants (ms) ────────────────────────────────────────────────────
const TIMING = {
  GIF_DURATION: 6400,
  AUDIO_B_STARTS_AT: 3400,
  COUNTDOWN_STARTS_AT: 4000,
  GAME_DURATION: 10000,
};

// ─── Fair-play : taille fixe de l'aire de jeu ────────────────────────────────
const GAME_WIDTH  = 480;
const GAME_HEIGHT = 700;

// ─── Couleurs explicites pour l'écran de résultat ───────────────────────────
// Dans ce thème, `ink` est une couleur CLAIRE (texte sur fond sombre).
// Sur le fond vert citron (bg-accent), on force du texte sombre explicitement.
const DARK     = "#1A1614";
const DARK_70  = "rgba(26,22,20,0.70)";
const DARK_50  = "rgba(26,22,20,0.50)";

const NAME_STORAGE_KEY = "papope_player_name";
const REPLAY_DEBOUNCE_MS = 800;

// ─── Page principale ─────────────────────────────────────────────────────────
export default function PapopePage() {
  const [phase, setPhase]               = useState<Phase>("name-input");
  const [playerName, setPlayerName]     = useState("");
  const [nameInput, setNameInput]       = useState(() => {
    // Restore saved name on mount (client-only)
    if (typeof window !== "undefined") {
      return localStorage.getItem(NAME_STORAGE_KEY) ?? "";
    }
    return "";
  });
  const [score, setScore]               = useState(0);
  const [isNewBest, setIsNewBest]       = useState(false);
  const [rank, setRank]                 = useState<number | null>(null);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [resultLoading, setResultLoading]   = useState(false);
 
  const audioIntroRef  = useRef<HTMLAudioElement | null>(null);
  const audioLoopRef   = useRef<HTMLAudioElement | null>(null);
  const winMusicRef    = useRef<HTMLAudioElement | null>(null);
  const loseMusicRef   = useRef<HTMLAudioElement | null>(null);
  const phaseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const replayLockedRef = useRef(false);
 
  const clearAllTimers = () => {
    phaseTimersRef.current.forEach(clearTimeout);
    phaseTimersRef.current = [];
  };
 
  const stopAllAudio = () => {
    [audioIntroRef, audioLoopRef, winMusicRef, loseMusicRef].forEach((ref) => {
      if (ref.current) { ref.current.pause(); ref.current.currentTime = 0; }
    });
  };
 
  // ─── Intro ──────────────────────────────────────────────────────────────
  const startIntro = useCallback(() => {
    if (!nameInput.trim()) return;
    const trimmed = nameInput.trim();
    setPlayerName(trimmed);
    // Persist name for next visit
    localStorage.setItem(NAME_STORAGE_KEY, trimmed);
    setPhase("intro");
    clearAllTimers();
    stopAllAudio();
 
    if (audioIntroRef.current) {
      audioIntroRef.current.volume = 0.85;
      audioIntroRef.current.play().catch(() => {});
    }
 
    const t1 = setTimeout(() => {
      if (audioIntroRef.current) { audioIntroRef.current.pause(); audioIntroRef.current.currentTime = 0; }
      if (audioLoopRef.current) {
        audioLoopRef.current.volume = 0.65;
        audioLoopRef.current.loop   = true;
        audioLoopRef.current.play().catch(() => {});
      }
    }, TIMING.AUDIO_B_STARTS_AT);
 
    const t5 = setTimeout(() => {
      setPhase("playing");
    }, TIMING.GIF_DURATION);
 
  }, [nameInput]);
 
  // ─── Fin de partie ──────────────────────────────────────────────────────
  const handleGameEnd = useCallback(
    async (finalScore: number) => {
      stopAllAudio();
      setScore(finalScore);
      setResultLoading(true); // show loader before showing gif
      setPhase("result");
 
      try {
        const res  = await fetch("/api/games/scores", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ playerName, score: finalScore, game: "papope" }),
        });
        const data = await res.json();
        setIsNewBest(data.isNewBest ?? false);
        setRank(data.rank ?? null);
 
        if (data.isNewBest) {
          if (winMusicRef.current)  { winMusicRef.current.volume  = 0.7; winMusicRef.current.play().catch(() => {}); }
        } else {
          if (loseMusicRef.current) { loseMusicRef.current.volume = 0.7; loseMusicRef.current.play().catch(() => {}); }
        }
 
        setLeaderboardKey((k) => k + 1);
      } catch (err) {
        console.error("Score save error:", err);
      } finally {
        setResultLoading(false);
      }
    },
    [playerName]
  );
 
  // ─── Rejouer (debounced) ─────────────────────────────────────────────────
  const handleReplay = () => {
    if (replayLockedRef.current) return;
    replayLockedRef.current = true;
    setTimeout(() => { replayLockedRef.current = false; }, REPLAY_DEBOUNCE_MS);
 
    clearAllTimers();
    stopAllAudio();
    setScore(0);
    setIsNewBest(false);
    setRank(null);
    setResultLoading(false);
    setPhase("name-input");
    setNameInput(playerName);
  };
 
  useEffect(() => () => { clearAllTimers(); stopAllAudio(); }, []);
 
  return (
    <div className="min-h-screen bg-cream">
      <audio ref={audioIntroRef} src="/sounds/intro.mp3"  preload="auto" />
      <audio ref={audioLoopRef}  src="/sounds/Papope.mp3" preload="auto" />
      <audio ref={winMusicRef}   src="/sounds/win.mp3"    preload="auto" />
      <audio ref={loseMusicRef}  src="/sounds/lose.mp3"   preload="auto" />
 
      {(phase === "name-input" || phase === "result") && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2">
          <Link href="/games" className="text-[#888] hover:text-[#e8e4dd] transition-colors text-sm">
            ← retour aux jeux
          </Link>
        </div>
      )}
 
      {phase === "name-input" && (
        <NameInputScreen nameInput={nameInput} setNameInput={setNameInput} onStart={startIntro} />
      )}
 
      {phase === "intro" && <IntroScreen />}
 
      {phase === "playing" && (
        <div className="min-h-screen flex justify-center bg-ink overflow-hidden">
          <ScaledGameArea width={GAME_WIDTH} height={GAME_HEIGHT}>
            <PapopeGame onGameEnd={handleGameEnd} gameDuration={TIMING.GAME_DURATION} playerName={playerName} />
          </ScaledGameArea>
        </div>
      )}
 
      {phase === "result" && (
        <ResultScreen
          score={score} isNewBest={isNewBest} rank={rank}
          playerName={playerName} onReplay={handleReplay}
          leaderboardKey={leaderboardKey} loading={resultLoading}
        />
      )}
    </div>
  );
}
 
// ─── ScaledGameArea ──────────────────────────────────────────────────────────
function ScaledGameArea({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
 
  useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / width, window.innerHeight / height, 1));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [width, height]);
 
  return (
    <div style={{ width: width * scale, height: height * scale, position: "relative", flexShrink: 0 }}>
      <div style={{ width, height, position: "absolute", top: 0, left: 0, transformOrigin: "top left", transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
 
// ─── NameInputScreen ─────────────────────────────────────────────────────────
function NameInputScreen({ nameInput, setNameInput, onStart }: {
  nameInput: string; setNameInput: (v: string) => void; onStart: () => void;
}) {
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && nameInput.trim()) onStart(); };
 
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mb-12">
          <h1 className="font-display text-6xl md:text-8xl font-black tracking-tighter glitch-text text-ink leading-none" data-text="VENDREDI">
            VENDREDI
          </h1>
          <p className="font-body text-base text-muted mt-4 italic">Clique sur Macron. C&apos;est tout.</p>
        </div>
        <div className="space-y-5">
          <div>
            <label className="font-display text-xs font-bold tracking-[0.18em] text-ink uppercase block mb-2.5 text-left">
              Ton nom, combattant
            </label>
            <input
              type="text" value={nameInput}
              onChange={(e) => setNameInput(e.target.value.slice(0, 32))}
              onKeyDown={handleKey} placeholder="Jean-Michel…" maxLength={32} autoFocus
              className="w-full bg-slate border-2 border-ink font-display text-xl px-5 py-4 outline-none focus:border-papope transition-colors placeholder:text-muted/40 rounded-none tracking-wide"
            />
          </div>
          <button
            onClick={onStart} disabled={!nameInput.trim()}
            className="w-full bg-papope text-cream font-display font-black text-xl py-5 border-2 border-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink transition-colors tracking-widest uppercase"
            style={{ boxShadow: nameInput.trim() ? "5px 5px 0 #1A1614" : "none" }}
          >
            Commencer →
          </button>
        </div>
      </div>
    </div>
  );
}
 
// ─── IntroScreen ─────────────────────────────────────────────────────────────
function IntroScreen() {
  return (
    <div className="fixed inset-0 bg-ink overflow-hidden">
      <img
        src="/images/intro.gif" alt="Intro"
        className="w-full h-full object-cover select-none"
        draggable={false}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />

        <div className="absolute inset-x-0 bottom-16 flex justify-center pointer-events-none">
          <p className="font-display text-cream/60 text-sm tracking-[0.35em] uppercase"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
            Prépare-toi…
          </p>
        </div>
     
    </div>
  );
}
 
// ─── ResultScreen ────────────────────────────────────────────────────────────
function ResultScreen({ score, isNewBest, rank, playerName, onReplay, leaderboardKey, loading }: {
  score: number; isNewBest: boolean; rank: number | null;
  playerName: string; onReplay: () => void; leaderboardKey: number; loading: boolean;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 120); return () => clearTimeout(t); }, []);
 
  const getMessage = () => {
    if (score === 0) return "…vraiment ?";
    if (score < 5)  return "C'est un début.";
    if (score < 10) return "C'est pas mauvais.";
    if (score < 20) return "Un doigté digne des plus grands";
    if (score < 40) return "Incrédiblé.";
    return "Tu es le Papope.";
  };
 
  const cardBg = isNewBest ? "#C8F135" : "#F5F0E8";
 
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-8 overflow-auto"
      style={{ background: "#0E0C0B" }}>
      <div className="max-w-md w-full"
        style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>
 
        {/* Score card */}
        <div className="border-2 p-4 text-center mb-6"
          style={{ background: cardBg, borderColor: DARK, boxShadow: `7px 7px 0 ${DARK}` }}>
          <div className="font-display text-md font-bold tracking-[0.22em] uppercase mb-4 animate-pulse" style={{ color: DARK }}>
            {loading ? "Calcul du score…" : isNewBest ? "🎉 Nouveau record personnel !" : "T'as pas fais mieux"}
          </div>
 
          <div className="font-display font-black leading-none"
            style={{ fontSize: "clamp(4rem, 14vw, 6rem)", color: DARK }}>
            {score}
          </div>
 
          <div className="font-display font-bold text-base tracking-widest uppercase mt-2" style={{ color: DARK_70 }}>
            {score <= 1 ? "clic" : "clics"}
          </div>
 
          <div className="mt-5 font-body italic text-base" style={{ color: DARK_70 }}>
            {getMessage()}
          </div>
 
          {/* Rank: show skeleton while loading, real rank after */}
          <div className="mt-5 font-display text-sm" style={{ color: DARK_50 }}>
            {loading ? (
              <span className="inline-block w-32 h-4 rounded animate-pulse" style={{ background: DARK_50 }} />
            ) : rank !== null ? (
              <>Classement mondial :{" "}
                <span className="font-black text-base" style={{ color: DARK }}>#{rank}</span>
              </>
            ) : null}
          </div>
        </div>
 
        {/* Win/lose gif — hidden while loading to avoid flashing wrong gif */}
        <div className="text-center mb-7" style={{ minHeight: 80 }}>
          {loading ? (
            <LoadingDots />
          ) : isNewBest ? (
            <img src="/images/win.gif" alt="Victoire"
              className="w-full h-full object-cover select-none" draggable={false}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <img src="/images/lose.gif" alt="Défaite"
              className="w-full h-full object-cover select-none" draggable={false}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
        </div>
 
        {/* Replay button */}
        <button
          onClick={onReplay}
          className="w-full bg-papope text-cream font-display font-black text-xl py-5 border-2 border-ink hover:bg-ink transition-colors tracking-widest uppercase mb-5"
          style={{ boxShadow: "5px 5px 0 #1A1614" }}
        >
          Rejouer ↺
        </button>
 
        {/* Leaderboard — only render once loading is done */}
        {!loading && (
          <div className="mt-8">
            <Leaderboard key={leaderboardKey} playerName={playerName} highlightScore={score} isNewBest={isNewBest} />
          </div>
        )}
      </div>
    </div>
  );
}
 
// ─── LoadingDots ─────────────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display:         "inline-block",
            width:           10,
            height:          10,
            borderRadius:    "50%",
            background:      "#888",
            animation:       "papope-bounce 1s ease-in-out infinite",
            animationDelay:  `${i * 0.18}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes papope-bounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
          40%            { transform: translateY(-8px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}