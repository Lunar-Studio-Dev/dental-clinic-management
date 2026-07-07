# Clinic Management System — Implementation Plan

> **Product:** A simple, fast, modern Clinic Management System (MVP).
> **NOT** a Hospital Management System or ERP. Every screen answers one primary question.
> **North star:** A receptionist or doctor learns the app in minutes; most daily tasks done in **2–3 clicks**.

---

## 1. Decisions (locked)

| Area | Choice | Notes |
|------|--------|-------|
| **Platform** | Next.js 15 (App Router), web, responsive | Reception desk (laptop) + doctor (tablet/mobile browser) |
| **Language** | TypeScript (strict) | |
| **Database** | Neon (serverless Postgres) | |
| **ORM** | Prisma | `@prisma/adapter-neon` for edge-friendly serverless driver |
| **Auth** | Clerk | Roles via `publicMetadata.role` = `receptionist` \| `doctor` |
| **Role model** | One app, in-app role switch | Same login, dashboard swaps by role; doctor can also switch clinics |
| **Data layer** | TanStack Query + Next.js Route Handlers (`/api/*`) | Optimistic updates for modal/drawer CRUD |
| **UI library** | **shadcn/ui** (owns all UI) | Preset `base-nova`; components live as source in `components/ui/` |
| **UI primitive** | **base** (Base UI) | Custom triggers use the `render` prop (not `asChild`) — see §7 |
| **Style / theme** | `nova` style, custom clinic theme | Semantic tokens only (`bg-primary`, `text-muted-foreground`) |
| **Styling** | Tailwind CSS v4 (`@theme inline`) | Theme vars in the single global CSS file; no `dark:` color overrides |
| **Charts** | shadcn **`Chart`** (wraps Recharts) | `ChartContainer`/`ChartConfig`/`ChartTooltip` — never raw Recharts |
| **Forms** | shadcn **`Field`**/`FieldGroup` + react-hook-form + Zod | Shared Zod schemas validate client **and** API |
| **Animation** | Framer Motion (motion) | Only for content transitions; overlays animate via shadcn Sheet/Dialog |
| **Icons** | **lucide-react** | In buttons use `data-icon`; no size classes on icons inside components |
| **Toasts** | **sonner** (`toast()`) | shadcn's toast; no custom notification markup |
| **Dates** | date-fns | KPI windows (today/week/month) |

**Deliberately excluded (out of scope for MVP):** billing/invoicing, inventory, pharmacy, lab modules, appointment scheduling calendars, staff/HR, insurance, prescriptions engine, reporting/BI exports, notifications. Keep the surface small.

---

## 2. Design principles (enforced during build)

1. **One question per screen.** Dashboard = "what's happening today?" Patient profile = "who is this person + their history?"
2. **Drawers & modals over new pages.** Register/Edit patient, New Visit, Add Note = right-side drawer or centered modal. Never route away from context.
3. **≤ 3 clicks** for every daily action. Global search + quick-action buttons are always reachable.
4. **Touch-friendly.** Min 44px targets, generous spacing, large tap zones.
5. **Consistent shell.** One top bar (search + clinic switcher + role + user), one thin sidebar (or bottom nav on mobile). No deep menus.
6. **Fast.** Server Components for initial paint; TanStack Query for interactivity; skeleton loaders; optimistic mutations.
7. **Accessible.** Semantic HTML, focus traps in drawers/modals, keyboard nav, ARIA labels, WCAG AA contrast, `prefers-reduced-motion`.

Reference the `modern-web-design` and `motion-framer` skills in `.claude/skills/` while building UI. **All UI is shadcn/ui** — see §2·A before writing any markup.

---

## 2·A. shadcn/ui design system & clinic theme

The entire UI is built from **shadcn/ui** components (added as source into `components/ui/`). We do not hand-roll styled markup where a component exists.

