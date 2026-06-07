import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id:        serial("id").primaryKey(),
  actorId:   integer("actor_id"),
  actorName: text("actor_name").notNull().default("Unknown"),
  action:    text("action").notNull(),
  details:   jsonb("details").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
