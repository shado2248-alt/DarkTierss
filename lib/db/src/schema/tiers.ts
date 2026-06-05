import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tiersTable = pgTable("tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  rank: integer("rank").notNull(),
  minRating: integer("min_rating").notNull(),
  maxRating: integer("max_rating"),
  color: text("color").notNull().default("#9333ea"),
  gamemodeId: integer("gamemode_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTierSchema = createInsertSchema(tiersTable).omit({ id: true, createdAt: true });
export type InsertTier = z.infer<typeof insertTierSchema>;
export type Tier = typeof tiersTable.$inferSelect;