### Setup & config
- **Init once:** `npx shadcn@latest init --preset base-nova` → writes `components.json` (`style: nova`, `base` primitive, `iconLibrary: lucide`, alias `~/`, TS, Tailwind v4).
- Add components per phase with `npx shadcn@latest add <name>` (see roadmap). Before adding, check `components.json` / `components/ui/` so we never re-add.
- After adding any community/registry block, **read the file** and fix imports/icons/composition to match this project (lucide, `@/` alias).

### Clinic theme (customize the generated tokens)
Edit **only** the global CSS file the init creates (Tailwind v4 `@theme inline` + `:root`/`.dark` oklch vars) — never a new CSS file, never `dark:` color classes. Override the brand tokens to a calm, trustworthy medical palette; leave shadcn's neutral scale intact:

```css
/* globals.css — override brand tokens only (values are oklch) */
:root {
  --primary:            oklch(0.55 0.10 195);   /* calm medical teal */
  --primary-foreground: oklch(0.99 0 0);
  --ring:               oklch(0.55 0.10 195);
  --radius:             0.65rem;                 /* soft, modern (Linear-ish) */
  /* accent/secondary/muted kept from nova neutral scale */
}
.dark {
  --primary:            oklch(0.68 0.11 195);
  --primary-foreground: oklch(0.18 0.02 200);
  --ring:               oklch(0.68 0.11 195);
}
```
- **Font:** Geist (or Inter) via `next/font`, wired to `--font-sans`.
- **Charts:** define `--chart-1..5` as tints of the teal primary + one warm accent, consumed through `ChartConfig` — never hard-coded colors.
- **Dark mode:** ships free via tokens; add a theme toggle only if asked (not MVP-critical).

### Composition rules (enforced — from the shadcn skill)
- **Forms:** `FieldGroup` + `Field` + `FieldLabel`/`FieldDescription`; validation via `data-invalid` on `Field` + `aria-invalid` on the control. Never `div` + `space-y`. Search-with-button uses `InputGroup` + `InputGroupAddon`. Gender/blood-group/visit-type (small option sets) use `ToggleGroup`.
- **Overlays:** `Sheet` (drawers), `Dialog` (modals), `AlertDialog` (confirm), `Command` in `Dialog` (⌘K). Each **requires a Title** (`sr-only` if hidden).
- **Custom triggers:** base primitive → use the **`render`** prop (not `asChild`).
- **Don't hand-roll:** callouts → `Alert`; empty states → `Empty`; loading → `Skeleton`; toasts → `sonner` `toast()`; dividers → `Separator`; status pills → `Badge`; charts → shadcn `Chart`.
- **Styling discipline:** semantic tokens only (`bg-primary`, `text-muted-foreground` — never `bg-blue-500`); `className` for layout only; `flex … gap-*` (no `space-x/y-*`); `size-*` for equal w/h; `cn()` for conditionals; no manual `z-index` on overlays; icons in buttons use `data-icon` with no size class.
- **Touch targets:** primary actions `size="lg"` (≥44px) to honor the touch-friendly goal, while tables stay compact.

---

## 3. Information architecture

```
Top bar:  [Logo] [Global Patient Search ⌘K] ............ [Clinic Switcher ▾] [Role: Reception/Doctor ▾] [User ▾]
Sidebar:  Dashboard · Patients · Visits            (collapses to bottom nav on mobile)

Routes
/                         → redirect to /dashboard
/dashboard                → role-aware (Reception KPIs+quick actions | Doctor patient-focused)
/patients                 → patient list (search, filter, register)
/patients/[id]            → patient profile + visit timeline
/visits                   → recent/daily visits for current clinic
/sign-in, /sign-up        → Clerk

Overlays (no route change)  —  shadcn component in brackets
Register/Edit Patient     → right drawer          [Sheet, side="right"]
New Visit                 → modal                 [Dialog]  (from dashboard / profile / visits)
Add Visit Note            → modal (doctor)         [Dialog]  (from patient profile)
Delete/confirm actions    → confirmation           [AlertDialog]
Command palette (⌘K)      → smart patient search    [Command inside Dialog]
```

