# Phase 4 — Dashboards & KPIs (Detailed Technical Plan)

> Parent: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md). Authoritative for Phase 4 only.
> **Method:** TDD (Vitest + RTL). Builds on Phase 0–3. Final MVP phase.
> **Rule:** no assumptions — open items live in §12, not in code.
> **STATUS: ✅ COMPLETE — MVP feature-complete (Phases 0–4 all done).**

---

## ✅ Implementation Review (post-build)

**Verification gate (all green):** `pnpm test` → **114 passed** (27 files; +14 new) · `pnpm build` → compiled + TS pass · `pnpm lint` (Biome) → clean · **live metrics verified against Neon** for clinic_1: `{total:50, newToday:1, returning:40, repeatPct:80, visitsToday:4, seenToday:4, monthly:[1,3,7,26,46,16], clinicWise:50/50}` — the backdated seed produced a realistic monthly curve.

**What shipped:** `lib/metrics.ts` (**pure** `computeMetrics`, no Prisma → 8 unit tests) + `lib/metrics-queries.ts` (Prisma wiring) + `/api/metrics`; `metricsRepo` + `useMetrics`; **Reception dashboard** (4 KPI cards + weekly-visits bar + recent visits + quick actions Register/Search/New-Visit) and **Doctor dashboard** (seen-today/repeat%/total + monthly-patients line + clinic-wise donut + recent); `KpiCard` + 3 shadcn `Chart` components (teal palette); role-split `/dashboard`; **seed backdating** (patient `createdAt` = earliest visit) → re-seeded.

**Tests added:** `computeMetrics` (all KPIs + windows + empty/no-divide-by-zero), `/api/metrics` handler, `metricsRepo`, `KpiCard`.

**Deviations / decisions:**
1. **Pure/impure split** — `computeMetrics` (pure, tested) is separate from `getDashboardMetrics` (Prisma) so the test never loads the DB client.
2. **Single `/api/metrics?clinicId`** bundle (role-agnostic); each dashboard picks fields — simpler than a role param.
3. Seed **backdating in `prisma/seed.ts` only** (createdAt = min visit date) — no constant.ts change; required a re-seed (resets manual test patients).
4. §12 defaults taken: 4 primary cards + weekly bar; clinic-wise donut on doctor; recent = 8.

**DoD:** automated criteria met + metrics verified on Neon. Remaining = manual visual check of both dashboards + charts in the browser.

---

## 🎉 MVP status (Phases 0–4)

All five phases complete: **foundation/auth (0) · shell (1) · patients (2) · visits (3) · dashboards (4).** 114 tests, clean build/lint, real Clerk + Neon. Full core scope from `IMPLEMENTATION.md` is implemented.

---

## 1. Objective

Turn the role-locked `/dashboard` placeholder into the real **Reception** and **Doctor** dashboards: lightweight KPI cards, a few simple charts (shadcn `Chart`), a recent-visits list, and quick actions — all clinic-scoped and role-correct. KPIs are computed **live** from Neon via `/api/metrics`, once, in `lib/metrics.ts`.

**In scope:** `lib/metrics.ts` (pure compute + prisma fetch) + `/api/metrics`; ReceptionDashboard (KPIs + weekly-visits chart + recent + quick actions Register/Search/New-Visit); DoctorDashboard (KPIs + monthly-patients chart + clinic-wise donut + recent); KpiCard + chart components; **seed backdating** (patient `createdAt` = first visit).

**Out of scope:** date-range pickers, exports/BI, custom report builder, per-KPI drill-downs.

---

## 2. Decisions (from user)

1. **Backdate + re-seed** — a patient's `createdAt` is set to their **earliest visit date** (registration ≈ first clinic visit). Makes "New patients today" realistic and the monthly chart meaningful. Re-seed wipes manually-added test patients (seeded data regenerates identically). *Implemented in `prisma/seed.ts` only — no constant.ts change.*
2. **Live per-request** metrics — `/api/metrics` computes on each load; TanStack Query caches ~30s.
3. Metrics computed **once** in `lib/metrics.ts` (pure functions over fetched arrays → fully unit-testable; a thin `getDashboardMetrics(clinicId)` wires Prisma). Dashboards never compute inline.

---

## 3. KPI definitions (per `IMPLEMENTATION.md` §5, scoped to current clinic)

