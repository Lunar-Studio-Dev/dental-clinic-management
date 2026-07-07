# Phase 3 — Visits (Detailed Technical Plan)

> Parent: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md). Authoritative for Phase 3 only.
> **Method:** TDD (Vitest + RTL). Builds on Phase 0/1/2.
> **Rule:** no assumptions — open items live in §12, not in code.
> **STATUS: ✅ COMPLETE** — see the Implementation Review at the bottom.

---

## ✅ Implementation Review (post-build)

**Verification gate (all green):** `pnpm test` → **100 passed** (23 files; +22 new) · `pnpm build` → compiled + TS pass, 13 routes · `pnpm lint` (Biome) → clean · **Neon queries verified** (today/recent visit lists with patient join; visit-count → type derivation).

**What shipped:** `/api/visits` (today/recent list w/ patient name, create with **server-derived NEW/FOLLOW_UP**) & `/api/visits/[id]` (**doctor-only** note patch, 403 otherwise); real `visitsRepo`; **New Visit dialog** (from profile pre-filled, and from the Visits page with an inline patient picker); **Visits page** (Today + Recent, clinic-scoped); **doctor-only note action** on the timeline + note dialog; `useRole()` client hook; live invalidation of timeline / visits / patient-status.

**Tests added:** visit-utils, schema (visit create/note), both route handlers (401/400/404/**403**/type-derivation/date-bound), repo, and presentational (visit row, timeline note-action gating).

**Deviations / decisions:**
1. **No new shadcn components** — textarea/input-group/dialog/command already present; `alert-dialog` (planned) unused this phase (no deletes).
2. New-Visit / note forms use **plain `useState`** (2–3 fields) rather than RHF — the shared Zod schema is still enforced server-side + unit-tested.
3. **`useRole()`** (Clerk `useUser`) gates the doctor-only note UI; the API independently enforces 403 (never trust the client).
4. Visit clinic = `patient.firstClinicId` on the profile (equals current clinic under the P2 ownership model); = current clinic on the Visits page.
5. §12 defaults taken: Recent = last **20**, reason **required**, `visitedAt` = **now** (no date picker this phase).

**DoD:** automated criteria met + DB verified. Remaining = manual interactive checks (need doctor + reception browser sessions).

---

## 1. Objective

Record visits and doctor notes. Log a visit (auto NEW/FOLLOW_UP), see it appear immediately in the patient timeline and the clinic's Visits page, and let doctors add/edit clinical notes. Completes the "New Visit" button left disabled on the profile in Phase 2.

**In scope:** `/api/visits` (list today/recent, create) + `/api/visits/[id]` (patch notes, doctor-only); real `visitsRepo`; New Visit modal (from profile + Visits page w/ patient picker); Visits page (today + recent lists); Add-note modal (doctor) on the timeline; live refresh of timeline/list/patient-status.

**Out of scope:** dashboard quick-actions & KPIs (P4), editing a visit's reason/date (only notes are editable), deleting visits.

---

## 2. Decisions (from user)

1. **Reception logs visits, doctor notes** — creating a visit is allowed for **both** roles; **adding/editing notes is doctor-only** (`PATCH /api/visits/[id]` → 403 for non-doctors; the note UI only renders for doctors).
2. **New Visit entry points** — patient **profile** (patient pre-filled) and the **Visits page** (a patient-search picker in the modal).
3. **Type is server-derived** — a visit is `NEW` iff the patient has **zero prior visits**, else `FOLLOW_UP`. Never client-supplied.
4. **Visit clinic = current clinic** (switcher). Since patients are only visible in their own clinic (P2), this equals the patient's `firstClinicId` in practice.
5. **Client role gating** via `useRole()` (Clerk `useUser().publicMetadata.role`) — no prop-threading.

---

## 3. Diagrams (Phase 3)

**New Visit modal (Dialog)**
```
        ┌──────── New visit ─────────────────────────┐
        │ Patient   [ Asha Mehta ]   ← prefilled, OR  │
        │           [ 🔍 search patient… ▾ ] (picker) │
        │ Reason*   [_______________________________] │
        │ Notes     [_______________________________] │ (doctor may fill; optional)
        │           type is set automatically          │
        │                       [ Cancel ] [ Save ▶ ]  │
        └─────────────────────────────────────────────┘
  Save → POST /api/visits (type auto) → toast → invalidate timeline + visits + patients
```

