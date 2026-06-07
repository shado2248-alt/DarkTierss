import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import statsRouter from "./stats";
import gamemodesRouter from "./gamemodes";
import tiersRouter from "./tiers";
import playersRouter from "./players";
import leaderboardRouter from "./leaderboard";
import matchesRouter from "./matches";
import testsRouter from "./tests";
import announcementsRouter from "./announcements";
import adminRouter from "./admin";
import auditRouter from "./audit";
import { generalLimiter, authLimiter, adminLimiter } from "../middleware/rate-limit";

const router: IRouter = Router();

router.use(generalLimiter);
router.use(/^\/auth\/(login|register)$/, authLimiter);
router.use(/^\/admin/, adminLimiter);

router.use(healthRouter);
router.use(authRouter);
router.use(statsRouter);
router.use(gamemodesRouter);
router.use(tiersRouter);
router.use(playersRouter);
router.use(leaderboardRouter);
router.use(matchesRouter);
router.use(testsRouter);
router.use(announcementsRouter);
router.use(adminRouter);
router.use(auditRouter);

export default router;