| KPI | Definition |
|-----|-----------|
| Total patients | `firstClinicId = clinic` count |
| New patients today | those with `createdAt ≥ startOfToday` |
| Returning patients | those with `≥ 2` visits |
| Repeat visit % | `round(returning / total × 100)` |
| Visits today / week / month | clinic visits within window |
| Patients seen today | distinct `patientId` among today's clinic visits |
| Weekly visit trend | count per day, last 7 days (bar) |
| Monthly patient count | distinct patients with a visit per month, last 6 months (line) |
| Clinic-wise patients | patient count per clinic, all clinics (donut) |
| New vs Returning | `{ new: total − returning, returning }` (donut) |
| Recent visits | last 8 clinic visits (desc) |

---

## 4. Diagrams (Phase 4)

**Reception dashboard**
```
Reception Dashboard · Clinic 1              [Register] [Search] [New Visit]  ← quick actions
┌────────────┬────────────┬────────────┬────────────┐
│ Total      │ New today  │ Returning  │ Today      │
│ 48         │ 1          │ 61%        │ 4 visits   │
└────────────┴────────────┴────────────┴────────────┘
┌───────────────────────────────┐  ┌────────────────────────────┐
│ Visits this week   ▁▂▄▆█▅▃    │  │ Recent visits              │
│  (bar chart, 7 days)          │  │ 09:12 Asha M.  ● New       │
└───────────────────────────────┘  │ 09:20 Ravi K.  ○ Follow-up │
                                    └────────────────────────────┘
```

**Doctor dashboard**
```
Doctor Dashboard · Clinic 1                                 [New Visit]
┌────────────┬────────────┬────────────┐
│ Seen today │ Repeat %   │ Total      │
│ 4          │ 61%        │ 48         │
└────────────┴────────────┴────────────┘
┌───────────────────────────────┐  ┌────────────────────────────┐
│ Monthly patients  ╱╲╱▁▂▄▆     │  │ Clinic-wise patients       │
│  (line, 6 months)             │  │   Clinic 1 ◕  Clinic 2 ◔   │
└───────────────────────────────┘  │   (donut)                  │
┌────────────────────────────────────────────────────────────────┐
│ Recent patient visits · 07 Jul  Asha Mehta  New  → profile      │
└────────────────────────────────────────────────────────────────┘
```

**Metrics flow**
```
Dashboard (client) ── useMetrics(clinicId) ─► metricsRepo.dashboard() ─► GET /api/metrics?clinicId
                                                                            │
                                            lib/metrics.getDashboardMetrics(clinicId)
                                              ├─ prisma: clinic patients (+visit counts), clinic visits, clinics(+counts)
                                              └─ computeMetrics(data, now)  ← PURE, unit-tested
                                                     → MetricsDTO (cards + chart series + recent)
```

---

## 5. API + metrics module

```
GET /api/metrics?clinicId → MetricsDTO        (401 unauth; 400 no clinicId)
```
`lib/metrics.ts`:
```ts
export function computeMetrics(data: MetricsInput, now: Date): MetricsDTO   // PURE
export async function getDashboardMetrics(clinicId: string): Promise<MetricsDTO>  // prisma → computeMetrics
```
`MetricsInput` = `{ patients: {id, createdAt, visitCount}[]; visits: VisitListItem[]; clinics: {id,name,patientCount}[] }`.
`MetricsDTO` (in `lib/data/types.ts`, shared): all KPIs from §3 + `weeklyVisitTrend: {day,count}[]`, `monthlyPatientCounts: {month,count}[]`, `clinicWisePatients: {clinicId,name,count}[]`, `newVsReturning: {new,returning}`, `recentVisits: VisitListItem[]`.

`metricsRepo.dashboard(clinicId)` (replace Phase 0 stub) → `getJson('/api/metrics?clinicId=…')`.

---

## 6. Components & files

```
app/(app)/dashboard/page.tsx     # server: getRole() → <ReceptionDashboard/> | <DoctorDashboard/>
app/api/metrics/route.ts         # GET → MetricsDTO

components/dashboard/
  reception-dashboard.tsx  # client: useMetrics + cards + weekly chart + recent + quick actions
  doctor-dashboard.tsx     # client: useMetrics + cards + monthly chart + donut + recent
  kpi-card.tsx             # presentational [Card]: label, value, sub
  kpi-row.tsx              # grid of KpiCards
  weekly-visits-chart.tsx  # shadcn Chart → Recharts <BarChart>
  monthly-patients-chart.tsx  # shadcn Chart → <LineChart>
  clinic-donut.tsx         # shadcn Chart → <PieChart> (New vs Returning / clinic-wise)
  quick-actions.tsx        # Register (PatientFormSheet) · Search (→/patients) · New Visit (NewVisitDialog)
  recent-visits.tsx        # reuses VisitListItem list

lib/
  metrics.ts               # computeMetrics (pure) + getDashboardMetrics (prisma)
  hooks/use-metrics.ts     # useQuery(["metrics", clinicId])
  data/metrics.ts          # metricsRepo.dashboard (real)
```
**shadcn add:** `chart` (pulls Recharts + ChartContainer/ChartTooltip/ChartConfig).

