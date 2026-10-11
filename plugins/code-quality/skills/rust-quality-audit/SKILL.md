---
name: rust-quality-audit
description: Use when asked to review, audit or assess the quality, health or technical debt of a Rust repository or workspace, to find which code is risky or most worth refactoring, or to compare a repository with an earlier audit. A bundled script measures complexity, coverage, CRAP, churn, coupling, duplication and advisories, and ranks what to read. Not for reviewing a single diff or pull request.
---

# Rust quality audit

Measure first, then read what the measurements rank, then report. Every finding cites a
number and a `file:line`. Without the ranking an audit is a sample of whichever files were
opened first.

## 1. Measure

`scripts/collect.py` is in this skill's directory, written `<skill-dir>` below. Run it from
inside the workspace. It needs Python 3 and `cargo`; `cargo-crap`, `cargo-llvm-cov` and
`cargo-audit` add signals, and a missing one is listed under **Skipped**.

```bash
python3 <skill-dir>/scripts/collect.py               # seconds: source and git history
python3 <skill-dir>/scripts/collect.py --tier full   # runs the tests for coverage, and clippy
```

Run the quick tier first. Then run the full tier, unless the tests need a GPU, a database or
more than a few minutes; in that case ask, or pass the project's own coverage as
`--lcov FILE`. The full tier builds a second target directory about as large as
`target/debug`.

`--help` lists the other options. The output goes to `target/quality/`.

## 2. Read

Read in this order, and stop at about twenty reads:

1. The top five hotspot files, and the files listed as recently created.
2. Every function in the riskiest table marked `*`, then the rest down to CRAP 30, then the
   functions listed under the table.
3. Both files of a cross-crate pair, when its shared commits are small.
4. One member of each of the three largest duplicate groups.
5. Each ignored test that has a reason.

Do not start anywhere else. Do follow a thread from there: when a restore path is flagged,
read the create path it must agree with; when one decoder skips a bounds check, search for
the others.

To see which lines of a function no test ran:

```bash
python3 <skill-dir>/scripts/collect.py --uncovered crates/api/src/parser.rs:300-345
```

An error branch or a security check that never ran is a finding with its evidence attached.

How to read the numbers:

- Complexity counts every `match` arm and every `?`. A flat decoder that scores 100 is fine;
  nested conditions and one function doing three jobs are not.
- Complexity cannot see inside macro calls such as `select!` or `quote!`. Clippy's cognitive
  complexity can, which is why its list is there.
- Coverage means a line ran, not that a test checks it, and it cannot show a line that is
  missing.
- A pair whose shared commits touch ten files each is a batch of work, not coupling.
- An ignored test whose reason names a bug is a defect the project already found. Run it with
  `cargo test -p <crate> -- --ignored`.

## 3. Check what you suspect

- **A defect you traced by reading.** Write a failing test for it in a scratch copy
  (`git worktree add --detach /tmp/audit HEAD`), never in the user's tree.
- **Tests on critical, well-covered code.** `cargo mutants -f <file> -F '<function>' -o
  target/quality` changes the code one piece at a time and reports the changes that no test
  caught. Add `--test-workspace true` before trusting a miss; without it only the crate's own
  tests run.
- **An advisory.** `cargo tree -i <crate>@<version>` shows what pulls it in, and
  `cargo update -p <crate> --dry-run` shows whether the fix is in reach.
- **A possibly unused dependency.** Remove it in the scratch copy and run
  `cargo check -p <crate> --all-targets --all-features`.

## 4. Report

Give the report in your reply, at most seven findings, ranked by what they cost.

```markdown
# Quality audit: <repository>, <date>

<Two or three sentences: the state of the code, and the one thing to do first.>

## Measured
<Tier, commit, how coverage was taken, the totals that matter, what was skipped.>

## Findings
### 1. <Claim, naming the code>
**Evidence:** <numbers, file:line, and whether you reproduced it or only read it>
**Consequence:** <what it costs in this project>
**Action:** <what to do, and its size>

## Healthy
<What is in good shape, and flagged code you read and dismissed, with the reason.>

## Not assessed
```

A finding needs evidence and a read: a number alone is a statistic, and a read alone is an
impression. Drop a finding with no consequence you can name. Give no overall score.

## 5. Baseline

```bash
python3 <skill-dir>/scripts/collect.py --save-baseline
```

This writes the last run to `quality-baseline.json` in the workspace root without measuring
again. Later runs print what changed since. Tell the user the file exists; committing it is
their choice.
