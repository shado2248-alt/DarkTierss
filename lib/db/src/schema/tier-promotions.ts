import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tierPromotionsTable = pgTable("tier_promotions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  gamemodeId: integer("gamemode_id").notNull(),
  fromTierId: integer("from_tier_id"),
  toTierId: integer("to_tier_id").notNull(),
  promotedAt: timestamp("promoted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTierPromotionSchema = createInsertSchema(tierPromotionsTable).omit({ id: true, promotedAt: true });
export type InsertTierPromotion = z.infer<typeof insertTierPromotionSchema>;
export type TierPromotion = typeof tierPromotionsTable.$inferSelect;
