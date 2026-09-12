---
name: bevy-debug-inspection
description: Use when diagnosing Bevy runtime behavior with ECS state, schedules, logs, deterministic scenarios, screenshots, or live inspection.
---

# Bevy Debug Inspection - Agent-Readable Runtime Diagnosis

The goal is to make the game interrogable, not merely runnable. A screenshot can prove what pixels appeared, but Bevy bugs usually need correlated evidence from ECS state, schedules, resources, logs, and deterministic scenarios.

## Default Probe Ladder

1. **Reproduce narrowly.** Capture the exact command, feature flags, platform, scenario, seed, frame count, and user action sequence. Prefer a deterministic scenario over free play.
2. **Check static evidence.** Run the smallest relevant `cargo check` or test command. Inspect `Cargo.toml` feature flags, Bevy version, plugin registration, system registration, and recent migrations before changing runtime code.
3. **Build a logic harness.** For gameplay bugs, prefer a headless or render-free `App`/`World` test that advances fixed frames and asserts resources, components, events, and state transitions.
4. **Inspect the live ECS.** When runtime evidence is needed, add or use a dev-only inspection path: reflected components/resources, `Name` on important entities, Bevy Remote Protocol, inspector panels, custom snapshot systems, or targeted logs.
5. **Correlate visuals with state.** Capture screenshots/videos at known frames and pair them with logs plus ECS/resource snapshots. Do not treat pixels alone as a root cause.
6. **Diagnose by symptom.** Use the symptom playbooks in `references/debug-playbooks.md` when the issue is blank screen, missing entity, bad input, physics, UI, schedule/state, asset loading, or performance.
7. **Fix with regression evidence.** Convert the smallest confirmed failure into a unit/integration/gameplay scenario test, snapshot check, screenshot assertion, or documented debug command.

## Probe Selection

| Problem shape | First useful probes |
| --- | --- |
| Compile or API breakage | `cargo check`, Bevy version, feature flags, migration guide, compiler error locality |
| System not running | Schedule dump, run conditions, state transitions, system set ordering, targeted `info_once!` |
| Entity missing or wrong data | BRP `world.query`, reflected component snapshot, `Name`, spawn/despawn logs |
| Blank screen or invisible object | Camera query, visibility query, asset load state, transform/gizmo overlay, screenshot |
| Bad input or picking | Input resource/event logs, pointer hit debug, focus policy, cursor-to-world probe |
| Physics/collision bug | Collider/rigid body query, physics debug render, layers/groups, fixed timestep state |
| UI bug | UI node tree, `Interaction`, focus, z-index, target camera, screenshot by state |
| Performance/stutter | Bevy diagnostics, frame-time graph, entity count, trace feature, system timing |

## Inspection Contract

When the project will be debugged repeatedly by an agent, create a dev-only inspection surface instead of scattering temporary `println!` calls:

- Gate it behind a feature such as `agent_inspect`; never enable it for release builds by default.
- Add Bevy Remote Protocol on localhost for native builds when ECS inspection or mutation is needed.
- Derive `Reflect` for gameplay components/resources that must be inspected and register them with the app.
- Add `Name` to important entities: player, camera, UI roots, bosses, levels, spawners, sensors, and replicated actors.
- Provide deterministic launch inputs: scenario name, seed, fixed frame count, optional scripted input, screenshot path.
- Add custom snapshot hooks for domain data that is awkward to reconstruct from generic ECS queries.
- Store debug artifacts in stable, grep-friendly paths and include the command that generated them.

Read `references/agent-inspection-plugin.md` when adding this infrastructure.

## Runtime Tools

Prefer built-in Bevy tools first:

- `bevy::remote` plus `RemoteHttpPlugin` for JSON-RPC ECS inspection and mutation.
- `bevy::diagnostic` and `bevy::dev_tools` for FPS, frame-time, entity count, and CI-oriented test utilities.
- `Gizmos` for bounds, paths, rays, spawn points, collision shapes, and camera frustums.
- `Screenshot` or `EasyScreenshotPlugin` for visual artifacts.
- `bevy_debug_stepping` for stepping through system execution when ordering is unclear.
- `bevy_mod_debugdump` for schedule and render graph dot output when static graph evidence helps.
- `bevy-inspector-egui` for human-facing live inspection, especially while developing local tools.

If a third-party tool is involved, verify its Bevy compatibility before adding it; Bevy plugins are usually version-locked.

## BRP Quick Check

If the game is already running with the remote HTTP transport on the default localhost port:

```bash
curl -fsS -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":"discover","method":"rpc.discover"}' http://127.0.0.1:15702
```

Use `rpc.discover` and `registry.schema` to learn what methods and reflected types are available before guessing type paths.

## Evidence Standard

A Bevy debugging answer is not complete until it names:

- Reproduction command or scenario.
- Observed evidence: compiler output, logs, ECS snapshot, schedule graph, screenshot/video, or test result.
- Root cause tied to Bevy concepts: query filter, state/run condition, deferred commands, transform hierarchy, camera/visibility, asset state, physics timestep, UI focus/picking, etc.
- Verification command and regression protection, or a clear statement of what could not be verified.

Read `references/runtime-artifacts.md` for artifact formats and acceptance checks.
