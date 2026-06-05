import { Router, type IRouter } from "express";
import { db, gamemodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateGamemodeBody, UpdateGamemodeBody, UpdateGamemodeParams, DeleteGamemodeParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/gamemodes", async (_req, res): Promise<void> => {
  const gamemodes = await db.select().from(gamemodesTable).orderBy(gamemodesTable.id);
  res.json(
    gamemodes.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      isActive: g.isActive,
      createdAt: g.createdAt.toISOString(),
    }))
  );
});

router.post("/gamemodes", async (req, res): Promise<void> => {
  const parsed = CreateGamemodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [gm] = await db
    .insert(gamemodesTable)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      isActive: parsed.data.isActive ?? true,
    })
    .returning();
  res.status(201).json({
    id: gm.id,
    name: gm.name,
    slug: gm.slug,
    description: gm.description,
    isActive: gm.isActive,
    createdAt: gm.createdAt.toISOString(),
  });
});

router.patch("/gamemodes/:id", async (req, res): Promise<void> => {
  const params = UpdateGamemodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGamemodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.slug != null) updates.slug = parsed.data.slug;
  if (parsed.data.description != null) updates.description = parsed.data.description;
  if (parsed.data.isActive != null) updates.isActive = parsed.data.isActive;
  const [gm] = await db
    .update(gamemodesTable)
    .set(updates)
    .where(eq(gamemodesTable.id, params.data.id))
    .returning();
  if (!gm) {
    res.status(404).json({ error: "Gamemode not found" });
    return;
  }
  res.json({
    id: gm.id,
    name: gm.name,
    slug: gm.slug,
    description: gm.description,
    isActive: gm.isActive,
    createdAt: gm.createdAt.toISOString(),
  });
});

router.delete("/gamemodes/:id", async (req, res): Promise<void> => {
  const params = DeleteGamemodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [gm] = await db
    .delete(gamemodesTable)
    .where(eq(gamemodesTable.id, params.data.id))
    .returning();
  if (!gm) {
    res.status(404).json({ error: "Gamemode not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
