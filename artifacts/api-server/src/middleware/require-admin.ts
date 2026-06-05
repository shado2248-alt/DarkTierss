import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ADMIN_ROLES = new Set(["admin", "owner"]);
const STAFF_ROLES = new Set(["admin", "owner", "moderator", "tester"]);

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  if (user.isSuspended) {
    res.status(403).json({ error: "Account suspended" });
    return;
  }
  (req as any).user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    const user = (req as any).user;
    if (!ADMIN_ROLES.has(user.role)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

export async function requireStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    const user = (req as any).user;
    if (!STAFF_ROLES.has(user.role)) {
      res.status(403).json({ error: "Staff access required" });
      return;
    }
    next();
  });
}
