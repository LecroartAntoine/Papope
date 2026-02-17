"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Head {
  id: number;
  x: number;       // center x
  y: number;       // center y
  vx: number;      // velocity x (px/frame)
  vy: number;      // velocity y (px/frame)
  size: number;    // diameter in px
  rotation: number;
  rotationSpeed: number;
  isClicked: boolean; // brief flash state
}

interface ScoreFloat {
  id: number;
  x: number;
  y: number;
}

let headIdCounter = 0;
let scoreFloatIdCounter = 0;

const HEAD_IMAGE = "/images/head.png";
const INITIAL_SPEED = 3.5;
const HEAD_SIZE = 90;         // px — adjust as needed
const CHILD_SIZE_FACTOR = 0.82; // children are slightly smaller (down to a minimum)
const MIN_SIZE = 40;
const MAX_HEADS = 80;          // cap to avoid performance death

function createHead(x: number, y: number, size: number, baseSpeed: number): Head {
  const angle = Math.random() * Math.PI * 2;
  const speed = baseSpeed * (0.8 + Math.random() * 0.4);
  return {
    id: headIdCounter++,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 4,
    isClicked: false,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface PapopeGameProps {
  onGameEnd: (score: number) => void;
  gameDuration: number; // ms
  playerName: string;
}

export default function PapopeGame({ onGameEnd, gameDuration, playerName }: PapopeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headsRef = useRef<Head[]>([]);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(gameDuration);
  const lastFrameRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const gameActiveRef = useRef(true);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const scoreFloatsRef = useRef<ScoreFloat[]>([]);

  const [displayScore, setDisplayScore] = useState(0);
  const [displayTime, setDisplayTime] = useState(Math.ceil(gameDuration / 1000));
  const [scoreFloats, setScoreFloats] = useState<ScoreFloat[]>([]);
  const [headCount, setHeadCount] = useState(0);

  // ─── Load head image ────────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.src = HEAD_IMAGE;
    img.onload = () => { imageRef.current = img; };
    img.onerror = () => {
      // Create a fallback canvas image (emoji face)
      const fb = document.createElement("canvas");
      fb.width = 100; fb.height = 100;
      const ctx = fb.getContext("2d")!;
      ctx.font = "80px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("😈", 50, 50);
      const fallbackImg = new Image();
      fallbackImg.src = fb.toDataURL();
      fallbackImg.onload = () => { imageRef.current = fallbackImg; };
    };
    imageRef.current = img;
  }, []);

  // ─── Init game ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    canvas.width = W;
    canvas.height = H;

    // Spawn initial head in center
    headsRef.current = [createHead(W / 2, H / 2, HEAD_SIZE, INITIAL_SPEED)];
    scoreRef.current = 0;
    timeLeftRef.current = gameDuration;
    gameActiveRef.current = true;
    lastFrameRef.current = performance.now();

    // ─── Game loop ─────────────────────────────────────────────────────
    const loop = (now: number) => {
      if (!gameActiveRef.current) return;

      const dt = now - lastFrameRef.current;
      lastFrameRef.current = now;

      // Update timer
      timeLeftRef.current -= dt;
      const timeLeft = Math.max(0, timeLeftRef.current);
      setDisplayTime(Math.ceil(timeLeft / 1000));

      if (timeLeftRef.current <= 0) {
        gameActiveRef.current = false;
        onGameEnd(scoreRef.current);
        return;
      }

      // Update heads
      const heads = headsRef.current;
      for (const h of heads) {
        h.x += h.vx;
        h.y += h.vy;
        h.rotation += h.rotationSpeed;

        const r = h.size / 2;

        // Bounce off walls
        if (h.x - r < 0) { h.x = r; h.vx = Math.abs(h.vx); }
        if (h.x + r > W) { h.x = W - r; h.vx = -Math.abs(h.vx); }
        if (h.y - r < 0) { h.y = r; h.vy = Math.abs(h.vy); }
        if (h.y + r > H) { h.y = H - r; h.vy = -Math.abs(h.vy); }
      }

      // Draw
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);

      for (const h of heads) {
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate((h.rotation * Math.PI) / 180);

        if (h.isClicked) {
          ctx.filter = "brightness(1.5) saturate(2)";
        }

        const r = h.size / 2;
        if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
          ctx.drawImage(imageRef.current, -r, -r, h.size, h.size);
        } else {
          // Draw emoji fallback
          ctx.font = `${h.size * 0.9}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("😈", 0, 0);
        }

        ctx.restore();
      }

      setDisplayScore(scoreRef.current);
      setHeadCount(heads.length);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      gameActiveRef.current = false;
    };
  }, [gameDuration, onGameEnd]);

  // ─── Handle resize ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Click handler ──────────────────────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!gameActiveRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let clickX: number, clickY: number;

      if ("touches" in e) {
        clickX = e.touches[0].clientX - rect.left;
        clickY = e.touches[0].clientY - rect.top;
      } else {
        clickX = e.clientX - rect.left;
        clickY = e.clientY - rect.top;
      }

      const heads = headsRef.current;
      let hit = false;

      for (let i = heads.length - 1; i >= 0; i--) {
        const h = heads[i];
        const dist = Math.sqrt((clickX - h.x) ** 2 + (clickY - h.y) ** 2);

        if (dist < h.size / 2) {
          hit = true;
          scoreRef.current += 1;

          // Brief click flash
          h.isClicked = true;
          setTimeout(() => { h.isClicked = false; }, 120);

          // Spawn 2 children if under cap
          if (heads.length < MAX_HEADS) {
            const childSize = Math.max(MIN_SIZE, h.size * CHILD_SIZE_FACTOR);
            const child1 = createHead(h.x + (Math.random() - 0.5) * 20, h.y + (Math.random() - 0.5) * 20, childSize, INITIAL_SPEED * 1.1);
            const child2 = createHead(h.x + (Math.random() - 0.5) * 20, h.y + (Math.random() - 0.5) * 20, childSize, INITIAL_SPEED * 1.1);
            // Remove hit head, add two children
            heads.splice(i, 1, child1, child2);
          } else {
            // Just remove the head (chaotic mode)
            heads.splice(i, 1);
            if (heads.length === 0) {
              // Add one back so game doesn't go empty
              const canvas2 = canvasRef.current!;
              heads.push(createHead(canvas2.width / 2, canvas2.height / 2, HEAD_SIZE, INITIAL_SPEED));
            }
          }

          // Score float
          const floatId = scoreFloatIdCounter++;
          scoreFloatsRef.current = [
            ...scoreFloatsRef.current,
            { id: floatId, x: clickX, y: clickY },
          ];
          setScoreFloats([...scoreFloatsRef.current]);

          setTimeout(() => {
            scoreFloatsRef.current = scoreFloatsRef.current.filter((f) => f.id !== floatId);
            setScoreFloats([...scoreFloatsRef.current]);
          }, 700);

          break; // Only hit one head per click
        }
      }

      // Miss feedback — slight screen shake via CSS class toggle? We'll skip for now.
      void hit;
    },
    []
  );

  // Time urgency
  const isUrgent = displayTime <= 3;
  const progress = timeLeftRef.current / gameDuration;

  return (
    <div className="min-h-screen bg-ink flex flex-col game-area">
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cream/10">
        <div className="flex items-center gap-3">
          <div className="font-display text-cream text-xs tracking-widest uppercase opacity-60">
            {playerName}
          </div>
          <div className="font-display text-cream/30 text-xs">·</div>
          <div className="font-display text-cream/50 text-xs">
            {headCount} têtes
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Score */}
          <div className="text-right">
            <div className="font-display font-bold text-cream text-3xl leading-none">
              {displayScore}
            </div>
            <div className="font-display text-cream/40 text-xs tracking-widest uppercase">
              clics
            </div>
          </div>

          {/* Timer */}
          <div
            className={`text-right transition-colors ${
              isUrgent ? "text-papope animate-pulse" : "text-cream"
            }`}
          >
            <div className="font-display font-bold text-3xl leading-none">
              {displayTime}
            </div>
            <div className="font-display text-xs tracking-widest uppercase opacity-40">
              sec
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-cream/10">
        <div
          className={`h-full transition-all duration-100 ${isUrgent ? "bg-papope" : "bg-accent"}`}
          style={{ width: `${Math.max(0, progress * 100)}%` }}
        />
      </div>

      {/* Game canvas */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onClick={handleClick}
          onTouchStart={handleClick}
        />

        {/* Score floats */}
        {scoreFloats.map((f) => (
          <div
            key={f.id}
            className="score-float absolute pointer-events-none font-display font-bold text-accent text-lg"
            style={{
              left: f.x - 10,
              top: f.y - 10,
              textShadow: "0 0 8px rgba(255, 214, 10, 0.8)",
            }}
          >
            +1
          </div>
        ))}
      </div>
    </div>
  );
}


