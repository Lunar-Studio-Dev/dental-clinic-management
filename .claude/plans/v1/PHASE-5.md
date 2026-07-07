# Phase 5 — Polish & Accessibility (Detailed Technical Plan)

> Parent: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md). Authoritative for Phase 5 only.
> **Method:** TDD where there's logic; polish/glue is build + manual verified.
> **Rule:** no assumptions — open items live in §10, not in code.
> **STATUS: ✅ COMPLETE — MVP fully done (Phases 0–5).**

---

## ✅ Implementation Review (post-build)

**Verification gate (all green):** `pnpm test` → **117 passed** (29 files; +3 new) · `pnpm build` → compiled + TS pass · `pnpm lint` (Biome) → clean · dev server serves; `<html suppressHydrationWarning>` + next-themes pre-paint script confirmed.

**What shipped:** reusable `ErrorState` (tested) driving the route boundary (`(app)/error.tsx`), root boundaries (`not-found.tsx`, `global-error.tsx`), and **query error+retry** branches on every client view (patients, profile, visits, both dashboards); **dark-mode** via next-themes (Light/Dark/System `ModeToggle` in the top bar; `.dark` tokens already defined); **Framer Motion** `FadeIn` (reduced-motion aware) wrapping each page; **a11y** skip-link + `<main id="main">` landmark + `aria-label`s; **per-page titles**.

**Deviations / decisions:** default theme **Light** (System available in the toggle); `motion` package (Framer Motion) + `next-themes` added; `global-error` is intentionally provider-free (renders its own html/body). §10 defaults taken.

**DoD:** automated criteria met. Remaining = manual browser checks: dark toggle persistence, reduced-motion, skip-link focus, and the not-found page (visible to signed-in users; unauthenticated unknown routes correctly redirect to sign-in).

---

## 🎉 MVP COMPLETE (Phases 0–5)

Foundation/auth · shell · patients · visits · dashboards · polish — all shipped, each TDD-built and reviewed. **117 tests**, clean build + lint, real Clerk + Neon, calm-teal theme (light + dark), Framer Motion, full a11y baseline.

---

## 1. Objective

Final polish so the app feels like Linear/Notion and is accessible: consistent **error handling** (boundaries + query retry states), a **dark-mode toggle**, subtle **Framer Motion** content transitions (reduced-motion aware), an **a11y pass** (skip link, labels, focus, AA contrast), and **per-page titles**. Much of the planned polish (skeletons, empty states, toasts) already shipped in Phases 1–4 — this phase fills the gaps.

**In scope:** error/not-found boundaries; query error+retry UI on every client view; `next-themes` dark toggle; `motion` FadeIn transitions; skip-link + aria labels + `<main>` landmark; page metadata; a consistency sweep.

**Out of scope:** new features, deploy config (separate), automated Lighthouse in CI.

---

## 2. Decisions (from user)

1. **Framer Motion** (`motion` package) — subtle content fade/slide-in per view; **respects `prefers-reduced-motion`** (renders static when reduced).
2. **Dark-mode toggle** — `next-themes` (`attribute="class"`, the theme already ships `.dark` tokens); Light / Dark / System toggle in the top bar.

---

## 3. Diagrams (Phase 5)

**Error handling layers**
```
render error in a route  ─► app/(app)/error.tsx (boundary, "Retry"→reset)
unknown URL              ─► app/not-found.tsx (404 + link home)
fatal root error         ─► app/global-error.tsx
query (fetch) error      ─► <ErrorState onRetry={refetch}/> inside each client view
```

**Theme + motion wiring**
```
app/layout.tsx <html suppressHydrationWarning>
  └ Providers: ClerkProvider ▸ QueryClientProvider ▸ ThemeProvider(next-themes) ▸ TooltipProvider
top bar: … [☀/🌙 ModeToggle] [UserButton]
page.tsx (server, +metadata) ─► <FadeIn> (motion, reduced-motion aware) ─► <View/> (client)
```

---

## 4. Files

```
app/
  (app)/error.tsx            # client boundary → <ErrorState onRetry={reset}>
  not-found.tsx              # 404
  global-error.tsx           # root fatal boundary
  providers.tsx              # + ThemeProvider (next-themes)
  layout.tsx                 # <html suppressHydrationWarning>
  (app)/layout.tsx           # skip-link + <main id="main">
  (app)/{dashboard,patients,patients/[id],visits}/page.tsx  # wrap child in <FadeIn> + export metadata

components/
  error-state.tsx            # reusable Empty-based error + Retry  (TESTED)
  motion/fade-in.tsx         # motion.div fade/slide, useReducedMotion
  shell/mode-toggle.tsx      # DropdownMenu Light/Dark/System (next-themes)
  {patients,visits,dashboard}/*  # add isError → <ErrorState onRetry={refetch}> branches

lib/ (none new)
```
**Deps:** `pnpm add motion next-themes`. **shadcn:** none new (dropdown-menu already present).

