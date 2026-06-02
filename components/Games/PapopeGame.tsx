"use client";

import { useEffect, useRef } from "react";

interface Props {
  onGameEnd:    (score: number) => void;
  gameDuration: number;
  playerName:   string;
}

// ─── ASSETS ────────────────────────────────────────────────────────────────
const ASSETS = {
  goodSprite: "/images/macron.png",
  badSprite:  "/images/bardela.png",
} as const;

// ─── Layout ────────────────────────────────────────────────────────────────
const W     = 480;
const H     = 700;
const HUD_H = 64;

// ─── Head config ───────────────────────────────────────────────────────────
const HEAD_RADIUS_BASE = 56;
const HEAD_SHRINK      = 0.8;
const HEAD_RADIUS_MIN  = 22;
const BAD_CHANCE       = 0.05;
const BAD_RADIUS       = HEAD_RADIUS_BASE; // bad head always this size, never shrinks

const SPEED_BASE   = 120;
const SPEED_GROWTH = 25;
const SPEED_JITTER = 0.1;
const MAX_SPEED    = 300;

const HIT_FADE_MS       = 180;  // normal head fade duration
const SPAWN_SCATTER     = 10;
const EXPLOSION_RADIUS  = 160;  // px — blast zone that kills neighbours
const EXPLOSION_DURATION = 400; // ms — shockwave ring animation