**Shell components:** top bar clinic switcher = `Select`; role switcher = `ToggleGroup` (2 options) or `Select`; user menu = Clerk `<UserButton>`; left nav = shadcn `Sidebar` (collapsible, becomes an off-canvas `Sidebar` sheet on mobile). Every overlay uses its required Title (`SheetTitle`/`DialogTitle`, `sr-only` when visually hidden) for accessibility.

Everything hangs off **current clinic** (from switcher, persisted) and **current role**.

---

## 4. Data model (Prisma schema)

```prisma
// schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Gender { MALE FEMALE OTHER }
enum BloodGroup { A_POS A_NEG B_POS B_NEG AB_POS AB_NEG O_POS O_NEG UNKNOWN }
enum VisitType { NEW FOLLOW_UP }

model Clinic {
  id        String    @id @default(cuid())
  name      String
  address   String?
  createdAt DateTime  @default(now())
  patients  Patient[] @relation("FirstClinic")
  visits    Visit[]
}

model Patient {
  id             String     @id @default(cuid())
  name           String
  dateOfBirth    DateTime?          // age derived; DOB optional, age fallback
  ageYears       Int?               // used when DOB unknown
  gender         Gender
  contactNumber  String
  address        String?
  medicalHistory String?            // basic free text
  allergies      String?            // basic free text
  bloodGroup     BloodGroup @default(UNKNOWN)
  firstClinicId  String
  firstClinic    Clinic     @relation("FirstClinic", fields: [firstClinicId], references: [id])
  visits         Visit[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@index([name])
  @@index([contactNumber])
  @@index([firstClinicId])
}

model Visit {
  id         String    @id @default(cuid())
  patientId  String
  patient    Patient   @relation(fields: [patientId], references: [id])
  clinicId   String
  clinic     Clinic    @relation(fields: [clinicId], references: [id])
  type       VisitType @default(FOLLOW_UP)   // NEW if patient's first-ever visit
  reason     String?                          // chief complaint (short)
  notes      String?                          // doctor's visit notes
  visitedAt  DateTime  @default(now())
  createdAt  DateTime  @default(now())

  @@index([clinicId, visitedAt])
  @@index([patientId, visitedAt])
}
```

**Seed:** Clinic 1, Clinic 2, plus ~15 sample patients and a spread of visits across today/this week/this month so KPIs and charts render immediately.

**Derived rules:**
- Age = from `dateOfBirth` if present, else `ageYears`.
- A visit is `NEW` if it is the patient's earliest visit; otherwise `FOLLOW_UP`.
- "Repeat/returning patient" = has ≥ 2 visits.

---

## 5. KPI definitions (single source of truth)

All KPIs are scoped to the **current clinic** unless noted. Windows via date-fns (`startOfDay/Week/Month`).

**Reception dashboard**
- Total Patients — count of patients whose `firstClinicId` = current clinic (or all-clinic total shown separately).
- New Patients (today) — patients registered today.
- Returning Patients — patients with ≥ 2 visits.
- Today's Visits / This Week's / This Month's — visit counts in window.
- Recent Visits — last N visits (list).

**Doctor dashboard**
- Patients Seen Today — distinct patients with a visit today.
- Clinic-wise Patients — count per clinic (donut/bar).
- Recent Patient Visits — list.
- Monthly Patient Count — distinct patients per month (line, last 6 months).
- Repeat Visit % — returning patients / total patients.

**Clinic KPIs** — Total Registered, Total Visits, Daily/Weekly/Monthly Visits, New vs Returning (donut).

> Implemented once in `lib/metrics.ts` as pure functions over Prisma queries, exposed via `/api/metrics?clinicId=&scope=`. Dashboards never compute inline.

