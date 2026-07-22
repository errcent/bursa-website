<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a single Next.js 16 app (see `README.md` for the full stack, routes, and standard scripts in `package.json`). Package manager is **npm**. The update script runs `npm install`, which also runs `postinstall` → `prisma generate`.

### Database (local PostgreSQL, not Neon)
The README targets a cloud Neon Postgres, but in this environment a local **PostgreSQL 16** server is used instead. A `.env` (gitignored) is already present pointing at it: DB `bursa`, user/password `postgres`/`postgres` on `localhost:5432`. The installed server, `.env`, and seeded data persist in the VM snapshot, so you normally do not need to reinstall or reseed.

- Postgres does not auto-start on boot. If connections fail, start it: `sudo pg_ctlcluster 16 main start`.
- Schema/data already applied via `npx prisma migrate deploy` and seeded via `npm run db:seed`. Test accounts (password `password123`): `learner@test.dev`, `mentor@test.dev`, `admin@test.dev`.
- Gotcha: `npm run db:seed` / `db:deploy` run through `tsx`/`prisma` which do NOT auto-load `.env` in the same way `next dev` does. If you hit `Environment variable not found: DATABASE_URL`, export `DATABASE_URL` and `DIRECT_URL` inline before the command. `npm run dev` loads `.env` automatically.

### Run / lint
- Dev server: `npm run dev` (Turbopack, http://localhost:3000). This is the way to run the app; do NOT use `npm run build` for dev because `build` runs `prisma migrate deploy` and needs a live DB.
- Lint: `npm run lint`. Note: the repo currently has pre-existing lint errors unrelated to environment setup.
- There is no automated test suite (no `test` script/framework configured).
