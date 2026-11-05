# AGENTS.md

## Repo layout

Two independent npm packages. There is **no root package.json** (the root `package-lock.json` is an empty leftover) — `npm install` / `npm run dev` at the repo root do nothing, despite what the README claims. Install and run each package separately:

```bash
npm install --prefix backend
npm install --prefix frontend
npm run dev --prefix backend    # node --watch server.js, port 3000 (env PORT)
npm run dev --prefix frontend   # Vite dev server, http://localhost:5173
```

## Architecture (read before touching data code)

- The frontend talks to Supabase (Postgrest + Auth) **directly** for almost all CRUD, via `frontend/src/services/api/*.js` and React Query hooks in `frontend/src/hooks/`. The Express backend (`/api/v1`) only handles privileged/file operations: staff account creation, service template RPCs, Backblaze B2 document upload/download/delete, payment proofs.
- The Supabase schema/migrations are **not in this repo**. Table names, RPC functions, and RLS policies live in a separate Supabase project; verify against the live schema, and don't assume code changes alone are deployable.
- File bytes go to Backblaze B2, **not** Supabase Storage. Uploads are held in Multer `memoryStorage`, capped at 15 MB, MIME allowlist in `backend/config/allowedFileTypes.js`.
- Auth is Supabase PKCE. Backend routes validate `Bearer` tokens via `supabaseAdmin.auth.getUser(token)` and resolve roles from the `user_roles` table (`authUser` + `requireRole` middlewares). Frontend role state lives in the Zustand `authStore`, populated by `setUserRole` in `frontend/src/services/api/userAPI.js`.

## Commands

- Lint (frontend only): `npm run lint --prefix frontend`. There is no typecheck (plain JS, no TS).
- Backend tests are **non-functional**: `backend/package.json`'s test script is the npm stub, and `backend/test/*.js` are stale scratch scripts importing a deleted `authService.js`. Don't run or "fix" them; if you add real backend tests, wire up a runner.
- Playwright e2e: `npm run test --prefix frontend`. Auto-starts Vite on `127.0.0.1:5173` (chromium/firefox/webkit projects). Specs in `frontend/tests/` are stubs with empty credentials — they will not pass as-is.
- No CI workflows, no pre-commit hooks. `lint` is the only automated check before submitting frontend changes.

## Environment

- `frontend/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`. Missing `VITE_API_BASE_URL` throws at startup (`src/config/api.js`).
- `backend/.env`: `PORT`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, B2 credentials, `FRONTEND_URL` (comma-separated CORS allowlist; requests without an `Origin` header are allowed).
- `.env` files are gitignored at the root — never commit them.

## Frontend conventions

- Path alias `@/` → `frontend/src` (configured in both `vite.config.js` and `jsconfig.json`).
- UI: shadcn-style components on Base UI + Tailwind v4 in `src/components/ui`; `components.json` style is `base-nova` (not classic Radix shadcn).
- React Query keys are centralized in `src/config/queryKeys.js` — always reuse those helpers, never ad-hoc key arrays.
- API modules map snake_case DB rows to camelCase UI shapes via `map*Row` helpers; follow that pattern for new endpoints.
- Roles are `client`, `admin`, `staff`, `billing_officer`, defined in `src/config/roles.js`. Route gating is per-role via `<ProtectedRoutes allow={[...]}>` in `src/routes/Routes.jsx` — new pages must be added under the correct role tree there.
- Prettier config exists (`frontend/.prettierrc`: single quotes, semicolons, es5 trailing commas) but there is no format script — match it manually.

## Backend conventions

- ESM only (`"type": "module"`), Express 5.
- Routers in `backend/routes/` are mounted under `/api/v1/...` in `server.js` — register new routers there.
- `GET /health` is the deploy health check; `server.set('trust proxy', 1)` is required behind Railway.

## Git

- Active development happens on the local `test` branch; `origin/main` is the default remote branch. The README lags the code — trust the code.
