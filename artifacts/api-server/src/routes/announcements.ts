import { Router, type IRouter } from "express";
import { db, announcementsTable, usersTable, auditLogsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  ListAnnouncementsQueryParams,
  CreateAnnouncementBody,
  GetAnnouncementParams,
  UpdateAnnouncementParams,
  UpdateAnnouncementBody,
  DeleteAnnouncementParams,
} from "@workspace/api-zod";
import { webhookAnnouncement } from "../lib/webhook";

const router: IRouter = Router();

async function formatAnnouncement(a: typeof announcementsTable.$inferSelect) {
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, a.authorId));
  return {
    id:         a.id,
    title:      a.title,
    content:    a.content,
    type:       a.type,
    isPinned:   a.isPinned,
    authorId:   a.authorId,
    authorName: author?.displayName ?? author?.username ?? "Unknown",
    createdAt:  a.createdAt.toISOString(),
    updatedAt:  a.updatedAt.toISOString(),
  };
}

router.get("/announcements", async (req, res): Promise<void> => {
  const qp = ListAnnouncementsQueryParams.safeParse(req.query);
  const page  = qp.success && qp.data.page  ? qp.data.page  : 1;
  const limit = qp.success && qp.data.limit ? Math.min(qp.data.limit, 50) : 10;
  const offset = (page - 1) * limit;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(announcementsTable);

  const announcements = await db
    .select()
    .from(announcementsTable)
    .orderBy(desc(announcementsTable.isPinned), desc(announcementsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const formatted = await Promise.all(announcements.map(formatAnnouncement));
  res.json({ announcements: formatted, total: count ?? 0, page, limit });
});

router.post("/announcements", async (req, res): Promise<void> => {
  const parsed = CreateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [ann] = await db
    .insert(announcementsTable)
    .values({
      title:    parsed.data.title,
      content:  parsed.data.content,
      type:     parsed.data.type,
      isPinned: parsed.data.isPinned ?? false,
      authorId: parsed.data.authorId,
    })
    .returning();

  const formatted = await formatAnnouncement(ann);

  // Audit log
  const session = req.session as any;
  const actorId = session?.userId as number | undefined;
  let actorName = formatted.authorName;
  if (actorId) {
    const [actor] = await db.select({ username: usersTable.username, displayName: usersTable.displayName }).from(usersTable).where(eq(usersTable.id, actorId));
    if (actor) actorName = actor.displayName ?? actor.username ?? actorName;
  }
  db.insert(auditLogsTable).values({
    actorId: actorId ?? null,
    actorName,
    action: "announcement_posted",
    details: { announcementId: ann.id, title: ann.title, type: ann.type, isPinned: ann.isPinned },
  }).catch(() => {});

  // Discord webhook
  webhookAnnouncement({
    title:      ann.title,
    content:    ann.content,
    authorName: formatted.authorName,
    type:       ann.type,
  }).catch(() => {});

  res.status(201).json(formatted);
});

router.get("/announcements/:id", async (req, res): Promise<void> => {
  const params = GetAnnouncementParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [ann] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, params.data.id));
  if (!ann) { res.status(404).json({ error: "Announcement not found" }); return; }
  res.json(await formatAnnouncement(ann));
});

router.patch("/announcements/:id", async (req, res): Promise<void> => {
  const params = UpdateAnnouncementParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.title    != null) updates.title    = parsed.data.title;
  if (parsed.data.content  != null) updates.content  = parsed.data.content;
  if (parsed.data.type     != null) updates.type     = parsed.data.type;
  if (parsed.data.isPinned != null) updates.isPinned = parsed.data.isPinned;
  const [ann] = await db.update(announcementsTable).set(updates).where(eq(announcementsTable.id, params.data.id)).returning();
  if (!ann) { res.status(404).json({ error: "Announcement not found" }); return; }
  res.json(await formatAnnouncement(ann));
});

router.delete("/announcements/:id", async (req, res): Promise<void> => {
  const params = DeleteAnnouncementParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [ann] = await db.delete(announcementsTable).where(eq(announcementsTable.id, params.data.id)).returning();
  if (!ann) { res.status(404).json({ error: "Announcement not found" }); return; }
  res.sendStatus(204);
});

export default router;
