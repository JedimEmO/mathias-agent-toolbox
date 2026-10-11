# The voice in documentation

Documentation gets the same register as a lesson, with the furniture removed and the volume turned down.
The rules in `SKILL.md` all still apply.
This page says how they bend for each kind of document, and it ends with short examples.

## Contents

- [What changes from a lesson](#what-changes-from-a-lesson)
- [Guide or reference](#guide-or-reference)
- [README](#readme)
- [Guides and manuals](#guides-and-manuals)
- [Decision records and design docs](#decision-records-and-design-docs)
- [Changelogs and release notes](#changelogs-and-release-notes)
- [Rust doc comments](#rust-doc-comments)
- [Rules that documentation adds](#rules-that-documentation-adds)
- [Examples](#examples)

## What changes from a lesson

A lesson is read once, from the top, by someone who chose to spend twenty minutes on it.
Documentation is read in pieces, by someone who arrived from a search with a problem.

So a document front-loads.
The first two lines say what the thing is and who it is for.
A reader who stops there should still leave with the right idea.

The moves get rarer.
A guide may name one objection and use one dry aside.
A reference page uses none; it states what is true and gives the reason.

There are no exclamation marks, no greeting, no roadmap in `I`, and no sign-off.

## Guide or reference

Decide which one a section is before writing it, because the person changes.

A *guide* walks the reader through doing something.
It uses `we` for the shared reasoning and the imperative for the steps.
It builds one example from the smallest version that works.

A *reference* answers "what does this do".
Its sentences often have no subject at all: "Returns `None` when the budget is spent."
It is complete where a guide is selective, and it is ordered for lookup, not for learning.

Do not narrate a reference.
"We then call `build()`" is a guide sentence, and in a reference it only adds length.

## README

A README is a front door.
It answers four questions in this order: what is this, what does it look like in use, how do I get it, and where do I go next.

- Open with one or two sentences that say what it is in plain words. No tagline.
- Give the problem a short beat of its own before the solution, as in a lesson.
- Show the smallest real example early, and point at what matters in it afterwards.
- Say what it is *not*, when a reader could reasonably expect more.
- Link to the guide and the reference instead of growing into them. A README that scrolls for ten screens has swallowed its manual.

Badges, link rows and tables sit outside the prose rules.
Keep them, and do not wrap them.

## Guides and manuals

- One task per page, named in the heading as the reader would say it: `## Adding a material`, not `## Material subsystem`.
- State what the reader needs before they start, and what they will have at the end.
- Every command and every code block must have been run. If one has not, say so next to it.
- When a step can fail in a known way, show the error text and the fix where the step is. That is the objection move, in documentation form.

## Decision records and design docs

A decision record is the one document where history belongs.

- Give the problem its own section, and write it so that it still makes sense in a year: what hurt, with a concrete case.
- State the decision in one or two plain sentences before defending it.
- Name the alternatives that were real candidates, and say why each lost. One line each is enough.
- State the cost of the decision as plainly as the benefit. A record with no cost section reads as a sales pitch.
- `we` is the natural subject: "We bake at build time, because the kernel must not ship in the game."

A design doc for work not yet done uses the same shape, in the future tense, and marks every open question as open.

## Changelogs and release notes

- Lead with what changed for the reader, not with what was done: "`iter_many` now yields a `Result`", not "Refactored the many-iterators".
- Breaking changes come first, each with the replacement.
- One line per change, in the imperative or as a plain statement. No `we`, no story.
- Release notes may open with one short paragraph of framing. A changelog has none.

## Rust doc comments

Crate and module docs (`//!`) are a small README: what this is, the smallest example, then the map.
Item docs (`///`) are reference: the first line says what the item does, in the third person, and fits on one line.

Say what the signature cannot: the invariant, the failure case, the reason a parameter exists.
Wrap at the width the project's `rustfmt.toml` sets, not at clause boundaries.

## Rules that documentation adds

- **Describe what is true now.** No `now`, `new`, `no longer`, `previously` or `we changed` outside a decision record or a changelog. The reader never saw the old version.
- **No working labels.** Phase numbers, ticket IDs, task names and names coined during the work mean nothing to the reader. Say the longer thing the label stands for.
- **Numbers are measured or marked.** A size, a timing or a count is one that was checked, with the conditions given. Otherwise leave it out.
- **Identifiers are exact.** Every crate, type, function, flag and path matches the source, in backticks.
- **One name per thing.** Pick the term on first use and keep it. A second word for the same thing reads as a second thing.
- **Headings are the outline.** A reader who sees only the headings should be able to find their section. Sentence case, no numbering.

## Examples

The crate in these examples is invented; only the shape matters.

### A README opening

````markdown
# retry-budget

A retry policy that stops a struggling service from being retried into the ground.

Retrying a failed request is the right call when one request failed.
When the whole service is failing, every client retries at once,
and the retries become most of the load.

`retry-budget` caps retries as a fraction of recent traffic.
A client may retry freely while the service is healthy,
and it backs off on its own when failures pile up.

```rust
let budget = Budget::new().retry_ratio(0.1);
let reply = budget.call(|| client.get(url)).await?;
```

Notice that there is no retry count here.
The budget allows one retry for every ten requests that went through,
so the limit follows the traffic.

This is not a circuit breaker; it never rejects a first attempt.
````

### A reference entry

```markdown
### `retry_ratio`

Sets how many retries are allowed per successful request. The default is `0.1`.

A ratio above `1.0` allows more retries than requests,
which removes the protection the budget exists for.
Returns `Err(InvalidRatio)` for a negative value.
```

### A decision record

```markdown
## The problem

A fixed retry count of three looked safe in testing.
During the March outage it tripled the load on a database that was already failing,
and recovery took forty minutes longer than the fault itself.

## Decision

We limit retries by a budget tied to recent successes, not by a count per request.

## What it costs

A single unlucky request may fail without a retry while the budget is empty.
We accept that; the caller sees the error it would have seen after three attempts anyway.
```

### A changelog entry

```markdown
## 0.4.0

### Breaking

- `Budget::call` returns `BudgetError` in place of `anyhow::Error`. Match on `BudgetError::Exhausted` to detect an empty budget.

### Added

- `Budget::remaining()` reports the retries currently available.
```
