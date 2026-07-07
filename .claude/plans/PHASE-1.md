# Phase 1 — App Shell & Navigation (Detailed Technical Plan)

> Parent: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md). Authoritative for Phase 1 only.
> **Method:** TDD (Vitest + RTL). Builds on the Phase 0 foundation (Clerk, Neon, repo seam, Zustand, theme).
> **Rule:** no assumptions — open items live in §11, not in code.
> **STATUS: ✅ COMPLETE** — see the Implementation Review at the bottom.

---

## ✅ Implementation Review (post-build)

**Verification gate (all green):** `pnpm test` → **41 passed** (9 files; +16 new Phase 1 tests) · `pnpm build` → compiled + TypeScript pass, 8 routes · `pnpm lint` (Biome) → clean · dev server → `/` `/dashboard` `/patients` `/visits` `/api/clinics` all 307 → in-app `/sign-in` when unauthenticated.

**What shipped:** `(app)` route group shell (`SidebarProvider` + `AppSidebar` + `TopBar` + `BottomNav`); `/api/clinics` (Clerk-guarded, matches `clinicsRepo` contract); clinic switcher (query → repo → `/api/clinics` → Neon; selection persisted via Zustand, default-to-first); read-only role badge; role-locked `/dashboard`; `/patients` + `/visits` skeleton placeholders; `/` → `/dashboard` redirect; ⌘K search stub.

**Tests added:** `/api/clinics` handler (mocked prisma+auth, 200/401), `resolveClinicId` (default/keep/repair/empty), `nav-items` active detection, `RoleBadge` render, `ClinicSwitcher` render.

