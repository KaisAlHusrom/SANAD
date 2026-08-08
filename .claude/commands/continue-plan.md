---
description: Build the next phase of the Sanad Tech platform (reads rules + PROGRESS + plans, builds TDD, verifies)
---

# /continue-plan — build the next phase

You are continuing the **Sanad Tech (سند التقنية)** build. Work the spine in `.claude/plans/02-mvp.md`, one phase at a time, to the binding rules.

> **⚠️ We are building the FINAL product — NOT an MVP.** `02-mvp.md` is a **filename**, not a quality bar (owner directive, 2026-07-20). **NEVER** narrow a scope, ship a weaker surface, leave an English string, or defer an axis on the grounds that "it's the MVP" / "good enough for now" — that reasoning is retired. Each phase ships its scope finished on every axis (U21) and every state (U23); a cross-cutting gap is fixed **platform-wide**, never patched only where it was noticed. Needs another session to do properly → **split the work, never lower the bar**.

## Procedure

1. **Load context (in order):**
   - `.claude/rules.md` — the binding law (MUST/NEVER). It wins over everything.
   - `.claude/docs/PROGRESS.md` — current phase, next step, decisions, open issues.
   - `.claude/plans/02-mvp.md` — find the **first unchecked phase** (or the one `PROGRESS.md` names as current).
   - The deep plan(s) that phase links: `01-architecture.md`, `03-microservices-platform.md`, `04-website.md`, `05-deployment.md`, or `06-ai-assistant.md`.

2. **Confirm scope.** State which phase you're building and its **"Done when"** acceptance criterion. If the previous phase's "Done when" isn't actually met, finish that first. If the phase is large, break it into a short checklist (use TodoWrite) — but stay within the one phase.

3. **Build — TDD (TDD1).** For each unit of work: **write the failing test first** (Jest/Vitest), then the code to pass it. Honor every relevant rule:
   - Backend: per-service own DB (MS5), DDD layering, base/translatable repos (N1/N5), contracts from `libs/contracts` (U3), `.strict()` Zod validation (N7), never `new Date()` (N3), cross-service via RMQ request/reply + events+Outbox + idempotent consumers (MS2/MS3/MS6), services never import services (MS1).
   - Frontend: logic in `use-*` hooks (U5), one API layer + envelope unwrap (F1), skeleton→error→empty→data (F2), tokens only (U6), full RTL + ar-default i18n parity (U7/U8/F13), settings null-safe to the leaf (F7), reuse-before-create (F9).
   - Everything: no `any` (U4), one concept per file (U10), `APP_ENV` config (U19/OPS1).
   - DB-touching tests run against the service's **`*_test`** DB (TDD2).

4. **Document (DOC1).** Create/update the module's colocated `<module>.md` in the **same change** (purpose, entities, contracts, events emitted/consumed, settings used).

5. **Update `PROGRESS.md`** — what you did, what's next, any decision (with date), any issue. Do **not** check the phase box yet.

6. **Verify.** Run the **`verifier`** agent. It must report **PASS** (typecheck + lint + build + tests green; no rule-grep violations; "Done when" met). If FAIL, fix and re-run — do not proceed.

7. **Close the phase.** On PASS, check the phase `- [x]` in `PROGRESS.md` and state the next phase. Record what happened in `PROGRESS.md`; touch `.claude/rules.md` **only** if a bug revealed a genuinely reusable, platform-wide rule (U13) — not for a one-off. Keep the law lean.

## Guardrails
- One phase at a time, in order. Don't skip ahead or scaffold future feature code.
- Never bypass hooks (`--no-verify` forbidden, U12/OPS4).
- If a needed decision isn't in the plans/PROGRESS, ask — don't guess on architecture.
- Reference projects (`smart-restaurant`, `Bishola/docs/v2`, `bishola-deployment-v2`) are **read-only patterns** — learn, never import (U14).
