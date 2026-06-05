import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playerRatingsTable = pgTable("player_ratings", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  gamemodeId: integer("gamemode_id").notNull(),
  rating: integer("rating").notNull().default(1000),
  peakRating: integer("peak_rating").notNull().default(1000),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  totalMatches: integer("total_matches").notNull().default(0),
  tierId: integer("tier_id"),
  season: integer("season").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPlayerRatingSchema = createInsertSchema(playerRatingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlayerRating = z.infer<typeof insertPlayerRatingSchema>;
export type PlayerRating = typeof playerRatingsTable.$inferSelect;
