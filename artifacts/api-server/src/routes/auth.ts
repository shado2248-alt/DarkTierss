import { Router, type IRouter } from "express";
import { db, usersTable, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function fetchMojangUUID(username: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { id: string; name: string };
    // Convert from no-dash to standard UUID format
    const id = data.id;
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
  } catch {
    return null;
  }
}

router.get("/auth/me", async (req, res): Promise<void> => {
  const session = req.session as any;
  if (!session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    role: user.role,
    isSuspended: user.isSuspended,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, minecraftUsername } = req.body ?? {};

  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  if (!minecraftUsername || typeof minecraftUsername !== "string" || minecraftUsername.trim().length < 2) {
    res.status(400).json({ error: "Minecraft username is required (min 2 characters)" });
    return;
  }

  const trimmedUsername = minecraftUsername.trim();

  // Check email uniqueness
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  // Check if minecraft username is already used by a player
  const existingPlayers = await db.select().from(playersTable);
  const takenUsername = existingPlayers.find(
    p => p.username.toLowerCase() === trimmedUsername.toLowerCase()
  );
  if (takenUsername) {
    res.status(409).json({ error: "This Minecraft username is already registered" });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    // Try to fetch Mojang UUID
    let uuid = await fetchMojangUUID(trimmedUsername);
    if (!uuid) {
      // Generate a random UUID if Mojang lookup fails
      uuid = crypto.randomUUID();
    }

    // Create user
    const [user] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        username: trimmedUsername,
        displayName: trimmedUsername,
        avatar: `https://mc-heads.net/avatar/${encodeURIComponent(trimmedUsername)}/128`,
        role: "user",
        isSuspended: false,
      })
      .returning();

    // Auto-create player record
    await db.insert(playersTable).values({
      username: trimmedUsername,
      uuid,
      region: "NA",
      userId: user.id,
    });

    (req.session as any).userId = user.id;

    res.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.isSuspended) {
    res.status(403).json({ error: "Your account has been suspended" });
    return;
  }

  (req.session as any).userId = user.id;

  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    role: user.role,
    isSuspended: user.isSuspended,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/auth/me", async (req, res): Promise<void> => {
  const session = req.session as any;
  if (!session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { displayName, region } = req.body ?? {};

  const updates: Record<string, unknown> = {};
  if (displayName !== undefined) {
    if (typeof displayName !== "string" || displayName.trim().length < 1) {
      res.status(400).json({ error: "Display name cannot be empty" });
      return;
    }
    updates.displayName = displayName.trim();
  }

  try {
    const [user] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, session.userId))
      .returning();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Also update linked player region if provided
    if (region && typeof region === "string") {
      const validRegions = ["NA", "EU", "AS", "OC", "SA"];
      if (validRegions.includes(region)) {
        await db
          .update(playersTable)
          .set({ region })
          .where(eq(playersTable.userId, session.userId));
      }
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Profile update error");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/auth/logout", (req, res): void => {
  const session = req.session as any;
  session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;