---

## 6. API surface (Route Handlers, validated with Zod)

```
GET    /api/patients?clinicId&q&cursor      list + smart search (name/phone), paginated
POST   /api/patients                        register
GET    /api/patients/[id]                    profile + visits (timeline)
PATCH  /api/patients/[id]                    edit
GET    /api/visits?clinicId&range           recent/daily visits
POST   /api/visits                          new visit (auto NEW/FOLLOW_UP)
PATCH  /api/visits/[id]                      add/edit notes (doctor)
GET    /api/metrics?clinicId&role           all KPIs for a dashboard in one call
GET    /api/clinics                          clinic list (for switcher)
```

- Every handler: Clinic auth via Clerk (`auth()`), Zod-parse input, Prisma query, typed JSON.
- Doctor-only endpoints (visit notes) gate on `role === 'doctor'`.
- Shared Zod schemas in `lib/schemas.ts` reused by forms.

---

## 7. Directory structure

```
app/
  (auth)/sign-in, sign-up/[[...]]/page.tsx
  (app)/
    layout.tsx                 # shell: top bar + sidebar + providers
    dashboard/page.tsx         # role-aware
    patients/page.tsx
    patients/[id]/page.tsx
    visits/page.tsx
  api/…                        # route handlers above
  layout.tsx                   # ClerkProvider + QueryProvider + fonts
components/
  shell/        AppSidebar[Sidebar], TopBar, ClinicSwitcher[Select], RoleSwitcher[ToggleGroup],
                CommandSearch[Command+Dialog]                    # mobile nav = Sidebar off-canvas
  patients/     PatientList[Table|Card grid], PatientCard[Card+Badge+Avatar],
                PatientFormSheet[Sheet+Field/FieldGroup], PatientProfile[Card+Tabs],
                VisitTimeline[custom list + Separator + Badge], EmptyPatients[Empty]
  visits/       VisitList[Table], NewVisitDialog[Dialog+Field], VisitNoteDialog[Dialog+Textarea]
  dashboard/    ReceptionDashboard, DoctorDashboard, KpiCard[Card+Badge],
                TrendChart/BarChart/DonutChart[Chart→ChartContainer+ChartConfig]
  ui/           shadcn components (added via CLI): button card sheet dialog alert-dialog input
                select toggle-group field input-group textarea command table badge avatar
                separator skeleton sonner empty tabs chart sidebar tooltip dropdown-menu
lib/
  prisma.ts, schemas.ts, metrics.ts, clinic-context.tsx, query.ts, utils.ts
prisma/
  schema.prisma, seed.ts
middleware.ts                  # Clerk route protection
```

---

## 8. Build roadmap (phased, each phase independently demoable)

