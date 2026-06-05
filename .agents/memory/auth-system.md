---
name: Auth system
description: How authentication works after Discord OAuth removal
---

# Auth System (Email + Password)

**Routes**: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout

**Register flow**: email + password + minecraftUsername → hash with bcrypt(12) → fetch Mojang UUID (`api.mojang.com/users/profiles/minecraft/{username}`) → create user → auto-create player with userId link. Falls back to `crypto.randomUUID()` if Mojang lookup fails.

**Login flow**: email → find user by email → bcrypt.compare → set session.userId

**Why:** Replaced Discord OAuth per user request. No passport, no OAuth. Manual sessions only.

**How to apply:** Add bcryptjs to api-server. Auth routes are in `artifacts/api-server/src/routes/auth.ts`. Admin formatUser no longer returns discordId.
