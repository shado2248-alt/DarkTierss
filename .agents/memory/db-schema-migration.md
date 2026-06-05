---
name: DB schema migration
description: How to run Drizzle schema migrations in non-TTY environments
---

# DB Schema Migrations

`pnpm --filter @workspace/db run push` fails in non-TTY shells (CI, bash tools) when there are column conflicts requiring interactive resolution.

**Workaround**: Apply schema changes directly via SQL using `executeSql` in code_execution, then run `push` from a TTY terminal if needed to sync drizzle's snapshot.

**Why:** drizzle-kit push v0.31 prompts for column rename/drop decisions interactively.

**How to apply:** For additive changes (new columns, indexes), direct SQL works fine. For drops/renames, user may need to run `pnpm --filter @workspace/db run push` manually from the Replit shell.