---

## 7. TDD plan (tests first, red → green)

**Pure logic (the core)**
1. `lib/metrics.test.ts` — `computeMetrics(fixture, fixedNow)` asserts: totalPatients, newPatientsToday (createdAt today), returningPatients (visitCount≥2), repeatVisitPct rounding, visitsToday/week/month windows, patientsSeenToday (distinct), weeklyVisitTrend length 7 + counts, monthlyPatientCounts length 6, clinicWisePatients mapping, newVsReturning, recentVisits (desc, capped). Edge: zero patients → repeatPct 0, no divide-by-zero.

**API (mock `~/lib/metrics` + `@clerk/nextjs/server`)**
2. `app/api/metrics/route.test.ts` — 401 unauth; 400 no clinicId; 200 returns the metrics object.

**Repo (mock fetch)**
3. `lib/data/metrics.test.ts` — `dashboard(clinicId)` GETs `/api/metrics?clinicId=…`.

**Presentational (RTL)**
4. `components/dashboard/kpi-card.test.tsx` — renders label + value (+ sub when given).

Charts, dashboards, quick actions, page = build + manual verified. Chart series correctness is covered by `computeMetrics` tests (data-shaping), not the SVG.

---

## 8. Build order

1. Update `prisma/seed.ts` (backdate `createdAt` = earliest visit) → `pnpm db:seed`.
2. `shadcn add chart` + `pnpm format`.
3. `MetricsDTO` type + `lib/metrics.ts` `computeMetrics` (tests → impl) → `getDashboardMetrics`.
4. `/api/metrics` (tests → impl); `metricsRepo` (tests → impl); `use-metrics`.
5. `kpi-card` (test) + `kpi-row`; chart components; `recent-visits`; `quick-actions`.
6. `reception-dashboard`, `doctor-dashboard`; wire `/dashboard` page (role split).
7. `pnpm test` + `build` + `lint`; verify metrics vs Neon; responsive.

---

## 9. Exit criteria (Phase 4 DoD)

- [ ] `pnpm test` green (all prior + new); `build` + `lint` clean; metrics verified against Neon.
- [ ] Re-seed done: "New today" is a small realistic number; monthly chart varies.
- [ ] Reception dashboard: correct KPI cards + weekly chart + recent visits + working quick actions (Register / Search / New Visit).
- [ ] Doctor dashboard: seen-today / repeat% / totals + monthly chart + clinic-wise donut + recent.
- [ ] `/dashboard` shows the role-correct dashboard; switching clinics re-scopes every number/chart.
- [ ] Charts render in light theme with the clinic palette; responsive; no console errors.

---

## 10. Quick actions (≤ 3 clicks)

Register → opens the P2 `PatientFormSheet` (create). New Visit → opens the P3 `NewVisitDialog` (picker). Search → navigates to `/patients` (search box) — ⌘K also available from the top bar everywhere.

---

## 11. Charts (shadcn `Chart`, clinic palette)

- Colors from `--chart-1..5` (teal-forward, set in Phase 0) via `ChartConfig` — never hard-coded.
- Weekly visits → `BarChart` (7 bars). Monthly patients → `LineChart` (6 points). Distribution → `PieChart` donut.
- Keep them small, few, and label-light (per the "no enterprise BI" principle).

---

## 12. Open questions / not assuming

1. **Reception charts** — showing **weekly visits** (bar). Add "This week / This month" as extra cards too, or keep the 4 primary cards? Default: 4 cards + weekly bar.
2. **Donut metric** — doctor dashboard donut = **clinic-wise patient counts**. Also want a **New vs Returning** donut somewhere (reception), or skip? Default: clinic-wise on doctor only; both computed and available.
3. **Recent list length** — 8. OK?

*(Defaults chosen; I'll proceed unless you say otherwise.)*

---

## 13. Where YOU test manually

- Sign in as **reception** → dashboard shows realistic KPIs + weekly chart; click **Register** / **New Visit** quick actions (open the drawer/modal) and **Search** (→ patients).
- Sign in as **doctor** → doctor dashboard: seen-today, monthly line, clinic-wise donut.
- **Switch clinics** → every number and chart re-scopes.
