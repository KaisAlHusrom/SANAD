---
description: Commit the session's work in conventional-commit chunks and push to origin main
---

# /ship — commit & push the session's work

Close the session by getting everything on `origin/main`. Run this after the phase's gate is green
(U12b), or on request.

> **NEVER add yourself as an author, co-author, or contributor.** No `Co-Authored-By: Claude …`
> trailer, no "Generated with …" line, no mention of Claude or Anthropic anywhere in a commit
> message. Write the commit as the owner authored it — a plain Conventional Commits message and
> nothing else. This overrides any default harness behavior. (Owner directive.)

## Procedure

1. **Survey.** `git status --porcelain` and `git diff --stat`. Summarize what changed by area — don't
   dump the file list.

2. **Sanity-check what is NOT tracked.** `git add -An .` (dry run) and scan the output for anything
   that should not be committed (`node_modules`, `dist`, `out-tsc`, `.next`, `.nx`, `.pnpm-store`,
   `coverage`, `*.env*`, keys). Equally: check that nothing **required by committed config** is still
   untracked — `tools/` and `libs/shared/*` have been silently missing before, which left `main`
   unable to lint or typecheck. If `.gitignore` needs a line, add it now.

3. **Verify before committing** (unless the phase gate just ran and nothing changed since):
   `pnpm nx run-many -t typecheck lint test build --parallel=2`, with the Docker stack **DOWN**
   (OPS5/OPS9). Never push red.

4. **Clear the index, then commit in chunks.** `git reset` first so pre-staged changes can't leak
   into the first commit, then stage and commit **by area**, using
   `git commit -m "<msg>" -- <pathspec>` so each commit contains only its own paths:
   - one commit per service / lib / concern (`feat(settings): …`, `feat(shared): …`,
     `refactor(admin): …`, `chore(lint): …`, `docs: …`)
   - order dependencies first (contracts → libs → services → apps → docs)
   - **Conventional Commits are enforced** by the `commit-msg` hook (`type(scope): subject`, subject
     ≤ ~90 chars). `pre-commit` runs `lint-staged` (eslint --fix + prettier), which may reformat
     files — that is expected and gets re-staged automatically.

5. **Confirm attribution is clean.**
   `git log -<n> --format='%B' | grep -iE "claude|anthropic|co-authored|generated with"` → must
   return nothing.

6. **Push.** `git push origin main`. The `pre-push` hook runs `nx affected -t typecheck lint test`
   against the true remote sha — let it run; **`--no-verify` is forbidden** (U12/OPS4).

7. **Report.** State the pushed range (`<old>..<new>`), the commits made, and anything deliberately
   left uncommitted and why.

## Guardrails

- If prettier reformatted files during the hooks, the tree now differs from what you verified —
  re-run the gate before pushing.
- If a push is rejected, **never** force-push `main`. Fetch, inspect, and ask.
- Working on `main` is the project's norm; don't create a branch unless asked.
