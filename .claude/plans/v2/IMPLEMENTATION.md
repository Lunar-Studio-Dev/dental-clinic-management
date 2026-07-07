# Clinic Management System — v2 Implementation Plan

> **STATUS: ✅ IMPLEMENTED (V2.0–V2.2), 150 tests green, build + lint clean.**
>
> **Implementation review:**
> - **V2.0 (identity + enforcement):** `Staff` model (`id`=Clerk userId, `role`, `clinicId?`) + `StaffRole` enum, pushed to Neon; `scripts/sync-staff.ts` backfill; **`resolveClinicScope`** wired into every clinic route (`patients`, `patients/[id]`, `visits`, `metrics`) — doctors roam, receptionists forced to their clinic (403 on cross-clinic, incl. forged bodies), unassigned auto-defaults; Clerk **webhook** `/api/webhooks/clerk` (`staffActionFromEvent` mapper) + public matcher.
> - **V2.1 (receptionist lock):** `/api/me/clinic` + `useMyClinic`/`useActiveClinicId`; top-bar switcher is now **role-aware** (read-only `🏥 clinic` label for receptionists, switcher for doctors); all data views scope via `useActiveClinicId`.
> - **V2.2 (management page):** `/clinic` = tabbed **Clinic Management** (doctor-only) — Clinics tab (stats cards via `/api/clinics/overview` + **add/edit** via `POST /api/clinics`, `PATCH /api/clinics/[id]`) and Staff tab (assign receptionists via `POST /api/staff/[id]/assign`, one-clinic-per-receptionist).
> - **V2.3 (polish):** loading/error/empty states + a11y labels folded into the above.
> - **Second seed receptionist** (Sam Kapoor) added; all 3 staff backfilled into `Staff`.
> - **Deviations:** `getRole()` still reads Clerk (per §12.3); default clinic = earliest by `createdAt`; webhook handler param typed `NextRequest` (Clerk's `RequestLike`).
> - **⚠ Needs your setup for live sync:** add `CLERK_WEBHOOK_SIGNING_SECRET` to `.env.local` + configure the webhook in Clerk Dashboard (user.created/updated/deleted → `https://<host>/api/webhooks/clerk`). Until then, `pnpm sync:staff` keeps `Staff` current for local dev.

---

> Builds on the v1 MVP (see `../IMPLEMENTATION.md` + `../PHASE-0..5.md`).
> **Scope:** a doctor-facing **Clinic Management** system (clinic CRUD + stats) and a
> **receptionist ⇄ clinic assignment** model that makes clinic scope an **enforced
> authorization boundary** — receptionists are locked to one clinic (read-only), doctors
> assign them and switch clinics freely.
> **This document is analysis + design only. No code until approved.**

---

## 0. Requirements (from the request)

1. The `/clinic` page becomes a real **clinic management system** (doctor-only).
2. A **doctor can assign a clinic to a receptionist**.
3. **One receptionist can be assigned to exactly one clinic.**
4. A receptionist can **only act on their assigned clinic** (enforced, not just UI).
5. A receptionist **cannot change clinic** — the top bar shows the assigned clinic **name only** (no switcher).
6. **Doctors: full clinic CRUD** (create/edit clinics) + assignments + clinic-wise stats.
7. **Unassigned receptionist → auto-assigned a default clinic** (Clinic 1) until a doctor changes it.
8. Store the assignment as a **`receptionistId` column on the Clinic table** — *pending the identity analysis in §1, which justifies what that column can reference.*

---

## 1. DEEP ANALYSIS — how staff users are created, stored, and synced (the prerequisite)

> The request asks us to justify, *before* adding `Clinic.receptionistId`: how is a user created, is it stored in our DB, and is it synced to Clerk — and if not, what are the options. This section answers that and drives the data-model decision.

### 1.1 Current reality (verified in the codebase)

| Question | Answer today |
|----------|--------------|
| **Who are "users"?** | **Staff only** — doctors & receptionists who sign in. **Patients are NOT users** (they never log in; they're rows in the `Patient` table). |
| **How is a staff user created?** | Two ways: (a) **seed** — `scripts/seed-clerk.ts` calls `@clerk/backend` `createUser(...)` with email/password + `publicMetadata.role`; (b) **sign-up** — Clerk's `<SignUp/>` UI (currently anyone who signs up has *no* role until set). |
| **Where does identity live?** | **Clerk is the system of record** for identity, auth, session, and **role** (`publicMetadata.role`). |
| **Is the staff user stored in our Neon DB?** | **No.** The schema has only `Clinic`, `Patient`, `Visit`. **The DB has zero knowledge of staff users.** `getRole()` reads Clerk (`currentUser()`), never the DB. |
| **Is Clerk synced to the DB (or vice-versa)?** | **No sync exists.** No webhooks, no `svix`, no `User`/`Staff` table. Clerk and the DB are disjoint except that `Visit`/`Patient` rows are clinic-scoped, not user-scoped. |

**Consequence:** there is **no DB identifier for a staff user** to reference. A `Clinic.receptionistId` column must reference *something stable*. The only stable staff identifier that exists is the **Clerk user id** (`user_2ab…`). So the real question is: **do we (a) store the raw Clerk id string, or (b) mirror staff into a DB table and reference that?**

### 1.2 The options (and trade-offs)

**Option A — Store the Clerk user id as an opaque string (no user table, no sync).**
`Clinic.receptionistId String? @unique` holds the Clerk id directly.
- ✅ Simplest; zero new infrastructure; matches the request literally.
- ✅ "One receptionist → one clinic" enforced by a `@unique` constraint on the column.
- ➖ **No referential integrity** (DB can't verify the id is a real/receptionist user).
- ➖ To render the assignment UI (list receptionists, show names), we must **call the Clerk API** (`users.getUserList({...})`) every time — names/emails are never in the DB.
- ➖ Only **one receptionist per clinic** (single column). Fine if that's the intent; blocks "many receptionists at one desk."

**Option B — Mirror staff into a DB `Staff` table, kept in sync from Clerk via webhooks (recommended).**
A `Staff` row per Clerk staff user (`id = clerkUserId`, `name`, `email`, `role`, `clinicId?`). Assignment lives as **`Staff.clinicId`** (not on Clinic).
- ✅ **Referential integrity** (`Staff.clinicId → Clinic.id`), real FKs.
- ✅ The doctor's assignment UI + clinic rosters are **plain SQL joins** (fast, no Clerk API per render).
- ✅ Natural constraints: `Staff.clinicId` (single) ⇒ **each receptionist has exactly one clinic**; **many receptionists can share a clinic** (the more realistic model).
- ✅ Server-side clinic authorization reads one indexed row (`Staff` by id) — cheap on every request.
- ➖ Requires **Clerk webhooks** (`user.created/updated/deleted`) → upsert `Staff`; a verified endpoint (`svix` / `verifyWebhook`); and a **backfill** of existing users.
- ➖ Two stores to keep coherent (mitigated: Clerk is source of truth for identity/role; DB mirrors it).

**Option C — Just-in-time (JIT) sync (no webhooks).** On each authenticated request, upsert the *current* user's `Staff` row from session claims.
- ✅ No webhook infra.
- ➖ **Only syncs users who have logged in.** The doctor can't assign a receptionist who has never logged in (no `Staff` row yet). Would still need a Clerk list call for the picker. Incomplete on its own.

**Option D — Keep assignment in Clerk `publicMetadata.assignedClinicId` (no DB column).**
- ✅ No DB change; consistent with role storage.
- ➖ The request explicitly wants a DB column; and clinic rosters/joins aren't SQL-queryable. **Rejected per the request.**

### 1.3 Recommendation

**Adopt Option B (Staff mirror synced via Clerk webhooks), with the assignment modeled as `Staff.clinicId`.**

Rationale, tied to the requirements:
- The request's intent — "assign a clinic to a receptionist", "one receptionist → one clinic", "act only on the assigned clinic" — is fundamentally a **property of the staff member**, so it belongs on a **Staff** row, not on Clinic. `Staff.clinicId` gives *exactly* "one clinic per receptionist" while allowing a clinic to have several receptionists (realistic) — a strict superset of what `Clinic.receptionistId` can express.
- It makes clinic scope **enforceable cheaply** on every API call (one indexed `Staff` lookup) — essential for requirement #4.
- It unlocks the doctor's clinic management screens (rosters, "who staffs Clinic 2", stats) as **SQL**, no Clerk API fan-out.

**✅ DECIDED (you): Option B — `Staff` mirror table + `Staff.clinicId`, synced from Clerk via webhooks.** Option A (`Clinic.receptionistId`) is retained in §2.2 only as a documented alternative; the rest of this plan is built on Option B.

> Net answer to "is the user synced to Clerk?": **No, not today.** The recommended solution is a **thin, one-way Clerk→DB mirror via webhooks** (Clerk stays the source of truth for identity/role; the DB gets a queryable `Staff` shadow used only for assignment, rostering, and authorization).

---

## 2. Data model changes

### 2.1 Recommended (Option B)

```prisma
model Staff {
  id        String   @id          // = Clerk userId (no separate PK)
  email     String   @unique
  name      String
  role      Role                    // enum: RECEPTIONIST | DOCTOR (mirrors Clerk)
  clinicId  String?                 // assignment; null = unassigned (→ auto-default at runtime)
  clinic    Clinic?  @relation(fields: [clinicId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([clinicId])
  @@index([role])
}

enum Role { RECEPTIONIST DOCTOR }

model Clinic {
  // …existing…
  staff     Staff[]                 // receptionists/doctors assigned here
}
```
- **One clinic per receptionist:** `Staff.clinicId` is singular ⇒ guaranteed by construction.
- **Many receptionists per clinic:** allowed (a `Clinic` has many `Staff`).
- Doctors: `clinicId` left null (they roam) — see §3.

### 2.2 Literal alternative (Option A, if chosen)

```prisma
model Clinic {
  // …existing…
  receptionistId String? @unique    // Clerk userId; @unique ⇒ one receptionist ↔ one clinic
}
```
- No `Staff` table, no webhooks. Names come from Clerk at render time. **Max one receptionist per clinic.**

### 2.3 Migration

- `prisma db push` (MVP convention). Backfill `Staff` from the 2 seeded Clerk users (§9).
- Assign the seeded receptionist to **Clinic 1** (the default) so the app has a valid state day one.

---

## 3. Authorization model — clinic scope as a boundary

Today every clinic-scoped route trusts the client's `?clinicId=…` (only `userId` is checked). That's the security hole this feature must close.

**New server helper `resolveClinicScope(requestedClinicId)`** (used by every clinic-scoped route):
```
auth() → userId (401 if none)
role   = getRole()            // Clerk
if role === "doctor":
    return requestedClinicId  // doctors may target any clinic
if role === "receptionist":
    assigned = Staff.clinicId (or auto-default → §7.3)
    if requestedClinicId && requestedClinicId !== assigned → 403 Forbidden
    return assigned           // force scope to their clinic, ignore/override client
```

**Applied to:** `/api/patients` (list/create), `/api/patients/[id]` (implicitly via patient's clinic), `/api/visits` (list/create), `/api/metrics`, and the new clinic-management routes. Create routes must also **stamp the resolved clinicId** (a receptionist can't create a patient/visit in another clinic even by forging the body).

> **Defense in depth:** the client already won't send a wrong clinicId for receptionists (no switcher), but the server never trusts that.

---

## 4. Clerk ⇄ DB sync design (Option B)

**One-way mirror, Clerk → DB `Staff`.**

1. **Webhook endpoint** `POST /api/webhooks/clerk` — verify with `verifyWebhook` (svix signature via `CLERK_WEBHOOK_SIGNING_SECRET`). Handle:
   - `user.created` / `user.updated` → upsert `Staff` (id, email, name, `role` from publicMetadata).
   - `user.deleted` → delete `Staff` (and null out any clinic references).
   - Configure in Clerk Dashboard → Webhooks; make the route **public** in `proxy.ts` matcher.
2. **Backfill** (one-off script `scripts/sync-staff.ts`) — list all Clerk users, upsert `Staff`. Run once + after seeding.
3. **Role source of truth stays Clerk.** The `Staff.role` mirror is for querying/rostering; `getRole()` still reads Clerk for auth decisions (or we switch it to read `Staff` for fewer Clerk calls — optional optimization).
4. **New env:** `CLERK_WEBHOOK_SIGNING_SECRET`. New dep: `svix` (or use `verifyWebhook` from `@clerk/nextjs/webhooks`). *(We'll consult the `clerk-webhooks` skill during implementation.)*

*(Option A skips all of §4 — no sync; the assign UI reads Clerk live.)*

---

## 5. API surface (all Clerk-guarded; clinic routes use `resolveClinicScope`)

```
# Clinic management (DOCTOR only unless noted)
GET   /api/clinics                 → clinics + per-clinic stats + assigned staff   (list; all roles read)
POST  /api/clinics                 → create clinic {name, address}                 (doctor)
PATCH /api/clinics/[id]            → edit {name, address}                          (doctor)
GET   /api/staff?role=receptionist → staff list (id, name, email, clinicId)        (doctor)
POST  /api/staff/[id]/assign       → { clinicId } assign a receptionist to a clinic (doctor)
                                     enforces one-clinic-per-receptionist (set Staff.clinicId)

# Identity sync
POST  /api/webhooks/clerk          → Clerk→Staff upsert (public, signature-verified)

# Existing routes — now clinic-authorized
GET/POST  /api/patients            → clinicId via resolveClinicScope
GET/PATCH /api/patients/[id]
GET/POST  /api/visits
GET       /api/metrics
GET       /api/me/clinic           → { clinicId, clinicName, canSwitch } for the top bar
```
- `/api/me/clinic` powers the receptionist's read-only clinic label and the doctor's switcher enablement.
- Per-clinic stats reuse `computeMetrics`/lightweight counts (patients, visits, today, new-vs-returning).

---

## 6. UI / UX

### 6.1 Doctor — Clinic Management page (`/clinic`)

Tabs (shadcn `Tabs`): **Clinics** · **Staff**.

**Clinics tab** — cards/table with stats + edit; header "Add clinic".
```
Clinic Management                                                 [ + Add clinic ]
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ Clinic 1            [ Edit ]  │  │ Clinic 2            [ Edit ]  │
│ 12 MG Road, Bengaluru        │  │ 44 Park Street, Kolkata      │
│ ─────────────────────────    │  │ ─────────────────────────    │
│ Patients  50   Visits  254   │  │ Patients  50   Visits  246   │
│ Today 4  · New/Return 20/30  │  │ Today 3  · New/Return 22/28  │
│ Receptionists: Riya R.       │  │ Receptionists: —             │
└──────────────────────────────┘  └──────────────────────────────┘
```

**Add / Edit clinic** (Dialog):
```
        ┌──── Add clinic ──────────────┐
        │ Name*     [________________] │
        │ Address   [________________] │
        │               [Cancel][Save] │
        └──────────────────────────────┘
```

**Staff tab** — receptionists with an inline clinic assignment `Select`:
```
Staff · Receptionists
┌───────────────────────────────────────────────────────────────────────┐
│ Name          Email                    Assigned clinic                 │
│ Riya R.       reception@clinicos.app    [ Clinic 1 ▾ ]  ← doctor sets   │
│ Sam K.        sam@clinicos.app          [ Unassigned ▾ ]               │
└───────────────────────────────────────────────────────────────────────┘
  changing the Select → POST /api/staff/[id]/assign → toast "Assigned to Clinic 1"
  (one receptionist can hold only one clinic — the Select is single-value)
```

### 6.2 Receptionist — read-only clinic (everywhere)

Top bar: the **clinic switcher is replaced by a static label** (no dropdown).
```
▣ ClinicOS   [ 🔍 Search… ⌘K ]        🏥 Clinic 1   «Reception»   (👤)
                                       └ read-only (no ▾), = assigned clinic
```
Doctor keeps the switcher:
```
▣ ClinicOS   [ 🔍 Search… ⌘K ]        [ Clinic 1 ▾ ]  «Doctor»   (👤)
```

### 6.3 Unassigned receptionist (before auto-default resolves, or edge cases)

If somehow unassigned and no default is resolvable:
```
┌──────────────── No clinic assigned ────────────────┐
│  You haven't been assigned to a clinic yet.         │
│  Ask a doctor to assign you from Clinic Management.  │
└─────────────────────────────────────────────────────┘
```
Per requirement #7, the default path **auto-assigns Clinic 1**, so this screen is a rare fallback.

---

## 7. User flows

### 7.1 Doctor assigns a receptionist to a clinic
```
Doctor → /clinic → Staff tab → row "Riya R." → clinic Select → "Clinic 2"
      → POST /api/staff/{id}/assign {clinicId:"clinic_2"}  (doctor-only, 403 else)
      → Staff.clinicId = clinic_2 (unique per receptionist ⇒ replaces any prior)
      → toast "Riya assigned to Clinic 2"
Next time Riya loads the app → her scope is Clinic 2 (top bar shows "Clinic 2", read-only).
```

### 7.2 Receptionist works within scope (enforced)
```
Receptionist (assigned Clinic 1) → any page
  client: currentClinic is FORCED to Clinic 1 (no switcher); ⌘K + lists scoped to Clinic 1
  server: every /api/* runs resolveClinicScope → forces/validates Clinic 1
  attempt to hit /api/patients?clinicId=clinic_2 (forged) → 403
```

### 7.3 Unassigned receptionist auto-default
```
Receptionist logs in, Staff.clinicId = null
  → on first authenticated resolve, assign default (first clinic / "Clinic 1"): Staff.clinicId = clinic_1 (persist)
  → from then on scoped to Clinic 1 until a doctor reassigns
  (doctor sees them as "Clinic 1" in the Staff tab immediately)
```

### 7.4 Doctor creates/edits a clinic
```
Doctor → /clinic → Clinics tab → [+ Add clinic] → name/address → Save
  → POST /api/clinics → new clinic appears; available in switcher + assignment Selects
Edit → PATCH /api/clinics/[id] → name/address update.
```

---

## 8. Changes to existing v1 features

| Area | Change |
|------|--------|
| **Top bar** | `ClinicSwitcherContainer` becomes role-aware: **doctor** → the `Select` switcher; **receptionist** → a read-only `🏥 <clinic name>` label from `/api/me/clinic`. |
| **`useCurrentClinicId` / Zustand** | For receptionists, `currentClinicId` is **forced** to the assigned clinic (ignore/replace any persisted value); switching disabled. Doctors unchanged. |
| **All clinic-scoped API routes** | Insert `resolveClinicScope`; create routes stamp the resolved clinicId. |
| **`/clinic` page** | Replace the Phase-5 placeholder with the management UI (§6.1); keep the doctor-only route guard. |
| **Nav** | `Clinic` item already doctor-scoped (done) — unchanged. |
| **Metrics/dashboards** | Reception dashboard now always reflects the assigned clinic (no switching); doctor dashboard follows the switcher. Logic unchanged, scope source changes. |

---

## 9. Seed & migration changes

- **`Staff` backfill:** after `seed:clerk`, run `scripts/sync-staff.ts` to mirror the 2 seed users into `Staff` (role from metadata).
- **Default assignment:** set the seeded **receptionist → Clinic 1**; doctor stays unassigned (roams).
- **Constants:** optionally add a second receptionist to `SEED_USERS` to demo "unassigned → assign" (flagged).
- **Env:** add `CLERK_WEBHOOK_SIGNING_SECRET` to `.env.local` (you'll provide it from the Clerk dashboard when we implement).

---

## 10. Testing plan (TDD, Vitest+RTL)

**Pure/logic (unit):**
- `resolveClinicScope` — doctor passes through; receptionist forced to assigned; mismatch → 403; unassigned → default.
- assignment invariant — setting a receptionist's clinic replaces the old (one-clinic-per-receptionist).
- webhook payload → `Staff` upsert mapping (created/updated/deleted).
**API (mocked prisma/clerk):** `/api/clinics` CRUD (doctor-gate 403), `/api/staff` list, `/api/staff/[id]/assign` (doctor-only, sets clinicId), patients/visits/metrics now 403 on cross-clinic receptionist access.
**Presentational (RTL):** clinic card (stats), staff-row assignment select, receptionist read-only clinic label.
**Manual:** doctor assign flow; receptionist locked-scope + forged-request 403; unassigned auto-default; clinic create/edit; webhook round-trip.

---

## 11. Phased rollout (each independently shippable)

- **V2.0 — Identity foundation:** `Staff` model + Clerk webhook sync + backfill + `resolveClinicScope` wired into existing routes (no UI yet). *Closes the security gap first.*
- **V2.1 — Receptionist lock:** role-aware top bar (read-only clinic label), forced client scope, auto-default. 
- **V2.2 — Clinic Management page:** Clinics tab (stats + add/edit) + Staff tab (assignment).
- **V2.3 — Polish:** empty/error/loading states, a11y, tests, docs.

---

## 12. Decisions — resolved

1. **Assignment home** — ✅ **Option B: `Staff.clinicId`** (mirror table). Not `Clinic.receptionistId`.
2. **Sync mechanism** — ✅ **Clerk webhooks** (`user.created/updated/deleted` → upsert `Staff`), signature-verified; + a one-off backfill.
3. **`getRole()` source** — *default:* keep reading **Clerk** for auth decisions (unchanged); the `Staff.role` mirror is for rostering/queries only. (Optimizing auth to read `Staff` can come later.) ⟵ minor, flag if you disagree.
4. **Default clinic** — *default:* **the earliest clinic by `createdAt`** (currently Clinic 1). Robust to create/delete. ⟵ minor.
5. **Doctor assignment** — *default:* **any doctor may assign any receptionist** (doctors act as admins).
6. **Second seed receptionist** — *default:* **add one** (`SEED_USERS`) so the assign flow is demoable (one assigned, one to assign). ⟵ minor, say the word to skip.

*(3, 4, 6 are low-stakes defaults I'll proceed with unless you object.)*

---

## 13. Decisions captured (from you)

- Clinic page = **full clinic CRUD** + assignments + stats.
- Unassigned receptionist = **auto-assign default clinic** (earliest by `createdAt`).
- Assignment stored in the **DB** as **`Staff.clinicId`** (Option B mirror table) — not Clerk metadata.
- Clerk → DB sync via **webhooks** (source of truth = Clerk).
- Receptionist clinic is **read-only** (name only, no switcher); scope **enforced server-side** via `resolveClinicScope`.

---

*Next step: on your go, I'll write the detailed **V2.0 phase plan** (identity foundation: `Staff` model + Clerk webhook sync + backfill + `resolveClinicScope` wired into existing routes) — the same plan → review → TDD-build → review cycle as v1. No code until you say go.*
