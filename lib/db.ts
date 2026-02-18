// import { neon } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-http";
// import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";

// // ─── Schema ───────────────────────────────────────────────────────────────────

// export const scores = pgTable("scores", {
//   id: serial("id").primaryKey(),
//   playerName: varchar("player_name", { length: 64 }).notNull(),
//   score: integer("score").notNull(),
//   game: varchar("game", { length: 32 }).notNull().default("papope"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });

// export type Score = typeof scores.$inferSelect;
// export type NewScore = typeof scores.$inferInsert;

// // ─── DB Instance ──────────────────────────────────────────────────────────────

// function getDb() {
//   const databaseUrl = process.env.DATABASE_URL;
//   if (!databaseUrl) {
//     throw new Error("DATABASE_URL environment variable is not set");
//   }
//   const sql = neon(databaseUrl);
//   return drizzle(sql);
// }

// export const db = getDb();
