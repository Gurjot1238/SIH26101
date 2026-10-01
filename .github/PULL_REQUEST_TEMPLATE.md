## What this changes

<!-- A short description of the change and why it's needed. -->

## Checklist

- [ ] `npm run typecheck` passes
- [ ] `DATABASE_URL='' npm test` passes (plus the focused suite for any subsystem I touched)
- [ ] No secrets committed (`server/.env` stays gitignored; only `server/.env.example` is tracked)
- [ ] No fake/placeholder data paths — features do the real thing or report themselves unavailable
- [ ] Existing working behaviour preserved
