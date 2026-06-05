---
name: DB migration in non-TTY environment
description: How to run schema migrations when drizzle-kit push requires a TTY.
---

## Rule
`pnpm --filter @workspace/db run push` (drizzle-kit push) requires interactive TTY confirmation and fails in non-interactive shells (CI, bash tool, code_execution).

Use the `executeSql` callback in the `code_execution` tool to run raw SQL directly against the database for schema changes.

**Why:** drizzle-kit push prompts the user to confirm destructive changes. Non-TTY environments can't respond to the prompt, so the process hangs or fails.

**How to apply:**
1. Write the migration SQL (ALTER TABLE, ADD COLUMN, etc.)
2. Call `executeSql({ sqlQuery: "ALTER TABLE ..." })` via the code_execution tool
3. Verify with a SELECT query
