---
name: Framer-motion ease types
description: How to correctly type transition ease values in framer-motion Variants in this project.
---

## Rule
Do NOT use string ease names (`"easeOut"`, `"easeInOut"`, etc.) directly in variant `transition` objects — they fail strict TypeScript checks (`Type 'string' is not assignable to type 'Easing | Easing[] | undefined'`).

Use a bezier array instead: `ease: [0.25, 0.1, 0.25, 1] as const`

For custom ease functions, declare them as `const` at module scope.

**Why:** framer-motion's `Easing` type is a union of specific string literals, not `string`. TypeScript narrows the inferred type to `string` when it's inline in an object literal.

**How to apply:** Replace all `ease: "easeOut"` / `ease: "easeInOut"` occurrences with `ease: [0.25, 0.1, 0.25, 1] as const`. Define a shared `const EASE = [0.25, 0.1, 0.25, 1] as const` at file top if used multiple times.
