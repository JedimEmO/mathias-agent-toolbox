---
name: finish
description: Use when the user asks for a completion check, release-readiness review, or verification of the current change.
---

# Finish — Pre-Completion Verification Workflow

A targeted workflow for verifying that a change is complete. Choose checks based on the files and risk involved, and report anything unavailable or still failing.

## Step 1: Identify What Changed

Run `git diff --stat` and `git diff` to understand the full scope of changes. Run `git status` to catch untracked files that may need to be included. Build a mental model of every file touched and why.

## Step 2: Run Tests

Run the smallest relevant test suite for the changed behavior. Run the full suite when the project is small or the change has broad impact.

Detection strategy — check in order, use the first match:

| Indicator | Command |
|-----------|---------|
| `Cargo.toml` at root or workspace root | `cargo test --workspace` |
| `package.json` with a `test` script | `npm test` or `yarn test` |
| `pyproject.toml` / `pytest.ini` / `setup.cfg` with pytest | `pytest` |
| `go.mod` | `go test ./...` |
| `justfile` / `Makefile` with a `test` target | `just test` / `make test` |

If no test framework is detected, state this explicitly and skip to Step 3.

If tests fail, determine whether the failure is caused by the change. Fix relevant failures or report unrelated failures clearly.

## Step 3: Build and Lint

Run the project's relevant build and lint tooling when the change affects code covered by those checks.

| Language | Command |
|----------|---------|
| Rust | `cargo clippy --workspace --all-targets -- -D warnings` |
| Node/TS | `npm run lint` (if script exists), `npx tsc --noEmit` (if tsconfig.json exists) |
| Python | `ruff check .` or `flake8` (whichever is configured) |
| Go | `go vet ./...` |

If a `justfile` or `Makefile` has a `check` or `lint` target, prefer that.

Fix any issues found. Re-run until clean.

## Step 4: Optional simplification

If `/simplify` is available and the change would benefit from a focused cleanup pass, invoke it and consider its recommendations.


## Step 5: Diff Review

Perform a thorough review of the final diff (`git diff` for unstaged, `git diff --cached` for staged). Check for:

- **Correctness:** Does the change do what was intended? Are there edge cases?
- **Leftovers:** Debug prints, TODO comments that should be resolved, commented-out code, hardcoded values that should be configurable.
- **Naming:** Are new functions, variables, and types named clearly?
- **Error handling:** Are errors handled, not swallowed? Are error messages useful?
- **Security:** No secrets, credentials, or API keys in the diff. No injection vectors. No path traversal.
- **Completeness:** If a new public API was added, is it documented? If behavior changed, are docs updated?

If issues are found, fix them. Re-run Steps 2–3 if the fixes are non-trivial.

## Step 6: Summary

Report what was verified:

- [ ] Relevant tests pass — name the command run and result
- [ ] Relevant build/lint checks are clean — name the command run and result
- [ ] Optional simplification considered — note any changes made
- [ ] Diff reviewed — note any issues found and fixed
- [ ] No secrets or debug artifacts in the diff

State clearly: **"Task verified complete"** or **"Task has unresolved issues:"** followed by what remains.

## Related Skills