**Add note modal (Dialog — doctor only)**
```
        ┌──── Visit note · 07 Jul 2026 ────┐
        │ Reason: Fever and body ache       │ (read-only context)
        │ Notes  [______________________]   │
        │                 [Cancel] [Save ▶] │
        └───────────────────────────────────┘
```

**Visits page**
```
Visits · Clinic 1                                              [+ New Visit]
┌ Today ───────────────────────────────────────────────────────────────────┐
│ 09:12   Asha Mehta      ● New       Fever and body ache          → profile │
│ 09:20   Ravi Kumar      ○ Follow-up Routine follow-up            → profile │
└───────────────────────────────────────────────────────────────────────────┘
┌ Recent ──────────────────────────────────────────────────────────────────┐
│ Yesterday 16:40  Neha Rao   ○ Follow-up  Blood pressure review   → profile │
│ …                                                                          │
└───────────────────────────────────────────────────────────────────────────┘
  each range = empty → <Empty> "No visits today" / "No recent visits"
```

**Profile timeline gains actions**
```
[ Edit ]  [ + New Visit ]              ← New Visit now enabled (patient prefilled)
 ┣━ 07 Jul 2026 · NEW · Fever            [ + Note ]  ← doctor-only per-visit action
 ┃    "Prescribed rest…"                 (Edit note if notes exist)
```

---

## 4. API surface (Clerk-guarded, Zod-validated)

```
GET   /api/visits?clinicId&range        range = "today" | "recent"
        → { visits: VisitListItem[] }    (VisitDTO + patientName), newest first
        today  → visitedAt >= startOfToday ; recent → take 20 desc
POST  /api/visits            body: VisitCreateInput → 201 VisitDTO
        type derived: (prisma.visit.count({patientId}) === 0) ? NEW : FOLLOW_UP
        clinicId from body (current clinic); visitedAt defaults to now
PATCH /api/visits/[id]       body: { notes } → VisitDTO      ← DOCTOR ONLY (403 else)
```
- 401 unauth on all; 400 invalid; 404 patch missing; **403** patch when role ≠ doctor.

---

## 5. Shared validation — add to `lib/schemas.ts`

```ts
visitCreateSchema = z.object({
  patientId: z.string().min(1),
  clinicId:  z.string().min(1),
  reason:    z.string().trim().min(1, "Reason is required"),
  notes:     z.string().trim().nullable().optional(),
  visitedAt: isoDate.optional(),        // defaults to now server-side
})   // NOTE: `type` intentionally absent — server-derived

visitNoteSchema = z.object({ notes: z.string() })   // "" allowed (clears the note)
```
Reused by the New-Visit/Add-note forms and the API handlers.

---

## 6. Data-access seam (implement Phase 0 stubs)

`lib/data/visits.ts`:
```ts
visitsRepo = {
  list(params: { clinicId; range }): Promise<{ visits: VisitListItem[] }>
  create(input: VisitCreateInput): Promise<VisitDTO>
  addNote(id: string, notes: string): Promise<VisitDTO>
}
```
`lib/data/types.ts` — add `VisitListItem` (= `VisitDTO & { patientName: string }`), `VisitCreateInput` (z.infer). `lib/serialize.ts` — `toVisitListItem(row)` (includes `patient.name`).

---

## 7. Components & files

```
app/(app)/visits/page.tsx          # thin → <VisitsPage/> (client)
app/api/visits/route.ts            # GET list, POST create
app/api/visits/[id]/route.ts       # PATCH notes (doctor-only)

components/visits/
  visits-page.tsx        # client: Today + Recent lists + New Visit button
  visit-list-item.tsx    # presentational row (time, patient, type, reason) → profile link
  new-visit-dialog.tsx   # Dialog + form (reason, notes) + optional patient picker
  patient-picker.tsx     # Command-based patient search/select (current clinic)
  visit-note-dialog.tsx  # Dialog + notes textarea (doctor)

components/patients/
  visit-timeline.tsx     # + optional per-visit "Note" action (doctor); role-gated by caller
  patient-profile.tsx    # enable New Visit (prefilled); wire note dialog

lib/
  hooks/use-role.ts          # Clerk useUser → Role | null (client)
  hooks/use-visits.ts        # useQuery list (today/recent)
  hooks/use-visit-mutations.ts  # createVisit + addNote (+ invalidate + toast)
  visit-utils.ts             # visitTypeLabel(), formatVisitTime()
```
**shadcn add:** `textarea input-group alert-dialog` (Dialog/Command/sonner already present).

