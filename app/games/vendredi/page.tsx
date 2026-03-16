"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import PapopeGame from "@/components/PapopeGame";
import Leaderboard from "@/components/Leaderboard";

// ─── Phase Types ─────────────────────────────────────────────────────────────
type Phase = "name-input" | "intro" | "playing" | "result";

// ─── Timing constants (ms) ────────────────────────────────────────────────────
const TIMING = {
  GIF_DURATION: 7400,
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

// ─── Page principale ─────────────────────────────────────────────────────────
export default function PapopePage() {
  const [phase, setPhase]               = useState<Phase>("name-input");
  const [playerName, setPlayerName]     = useState("");
  const [nameInput, setNameInput]       = useState("");
  const [score, setScore]               = useState(0);
  const [isNewBest, setIsNewBest]       = useState(false);
  const [rank, setRank]                 = useState<number | null>(null);
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  const audioIntroRef = useRef<HTMLAudioElement | null>(null);
  const audioLoopRef  = useRef<HTMLAudioElement | null>(null);
  const winMusicRef   = useRef<HTMLAudioElement | null>(null);
  const loseMusicRef  = useRef<HTMLAudioElement | null>(null);
  const phaseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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
    setPlayerName(nameInput.trim());
    setPhase("intro");
    setCountdownNum(null);
    clearAllTimers();
    stopAllAudio();

    // Audio A démarre immédiatement
    if (audioIntroRef.current) {
      audioIntroRef.current.volume = 0.85;
      audioIntroRef.current.play().catch(() => {});
    }

    // À ~3.4s : stop audio A → audio B en boucle
    const t1 = setTimeout(() => {
      if (audioIntroRef.current) { audioIntroRef.current.pause(); audioIntroRef.current.currentTime = 0; }
      if (audioLoopRef.current) {
        audioLoopRef.current.volume = 0.65;
        audioLoopRef.current.loop = true;
        audioLoopRef.current.play().catch(() => {});
      }
    }, TIMING.AUDIO_B_STARTS_AT);

    // Compteur 3-2-1 en overlay à partir de 4s
    const t2 = setTimeout(() => setCountdownNum(3), TIMING.COUNTDOWN_STARTS_AT);
    const t3 = setTimeout(() => setCountdownNum(2), TIMING.COUNTDOWN_STARTS_AT + 1000);
    const t4 = setTimeout(() => setCountdownNum(1), TIMING.COUNTDOWN_STARTS_AT + 2000);

    // Fin du GIF (7.5s) → jeu, audio B continue
    const t5 = setTimeout(() => {
      setCountdownNum(null);
      setPhase("playing");
    }, TIMING.GIF_DURATION);

    phaseTimersRef.current.push(t1, t2, t3, t4, t5);
  }, [nameInput]);

  // ─── Fin de partie ──────────────────────────────────────────────────────
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

        if (data.isNewBest) {
          if (winMusicRef.current) { winMusicRef.current.volume = 0.7; winMusicRef.current.play().catch(() => {}); }
        } else {
          if (loseMusicRef.current) { loseMusicRef.current.volume = 0.7; loseMusicRef.current.play().catch(() => {}); }
        }

        setLeaderboardKey((k) => k + 1);
      } catch (err) {
        console.error("Score save error:", err);
      }
    },
    [playerName]
  );

  // ─── Rejouer ────────────────────────────────────────────────────────────
  const handleReplay = () => {
    clearAllTimers();
    stopAllAudio();
    setScore(0);
    setIsNewBest(false);
    setRank(null);
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
        <div className="fixed
          bottom-5
          left-1/2
          -translate-x-1/2">
          <Link href="/games" className="text-[#888] hover:text-[#e8e4dd] transition-colors text-sm">
            ← retour aux jeux
          </Link>
        </div>
      )}

      {phase === "name-input" && (
        <NameInputScreen nameInput={nameInput} setNameInput={setNameInput} onStart={startIntro} />
      )}

      {phase === "intro" && <IntroScreen countdownNum={countdownNum} />}

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
          playerName={playerName} onReplay={handleReplay} leaderboardKey={leaderboardKey}
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
// Le GIF prend tout l'écran (object-cover).
// Le compteur est positionné en BAS À DROITE pour ne pas masquer le sujet.
function IntroScreen({ countdownNum }: { countdownNum: number | null }) {
  return (
    <div className="fixed inset-0 bg-ink overflow-hidden">
      {/* GIF plein écran */}
      <img
        src="/images/intro.gif"
        alt="Intro"
        className="w-full h-full object-cover select-none"
        draggable={false}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />

      {/* "Prépare-toi" centré en bas, avant le compteur */}
      {countdownNum === null && (
        <div className="absolute inset-x-0 bottom-16 flex justify-center pointer-events-none">
          <p
            className="font-display text-cream/60 text-sm tracking-[0.35em] uppercase"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
          >
            Prépare-toi…
          </p>
        </div>
      )}

      {/* Compteur — coin inférieur droit, ne masque pas le sujet du GIF */}
      {countdownNum !== null && (
        <div
          key={countdownNum}
          className="absolute bottom-8 right-10 flex flex-col items-end pointer-events-none select-none"
        >
          <div
            className="font-display font-black text-cream leading-none"
            style={{
              fontSize: "clamp(5rem, 16vw, 10rem)",
              textShadow:
                "0 0 80px rgba(0,0,0,1), 4px 4px 0 rgba(0,0,0,0.9), -2px -2px 0 rgba(0,0,0,0.7)",
            }}
          >
            {countdownNum}
          </div>
          <p
            className="font-display font-bold text-cream/90 text-xs tracking-[0.25em] uppercase mt-1"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.95)" }}
          >
            {countdownNum === 3 ? "Prêt ?" : countdownNum === 2 ? "Attention…" : "FONCE !"}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── ResultScreen ────────────────────────────────────────────────────────────
function ResultScreen({ score, isNewBest, rank, playerName, onReplay, leaderboardKey }: {
  score: number; isNewBest: boolean; rank: number | null;
  playerName: string; onReplay: () => void; leaderboardKey: number;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 120); return () => clearTimeout(t); }, []);

  const getMessage = () => {
    if (score === 0)  return "…vraiment ?";
    if (score < 5)   return "C'est un début.";
    if (score < 10)  return "C'est pas mauvais.";
    if (score < 20)  return "Un doigté digne des plus grands";
    if (score < 40)  return "Incrédiblé.";
    return "Tu es le Papope.";
  };

  // Fond de carte : vert citron (record) ou blanc cassé (normal)
  const cardBg = isNewBest ? "#C8F135" : "#F5F0E8";

  return (
    // Fond propre à cet écran — indépendant du thème parent
    <div
      className="min-h-screen flex flex-col items-center justify-start px-6 py-8 overflow-auto"
      style={{ background: "#0E0C0B" }}
    >
      <div
        className="max-w-md w-full"
        style={{
          opacity:   show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.45s ease, transform 0.45s ease",
        }}
      >
        {/* ── Carte score ─────────────────────────────────────────────── */}
        <div
          className="border-2 p-4 text-center mb-6"
          style={{ background: cardBg, borderColor: DARK, boxShadow: `7px 7px 0 ${DARK}` }}
        >
          {isNewBest ? (
              <div
                className="font-display text-md font-bold tracking-[0.22em] uppercase mb-4 animate-pulse"
                style={{ color: DARK }}
              >
                🎉 Nouveau record personnel !
              </div>
            ) : 
            (

              <div
                className="font-display text-md font-bold tracking-[0.22em] uppercase mb-4 animate-pulse"
                style={{ color: DARK }}
              >
                T'as pas fais mieux
              </div>
            )
          }

          {/* Chiffre — couleur sombre forcée, lisible sur vert ET sur crème */}
          <div
            className="font-display font-black leading-none"
            style={{ fontSize: "clamp(4rem, 14vw, 6rem)", color: DARK }}
          >
            {score}
          </div>

          <div
            className="font-display font-bold text-base tracking-widest uppercase mt-2"
            style={{ color: DARK_70 }}
          >
            {score <= 1 ? "clic" : "clics"}
          </div>

          <div className="mt-5 font-body italic text-base" style={{ color: DARK_70 }}>
            {getMessage()}
          </div>

          {rank !== null && (
            <div className="mt-5 font-display text-sm" style={{ color: DARK_50 }}>
              Classement mondial :{" "}
              <span className="font-black text-base" style={{ color: DARK }}>#{rank}</span>
            </div>
          )}
        </div>

        {/* Icône */}
        <div className="text-center mb-7">
          {isNewBest
            ? <div className="">
              <img
                src="/images/win.gif"
                alt="Intro"
                className="w-full h-full object-cover select-none"
                draggable={false}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            : <div className="">
              <img
                src="/images/lose.gif"
                alt="Intro"
                className="w-full h-full object-cover select-none"
                draggable={false}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              </div>}
        </div>

        {/* Bouton rejouer */}
        <button
          onClick={onReplay}
          className="w-full bg-papope text-cream font-display font-black text-xl py-5 border-2 border-ink hover:bg-ink transition-colors tracking-widest uppercase mb-5"
          style={{ boxShadow: "5px 5px 0 #1A1614" }}
        >
          Rejouer ↺
        </button>

        {/* Classement */}
        <div className="mt-8">
          <Leaderboard key={leaderboardKey} playerName={playerName} highlightScore={score} isNewBest={isNewBest} />
        </div>
      </div>
    </div>
  );
}
