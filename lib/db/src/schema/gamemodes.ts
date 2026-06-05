import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gamemodesTable = pgTable("gamemodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGamemodeSchema = createInsertSchema(gamemodesTable).omit({ id: true, createdAt: true });
export type InsertGamemode = z.infer<typeof insertGamemodeSchema>;
export type Gamemode = typeof gamemodesTable.$inferSelect;
