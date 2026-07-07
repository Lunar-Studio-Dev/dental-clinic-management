# Phase 2 — Patient Management (Detailed Technical Plan)

> Parent: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md). Authoritative for Phase 2 only.
> **Method:** TDD (Vitest + RTL). Builds on Phase 0/1 (Clerk, Neon, repo seam, Zustand, shell).
> **Rule:** no assumptions — open items live in §12, not in code.
> **STATUS: ✅ COMPLETE** — see the Implementation Review at the bottom.

---

## ✅ Implementation Review (post-build)

**Verification gate (all green):** `pnpm test` → **78 passed** (18 files; +34 new) · `pnpm build` → compiled + TS pass, 11 routes · `pnpm lint` (Biome) → clean · **real Neon queries verified** via a throwaway script (clinic-scoped `findMany` + `mode:"insensitive"` search + `_count`, and profile `include: visits`) — things the mocked handler tests can't catch.

**What shipped:** `/api/patients` (list w/ cursor pagination + case-insensitive name/phone search + visitCount) & `/api/patients/[id]` (get+visits, patch); real `patientsRepo`; clinic-scoped patient list with debounced search + Load more; Register/Edit **Sheet** form (Field + RHF + Zod, shared schema); patient profile (details Card + read-only VisitTimeline); ⌘K **CommandSearch** wired to real clinic search; sonner toasts.

**Tests added:** schemas (create/update rules), patient-utils (age/returning), debounce (fake timers), both route handlers (401/400/404/pagination/search-where), repo (URL building + verbs), and presentational (status badge, timeline, row).

**Deviations / decisions:**
1. **Client-rendered** list/profile (not SSR) — current clinic lives in client Zustand; pages are thin server wrappers over client subtrees.
2. **Invalidate-on-success** instead of hand-rolled optimistic writes (reliable at this scale).
3. **`lib/types` enum values now import from the generated `enums` file, not `client`** — importing enum *values* from the Prisma client dragged `node:module` into the browser bundle and broke the build. Model *types* stay type-only from `client` (erased). Key fix.
4. Added **`visitCount`** to the list DTO to drive the New/Returning badge.
5. `zodResolver` cast to the output type (schema `.default()` makes input≠output).
6. `CommandSearch` wraps children in `<Command shouldFilter={false}>` so cmdk doesn't re-filter server results (would hide phone matches).
7. Removed the P1 `search-button` stub (replaced by CommandSearch).

**DoD:** all automated criteria met + DB queries verified. Remaining = manual interactive checks (need an authenticated browser).

---

## 1. Objective

The first feature phase: register, search, view, and edit patients — each in **≤ 3 clicks**. Real CRUD against Neon through the repo seam, a clinic-scoped patient list with smart search, a drawer-based register/edit form, and a patient profile with a read-only visit timeline (visits are *created* in Phase 3; existing seed visits render here now).

**In scope:** `/api/patients` (list/search/create) + `/api/patients/[id]` (get/update); `patientsRepo` real impl; patient list (clinic-scoped) + smart search; ⌘K wired to real search; Register/Edit drawer (Sheet + Field + RHF + Zod); patient profile + visit timeline; toasts.

**Out of scope:** creating visits / add-note (P3), KPIs & charts (P4), deleting patients (not in MVP scope).

---

## 2. Decisions

