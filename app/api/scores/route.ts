import { NextRequest, NextResponse } from "next/server";
import { db, scores } from "@/lib/db";
import { desc, eq, and } from "drizzle-orm";

// GET /api/scores?game=papope&player=Jean
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game") || "papope";
    const player = searchParams.get("player");

    // Global top 10
    const top10 = await db
      .select()
      .from(scores)
      .where(eq(scores.game, game))
      .orderBy(desc(scores.score))
      .limit(10);

    // Personal best if player provided
    let personalBest = null;
    if (player) {
      const rows = await db
        .select()
        .from(scores)
        .where(and(eq(scores.game, game), eq(scores.playerName, player)))
        .orderBy(desc(scores.score))
        .limit(1);
      personalBest = rows[0] ?? null;
    }

    return NextResponse.json({ top10, personalBest });
  } catch (err) {
    console.error("GET /api/scores error:", err);
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

    const [inserted] = await db
      .insert(scores)
      .values({ playerName: sanitizedName, score, game })
      .returning();

    // Check if this is a new personal best
    const allPersonal = await db
      .select()
      .from(scores)
      .where(and(eq(scores.game, game), eq(scores.playerName, sanitizedName)))
      .orderBy(desc(scores.score))
      .limit(2);

    const isNewBest = allPersonal.length <= 1 || allPersonal[0].id === inserted.id;

    // Get rank
    const higherScores = await db
      .select()
      .from(scores)
      .where(eq(scores.game, game))
      .orderBy(desc(scores.score));

    // Dedupe by player name keeping their best
    const seen = new Map<string, number>();
    for (const s of higherScores) {
      if (!seen.has(s.playerName)) seen.set(s.playerName, s.score);
    }
    const sorted = Array.from(seen.values()).sort((a, b) => b - a);
    const rank = sorted.findIndex((s) => s <= score) + 1;

    return NextResponse.json({ inserted, isNewBest, rank });
  } catch (err) {
    console.error("POST /api/scores error:", err);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
