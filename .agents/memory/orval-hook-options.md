---
name: Orval hook options typing
description: How to correctly pass partial options to Orval-generated React Query hooks in this project.
---

## Rule
Orval-generated hooks wrap `UseQueryOptions` but `queryKey` is technically required by `@tanstack/react-query`. When passing partial options (e.g. just `enabled`), cast the inner object: `{ query: { enabled: !!id } as any }`.

For string-union params (role, status) that come from user input, the generated types are narrow enums. Cast with `as any` at the call site rather than widening the handler's parameter type.

**Why:** The Orval code-gen produces types that satisfy `@tanstack/react-query`'s internal generics but TypeScript strict mode catches missing `queryKey`. The cast is safe because Orval supplies the key internally.

**How to apply:** Any time you see TS error "Property 'queryKey' is missing in type '{ enabled: boolean }' but required in type 'UseQueryOptions'" — add `as any` to the query options object.