1. **Patients are owned by their first clinic** (user): list = `WHERE firstClinicId = currentClinicId`. A patient appears in exactly one clinic's roster.
2. **⌘K search = current clinic only** (user): same scope as the list.
3. **`firstClinicId` is immutable on edit** — set at registration (defaults to current clinic, selectable), never changed later ("first clinic visited").
4. **Required at registration:** name, gender, contactNumber, firstClinic, and **(dateOfBirth OR ageYears)**. Optional: address, medicalHistory, allergies, bloodGroup (defaults `UNKNOWN`).
5. **Client-rendered feature UI** (deviation from main plan's "server-rendered first page"): the current clinic lives in client Zustand/localStorage, so the list/profile are client components using TanStack Query + the fetch repos (one data path, matches the seam). SSR is a later perf optimization. Pages are thin server wrappers rendering the client subtree.
6. **Mutations use invalidate-on-success** (refetch) rather than hand-rolled optimistic cache writes — reliable and fast at this scale; optimistic can be layered later. Feedback via `sonner` toasts.
7. **`sonner` added now** (main plan listed it in P3) — CRUD needs success/error feedback.

---

## 3. Diagrams (Phase 2)

**Patients list — desktop (Table) & mobile (cards)**
```
Patients · Clinic 1                    [ 🔍 name / phone… ]        [+ Register]
┌───────────────────────────────────────────────────────────────────────────┐
│ Name            Age  Sex   Phone          First clinic   Status            │
│ Asha Mehta      34   F     98…01          Clinic 1       ● Returning       │  ← row → profile
│ Ravi Kumar      41   M     98…02          Clinic 1       ○ New             │
│ …                                            [ Load more ]                  │
└───────────────────────────────────────────────────────────────────────────┘
 mobile: each row → a Card (name + age·sex·phone + status badge), tap → profile
 empty search → <Empty> "No patients match ‘xyz’."   empty clinic → <Empty> + [Register]
```

**Register / Edit drawer (Sheet, right)**
```
                                   ┌─── Register patient ──────────────┐
                                   │ Name*        [__________________] │
                                   │ Contact*     [__________________] │
                                   │ Gender*      (Male)(Female)(Other)│ ToggleGroup
                                   │ DOB / Age*   [__/__/____]  or [__] │
                                   │ Blood group  [ UNKNOWN ▾ ]         │ Select
                                   │ Clinic*      [ Clinic 1 ▾ ]        │ (edit: read-only)
                                   │ Address      [__________________] │
                                   │ Allergies    [__________________] │
                                   │ History      [__________________] │
                                   │              [ Cancel ] [ Save ▶ ] │
                                   └────────────────────────────────────┘
 invalid → Field data-invalid + message; Save → toast; drawer closes; list refetches
```

**Patient profile + visit timeline**
```
‹ Patients                                              [ Edit ]   [+ New Visit*]   (*disabled → P3)
┌───────────────────────────────┐   Visit timeline (newest first)
│ Asha Mehta      ● Returning    │   ┃
│ 34 · Female · O+               │   ┣━ 07 Jul 2026 · NEW · Fever and body ache
│ 📞 98…01                       │   ┃    "Prescribed rest and fluids…"
│ 🏥 First: Clinic 1             │   ┣━ 20 Jun 2026 · FOLLOW_UP · Routine follow-up
│ ⚠ Allergies: Penicillin        │   ┃
│ 📋 History: Hypertension       │   ┗━ 02 May 2026 · NEW · Persistent cough
└───────────────────────────────┘   (no visits → <Empty> "No visits yet")
```

**Data flow (list + search)**
```
PatientsList (client)
  currentClinicId ◀ useUIStore        q ◀ SearchInput (debounced 300ms)
        └────────────┬───────────────────┘
                     ▼
 useInfiniteQuery(["patients", clinicId, q]) → patientsRepo.list({clinicId,q,cursor})
        → GET /api/patients?clinicId&q&cursor → Prisma (where firstClinicId+OR name/phone) → Neon
 register/edit → patientsRepo.create/update → POST/PATCH → invalidate ["patients"] + toast
```

---

## 4. API surface (Clerk-guarded, Zod-validated)

```
GET   /api/patients?clinicId&q&cursor
        → { patients: PatientDTO[], nextCursor: string | null }
        where: firstClinicId = clinicId AND (q? name ILIKE %q% OR contactNumber ILIKE %q%)
        order: name asc, id asc ; cursor pagination on id ; take 20
POST  /api/patients            body: PatientCreateInput → 201 PatientDTO   (400 on invalid)
GET   /api/patients/[id]        → { patient: PatientDTO, visits: VisitDTO[] }   (404 if missing)
PATCH /api/patients/[id]        body: PatientUpdateInput → PatientDTO       (400 invalid, 404 missing)
```
- `clinicId` required on list; missing → 400.
- All handlers: `auth()` guard (401), Zod parse, Prisma, typed JSON. Dates serialized as ISO strings (DTO).

---

## 5. Shared validation — `lib/schemas.ts`

```ts
patientCreateSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(Gender),
  contactNumber: z.string().min(5),
  firstClinicId: z.string().min(1),
  dateOfBirth: isoDate.nullable().optional(),
  ageYears: z.number().int().positive().max(150).nullable().optional(),
  bloodGroup: z.enum(BloodGroup).default("UNKNOWN"),
  address: z.string().nullable().optional(),
  medicalHistory: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
}).refine(dob-or-age present)

patientUpdateSchema = patientCreateSchema.omit({ firstClinicId: true }).partial()  // clinic immutable
```
Reused by the form (RHF `zodResolver`) **and** the API handlers → one source of truth.

---

## 6. Data-access seam (implement Phase 0 stubs)

`lib/data/http.ts` — add `postJson`, `patchJson`. `lib/data/patients.ts`:
```ts
patientsRepo = {
  list(params): Promise<{ patients: PatientDTO[]; nextCursor: string | null }>
  get(id): Promise<{ patient: PatientDTO; visits: VisitDTO[] }>
  create(input: PatientCreateInput): Promise<PatientDTO>
  update(id, input: PatientUpdateInput): Promise<PatientDTO>
}
```
`lib/data/types.ts` — add `PatientCreateInput`/`PatientUpdateInput` (z.infer) + `PatientListResult`, `PatientWithVisits`.

---

## 7. Components & files

```
app/(app)/patients/page.tsx           # thin → <PatientsPage/> (client)
app/(app)/patients/[id]/page.tsx       # thin → <PatientProfile id={id}/> (client)
app/api/patients/route.ts              # GET list, POST create
app/api/patients/[id]/route.ts         # GET one+visits, PATCH update

components/patients/
  patients-page.tsx        # client: search + list + Register button
  patient-list.tsx         # Table (desktop) / Card list (mobile); useInfiniteQuery
  patient-row.tsx          # presentational row/card
  patient-status-badge.tsx # New / Returning (from visit count) [Badge]
  patient-search-input.tsx # debounced input
  patient-form-sheet.tsx   # Sheet wrapper (register + edit modes)
  patient-form.tsx         # Field/FieldGroup + RHF + zodResolver
  patient-profile.tsx      # client: details Card + timeline; Edit button
  visit-timeline.tsx       # presentational timeline [Separator/Badge]
components/shell/
  command-search.tsx       # replaces the P1 SearchButton stub → real clinic-scoped search

lib/
  schemas.ts               # patientCreate/UpdateSchema
  hooks/use-patients.ts    # useInfiniteQuery list
  hooks/use-patient.ts     # useQuery one
  hooks/use-patient-mutations.ts  # create/update + invalidate + toast
  hooks/use-debounced-value.ts
  patient-utils.ts         # patientAge(), isReturning()

app/layout.tsx             # add <Toaster/> (sonner)
```
**shadcn add:** `table card sheet field input badge avatar empty tabs toggle-group sonner`.

---

## 8. TDD plan (tests first, red → green)

**Pure logic / schemas**
1. `lib/schemas.test.ts` — patientCreateSchema: rejects missing name/contact/gender/clinic; rejects when both dob & age absent; accepts dob-only and age-only; bloodGroup defaults UNKNOWN. patientUpdateSchema: forbids firstClinicId; allows partial.
2. `lib/patient-utils.test.ts` — `patientAge` from dob (fixed `now`) and from ageYears; `isReturning` (visitCount ≥ 2).
3. `lib/hooks/use-debounced-value.test.ts` — fake timers: value updates only after delay.

**API handlers (mock `~/lib/prisma` + `@clerk/nextjs/server`)**
4. `app/api/patients/route.test.ts` — GET: 401 unauth; 400 no clinicId; builds where with clinicId + q OR-filter; returns `{patients, nextCursor}` (nextCursor null when < pageSize). POST: 401; 400 invalid body; 201 + create called with parsed data.
5. `app/api/patients/[id]/route.test.ts` — GET: returns `{patient, visits}`; 404 when null. PATCH: 400 invalid; updates; 404 missing.

**Repo (mock fetch)**
6. `lib/data/patients.test.ts` — list builds `/api/patients?clinicId&q&cursor` correctly and returns result; create POSTs body; update PATCHes; get GETs `/api/patients/{id}`.

**Presentational (RTL)**
7. `components/patients/patient-status-badge.test.tsx` — New vs Returning label.
8. `components/patients/visit-timeline.test.tsx` — renders a row per visit, newest first, shows type + reason; empty → Empty state.
9. `components/patients/patient-row.test.tsx` — shows name, age, phone; clicking navigates (mock router / asserts link href).

Containers, Sheet form, and pages = build + manual verified (heavy framework glue). Form validation is covered at the schema level (#1) + manual.

---

## 9. Build order

1. `shadcn add …` + `pnpm format`; add `<Toaster/>`.
2. `lib/schemas.ts` + `patient-utils` + `use-debounced-value` (tests → impl).
3. `/api/patients` + `/api/patients/[id]` (tests → impl).
4. `patientsRepo` + http helpers (tests → impl); update `types.ts`.
5. Hooks (`use-patients`, `use-patient`, `use-patient-mutations`).
6. Presentational (status badge, row, timeline — tests) → list, search input.
7. `patient-form` + `patient-form-sheet` (register + edit) → wire into list + profile.
8. `patient-profile` page; `patients` page; `command-search` (⌘K).
9. `pnpm test` + `build` + `lint`; responsive + a11y pass.

---

## 10. Exit criteria (Phase 2 DoD)

- [ ] `pnpm test` green (Phase 0/1 still pass + new); `build` + `lint` clean.
- [ ] Patients list shows current-clinic patients; switching clinics re-scopes it.
- [ ] Smart search (name/phone) filters, debounced; ⌘K opens the same search and jumps to a profile.
- [ ] Register a patient (drawer) → appears in the list; validation blocks bad input; toast on success.
- [ ] Open a profile → details + visit timeline (seed visits) render; empty states where relevant.
- [ ] Edit a patient (drawer) → changes persist; `firstClinic` not editable.
- [ ] Each of register / search / open / edit reachable in ≤ 3 clicks; responsive; no console errors.

---

## 11. ≤ 3-click check

- **Register:** [Register] (1) → drawer → Save (2). **Search:** type in always-visible box (0) or ⌘K (1). **Open:** click row (1). **Edit:** [Edit] on profile (1) → drawer.

---

## 12. Open questions / not assuming

1. **Status label thresholds** — "Returning" = ≥ 2 visits, "New" = < 2 (matches KPI rule). OK?
2. **Search fields** — name + phone only (per plan). Add anything else (e.g., blood group)? Default: name + phone.
3. **Register default clinic** — defaults to the current clinic in the switcher, but is changeable in the form. OK, or force = current clinic?

*(All three have sensible defaults above; I'll proceed with them unless you say otherwise — flagged, not blocking.)*

---

## 13. Where YOU test manually

- Register a new patient in the current clinic → see it appear; reload → still there (Neon).
- Search by partial name and by phone; try ⌘K.
- Open a seeded patient → timeline shows their visits; Edit → change phone/allergies → persists.
- Switch clinics → list re-scopes to that clinic's patients.
