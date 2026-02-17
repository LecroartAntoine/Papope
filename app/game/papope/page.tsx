"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import PapopeGame from "@/components/PapopeGame";
import Leaderboard from "@/components/Leaderboard";

// ─── Phase Types ─────────────────────────────────────────────────────────────
type Phase =
  | "name-input"   // Player enters name
  | "intro"        // GIF + music intro plays
  | "countdown"    // 3-2-1 countdown
  | "playing"      // Active game
  | "result";      // Score + leaderboard

// ─── Timing constants (ms) — tweak these freely ───────────────────────────
const TIMING = {
  GIF_DURATION: 4000,        // How long the intro GIF plays before music
  MUSIC_STARTS_AT: 2000,     // Ms into GIF when music fades in
  COUNTDOWN_STARTS_AT: 3500, // Ms into GIF when countdown appears
  COUNTDOWN_DURATION: 3000,  // 3-2-1 (1s each)
  GAME_DURATION: 10000,      // 10 seconds of gameplay
};

export default function PapopePage() {
  const [phase, setPhase] = useState<Phase>("name-input");
  const [playerName, setPlayerName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [score, setScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [countdownNum, setCountdownNum] = useState(3);
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  // Audio refs
  const introMusicRef = useRef<HTMLAudioElement | null>(null);
  const gameMusicRef = useRef<HTMLAudioElement | null>(null);
  const winMusicRef = useRef<HTMLAudioElement | null>(null);
  const loseMusicRef = useRef<HTMLAudioElement | null>(null);

  const phaseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = () => {
    phaseTimersRef.current.forEach(clearTimeout);
    phaseTimersRef.current = [];
  };

  const stopAllAudio = () => {
    [introMusicRef, gameMusicRef, winMusicRef, loseMusicRef].forEach((ref) => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
  };

  // ─── Start intro sequence ────────────────────────────────────────────────
  const startIntro = useCallback(() => {
    if (!nameInput.trim()) return;
    setPlayerName(nameInput.trim());
    setPhase("intro");
    clearAllTimers();
    stopAllAudio();

    // Start intro music at MUSIC_STARTS_AT
    const t1 = setTimeout(() => {
      if (introMusicRef.current) {
        introMusicRef.current.volume = 0;
        introMusicRef.current.play().catch(() => {});
        // Fade in
        let vol = 0;
        const fadeIn = setInterval(() => {
          vol = Math.min(vol + 0.05, 0.8);
          if (introMusicRef.current) introMusicRef.current.volume = vol;
          if (vol >= 0.8) clearInterval(fadeIn);
        }, 50);
      }
    }, TIMING.MUSIC_STARTS_AT);

    // Show countdown at COUNTDOWN_STARTS_AT
    const t2 = setTimeout(() => {
      setPhase("countdown");
      setCountdownNum(3);

      const t3 = setTimeout(() => setCountdownNum(2), 1000);
      const t4 = setTimeout(() => setCountdownNum(1), 2000);
      const t5 = setTimeout(() => {
        // Stop intro music, start game music
        stopAllAudio();
        if (gameMusicRef.current) {
          gameMusicRef.current.volume = 0.6;
          gameMusicRef.current.loop = true;
          gameMusicRef.current.play().catch(() => {});
        }
        setPhase("playing");
      }, TIMING.COUNTDOWN_DURATION);

      phaseTimersRef.current.push(t3, t4, t5);
    }, TIMING.COUNTDOWN_STARTS_AT);

    phaseTimersRef.current.push(t1, t2);
  }, [nameInput]);

  // ─── Game ends ───────────────────────────────────────────────────────────
  const handleGameEnd = useCallback(
    async (finalScore: number) => {
      stopAllAudio();
      setScore(finalScore);
      setPhase("result");

      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName, score: finalScore, game: "papope" }),
        });
        const data = await res.json();
        setIsNewBest(data.isNewBest ?? false);
        setRank(data.rank ?? null);

        // Play win or lose music
        if (data.isNewBest) {
          if (winMusicRef.current) {
            winMusicRef.current.volume = 0.7;
            winMusicRef.current.play().catch(() => {});
          }
        } else {
          if (loseMusicRef.current) {
            loseMusicRef.current.volume = 0.6;
            loseMusicRef.current.play().catch(() => {});
          }
        }

        setLeaderboardKey((k) => k + 1);
      } catch (err) {
        console.error("Score save error:", err);
      }
    },
    [playerName]
  );

  // ─── Replay ──────────────────────────────────────────────────────────────
  const handleReplay = () => {
    clearAllTimers();
    stopAllAudio();
    setScore(0);
    setIsNewBest(false);
    setRank(null);
    setPhase("name-input");
    setNameInput(playerName); // Pre-fill name
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      stopAllAudio();
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hidden audio elements — replace src with your actual audio files */}
      <audio ref={introMusicRef} src="/sounds/intro.mp3" preload="auto" />
      <audio ref={gameMusicRef} src="/sounds/game.mp3" preload="auto" />
      <audio ref={winMusicRef} src="/sounds/win.mp3" preload="auto" />
      <audio ref={loseMusicRef} src="/sounds/lose.mp3" preload="auto" />

      {/* Back link */}
      {(phase === "name-input" || phase === "result") && (
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/"
            className="font-display text-xs text-muted hover:text-ink transition-colors flex items-center gap-1"
          >
            ← retour
          </Link>
        </div>
      )}

      {/* ── Phase: Name Input ─────────────────────────────────────────────── */}
      {phase === "name-input" && (
        <NameInputScreen
          nameInput={nameInput}
          setNameInput={setNameInput}
          onStart={startIntro}
        />
      )}

      {/* ── Phase: Intro GIF ─────────────────────────────────────────────── */}
      {phase === "intro" && <IntroScreen />}

      {/* ── Phase: Countdown ─────────────────────────────────────────────── */}
      {phase === "countdown" && <CountdownScreen num={countdownNum} />}

      {/* ── Phase: Playing ───────────────────────────────────────────────── */}
      {phase === "playing" && (
        <PapopeGame
          onGameEnd={handleGameEnd}
          gameDuration={TIMING.GAME_DURATION}
          playerName={playerName}
        />
      )}

      {/* ── Phase: Result ────────────────────────────────────────────────── */}
      {phase === "result" && (
        <ResultScreen
          score={score}
          isNewBest={isNewBest}
          rank={rank}
          playerName={playerName}
          onReplay={handleReplay}
          leaderboardKey={leaderboardKey}
        />
      )}
    </div>
  );
}