**Deviations / decisions:**
1. **RoleSwitcher → RoleBadge** (roles locked to Clerk per user); `toggle-group` deferred to Phase 2.
2. Base-ui `Select.onValueChange` is `(value|null, details)` — wrapped to adapt to `onChange(string)`.
3. Biome: `components/ui/**` excluded from linting (vendored shadcn); `useValidAriaRole` disabled for `*.test.tsx` only (false-positive on `RoleBadge`'s domain `role` prop).
4. Presentational/container split (ClinicSwitcher, hooks) so real logic is unit-tested and framework glue is build/manual-verified.

**DoD:** all automated criteria met. Remaining = manual visual/interactive checks (below), which need an authenticated browser session.

---

## 1. Objective

Build the **consistent app shell** every feature screen lives in: a top bar (brand, search stub, clinic switcher, role badge, user menu), a sidebar (desktop) + bottom nav (mobile), and the three placeholder routes (Dashboard / Patients / Visits) with loading skeletons. Wire the **clinic switch** end-to-end (real `/api/clinics` → repo → TanStack Query → Zustand, persisted) and make the **role-locked** dashboard split real (server reads Clerk role; no client toggle).

**In scope:** shell layout, navigation (desktop sidebar + mobile bottom nav), `/api/clinics`, clinic switcher, role badge + role-locked `/dashboard`, placeholder pages with skeletons, `/` → `/dashboard` redirect.

**Out of scope (later phases):** patient CRUD + list (P2), visits (P3), KPIs/charts (P4), working ⌘K search (P2 — Phase 1 ships only a stub), quick-action buttons that open Register/New-Visit (P2/P3).

---

## 2. Decisions (from user)

1. **Roles are locked to Clerk metadata.** Receptionist → reception view only; doctor → doctor view only. **No role switcher.** Role is shown as a read-only badge. `/dashboard` renders the correct view server-side via `getRole()`.
2. **Clinic switching** is the only context switch. Available to **both** roles (every screen is clinic-scoped). ⟵ *flagged: if reception should be pinned to one clinic, say so and I'll gate it.*
3. **Dark mode deferred** — light only. No `.dark` class is applied; dark tokens stay dormant.
4. Zustand `roleView` becomes a **programmatic mirror** of the Clerk role (hydrated on load for client components), not a user toggle. `currentClinicId` remains the user-switchable, persisted value.

---

## 3. Diagrams (Phase 1)

**Desktop shell**
```
┌───────────────────────────────────────────────────────────────────────────┐
│ [≡] ▣ ClinicOS   [ 🔍 Search…  ⌘K ]        [Clinic 1 ▾]  «Reception»   (👤) │  ← TopBar
├───────────────┬───────────────────────────────────────────────────────────┤
│ ▚ Dashboard   │                                                           │
│ ☺ Patients    │      ‹ route content — placeholder + skeletons ›          │
│ ⧗ Visits      │                                                           │
└───────────────┴───────────────────────────────────────────────────────────┘
   Sidebar (collapsible)          «Reception»/«Doctor» = read-only role badge
```

**Mobile (≤ md)**
```
┌────────────────────┐
│ ▣ ClinicOS      👤 │  TopBar (compact)
│ [ 🔍 Search…  ⌘K ] │
│ [Clinic 1 ▾]       │
├────────────────────┤
│   ‹ content ›      │
│   skeletons        │
├────────────────────┤
│  ▚      ☺      ⧗   │  ← BottomNav (Dashboard · Patients · Visits)
└────────────────────┘
```

**Clinic-switch data flow**
```
ClinicSwitcher (shadcn Select)
   │ onChange(clinicId)
   ▼
useUIStore.setClinic(clinicId) ──► persisted to localStorage ("clinic-ui")
   ▲ options                                   │ currentClinicId
   │                                           ▼
useClinics() = useQuery(["clinics"]) ─► clinicsRepo.list() ─► GET /api/clinics ─► Prisma ─► Neon
   (first load with no saved clinic → default to clinics[0])
```

**Role-locked routing (no client toggle)**
```
GET /            ─► redirect ─► /dashboard
GET /dashboard   ─► (server) getRole()  ┬─ "receptionist" ─► <ReceptionDashboard/>  (placeholder)
                                        └─ "doctor"       ─► <DoctorDashboard/>     (placeholder)
                                        └─ null           ─► <RoleUnset/> (guidance to set role)
```

---

## 4. Routing & file structure

Move the app screens under an authenticated **route group** `(app)` that renders the shell; keep `sign-in`/`sign-up` outside it.

```
app/
  (app)/
    layout.tsx              # SHELL: SidebarProvider + AppSidebar + TopBar + BottomNav + <main>
    dashboard/page.tsx      # server; role-split placeholder
    patients/page.tsx       # placeholder + table skeleton
    visits/page.tsx         # placeholder + table skeleton
  api/
    clinics/route.ts        # GET → { clinics: ClinicDTO[] }
  page.tsx                  # redirect() → /dashboard
  layout.tsx                # unchanged (ClerkProvider + Providers + fonts)
  sign-in, sign-up          # unchanged

components/
  shell/
    app-sidebar.tsx         # client; shadcn Sidebar + nav items
    top-bar.tsx             # client; brand + SearchButton + ClinicSwitcherContainer + RoleBadge + UserButton
    bottom-nav.tsx          # client; mobile nav (md:hidden)
    nav-items.ts            # shared nav config (label, href, icon)
    clinic-switcher.tsx     # PRESENTATIONAL: { clinics, value, onChange }
    clinic-switcher-container.tsx  # client: useClinics + useUIStore → ClinicSwitcher
    role-badge.tsx          # PRESENTATIONAL: { role }
    search-button.tsx       # opens Command dialog stub (⌘K)
  ui/                       # shadcn adds (below)

lib/
  data/clinics.ts           # (exists) clinicsRepo.list()
  hooks/use-clinics.ts      # useQuery(["clinics"], clinicsRepo.list)
  hooks/use-current-clinic.ts  # selected clinic + default-to-first logic
```

**shadcn components to add:**
`pnpm dlx shadcn@latest add sidebar select dropdown-menu tooltip separator skeleton command dialog button badge` then `pnpm format`.
(`toggle-group` dropped — no role toggle. `UserButton` comes from Clerk.)

---

## 5. `/api/clinics` route

```ts
// app/api/clinics/route.ts
export async function GET() {
  const { userId } = await auth();          // Clerk; 401 if unauthenticated
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const clinics = await prisma.clinic.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true },
  });
  return Response.json({ clinics });          // { clinics: ClinicDTO[] }
}
```
- Matches the `clinicsRepo.list()` contract set in Phase 0 (`{ clinics }`).
- Protected (middleware already covers `/api/*`, plus explicit `userId` guard).

---

## 6. Shell behavior

- **AppSidebar** (shadcn `Sidebar`, `collapsible="icon"`): nav = Dashboard/Patients/Visits from `nav-items.ts`; active item via `usePathname()`. Hidden below `md`; `SidebarTrigger` (≡) in the top bar toggles collapse on desktop and opens the off-canvas sheet the component provides. To avoid duplicate mobile UI, mobile primary nav = **BottomNav**; the sidebar's mobile sheet is left disabled/unused.
- **TopBar** (client): brand, `SearchButton` (⌘K stub), `ClinicSwitcherContainer`, `RoleBadge` (role passed from the server layout), Clerk `<UserButton>`. Sticky top.
- **BottomNav** (client, `md:hidden`): same three nav items, large touch targets (≥44px), active highlight.
- **Role badge**: the shell `layout.tsx` is a server component → reads `getRole()` → passes `role` into `TopBar`. Client components never fetch role.
- **Clinic switcher**: `useClinics()` for options; `useUIStore` for value/set; on first load with no persisted `currentClinicId`, effect sets it to `clinics[0].id`.
- **Search stub**: ⌘K / click opens a `Command` inside `Dialog` showing an empty state ("Patient search arrives in Phase 2"). No query yet.

---

## 7. Placeholder pages (with skeletons)

- `/dashboard` (server): `getRole()` → heading "Reception"/"Doctor"; body = a row of `Skeleton` KPI cards + a `Skeleton` list. `null` role → an `Alert`/`Empty` explaining role isn't set (shouldn't happen for seeded users).
- `/patients` (server): title + `Skeleton` table rows.
- `/visits` (server): title + `Skeleton` list.
- These prove the shell + routing + role split; real content lands P2–P4.

