# Runtime Artifacts

Use artifacts to make Bevy debugging repeatable. The agent should be able to rerun a scenario and compare evidence without relying on memory or manual play.

## Artifact Bundle

Use a stable directory per case:

```text
debug-artifacts/<case-id>/
├── command.txt
├── env.txt
├── logs.txt
├── brp-discover.json
├── registry-schema.json
├── world-frame-000000.json
├── world-frame-000120.json
├── screenshot-frame-000120.png
├── schedule-Update.dot
└── checks.json
```

Keep generated artifacts out of source control unless the repo already tracks golden fixtures.

## World Snapshot Shape

Prefer small, domain-oriented snapshots over full-world dumps:

```json
{
  "case_id": "combat-dodge-hitbox",
  "bevy_version": "0.18.1",
  "git_rev": "abc123",
  "scenario": "combat_dodge",
  "seed": 1,
  "frame": 120,
  "states": {
    "AppState": "InGame",
    "CombatState": "Active"
  },
  "resources": {
    "time_scale": 1.0,
    "enemy_count": 3
  },
  "entities": [
    {
      "entity": "Entity(42)",
      "name": "player",
      "markers": ["Player"],
      "translation": [0.0, 0.5, 0.0],
      "health": { "current": 80.0, "max": 100.0 },
      "visible": true
    }
  ]
}
```

Use stable names and domain fields. Raw reflected component maps are useful for discovery, but curated snapshots are better for regression checks.

## Check Results

Store explicit pass/fail checks:

```json
{
  "case_id": "blank-screen-player-visible",
  "checks": [
    {
      "id": "primary-camera-exists",
      "status": "pass",
      "evidence": "one active Camera2d named main-camera"
    },
    {
      "id": "player-visible",
      "status": "fail",
      "evidence": "player has Visibility::Hidden at frame 120"
    }
  ]
}
```

Good checks are tied to user-visible promises and Bevy concepts: camera existence, active state, entity count, transform bounds, visibility, asset load state, interaction state, collision contact, health value.

## BRP Request Examples

Discover methods:

```bash
curl -fsS -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":"discover","method":"rpc.discover"}' http://127.0.0.1:15702
```

List reflectable resources:

```bash
curl -fsS -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":"resources","method":"world.list_resources"}' http://127.0.0.1:15702
```

Inspect schema for the game crate after learning its crate name:

```bash
curl -fsS -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":"schema","method":"registry.schema","params":{"with_crates":["my_game"]}}' http://127.0.0.1:15702
```

Query entities once exact type paths are known:

```bash
curl -fsS -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":"players","method":"world.query","params":{"data":{"components":["bevy_transform::components::transform::Transform"]},"filter":{"with":["my_game::player::Player"]}}}' http://127.0.0.1:15702
```

Prefer explicit component paths for repeatable probes. Use broad component selectors only for discovery, then narrow the query to the fields needed by the debug case.

## Screenshot Rules

- Name screenshots by scenario and frame, not by wall-clock time.
- Pair every screenshot with a world snapshot from the same or nearest frame.
- Use image comparison only for stable scenes. Prefer semantic checks for dynamic scenes.
- When comparing screenshots, use tolerances; GPU, driver, font, antialiasing, and platform differences can change pixels.
- Verify that the screenshot captures the intended camera/window, especially in multi-camera and render-to-texture setups.

## Regression Choices

Pick the cheapest durable evidence:

| Failure | Regression evidence |
| --- | --- |
| Pure gameplay rule | Unit test or render-free `App` test |
| State transition | Frame-by-frame app test with state assertions |
| Spawn/despawn bug | Scenario test asserting named entity/component count |
| Visual visibility bug | Scenario screenshot plus ECS visibility/camera assertions |
| UI interaction bug | Backend-free UI scenario asserting `Interaction`/state result |
| Physics bug | Fixed timestep scenario asserting contact/position/layer behavior |
| Performance regression | Diagnostics threshold or benchmark-style scenario |

## Final Debug Report

Use this compact shape:

```text
Reproduction: <command/scenario/seed/frame>
Evidence: <logs/snapshot/screenshot/test/schedule graph>
Root cause: <Bevy-specific reason>
Fix: <code-level change>
Verification: <commands and artifacts>
Regression protection: <test/check/artifact or reason unavailable>
Residual risk: <what remains unobserved>
```
