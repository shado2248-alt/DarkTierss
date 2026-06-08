import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust one layer of proxy (Replit, nginx, Cloudflare, etc.)
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowedOrigin ? allowedOrigin : true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret === "dark-tiers-secret-change-me") {
  if (process.env.NODE_ENV === "production") {
    logger.warn("SESSION_SECRET is not set or is using the default. Set a strong random secret in production.");
  }
}

const PgSession = connectPgSimple(session);

// behindProxy = true when running behind an HTTPS reverse proxy.
// Replit sets REPLIT_DOMAINS; for self-hosting set TRUST_PROXY=true in your env.
const behindProxy = !!process.env.REPLIT_DOMAINS || process.env.TRUST_PROXY === "true";

app.use(
  session({
    store: process.env.DATABASE_URL
      ? new PgSession({
          conString: process.env.DATABASE_URL,
          tableName: "sessions",
          createTableIfMissing: true,
        })
      : undefined,
    secret: sessionSecret ?? "dark-tiers-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: behindProxy,
      sameSite: behindProxy ? "none" : "lax",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

// Optional: serve the built frontend from STATIC_DIR so no separate web server
// is needed. Set STATIC_DIR to the path of the frontend build output, e.g.:
//   STATIC_DIR=/app/dark-tiers/dist/public
// The API keeps handling /api; everything else falls through to index.html.
const staticDir = process.env.STATIC_DIR;
if (staticDir && fs.existsSync(staticDir)) {
  logger.info({ staticDir }, "Serving static frontend files");
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