### Phase 0 — Scaffold & infra
- `create-next-app` (TS, App Router, Tailwind v4, ESLint), then **`npx shadcn@latest init --preset base-nova`** (base primitive + nova style; TS; `@/` alias; lucide icons). This writes `components.json`, the global theme CSS, and `lib/utils.ts` (`cn()`).
- Add non-UI deps with the project package manager: TanStack Query, Framer Motion, react-hook-form, `@hookform/resolvers`, Zod, date-fns. (Recharts comes in transitively with the shadcn `chart` component — don't add it directly.)
- Prisma + Neon: `DATABASE_URL`, schema, `prisma db push`, seed script.
- Clerk: install, `ClerkProvider`, `middleware.ts`, sign-in/up pages, env keys.
- Providers: `QueryProvider`, `ClinicProvider` (context + localStorage persistence).
- **Done when:** app boots, login works, seeded DB reachable.

### Phase 1 — App shell & navigation
- `npx shadcn@latest add sidebar select toggle-group dropdown-menu tooltip separator skeleton command dialog`
- TopBar (search stub, clinic switcher, role switcher, Clerk `<UserButton>`), shadcn `Sidebar` (collapsible; off-canvas on mobile via `SidebarTrigger`).
- Clinic switcher reads `/api/clinics`, persists selection. Role switcher reads Clerk metadata (fallback UI toggle in dev).
- Empty dashboard/patients/visits routes with skeletons.
- **Done when:** shell is consistent, responsive, clinic/role state flows everywhere.

### Phase 2 — Patient management (core)
- `npx shadcn@latest add table card sheet field input badge avatar empty tabs`
- Patient list: server-rendered first page + TanStack Query for search/pagination.
- Smart search (name/phone), debounced; wire ⌘K command palette to it.
- Register/Edit **drawer** (react-hook-form + Zod), optimistic insert/update.
- Patient profile page: details card + **visit timeline** (vertical, newest first).
- **Done when:** register → search → open → edit a patient in ≤ 3 clicks each.

### Phase 3 — Visits
- `npx shadcn@latest add textarea input-group alert-dialog sonner`  (Dialog already added in Phase 1)
- New Visit **modal** (from dashboard, patient profile, visits page) — auto NEW/FOLLOW_UP.
- Visits page: today / recent lists for current clinic.
- Add Visit Note modal (doctor) on profile timeline.
- **Done when:** a visit is logged and appears in timeline + recent visits instantly.

### Phase 4 — Dashboards & KPIs
- `npx shadcn@latest add chart`  (pulls in Recharts + `ChartContainer`/`ChartTooltip`)
- `lib/metrics.ts` + `/api/metrics`.
- ReceptionDashboard: KPI cards + quick actions (Register, Search, New Visit) + recent visits.
- DoctorDashboard: seen-today, recent visits, clinic-wise list, monthly line, repeat %.
- Charts: KpiCard, small TrendChart (line), BarChart, DonutChart (New vs Returning).
- **Done when:** both dashboards render real seeded numbers, role switch swaps them.

### Phase 5 — Polish & a11y
- Loading skeletons everywhere, empty states, toasts, error boundaries.
- Framer Motion drawer/modal transitions (respect `prefers-reduced-motion`).
- Keyboard/focus traps, ARIA, AA contrast pass; mobile QA on real viewport.
- Run `modern-web-design` audit + Lighthouse; trim any ERP-creep.
- **Done when:** feels like Linear/Notion; passes a11y + perf smoke checks.

---

## 9. Definition of done (MVP acceptance)

- [ ] Login (Clerk), role + clinic switching work end-to-end.
- [ ] Register / edit / search / view patient — each ≤ 3 clicks, via drawer/modal (no page hops).
- [ ] Patient profile shows details + full visit timeline.
- [ ] Log a visit and add doctor notes; reflected immediately.
- [ ] Reception & Doctor dashboards show correct, clinic-scoped KPIs + simple charts.
- [ ] Switch between Clinic 1 / Clinic 2 instantly; data rescopes.
- [ ] Fully responsive (mobile bottom nav), touch-friendly, AA-accessible.
- [ ] No feature outside the scope above. No deep menus, no large multi-tab forms.

---

## 10. Risks / guardrails

- **Scope creep is the #1 risk.** Before adding any screen/field/button, check it against Section 1's exclusions and the "one question per screen" rule.
- **Clerk roles:** if role metadata setup is slow, ship a dev role toggle in the switcher and back it with `publicMetadata` later — don't block workflow phases.
- **Neon cold starts:** use the Prisma Neon serverless adapter + pooled connection string.
- **Charts:** keep them small and few. No dense analytics grids. Use shadcn `Chart` only.
- **shadcn discipline:** don't reinvent UI — search/add a component before writing custom markup, follow the §2·A composition rules, and keep the `shadcn` skill loaded while building. Run `npx shadcn@latest add --diff` before overwriting any customized component.

---

*Next step: on approval, execute Phase 0 (scaffold + Prisma/Neon + Clerk).*
