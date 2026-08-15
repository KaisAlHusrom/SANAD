---
description: Build the next phase of the Sanad Tech platform (reads rules + PROGRESS + plans, builds TDD, verifies)
---

# /continue-plan — build the next phase

You are continuing the **Sanad Tech (سند التقنية)** build. Work the spine in `docs/plans/02-mvp.md`, one phase at a time, to the binding rules.

> **⚠️ We are building the FINAL product — NOT an MVP.** U0 in `docs/rules.md` is the standing directive and it outranks everything here. Needs another session to do properly → **split the work, never lower the bar**.

## Procedure

1. **Load context — in this order, and only this much (U31):**
   - `docs/rules.md` — the binding law (MUST/NEVER). It wins over everything.
   - `docs/PROGRESS.md` — current phase, next step, decisions, open issues. **This names the current phase**; the `## MVP phase checklist` in it is the *only* place phases are checked off.
   - `docs/plans/02-mvp.md` — **read ONLY the current phase's `## Pn` section**, not the whole file (`sed -n '/^## P8.9/,/^## /p'` or equivalent). It contains no checkboxes; do not scan it for one.
   - The deep plan(s) that phase links — again, **only the relevant section**.
   - **NEVER** read `docs/PROGRESS-archive.md` or `docs/rules-changelog.md` as part of startup. They are archives; grep them only when you need a specific past decision.

2. **Confirm scope.** State which phase you're building and its **"Done when"** acceptance criterion. If the previous phase's "Done when" isn't actually met, finish that first.
   **Then size it (U0 + E):** if the phase implies more than ~6–8 files of new logic, or more than one new service + one new admin surface, **split it into lettered sub-phases** (`P8.9.A`, `P8.9.B`) in `docs/plans/02-mvp.md` first, each with its own "Done when", and build only the first this session. Splitting is expected, not a failure — same scope, same bar, shorter sessions.

3. **Build — TDD (TDD1).** For each unit of work: **write the failing test first** (Jest/Vitest), then the code to pass it. Honor every relevant rule:
   - Backend: per-service own DB (MS5), DDD layering, base/translatable repos (N1/N5), contracts from `libs/contracts` (U3), `.strict()` Zod validation (N7), never `new Date()` (N3), cross-service via RMQ request/reply + events+Outbox + idempotent consumers (MS2/MS3/MS6), services never import services (MS1).
   - Frontend: logic in `use-*` hooks (U5), one API layer + envelope unwrap (F1), skeleton→error→empty→data (F2), tokens only (U6), full RTL + ar-default i18n parity (U7/U8/F13), settings null-safe to the leaf (F7), reuse-before-create (F9).
   - Everything: no `any` (U4), one concept per file (U10), `APP_ENV` config (U19/OPS1).
   - DB-touching tests run against the service's **`*_test`** DB (TDD2).

4. **Document (DOC1).** Create/update the module's colocated `<module>.md` in the **same change** (purpose, entities, contracts, events emitted/consumed, settings used).

5. **Update `PROGRESS.md`** — what you did, what's next, any decision (with date), any issue. Do **not** check the phase box yet.

6. **Verify — two tiers (U12).** Give each agent a **distilled brief** in its prompt (phase ID, "Done when", the projects you changed, the rule IDs in scope). **Do not tell them to re-read `rules.md` + `PROGRESS.md` + the plans** — you already hold that context; they read a rule's exact text only if they need it.
   - **a. Mid-phase**, after each work chunk: `nx affected -t typecheck lint test --base=<sha at phase start> --parallel=2`. Fast, same targets, scoped to what changed.
   - **b. At phase close**, with the Docker stack **DOWN** (OPS5): run the **`verifier`** agent — full `nx run-many -t typecheck lint test build --parallel=2`. It must report **PASS**. If FAIL, fix and re-run.
   - **c. Then bring the stack UP on the phase's profile** (`infra/scripts/dev-up.sh core <profile…>`) and run the **`boot-verifier`** agent — it must report **UP** (U29). Never run host `nx` while the stack is up, and never hold both spikes at once.

7. **Close the phase.** Only after **both** b and c are green: check the phase `- [x]` in the `## MVP phase checklist` in `docs/PROGRESS.md` and state the next phase. Add a session entry of **≤15 lines** (U31) and move the previous phase's entries to `docs/PROGRESS-archive.md`. Touch `docs/rules.md` **only** if a bug revealed a genuinely reusable, platform-wide rule (U13) — not for a one-off. Keep the law lean.

8. **Ship it.** Run **`/ship`** — commit the session's work in conventional-commit chunks and push to `origin main`.

## Guardrails
- One phase at a time, in order. Don't skip ahead or scaffold future feature code.
- Never bypass hooks (`--no-verify` forbidden, U12/OPS4).
- If a needed decision isn't in the plans/PROGRESS, ask — don't guess on architecture.
- Reference projects (`smart-restaurant`, `Bishola/docs/v2`, `bishola-deployment-v2`) are **read-only patterns** — learn, never import (U14).
