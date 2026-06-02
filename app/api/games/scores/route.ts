import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET /api/games/scores?game=papope&player=Jean
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game   = searchParams.get("game")   || "papope";
    const player = searchParams.get("player");

    // ── Top 10 dédupliqué : 1 ligne par joueur = son meilleur score ──────
    // DISTINCT ON (player_name) + ORDER BY score DESC garantit
    // que chaque joueur n'apparaît qu'une seule fois.
    const { rows: top10 } = await sql`
      SELECT DISTINCT ON (player_name)
        id,
        player_name AS "playerName",
        score,
        game,
        created_at AS "createdAt"
      FROM scores
      WHERE game = ${game}
      ORDER BY player_name, score DESC, created_at DESC
    `;

    // Re-trier par score décroissant et limiter à 10
    // (DISTINCT ON impose d'abord un ORDER BY player_name)
    const sorted = top10
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // ── Meilleur score personnel ─────────────────────────────────────────
    let personalBest = null;
    if (player) {
      const { rows } = await sql`
        SELECT id, player_name AS "playerName", score, game, created_at AS "createdAt"
        FROM scores
        WHERE game = ${game} AND player_name = ${player}
        ORDER BY score DESC
        LIMIT 1
      `;
      personalBest = rows[0] ?? null;
    }

    return NextResponse.json({ top10: sorted, personalBest });
  } catch (err) {
    console.error("GET /api/games/scores error:", err);
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}

// POST /api/scores — body: { playerName, score, game }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName, score, game = "papope" } = body;

    if (!playerName || typeof score !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const sanitizedName = String(playerName).slice(0, 64).trim();
    if (!sanitizedName) {
      return NextResponse.json({ error: "Player name required" }, { status: 400 });
    }

    // ── Insérer le score ─────────────────────────────────────────────────
    const { rows } = await sql`
      INSERT INTO scores (player_name, score, game)
      VALUES (${sanitizedName}, ${score}, ${game})
      RETURNING id, player_name AS "playerName", score, game, created_at AS "createdAt"
    `;
    const inserted = rows[0];

    // ── Nouveau record personnel ? ───────────────────────────────────────
    // On cherche si le joueur avait déjà un score STRICTEMENT supérieur
    // avant cette insertion. Si non → c'est son nouveau meilleur score.
    const { rows: previousBest } = await sql`
      SELECT id
      FROM scores
      WHERE game          = ${game}
        AND player_name   = ${sanitizedName}
        AND score         > ${score}
      LIMIT 1
    `;
    const isNewBest = previousBest.length === 0;

    // ── Rang mondial (best score par joueur unique) ──────────────────────
    // Nombre de joueurs distincts dont le meilleur score est > au score soumis.
    const { rows: rankRows } = await sql`
      SELECT COUNT(*) AS count
      FROM (
        SELECT MAX(score) AS best
        FROM scores
        WHERE game = ${game}
        GROUP BY player_name
      ) sub
      WHERE sub.best > ${score}
    `;
    const rank = Number(rankRows[0].count) + 1;

    return NextResponse.json({ inserted, isNewBest, rank });
  } catch (err) {
    console.error("POST /api/games/scores error:", err);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