---

## 5. Detail

- **ErrorState** — `Empty` with title/description + optional `onRetry` button. Used by the route boundary and every query-error branch.
- **Query error states** — PatientsPage, PatientProfile, VisitsPage (per section), Reception/Doctor dashboards: when `query.isError`, render `<ErrorState onRetry={query.refetch}/>` instead of empty/blank.
- **FadeIn** — `"use client"`; `useReducedMotion()` → if reduced, render a plain wrapper; else `motion.div` `initial{opacity:0,y:8} animate{opacity:1,y:0}` ~0.25s. Wrap each view at the `page.tsx` level (re-mounts per navigation → animates on route change).
- **Dark mode** — `ThemeProvider attribute="class" defaultTheme="light" enableSystem`; `<html suppressHydrationWarning>`. `ModeToggle` = `DropdownMenu` with Sun/Moon icon → `setTheme("light"|"dark"|"system")`, `aria-label="Toggle theme"`. Placed in the top bar.
- **A11y** — skip link (`sr-only focus:not-sr-only`) → `#main`; `<main id="main">` landmark; `aria-label` on icon-only controls (ModeToggle; verify SidebarTrigger has its built-in sr-only); ensure Dialog/Sheet titles exist (they do); AA contrast already from the token palette.
- **Metadata** — `export const metadata = { title: "Patients · ClinicOS" }` etc. per route.
- **Consistency sweep** — confirm every list/detail has loading + empty + error; primary actions `size="lg"`; no dead ends; trim any ERP-creep.

---

## 6. TDD plan

1. `components/error-state.test.tsx` — renders title + description; shows a **Retry** button only when `onRetry` given; clicking calls it.
2. `components/motion/fade-in.test.tsx` — renders its children (smoke; motion vs static both output the content). *(matchMedia mocked in `vitest.setup.ts`.)*

The rest (boundaries, theme toggle, transitions, metadata, aria) = build + manual verified — no meaningful pure logic.

---

## 7. Build order

1. `pnpm add motion next-themes`; add `matchMedia` mock to `vitest.setup.ts`.
2. `ErrorState` (test → impl); `FadeIn` (impl + smoke test).
3. Error boundaries: `(app)/error.tsx`, `not-found.tsx`, `global-error.tsx`.
4. `next-themes` ThemeProvider in `providers.tsx` + `suppressHydrationWarning`; `ModeToggle` → top bar.
5. Wrap views in `<FadeIn>` + add `metadata` per `page.tsx`.
6. Add `isError` → `<ErrorState>` branches to all client views.
7. Skip-link + `<main id="main">` + aria labels.
8. `pnpm test` + `build` + `lint`; manual light/dark + reduced-motion + keyboard/mobile pass.

---

## 8. Exit criteria (Phase 5 DoD)

- [ ] `pnpm test` green (all prior + new); `build` + `lint` clean.
- [ ] A thrown error in a route shows the boundary with a working **Retry**; an unknown URL shows a 404 with a link home.
- [ ] Every list/detail/dashboard shows a proper **error + retry** state when its query fails (not a blank/empty).
- [ ] Dark-mode toggle switches Light/Dark/System; both themes render correctly (no unreadable contrast); no hydration warning.
- [ ] Content fades in subtly on navigation; with `prefers-reduced-motion` it's static.
- [ ] Skip link works; icon-only controls have labels; overlays trap focus; keyboard nav works.
- [ ] Per-page browser titles; mobile pass; no console errors; nothing ERP-ish crept in.

---

## 9. Manual test (you)

- Toggle **dark mode** (top bar) → whole app restyles; reload → persists.
- Turn on OS **Reduce Motion** → transitions become instant.
- Tab from the top of a page → **Skip to content** appears; Enter jumps to main.
- (Optional) throw/disconnect to see the error boundary + retry.

---

## 10. Open questions / not assuming

1. **Theme default** — default to **Light** with a System option in the toggle. OK, or default to System?
2. **Motion intensity** — subtle (opacity + 8px rise, 0.25s). OK, or none-but-overlays?