// ─── Colours ───────────────────────────────────────────────────────────────
const C = {
  bg:        "#0E0C0B",
  grid:      "rgba(255,255,255,0.035)",
  hudBg:     "rgba(10,8,7,0.88)",
  barFull:   "#C8F135",
  barMid:    "#F5A623",
  barLow:    "#E74C3C",
  barTrack:  "rgba(255,255,255,0.13)",
  scoreText: "#F5F0E8",
  nameText:  "rgba(245,240,232,0.40)",
  goodFace:  "#F5D020",
  badFace:   "#C0392B",
  ink:       "#1A1614",
  blast:     "#FF4500",
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface Head {
  id:         number;
  x:          number;
  y:          number;
  vx:         number;
  vy:         number;
  radius:     number;
  isBad:      boolean;
  generation: number;
  wobble:     number;
  hitAt:      number; // 0 = alive
}

interface Explosion {
  id:      number;
  x:       number;
  y:       number;
  startAt: number;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function PapopeGame({ onGameEnd, gameDuration, playerName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onEndRef  = useRef(onGameEnd);
  useEffect(() => { onEndRef.current = onGameEnd; }, [onGameEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const dpr = window.devicePixelRatio || 1;
    canvas.width        = W * dpr;
    canvas.height       = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // ── State ─────────────────────────────────────────────────────────────
    let score       = 0;
    let heads: Head[]       = [];
    let explosions: Explosion[] = [];
    let nextId      = 0;
    let expId       = 0;
    let startTime   = 0;
    let prevNow     = 0;
    let dead        = false;
    let rafHandle   = 0;
    let goodImg: HTMLImageElement | null = null;
    let badImg:  HTMLImageElement | null = null;

    const gi = new Image(); gi.src = ASSETS.goodSprite; gi.onload = () => { goodImg = gi; };
    const bi = new Image(); bi.src = ASSETS.badSprite;  bi.onload = () => { badImg  = bi; };

    // ── Helpers ───────────────────────────────────────────────────────────
    function radiusForGen(gen: number) {
      return Math.max(HEAD_RADIUS_MIN, HEAD_RADIUS_BASE * Math.pow(HEAD_SHRINK, gen));
    }

    function speedForGen(gen: number) {
      const base   = Math.min(SPEED_BASE + SPEED_GROWTH * gen, MAX_SPEED);
      const jitter = 1 + (Math.random() * 2 - 1) * SPEED_JITTER;
      return base * jitter;
    }

    function makeHead(x: number, y: number, vx: number, vy: number, gen: number): Head {
      const isBad = gen > 0 && Math.random() < BAD_CHANCE;
      return {
        id: nextId++, x, y, vx, vy,
        radius:     isBad ? BAD_RADIUS : radiusForGen(gen),
        isBad,
        generation: gen,
        wobble:     Math.random() * Math.PI * 2,
        hitAt:      0,
      };
    }

    function spawnInitial() {
      const spd = speedForGen(0);
      const ang = Math.random() * Math.PI * 2;
      heads.push(makeHead(W / 2, HUD_H + (H - HUD_H) / 2, Math.cos(ang) * spd, Math.sin(ang) * spd, 0));
    }

    function spawnClones(parent: Head) {
      const gen = parent.generation + 1;
      for (let i = 0; i < 2; i++) {
        const ang  = Math.random() * Math.PI * 2;
        const spd  = speedForGen(gen);
        const sign = i === 0 ? 1 : -1;
        const r    = radiusForGen(gen);
        const nx   = Math.max(r, Math.min(W - r, parent.x + sign * SPAWN_SCATTER * 0.5));
        const ny   = Math.max(HUD_H + r, Math.min(H - r, parent.y + sign * SPAWN_SCATTER * 0.4));
        heads.push(makeHead(nx, ny, Math.cos(ang) * spd, Math.sin(ang) * spd, gen));
      }
    }

    // Kill all alive heads within EXPLOSION_RADIUS of (ex, ey)
    function triggerExplosion(ex: number, ey: number, now: number) {
      explosions.push({ id: expId++, x: ex, y: ey, startAt: now });
      for (const h of heads) {
        if (h.hitAt > 0) continue;
        const dx = h.x - ex, dy = h.y - ey;
        if (dx*dx + dy*dy <= EXPLOSION_RADIUS ** 2) {
          h.hitAt = now; // killed by blast (no score change for collateral)
        }
      }
    }

    // ── Drawing ───────────────────────────────────────────────────────────
    function rrect(x: number, y: number, w: number, h: number, r: number) {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y,     x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x,     y + h, r);
      ctx.arcTo(x,     y + h, x,     y,     r);
      ctx.arcTo(x,     y,     x + w, y,     r);
      ctx.closePath();
    }

    function drawFallbackFace(r: number, bad: boolean) {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = bad ? C.badFace : C.goodFace; ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = C.ink;
      if (bad) {
        const ew = r * 0.12;
        for (const [ex, ey] of [[-r*0.28, -r*0.12], [r*0.28, -r*0.12]] as [number,number][]) {
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(ex-ew, ey-ew); ctx.lineTo(ex+ew, ey+ew); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ex+ew, ey-ew); ctx.lineTo(ex-ew, ey+ew); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, r*0.35, r*0.28, 1.1*Math.PI, 1.9*Math.PI);
        ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(-r*0.28, -r*0.1, r*0.10, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( r*0.28, -r*0.1, r*0.10, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, r*0.1, r*0.28, 0.1*Math.PI, 0.9*Math.PI);
        ctx.lineWidth = 2; ctx.stroke();
      }
    }

    function drawHead(h: Head, now: number) {
      const r     = h.radius;
      const isHit = h.hitAt > 0;
      const prog  = isHit ? Math.min((now - h.hitAt) / HIT_FADE_MS, 1) : 0;
      const img   = h.isBad ? badImg : goodImg;

      ctx.save();
      ctx.translate(h.x, h.y);

      if (isHit) {
        ctx.globalAlpha = 1 - prog;
      } else {
        ctx.translate(
          Math.sin(now / 430 + h.wobble) * 2.5,
          Math.cos(now / 330 + h.wobble * 1.4) * 1.8,
        );
      }

      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
      if (img) {
        ctx.drawImage(img, -r, -r, r * 2, r * 2);
      } else {
        drawFallbackFace(r, h.isBad);
      }
      ctx.restore();

      ctx.restore();
    }

    function drawExplosions(now: number) {
      for (const exp of explosions) {
        const prog = Math.min((now - exp.startAt) / EXPLOSION_DURATION, 1);
        if (prog >= 1) continue;

        // Easing: fast expand then slow
        const eased = 1 - Math.pow(1 - prog, 2);
        const currentR = EXPLOSION_RADIUS * eased;
        const alpha    = 1 - prog;

        ctx.save();
        ctx.translate(exp.x, exp.y);

        // Outer shockwave ring
        ctx.beginPath();
        ctx.arc(0, 0, currentR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,69,0,${alpha * 0.9})`;
        ctx.lineWidth   = 4 * (1 - prog);
        ctx.stroke();

        // Inner glow ring (slightly smaller, different colour)
        ctx.beginPath();
        ctx.arc(0, 0, currentR * 0.65, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,200,0,${alpha * 0.6})`;
        ctx.lineWidth   = 2.5 * (1 - prog);
        ctx.stroke();

        // Hot core flash (only first 20% of animation)
        if (prog < 0.2) {
          const coreAlpha = (1 - prog / 0.2) * 0.35;
          ctx.beginPath();
          ctx.arc(0, 0, currentR * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,230,100,${coreAlpha})`;
          ctx.fill();
        }

        ctx.restore();
      }
    }

    function drawHUD(remaining: number) {
      ctx.fillStyle = C.hudBg;
      ctx.fillRect(0, 0, W, HUD_H);

      const PAD = 14, BAR_Y = 10, BAR_H = 9, BAR_W = W - PAD * 2;
      const prog  = Math.max(remaining / gameDuration, 0);
      const fillW = BAR_W * prog;

      ctx.fillStyle = C.barTrack;
      ctx.beginPath(); rrect(PAD, BAR_Y, BAR_W, BAR_H, BAR_H / 2); ctx.fill();

      ctx.fillStyle = prog > 0.5 ? C.barFull : prog > 0.25 ? C.barMid : C.barLow;
      if (fillW > 0) {
        ctx.beginPath(); rrect(PAD, BAR_Y, Math.max(fillW, BAR_H), BAR_H, BAR_H / 2); ctx.fill();
      }

      ctx.fillStyle = C.scoreText;
      ctx.font = "bold 30px 'Arial Black', Arial, sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(String(score), PAD, HUD_H - 13);

      ctx.fillStyle = C.nameText;
      ctx.font = "13px Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(playerName, W - PAD, HUD_H - 13);
    }

    function drawBg() {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, HUD_H); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = HUD_H; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }

    // ── Main loop ─────────────────────────────────────────────────────────
    spawnInitial();

    let lastRespawnCheck = 0;
    const RESPAWN_INTERVAL = 1000; // ms — check every second

    function tick(now: number) {
      if (dead) return;
      if (startTime === 0) { startTime = now; prevNow = now; }

      const elapsed   = now - startTime;
      const remaining = gameDuration - elapsed;

      if (remaining <= 0) {
        drawBg();
        drawExplosions(now);
        for (const h of heads) drawHead(h, now);
        drawHUD(0);
        dead = true;
        onEndRef.current(score);
        return;
      }

      const dt = Math.min((now - prevNow) / 1000, 0.05);
      prevNow = now;

      for (const h of heads) {
        if (h.hitAt > 0) continue;
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        const minY = HUD_H + h.radius;
        if (h.x < h.radius)     { h.x = h.radius;     h.vx =  Math.abs(h.vx); }
        if (h.x > W - h.radius) { h.x = W - h.radius; h.vx = -Math.abs(h.vx); }
        if (h.y < minY)         { h.y = minY;          h.vy =  Math.abs(h.vy); }
        if (h.y > H - h.radius) { h.y = H - h.radius;  h.vy = -Math.abs(h.vy); }
      }

      // Prune finished fades and explosions
      heads      = heads.filter(h => h.hitAt === 0 || now - h.hitAt < HIT_FADE_MS);
      explosions = explosions.filter(e => now - e.startAt < EXPLOSION_DURATION);

      // Respawn: if no alive heads exist, spawn a fresh gen-0 every second
      const hasAlive = heads.some(h => h.hitAt === 0);
      if (!hasAlive && now - lastRespawnCheck >= RESPAWN_INTERVAL) {
        lastRespawnCheck = now;
        const spd = speedForGen(0);
        const ang = Math.random() * Math.PI * 2;
        heads.push(makeHead(W / 2, HUD_H + (H - HUD_H) / 2, Math.cos(ang) * spd, Math.sin(ang) * spd, 0));
      }

      drawBg();
      drawExplosions(now);
      for (const h of heads.filter(h => h.hitAt  > 0)) drawHead(h, now);
      for (const h of heads.filter(h => h.hitAt === 0)) drawHead(h, now);
      drawHUD(remaining);

      rafHandle = requestAnimationFrame(tick);
    }

    rafHandle = requestAnimationFrame(tick);

    // ── Input ─────────────────────────────────────────────────────────────
    function logicalXY(cx: number, cy: number) {
      if (!canvas) return { x : null, y: null};
      const rect = canvas.getBoundingClientRect();
      return { x: (cx - rect.left) * (W / rect.width), y: (cy - rect.top) * (H / rect.height) };
    }

    function tryHit(lx: number | null, ly: number | null) {
      if (dead || !lx || !ly) return;
      const now = performance.now();
      for (let i = heads.length - 1; i >= 0; i--) {
        const h = heads[i];
        if (h.hitAt > 0) continue;
        const dx = lx - h.x, dy = ly - h.y;
        if (dx*dx + dy*dy > (h.radius * 1.15) ** 2) continue;

        h.hitAt = now;

        if (h.isBad) {
          score = Math.max(0, score - 1);
          triggerExplosion(h.x, h.y, now); // blasts all neighbours
        } else {
          score += 1;
          spawnClones(h);
        }
        break;
      }
    }

    function onPointerDown(e: PointerEvent) {
      e.preventDefault();
      const { x, y } = logicalXY(e.clientX, e.clientY);
      tryHit(x, y);
    }

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    return () => {
      dead = true;
      cancelAnimationFrame(rafHandle);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display:          "block",
        touchAction:      "none",
        userSelect:       "none",
        WebkitUserSelect: "none",
        cursor:           "crosshair",
      }}
    />
  );
}