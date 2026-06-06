import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET ?? "dark-tiers-secret-change-me";
const PgSession = connectPgSimple(session);

// When running behind Replit's HTTPS proxy (or any HTTPS proxy), cookies must
// be Secure + SameSite=None so they survive the iframe / cross-origin context.
const behindProxy = !!process.env.REPLIT_DOMAINS;

app.use(
  session({
    store: process.env.DATABASE_URL
      ? new PgSession({
          conString: process.env.DATABASE_URL,
          tableName: "sessions",
          createTableIfMissing: true,
        })
      : undefined,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: behindProxy,
      sameSite: behindProxy ? "none" : "lax",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

app.use("/api", router);

export default app;
