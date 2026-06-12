# features/

Each subfolder is a **feature module** owning all its UI, logic, and types.

## Structure per feature

```
features/<feature>/
  components/   Presentational UI — pure rendering, no API calls
  hooks/        Business logic + data fetching (use<Feature>.ts)
  types.ts      Types specific to this feature
  api.ts        API call functions for this feature (thin wrappers over lib/api)
```

## Migration status

| Feature | Phase 1 (types + api barrels) | Phase 2 (hooks) | Phase 3 (components) |
|---|---|---|---|
| auth | done 2026-06-11 | pending | pending |
| member | done 2026-06-11 | pending | pending |
| admin | done 2026-06-11 | pending | pending |
| cashier | done 2026-06-11 | pending | pending |
| wallet | done 2026-06-11 | pending | pending |
| genealogy | done 2026-06-11 | pending | pending |
| activation-codes | done 2026-06-11 | pending | pending |
| registration | done 2026-06-11 | pending | pending |

## Rules

- A component in `features/<name>/components/` must NOT import from `pages/`
- A hook in `features/<name>/hooks/` must NOT import from other features directly — use shared `lib/` or `types/`
- Pages import from features; features do NOT import from pages
