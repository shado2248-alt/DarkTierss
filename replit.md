# DARK TIERS

An elite Minecraft PvP ranking platform where competitive players track ELO ratings, earn tier placements (HT1–LT5), and compete across 8 gamemodes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`
- Optional env: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` (for Discord OAuth login)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (wouter, @tanstack/react-query, recharts, framer-motion)
- API: Express 5 at `/api` prefix
- DB: PostgreSQL + Drizzle ORM
- Auth: Discord OAuth (manual flow, no passport), express-session
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — all DB table schemas (users, players, gamemodes, tiers, player_ratings, matches, tests, announcements, tier_promotions, sessions)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — generated React Query hooks (from Orval)
- `lib/api-zod/src/generated/` — generated Zod schemas (from Orval)
- `artifacts/api-server/src/routes/` — all Express routes (auth, stats, gamemodes, tiers, players, leaderboard, matches, tests, announcements, admin)
- `artifacts/dark-tiers/src/pages/` — all frontend pages

## Architecture decisions

- Contract-first: OpenAPI spec defines the API, Orval generates typed hooks and Zod validators — never write fetch calls by hand
- ELO calculation: K-factor 32, standard formula. Rating changes on match creation, not separate step
- Leaderboard "All Modes" view: shows each player's best (highest) rating across gamemodes, deduplicated with GROUP BY. Per-gamemode filter shows raw ratings table
- Session store: express-session with in-memory store (sufficient for dev). For production, switch to connect-pg-simple using the sessions table
- Tier promotion tracking: recorded automatically on match creation if winner's tier changes, also on admin tier change

## Product

- **Leaderboard**: ELO rankings per gamemode (Sword, Axe, SMP, Crystal, UHC, DiaPot, NethPot, Mace) with tier badges, Minecraft skin avatars
- **Player Profiles**: per-player stats, per-gamemode ratings, match history, Minecraft skin renders
- **Match System**: create matches, auto-calculates ELO changes, tracks W/L records, triggers tier promotions
- **Tier Tests**: players request tier evaluations; testers review and approve/reject
- **Announcements**: pinned news/updates
- **Admin Dashboard**: user management, match/player/tier CRUD, analytics charts

## Tiers (HT1 = highest, LT5 = lowest)

HT1 (2400+), LT1 (2100–2399), HT2 (1900–2099), LT2 (1700–1899), HT3 (1550–1699), LT3 (1400–1549), HT4 (1250–1399), LT4 (1100–1249), HT5 (1000–1099), LT5 (0–999)

## Discord OAuth Setup

1. Go to https://discord.com/developers/applications
2. Create an application, add OAuth2 redirect: `https://YOUR_DOMAIN/api/auth/discord/callback`
3. Set `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` env vars
4. Login button at `/login` redirects to `/api/auth/discord`

## User preferences

- Dark black/purple esports aesthetic throughout
- No emojis in the UI
- Minecraft skin avatars via mc-heads.net

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`
- Always run `pnpm --filter @workspace/db run push` after editing schema files
- Leaderboard deduplication uses raw SQL with Drizzle's `db.execute(sql\`...\`)` — do NOT use `pg` directly (not in esbuild bundle)
- Tier badges use `tierName`/`tierColor` props (not `name`/`color`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