---

## 8. TDD plan (tests first, red → green)

**Pure logic**
1. `lib/visit-utils.test.ts` — `visitTypeLabel` (NEW→"New", FOLLOW_UP→"Follow-up"); `formatVisitTime` fixed input.
2. `lib/schemas.test.ts` (extend) — visitCreateSchema requires patientId/clinicId/reason; visitNoteSchema accepts "".

**API handlers (mock `~/lib/prisma`, `@clerk/nextjs/server`, `~/lib/auth`)**
3. `app/api/visits/route.test.ts` — GET: 401; 400 no clinicId; today builds `visitedAt gte`; recent take 20 desc; maps `patientName`. POST: 401; 400 invalid; **derives NEW when count 0, FOLLOW_UP when >0**; create called with derived type + clinicId.
4. `app/api/visits/[id]/route.test.ts` — PATCH: 401; **403 when role ≠ doctor**; 200 updates notes when doctor; 400 invalid; 404 missing.

**Repo (mock fetch)**
5. `lib/data/visits.test.ts` — list builds `/api/visits?clinicId&range`; create POSTs; addNote PATCHes `/api/visits/{id}`.

**Presentational (RTL)**
6. `components/visits/visit-list-item.test.tsx` — shows patient name + reason + type; links to `/patients/{patientId}`.
7. `components/patients/visit-timeline.test.tsx` (extend) — renders a Note action only when `onAddNote` is provided.

Dialogs, picker, pages = build + manual verified.

---

## 9. Build order

1. `shadcn add textarea input-group alert-dialog` + `pnpm format`.
2. `visit-utils` + schema additions (tests → impl).
3. `/api/visits` + `/api/visits/[id]` (tests → impl); `serialize` + `types` additions.
4. `visitsRepo` (tests → impl).
5. `use-role`, `use-visits`, `use-visit-mutations`.
6. `visit-list-item` (test) → `visits-page`; `patient-picker`.
7. `new-visit-dialog`; `visit-note-dialog`; extend `visit-timeline` (test) + wire `patient-profile`.
8. `pnpm test` + `build` + `lint`; verify queries against Neon; responsive.

---

## 10. Exit criteria (Phase 3 DoD)

- [ ] `pnpm test` green (all prior + new); `build` + `lint` clean; Neon queries verified.
- [ ] New Visit from a profile → visit appears in that patient's timeline immediately; patient status flips New→Returning after the 2nd.
- [ ] New Visit from the Visits page (pick a patient) → appears under Today.
- [ ] Type auto-set correctly (first ever = New, else Follow-up).
- [ ] Doctor can add/edit a note on a visit; the note shows in the timeline. Reception sees no note action, and the API rejects reception PATCH (403).
- [ ] Visits page shows Today + Recent for the current clinic; switching clinics re-scopes; rows link to profiles.
- [ ] ≤ 3 clicks to log a visit from a profile; responsive; no console errors.

---

## 11. ≤ 3-click check

- **New Visit (profile):** [+ New Visit] (1) → reason → Save (2). **New Visit (Visits page):** [+ New Visit] (1) → pick patient → reason → Save. **Add note (doctor):** [Note] on a timeline entry (1) → type → Save (2).

---

## 12. Open questions / not assuming

1. **Recent window** — "Recent" = last **20** visits (desc), regardless of day. OK, or a time window (e.g. last 7 days)?
2. **Reason required?** — a visit requires a non-empty **reason**. OK, or make reason optional (just log the visit)?
3. **visitedAt** — defaults to **now** on create (no date/time picker this phase). OK for MVP?

*(Sensible defaults chosen above; I'll proceed unless you say otherwise.)*

---

## 13. Where YOU test manually

- Open a patient → New Visit → save → see it top of the timeline; status badge updates after a 2nd visit.
- As **doctor**: add a note to a visit → it shows under that entry; edit it.
- As **reception**: confirm there's no note action (and it's genuinely blocked, not just hidden).
- Visits page → Today/Recent populate for the current clinic; New Visit with the picker; switch clinics to re-scope.