// ─── Sub-screens ─────────────────────────────────────────────────────────────

function NameInputScreen({
  nameInput,
  setNameInput,
  onStart,
}: {
  nameInput: string;
  setNameInput: (v: string) => void;
  onStart: () => void;
}) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && nameInput.trim()) onStart();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        {/* Title */}
        <div className="mb-10">
          <h1
            className="font-display text-6xl md:text-8xl font-bold tracking-tighter glitch-text text-ink"
            data-text="PAPOPE"
          >
            PAPOPE
          </h1>
          <p className="font-body text-muted text-sm mt-3 italic">
            Clique sur la tête. C&apos;est tout.
          </p>
        </div>

        {/* Name input */}
        <div className="space-y-4">
          <div>
            <label className="font-display text-xs tracking-[0.15em] text-muted uppercase block mb-2 text-left">
              Ton nom, combattant
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value.slice(0, 32))}
              onKeyDown={handleKey}
              placeholder="Jean-Michel..."
              maxLength={32}
              autoFocus
              className="w-full border-2 border-ink bg-cream font-display text-lg px-4 py-3 outline-none focus:border-papope transition-colors placeholder:text-muted/40 rounded-none"
            />
          </div>

          <button
            onClick={onStart}
            disabled={!nameInput.trim()}
            className="w-full bg-papope text-cream font-display font-bold text-lg py-4 border-2 border-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink transition-colors tracking-wider uppercase"
            style={{ boxShadow: nameInput.trim() ? "4px 4px 0 #1A1614" : "none" }}
          >
            Commencer →
          </button>
        </div>

        {/* Teaser rules */}
        <div className="mt-10 border-t border-ink/10 pt-6 space-y-1 text-left">
          <p className="font-display text-xs text-muted">
            <span className="text-ink">⏱</span> 10 secondes
          </p>
          <p className="font-display text-xs text-muted">
            <span className="text-ink">💥</span> Clique sur les têtes → elles se multiplient
          </p>
          <p className="font-display text-xs text-muted">
            <span className="text-ink">🏆</span> Score mondial en direct
          </p>
        </div>
      </div>
    </div>
  );
}

function IntroScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="text-center">
        {/* Replace with your actual GIF */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto mb-6">
          <img
            src="/images/intro.gif"
            alt="Intro"
            className="w-full h-full object-contain"
            // If no GIF yet, show a placeholder
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Fallback placeholder shown if gif missing */}
          <div className="absolute inset-0 flex items-center justify-center border-2 border-cream/20 rounded-xl">
            <div className="text-center">
              <div className="text-8xl animate-bounce">😈</div>
              <p className="font-display text-cream/50 text-xs mt-4 tracking-widest">
                INTRO.GIF
              </p>
            </div>
          </div>
        </div>
        <p className="font-display text-cream/30 text-xs tracking-[0.3em] uppercase">
          Prépare-toi…
        </p>
      </div>
    </div>
  );
}

function CountdownScreen({ num }: { num: number }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="text-center" key={num}>
        <div
          className="font-display font-bold text-cream animate-countdown"
          style={{ fontSize: "clamp(8rem, 30vw, 20rem)", lineHeight: 1 }}
        >
          {num}
        </div>
        <p className="font-display text-cream/30 text-sm tracking-[0.3em] uppercase mt-4">
          {num === 3 ? "Prêt ?" : num === 2 ? "Attention…" : "FONCE !"}
        </p>
      </div>
    </div>
  );
}

function ResultScreen({
  score,
  isNewBest,
  rank,
  playerName,
  onReplay,
  leaderboardKey,
}: {
  score: number;
  isNewBest: boolean;
  rank: number | null;
  playerName: string;
  onReplay: () => void;
  leaderboardKey: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const getMessage = () => {
    if (score === 0) return "...vraiment ?";
    if (score < 5) return "C'est un début.";
    if (score < 10) return "Pas mal du tout.";
    if (score < 20) return "Tu as des doigts agiles.";
    if (score < 40) return "Impressionnant.";
    return "Tu es le Papope.";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-16 overflow-auto">
      <div
        className="max-w-md w-full"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Result header */}
        <div
          className={`border-2 border-ink rounded-xl p-8 text-center mb-6 ${
            isNewBest ? "bg-accent" : "bg-cream"
          }`}
          style={{ boxShadow: "6px 6px 0 #1A1614" }}
        >
          {isNewBest && (
            <div className="font-display text-xs tracking-[0.2em] uppercase text-ink mb-3 animate-pulse">
              🎉 Nouveau record personnel !
            </div>
          )}

          <div className="font-display font-bold text-ink" style={{ fontSize: "clamp(4rem, 15vw, 8rem)", lineHeight: 1 }}>
            {score}
          </div>
          <div className="font-display text-muted text-sm tracking-widest uppercase mt-1">
            {score <= 1 ? "clic" : "clics"}
          </div>

          <div className="mt-4 font-body text-ink/70 italic text-sm">{getMessage()}</div>

          {rank !== null && (
            <div className="mt-4 font-display text-xs text-muted">
              Classement mondial : <span className="text-ink font-bold">#{rank}</span>
            </div>
          )}
        </div>

        {/* Win / Lose animation indicator */}
        <div className="text-center mb-6">
          {isNewBest ? (
            <div className="text-5xl animate-bounce">🏆</div>
          ) : (
            <div className="text-5xl animate-shake">💀</div>
          )}
        </div>

        {/* Replay */}
        <button
          onClick={onReplay}
          className="w-full bg-papope text-cream font-display font-bold text-lg py-4 border-2 border-ink hover:bg-ink transition-colors tracking-wider uppercase mb-4"
          style={{ boxShadow: "4px 4px 0 #1A1614" }}
        >
          Rejouer ↺
        </button>

        {/* Leaderboard */}
        <div className="mt-8">
          <Leaderboard key={leaderboardKey} playerName={playerName} highlightScore={score} />
        </div>
      </div>
    </div>
  );
}
