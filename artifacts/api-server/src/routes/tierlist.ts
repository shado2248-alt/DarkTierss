import { Router, type IRouter } from "express";

const router: IRouter = Router();

const EXTERNAL_URL = "https://tierlist-bot.vercel.app/api/dark-tiers";

router.get("/tierlist", async (req, res): Promise<void> => {
  try {
    const response = await fetch(EXTERNAL_URL, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      res.status(502).json({ error: "Upstream API error", status: response.status });
      return;
    }
    const data = await response.json();
    res.setHeader("Cache-Control", "no-store");
    res.json(data);
  } catch (err: any) {
    req.log.error({ err }, "Failed to proxy tierlist");
    res.status(502).json({ error: "Failed to reach tierlist API" });
  }
});

export default router;
