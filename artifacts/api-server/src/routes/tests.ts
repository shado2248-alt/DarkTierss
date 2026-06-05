import { Router, type IRouter } from "express";
import { db, testsTable, playersTable, gamemodesTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  ListTestsQueryParams,
  CreateTestBody,
  GetTestParams,
  UpdateTestParams,
  UpdateTestBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatTest(t: typeof testsTable.$inferSelect) {
  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, t.playerId));
  const [gm] = await db.select().from(gamemodesTable).where(eq(gamemodesTable.id, t.gamemodeId));
  let testerName: string | null = null;
  if (t.testerId) {
    const [tester] = await db.select().from(usersTable).where(eq(usersTable.id, t.testerId));
    testerName = tester?.username ?? null;
  }
  return {
    id: t.id,
    playerId: t.playerId,
    playerName: player?.username ?? "Unknown",
    gamemodeId: t.gamemodeId,
    gamemodeName: gm?.name ?? "Unknown",
    requestedTier: t.requestedTier,
    status: t.status,
    testerId: t.testerId,
    testerName,
    notes: t.notes,
    result: t.result,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

router.get("/tests", async (req, res): Promise<void> => {
  const qp = ListTestsQueryParams.safeParse(req.query);
  const page = qp.success && qp.data.page ? qp.data.page : 1;
  const limit = qp.success && qp.data.limit ? Math.min(qp.data.limit, 100) : 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (qp.success && qp.data.status) conditions.push(eq(testsTable.status, qp.data.status));
  if (qp.success && qp.data.gamemodeId) conditions.push(eq(testsTable.gamemodeId, qp.data.gamemodeId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(testsTable)
    .where(where);

  const tests = await db
    .select()
    .from(testsTable)
    .where(where)
    .orderBy(desc(testsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const formatted = await Promise.all(tests.map(formatTest));
  res.json({ tests: formatted, total: count ?? 0, page, limit });
});

router.post("/tests", async (req, res): Promise<void> => {
  const parsed = CreateTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [test] = await db
    .insert(testsTable)
    .values({
      playerId: parsed.data.playerId,
      gamemodeId: parsed.data.gamemodeId,
      requestedTier: parsed.data.requestedTier,
      notes: parsed.data.notes,
      status: "pending",
    })
    .returning();
  res.status(201).json(await formatTest(test));
});

router.get("/tests/:id", async (req, res): Promise<void> => {
  const params = GetTestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [test] = await db.select().from(testsTable).where(eq(testsTable.id, params.data.id));
  if (!test) {
    res.status(404).json({ error: "Test not found" });
    return;
  }
  res.json(await formatTest(test));
});

router.patch("/tests/:id", async (req, res): Promise<void> => {
  const params = UpdateTestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.status != null) updates.status = parsed.data.status;
  if (parsed.data.testerId != null) updates.testerId = parsed.data.testerId;
  if (parsed.data.notes != null) updates.notes = parsed.data.notes;
  if (parsed.data.result != null) updates.result = parsed.data.result;
  const [test] = await db
    .update(testsTable)
    .set(updates)
    .where(eq(testsTable.id, params.data.id))
    .returning();
  if (!test) {
    res.status(404).json({ error: "Test not found" });
    return;
  }
  res.json(await formatTest(test));
});

export default router;
