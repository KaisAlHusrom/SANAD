---
description: Diagnose & fix a bug/regression/rule-violation in the Sanad Tech platform, add a preventive rule, re-verify
---

# /fix — diagnose, fix, prevent, verify

A bug, regression, failing test, or rule violation needs fixing. Work it methodically and leave the codebase **more protected** than you found it.

## Procedure

1. **Load context:** `.claude/rules.md`, `.claude/docs/PROGRESS.md` (open issues), and the relevant plan(s). Note any rule the bug touches.

2. **Reproduce & locate.** Reproduce the failure (run the test/app). Find the **root cause**, not the symptom. State it plainly. For data-shape bugs, **verify the real shape against the source of truth** (Drizzle schema, the service's returned object, the message contract) — never assume (U15).

3. **Write a failing test first (TDD1).** Capture the bug as a test that fails for the current code. DB-touching tests use the `*_test` DB (TDD2).

4. **Fix to the rules.** Make the test pass with the smallest correct change that honors the rules. **NEVER** silence the compiler (`as any`/`@ts-ignore`, U4) or bypass hooks (U12). Respect module/service isolation (U1/MS1) and the network-boundary patterns (MS2/MS3/MS6).

5. **Update the module doc (DOC1)** if behavior/contract changed.

6. **Add a preventive rule (U13).** If this bug is a class that could recur, **add or sharpen a rule** in `.claude/rules.md` with a dated change-log entry so it never happens again. (This is the point of `/fix` — every fix hardens the law.)

7. **Update `PROGRESS.md`** — the issue, the root cause, the fix, the new/changed rule.

8. **Verify.** Run the **`verifier`** agent — must report **PASS** (typecheck + lint + build + tests green; no rule-grep violations). Re-run until green.

## Guardrails
- Fix the cause, not the symptom. One root cause at a time.
- A fix without a test doesn't count. A recurring-class fix without a new rule is incomplete.
- If the "fix" reveals a wrong architectural decision, surface it — don't paper over it.
