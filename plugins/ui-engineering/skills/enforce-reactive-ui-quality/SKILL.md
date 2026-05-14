---
name: enforce-reactive-ui-quality
description: Use when the user asks to review, refactor, improve, or enforce UI code quality, reactive UI architecture, component boundaries, state management, render performance, over-rendering prevention, small files, clear responsibilities, or precise reactivity. Applies to frontend code in any framework, especially when UI behavior should update only the components or DOM fragments affected by changed state.
---

# Enforce Reactive UI Quality

Keep UI code understandable, maintainable, and precisely reactive: small files with clear responsibilities, explicit data flow, and updates scoped to the state that actually changed.

## Quality Bar

UI code is acceptable only when:

- State ownership is clear and close to the behavior that changes it.
- Derived state is computed once in the right layer, not duplicated across components.
- Components, hooks, stores, view models, and services have narrow responsibilities.
- Files stay small enough to review without scrolling through unrelated concerns.
- Reactivity is precise: a state change should not re-render unrelated screens, lists, rows, panels, or expensive child trees.
- Expensive derived values, selectors, subscriptions, and effects are scoped, memoized, or split according to the framework's idioms.
- Effects are reserved for real side effects, not ordinary derivation or data reshaping.
- Tests or profiling evidence cover behavior at risk of regressions or over-rendering.

## Workflow

1. **Map responsibilities.** Identify each UI file's job: rendering, state ownership, derivation, side effects, service access, styling, routing, or test harness setup. Flag files doing several unrelated jobs.
2. **Trace reactive data flow.** Follow state from source to rendered output. Identify global stores, context/provider values, signals, selectors, hooks, subscriptions, effects, and derived values.
3. **Find over-rendering risk.** Look for broad subscriptions, whole-object context values, parent-owned state that only one child needs, unstable props/callbacks, array/object recreation in render, large list re-renders, and effects that fan out updates.
4. **Split by responsibility.** Extract focused components, hooks, selectors, view models, services, fixture builders, and style modules when it reduces real coupling. Avoid splitting into files that merely hide complexity without naming a concept.
5. **Make reactivity precise.** Subscribe to the smallest state slice, use selectors or signals, memoize expensive derived values, isolate list rows/items, keep local UI state local, and prefer event-driven updates over broad invalidation.
6. **Protect behavior.** Add or update tests for user-visible behavior first. Add render-count, subscription, profiling, or regression tests only when over-rendering is likely and the repo has a practical way to assert it.
7. **Verify.** Run focused tests and type/lint checks. For visible workflow changes, use the backend-free UI/Playwright guidance from `enforce-testable-ui-flows` where applicable.

## Output Format

When reporting a review or refactor, include:

```markdown
## Reactive UI Quality Report

Verdict: pass / needs work / blocked

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Responsibilities | pass/warn/fail | <files/components inspected> | <change or none> |
| State ownership | pass/warn/fail | <state sources> | <change or none> |
| Reactivity precision | pass/warn/fail | <subscriptions/renders> | <change or none> |
| File size and cohesion | pass/warn/fail | <files> | <change or none> |
| Tests and evidence | pass/warn/fail | <tests/profiling> | <change or none> |

## Changes

- <small, behavior-preserving refactor or quality fix>

## Remaining Risks

- <over-rendering risk, large file, unclear ownership, or missing evidence>
```

## Responsibility Rules

- Keep rendering separate from backend adapters and transport details.
- Keep domain/service calls behind injected repositories or services; UI components should not know protocol details.
- Keep view state separate from persistence state when the distinction affects behavior or tests.
- Keep validation, formatting, filtering, sorting, and selection logic in named helpers/selectors when it is reused or complex.
- Keep styling concerns close to the component only when they are local. Shared design rules belong in shared style/token modules.
- Prefer cohesive files over arbitrary size limits, but treat files above roughly 250-350 lines as suspicious unless they are mostly declarative markup or generated data.

## Precise Reactivity Rules

- Subscribe to exact fields, selectors, signals, atoms, resources, or queries needed by the component.
- Avoid passing large mutable objects or whole stores through props/context when children need one value or one command.
- Avoid deriving new arrays, objects, functions, dates, regexes, or options in render paths when identity changes force child updates.
- Split large list items into memoized/keyed row components when list updates should affect one row.
- Keep transient UI state local: hover, expanded row, draft input, focused tab, pending confirmation, selected item.
- Use stable keys that represent domain identity, not array position, when items can be inserted, removed, or reordered.
- Cancel, ignore, or sequence stale async results so old data cannot overwrite newer UI state.
- Avoid effects that mirror props to state, recompute pure values, or synchronize two sources of truth.

## Framework-Agnostic Signals

Use the local framework's established mechanism:

- React: selectors, `useMemo`, `useCallback`, `memo`, context splitting, colocated state, reducer boundaries, external-store selectors, and profiler/render-count tests when useful.
- Solid, Leptos, Dioxus, Sycamore, futures-signals, or similar fine-grained systems: small signals/resources/memos, keyed lists, derived signals, and subscriptions at the exact DOM/component boundary.
- Vue/Svelte: computed values, stores scoped by feature, keyed each blocks, avoiding broad reactive object dependencies, and explicit derived stores.
- Elm/TEA style: small model sections, precise messages, update functions split by domain, and views that receive only the model slice they render.

Prefer existing project idioms over introducing a new state library.

## Red Flags

- One screen file owns fetching, parsing, state transitions, validation, rendering, styles, and tests.
- A top-level provider update re-renders most of the app for one field change.
- Every row in a large list re-renders when one row changes.
- Tests only check snapshots or "renders without crashing" for complex behavior.
- Effects are used to derive values that could be pure selectors/memos.
- Components accept broad `props` objects and reach through several levels to find what they need.
- UI state is stored globally only because passing dependencies felt inconvenient.
- A refactor increases indirection without reducing coupling, render scope, or test complexity.

## Fix Strategy

Apply the smallest useful improvement:

- Extract a named selector before creating a new store.
- Split context/provider values before rewriting state management.
- Move one backend call behind a service before introducing a full repository layer.
- Isolate one expensive child/list row before memoizing an entire screen.
- Add a focused behavior test before making a broad refactor.
- Add render/profiling evidence only for hotspots or regressions where behavior tests cannot catch the problem.
