# Phase 0 — Foundation & Infrastructure (Detailed Technical Plan)

> Parent: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md). This plan is authoritative for Phase 0 only.
> **Method:** TDD (Vitest + RTL). Real Clerk + Neon set up now, seeded from `/utils/constant.ts`.
> **Rule:** no assumptions — anything unverified is listed in §12 (Open questions) instead of guessed.
> **STATUS: ✅ COMPLETE** — see the Implementation Review at the bottom.

---

## ✅ Implementation Review (post-build)

**Verification gate (all green):** `pnpm test` → 25 passed (4 files) · `pnpm build` → compiled + TypeScript pass · `pnpm lint` (Biome) → clean · Neon fresh query → `{clinics:2, patients:100, visits:500, visitsToday:4}` · Clerk → 2 users created with roles · dev server → `/sign-in` HTTP 200, protected `/` → 307 redirect to Clerk.

**Deviations from the original plan (reality > assumptions):**
1. **Prisma 7** (not the plan's `prisma-client-js`): generator is `prisma-client` → `lib/generated/prisma`; Query Compiler is enabled so the **Neon driver adapter is mandatory**; env is loaded via `prisma.config.ts` (`dotenv` → `.env.local`, since Prisma doesn't read `.env.local`). Types re-exported from `…/prisma/client` (not `/models`).
2. **`middleware.ts` → `proxy.ts`** — Next 16 deprecated the middleware convention; renamed (1:1). Clerk `clerkMiddleware` runs unchanged.
3. **Seed emails** use `@clinicos.app` (Clerk rejects the invalid `.demo` TLD).
4. **`z.enum(EnumObject)`** used so seed types keep literal unions and match Prisma enum types.
5. Added `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`SIGN_UP_URL` so Clerk uses the in-app `/sign-in` pages, not the hosted portal.
6. No blocking peer-dep conflicts (decision #6 not triggered) — Clerk 7.5 / testing libs resolved cleanly on React 19 / Next 16.

**DoD:** all automated criteria met. Remaining = the user's manual browser sign-in (interactive; can't be automated) and enabling the Google connection in the Clerk dashboard if Google login is wanted.

---

## 0. Verified current repo state (do not re-scaffold)

| Fact | Value |
|------|-------|
| Framework | Next.js **16.2.10** (App Router), React **19.2.4** |
| Language | TypeScript strict; alias **`~/*` → project root**; **no `src/`** |
| Styling | Tailwind CSS **v4** (`@tailwindcss/postcss`), `app/globals.css` |
| Tooling | **pnpm** (`pnpm-lock.yaml`), **Biome** 2.2 (`biome.json`) for lint+format |
| App dir | `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `favicon.ico` |
| Git | Initialized, 1 commit (`Initial commit from Create Next App`) |
| Env | `.env*` is gitignored ✅ |

**Implications:** use `pnpm add` / `pnpm dlx`; import with `~/…`; run `pnpm format` (Biome) after any generated/added code; components → `~/components`, libs → `~/lib`, stores → `~/stores`, seed → `~/utils/constant.ts`.

---

## 1. Objective

Stand up every foundation the feature phases build on — with **real** Clerk auth and a **real** Neon database seeded from typed constants — but **no feature UI yet** (shell = Phase 1). At the end of Phase 0: the app boots, a seeded user can sign in, the DB holds seeded clinics/patients/visits, providers + the Zustand UI store + the data-access seam + the Vitest harness all exist and are green.

**Out of scope for Phase 0:** app shell/sidebar, dashboards, patient/visit CRUD UI, KPIs, charts (Phases 1–4); Playwright E2E (deferred — Vitest+RTL only for now).

---

## 1·A. Diagrams (Phase 0)

**System architecture**
```
┌────────────────────────────────────────────────────────────┐
│                        Browser (client)                     │
│  Next.js App Router UI  ·  Zustand UI store (localStorage)  │
│  TanStack Query cache   ·  Clerk React (<ClerkProvider>)    │
└──────────────┬──────────────────────────────┬──────────────┘
               │ repo seam (lib/data/*)        │ Clerk JS
               ▼                               ▼
┌──────────────────────────────┐     ┌────────────────────────┐
│  Next.js server               │     │       Clerk (SaaS)      │
│  route handlers /api/*  (P1+) │     │  users · sessions ·     │
│  Prisma Client (lib/prisma)   │     │  publicMetadata.role    │
└──────────────┬────────────────┘     └────────────────────────┘
               │ @prisma/adapter-neon
               ▼
       ┌────────────────────┐
       │    Neon Postgres    │   ◄── seeded by prisma/seed.ts
       │ Clinic·Patient·Visit│        + scripts/seed-clerk.ts
       └────────────────────┘             ▲
                                          │ source of truth
                                  utils/constant.ts
```

**Data model (ERD)**
```
┌────────────┐ 1     * ┌──────────────────┐ 1     * ┌────────────┐
│   Clinic   │─────────│     Patient      │─────────│   Visit    │
├────────────┤ first   ├──────────────────┤         ├────────────┤
│ id (PK)    │ clinic  │ id (PK)          │         │ id (PK)    │
│ name       │◄────────│ firstClinicId FK │◄────────│ patientId  │
│ address    │         │ dob / ageYears   │  clinic │ clinicId FK│
│ createdAt  │◄────────│ gender · phone   │◄────────│ type       │
└────────────┘ clinicId│ address          │(Visit)  │ reason     │
                       │ medicalHistory   │         │ notes      │
                       │ allergies        │         │ visitedAt  │
                       │ bloodGroup       │         └────────────┘
                       └──────────────────┘
```

**Auth / sign-in flow**
```
 visitor ──GET /dashboard (protected)──► middleware.ts (clerkMiddleware)
                                              │
                            authed? ──no──► redirect /sign-in ──► <SignIn/>
                                              │                     │ email+password
                                              │                     │   or Google
                                              │                     ▼
                                              │             Clerk verifies →
                                              │             session (role in metadata)
                            authed? ──yes────────────────► app renders (role-aware, P1+)
```

**Seed pipeline**
```
utils/constant.ts ──► prisma/seed.ts ─────► Neon (100 patients / 500 visits / 2 clinics)
 (typed dataset)  └──► scripts/seed-clerk.ts ─► Clerk (receptionist + doctor, role metadata)
```

---

## 2. Deliverables checklist

- [ ] Dependencies installed (§3)
- [ ] shadcn/ui initialized (`base-nova`) + clinic theme tokens in `app/globals.css` (§4)
- [ ] Prisma schema + Neon client singleton + `db push` applied (§5)
- [ ] `~/utils/constant.ts` typed seed dataset + Zod schemas (§6)
- [ ] `prisma/seed.ts` (Neon) + `scripts/seed-clerk.ts` (Clerk users) (§6)
- [ ] Clerk wired: `ClerkProvider`, `middleware.ts`, sign-in/up routes (§7)
- [ ] Providers (`QueryClientProvider`) + Zustand UI store (persisted) (§8)
- [ ] Data-access seam `~/lib/data/*` (interfaces + types) (§9)
- [ ] Vitest + RTL configured; sample tests green; `pnpm test` script (§10)
- [ ] `pnpm build`, `pnpm lint`, `pnpm test` all pass (§14)

---

## 3. Dependencies (exact, pnpm)

**Runtime**
```
pnpm add @clerk/nextjs @prisma/client @prisma/adapter-neon @neondatabase/serverless \
         zustand @tanstack/react-query zod date-fns react-hook-form @hookform/resolvers
```
- `framer-motion`, `lucide-react`, `sonner`, and Recharts arrive via shadcn add steps in later phases — **not** installed in Phase 0 (Phase 0 has no animated/charted UI). `lucide-react` will be pulled by `shadcn init`.

**Dev**
```
pnpm add -D prisma tsx vitest @vitejs/plugin-react jsdom \
            @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
```
- `tsx` runs the TS seed scripts. `@types/*` already present.

**shadcn init** (separate, interactive-safe with preset)
```
pnpm dlx shadcn@latest init --preset base-nova
```

> Exact versions are resolved at install time and then pinned in `pnpm-lock.yaml`. I will report any peer-dependency conflict with React 19 / Next 16 (esp. Clerk + testing libs) rather than force-resolve silently — see §12.

---

## 4. shadcn init + clinic theme

1. `pnpm dlx shadcn@latest init --preset base-nova` → writes `components.json` (style `nova`, base primitive, lucide, alias **`~/`**, Tailwind v4), `~/lib/utils.ts` (`cn()`), and rewrites `app/globals.css` with the token layer.
2. Overlay the clinic brand tokens **in `app/globals.css` only** (from `IMPLEMENTATION.md` §2·A): teal `--primary` (light+dark), `--ring`, `--radius: 0.65rem`. Leave neutral scale as generated.
3. Fonts: keep the scaffold's font wiring; ensure `--font-sans` is bound. (Default create-next-app ships Geist; confirm during impl — if absent, add via `next/font`.)
4. Add **only** what Phase 0 needs from shadcn: **nothing renders yet**, so we add `sonner` + `button` lazily in Phase 1. Phase 0 stops at init + theme. *(No component `add` in Phase 0.)*
5. Run `pnpm format` so Biome reconciles the generated files.

---

## 5. Data model — Prisma + Neon

1. `pnpm dlx prisma init --datasource-provider postgresql` (creates `prisma/schema.prisma`, `.env` stub).
2. Replace schema with the model from `IMPLEMENTATION.md` §4 (`Clinic`, `Patient`, `Visit`, enums `Gender`/`BloodGroup`/`VisitType`), generator `prisma-client-js`.
3. **Neon client singleton** at `~/lib/prisma.ts` (name per `IMPLEMENTATION.md` §7) using `@prisma/adapter-neon` + `@neondatabase/serverless` (pooled connection), guarded against hot-reload duplication (`globalThis.prisma`).
4. `~/lib/types.ts` re-exports Prisma model types (`Patient`, `Visit`, `Clinic`) as the shared app types so constants + repos + UI all reference one source.
5. Apply schema: `pnpm dlx prisma db push` (MVP uses `db push`, not migrations — noted as a deliberate simplification; can switch to `migrate` later).
6. `pnpm dlx prisma generate` (postinstall-safe).

---

## 6. Seed data — `~/utils/constant.ts` + seed scripts

**`~/utils/constant.ts`** — the single typed dataset:
- `CLINICS` — exactly 2 (Clinic 1, Clinic 2) with stable ids.
- `PATIENTS` — **100 patients** split across both clinics (each with `firstClinicId`, DOB or `ageYears`, gender, contact, optional history/allergies/blood group). Generated deterministically from name/attribute pools (no `Math.random` in shared modules — seeded PRNG or index-based).
- `VISITS` — **500 visits** spread across **today / this week / this month / older** so KPIs render; mix of NEW vs FOLLOW_UP; a good share of patients with ≥2 visits (returning).
- `SEED_USERS` — 2 Clerk users: one `receptionist`, one `doctor` (email + fixed demo password + `publicMetadata.role`; passwords reported back to you after seeding).
- All arrays typed against `~/lib/types.ts`. **Dates are relative-safe** (computed from a single base date passed in, since we avoid nondeterministic `Date.now()` in shared modules — see impl note).

**Zod schemas** `~/utils/constant.schema.ts` — validate each array's shape; used both by a unit test (constants conform) and reused later by API validation.

**`prisma/seed.ts`** (run via `tsx`, wired to `prisma db seed`): idempotent upsert of `CLINICS`, `PATIENTS`, `VISITS` into Neon.

**`scripts/seed-clerk.ts`**: uses the Clerk Backend SDK (`@clerk/backend` or `clerkClient`) to create/find `SEED_USERS` and set `publicMetadata.role`. Requires `CLERK_SECRET_KEY`.

> This is the "mock data" you authorized — it lives in `~/utils/constant.ts`, is API/Prisma-shaped, and seeds the **real** services. No inline fake data anywhere else.

---

## 7. Clerk auth wiring

*(Consult the `clerk-setup` / `clerk-nextjs-patterns` skills during implementation to confirm Next 16 specifics.)*
1. `<ClerkProvider>` wraps `app/layout.tsx`.
2. `middleware.ts` at root: `clerkMiddleware()` from `@clerk/nextjs/server`; protect everything except `/sign-in`, `/sign-up`, and static assets, with the standard matcher.
3. Routes: `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` (Clerk `<SignIn/>`/`<SignUp/>`).
4. Env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (+ optional `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `…SIGN_UP_URL=/sign-up`).
   **Sign-in methods:** email + password **and** Google OAuth (enable the Google social connection in the Clerk dashboard — I'll flag exactly where when we get there).
5. Role read helper `~/lib/auth.ts`: `getRole()` from `auth().sessionClaims.publicMetadata.role`, defaulting sensibly. (In-app role *view* switch is Zustand; the *authoritative* role is Clerk metadata.)

---

## 8. Providers + Zustand UI store

1. `~/app/providers.tsx` (`"use client"`): `QueryClientProvider` with a `QueryClient` from `~/lib/query.ts`. Mounted inside `ClerkProvider` in `layout.tsx`.
2. `~/stores/ui-store.ts` — Zustand + `persist` (localStorage, key `clinic-ui`):
   - state: `currentClinicId: string | null`, `roleView: 'receptionist' | 'doctor' | null`
   - actions: `setClinic(id)`, `setRoleView(role)`, `reset()`
   - persistence: only `currentClinicId` + `roleView` persisted; hydration-safe for SSR (guard against hydration mismatch).

---

## 9. Data-access seam `~/lib/data/*`

Establish the interface layer so feature phases never talk to `fetch`/Prisma directly:
- `~/lib/data/types.ts` — DTOs + query params (list/search/create/update shapes), derived from `~/lib/types.ts`.
- `~/lib/data/clinics.ts`, `patients.ts`, `visits.ts`, `metrics.ts` — exported repo objects with typed method **signatures**; Phase 0 implements only `clinicsRepo.list()` (calls `/api/clinics`, added in Phase 1) as the reference pattern, others are typed stubs `throw new Error('not implemented — Phase N')`.
- Rationale: satisfies "migrating to real APIs doesn't change components" — components import repos, repo internals swap freely.

> Note: `/api/clinics` route itself is Phase 1 work; Phase 0 only defines the seam + types.

---

## 10. Testing setup (Vitest + RTL) — TDD harness

1. `vitest.config.ts`: `@vitejs/plugin-react`, `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./vitest.setup.ts']`, alias `~` → project root (mirror tsconfig).
2. `vitest.setup.ts`: `import '@testing-library/jest-dom/vitest'`; localStorage/matchMedia mocks as needed.
3. `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.
4. **Phase 0 tests (written first, red → green):**
   - `utils/constant.test.ts` — every seed array parses against its Zod schema; invariants: exactly 2 clinics, ≥1 returning patient (≥2 visits), ≥1 visit today.
   - `stores/ui-store.test.ts` — `setClinic`/`setRoleView` update state; persistence writes to localStorage; `reset()` clears.
   - `lib/data/clinics.test.ts` — `clinicsRepo.list()` calls the right URL (fetch mocked) and maps the response to `Clinic[]`.
   - `smoke.test.tsx` — a trivial RTL render to prove the harness (removed once real component tests exist).

---

## 11. TDD execution order (red/green per unit)

1. Harness first: add Vitest config + `smoke.test.tsx` → run → green. (proves tooling)
2. Types + `~/lib/types.ts` (from Prisma generate).
3. Write `constant.schema.ts` + **failing** `constant.test.ts` → author `constant.ts` until green.
4. Write **failing** `ui-store.test.ts` → implement `ui-store.ts` → green.
5. Write **failing** `clinics.test.ts` → implement `clinicsRepo.list()` + seam types → green.
6. Infra (not unit-tested, verified manually/build): Prisma client, Neon push, Clerk wiring, providers, seed scripts.
7. Run seeds → `pnpm build` → `pnpm lint` → `pnpm test`.

---

## 12. Decisions (resolved ✅)

1. **Neon** — project already created; user provides the pooled `DATABASE_URL` (+ direct URL if available).
2. **Clerk** — existing account. Sign-in via **email + password AND Google OAuth**. Both must let seeded users in.
3. **Seed users** — fixed demo passwords set by me, **reported back** to the user after seeding.
4. **Seed volume** — **100 patients, 500 visits.**
5. **Schema apply** — `prisma db push` (no migration history) for the MVP. ✅
6. **Peer-deps** — if Clerk/testing libs don't cleanly support React 19 / Next 16, **STOP and report to the user with suggestions before installing anything.** ✅ (No silent version pinning.)

---

## 13. Env variables required (I will ask for values at implement time, not before)

| Var | Purpose | When |
|-----|---------|------|
| `DATABASE_URL` | Neon pooled connection | Prisma client + `db push` + seed |
| `DIRECT_URL` (optional) | Neon direct (for push/migrate) | schema apply |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend | ClerkProvider |
| `CLERK_SECRET_KEY` | Clerk backend | middleware + `scripts/seed-clerk.ts` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `…SIGN_UP_URL` (optional) | route hints | Clerk config |

Stored in `.env.local` (gitignored). I will never commit or echo secret values.

---

## 14. Exit criteria (Phase 0 Definition of Done)

- [ ] `pnpm test` — all Phase 0 unit tests green.
- [ ] `pnpm build` succeeds; `pnpm lint` (Biome) clean.
- [ ] `pnpm dlx prisma db push` applied; `prisma/seed.ts` populated Neon (verified via `prisma studio` or a count query).
- [ ] `scripts/seed-clerk.ts` created the 2 role users in Clerk.
- [ ] App boots (`pnpm dev`); visiting a protected route redirects to `/sign-in`; a seeded user can sign in and reach `/` (blank/placeholder is fine — shell is Phase 1).
- [ ] Zustand store persists selected clinic/role across reload.
- [ ] No feature UI added, no scope creep.

---

## 15. Where YOU need to test manually (I'll prompt you)

1. **Neon:** confirm rows exist (I'll share a `prisma studio` link/command or a count output).
2. **Clerk sign-in:** log in with a seeded user in the browser — confirm you land on `/` and the session carries the right role. (I can't complete an interactive browser login for you.)
3. Provide the env values in §13 when I ask.

---

*On your approval of this plan (and answers to §12), I'll request the §13 env values and begin implementation in the §11 order.*
