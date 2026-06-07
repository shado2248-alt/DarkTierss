import { Router, type IRouter } from "express";
import { db, auditLogsTable, usersTable } from "@workspace/db";
import { desc, sql, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/audit-logs", async (req, res): Promise<void> => {
  const session = req.session as any;
  if (!session?.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [me] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, session.userId));
  if (!me || me.role !== "owner") { res.status(403).json({ error: "Owner only" }); return; }

  const page  = parseInt(String(req.query.page  ?? 1))  || 1;
  const limit = Math.min(parseInt(String(req.query.limit ?? 50)) || 50, 200);
  const offset = (page - 1) * limit;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(auditLogsTable);

  const logs = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    logs: logs.map(l => ({
      id:        l.id,
      actorId:   l.actorId,
      actorName: l.actorName,
      action:    l.action,
      details:   l.details,
      createdAt: l.createdAt.toISOString(),
    })),
    total: Number(total ?? 0),
    page,
    limit,
  });
});

export default router;