---

## 8. TDD plan (Vitest + RTL) — tests first, red → green

1. **`app/api/clinics/route.test.ts`** — mock `~/lib/prisma` (`clinic.findMany`) and `@clerk/nextjs/server` (`auth`): (a) returns `{ clinics }` shape sorted by name; (b) 401 when `userId` is null.
2. **`components/shell/clinic-switcher.test.tsx`** — presentational: renders an option per clinic; selecting a value calls `onChange` with the clinic id; shows the current value.
3. **`components/shell/role-badge.test.tsx`** — renders "Reception" for `receptionist`, "Doctor" for `doctor`, nothing/neutral for `null`.
4. **`lib/hooks/use-current-clinic.test.ts`** — with an empty store + a clinics list, defaults to `clinics[0].id`; with a persisted id, keeps it; ignores a persisted id that's no longer in the list (re-defaults).
5. **`components/shell/nav-items.test.ts`** (or nav render test) — the three items have correct hrefs; active detection matches a pathname.

Containers (`clinic-switcher-container`, `top-bar`, `app-sidebar`, route pages) are thin wiring → verified by `pnpm build` + manual, not unit-tested (keeps tests focused on logic, not framework glue). RTL for the presentational pieces above.

---

## 9. Build order

1. `shadcn add …` + `pnpm format`.
2. `/api/clinics` route (write test → implement).
3. `use-clinics` + `use-current-clinic` hooks (test the logic hook).
4. `ClinicSwitcher` (presentational, test) → `ClinicSwitcherContainer` (wire query + store).
5. `RoleBadge` (test), `nav-items`, `AppSidebar`, `BottomNav`, `SearchButton` (stub), `TopBar`.
6. `(app)/layout.tsx` shell; move/create `dashboard`/`patients`/`visits` pages; `/` redirect.
7. `pnpm test` + `pnpm build` + `pnpm lint`; responsive check.

---

## 10. Exit criteria (Phase 1 DoD)

- [ ] `pnpm test` green (new Phase 1 tests + Phase 0's still pass); `pnpm build` + `pnpm lint` clean.
- [ ] Signed-in user sees the shell on every route; role badge matches their Clerk role.
- [ ] `/` redirects to `/dashboard`; `/dashboard` shows the **role-correct** placeholder (reception vs doctor) with no toggle.
- [ ] Clinic switcher lists both clinics from Neon, switches, and **persists across reload**.
- [ ] Sidebar (desktop) + bottom nav (mobile) navigate between the 3 routes; active state correct; responsive at mobile width.
- [ ] Search opens a stub; no dead links; no console errors.

---

## 11. Open questions / things I will NOT assume

1. **Reception + clinic switching** — OK that receptionists can also switch clinics (Decision #2), or should reception be pinned to a single clinic? Default: both can switch.
2. **Brand name** — using "ClinicOS" as the app name in the shell. Want a different name/logo?
3. **Sidebar quick action** — the "+ New" button in the sidebar wireframe: defer to Phase 2 (when Register/New-Visit modals exist), or add a disabled placeholder now? Default: defer (no dead button).

---

## 12. Where YOU test manually

- Sign in as **reception** → confirm only the reception placeholder shows and the badge says Reception; repeat as **doctor**.
- Switch clinics in the top bar, reload → selection persists.
- Resize to mobile → bottom nav appears, sidebar hides, nav still works.
