# Debug Playbooks

## Contents

- Blank Or Black Screen
- Entity Missing Or Wrong Data
- System Not Running
- Input Or Picking Bug
- UI Bug
- Physics Or Collision Bug
- Schedule, State, Or Ordering Bug
- Asset Loading Bug
- Performance Or Stutter

Use these symptom paths to choose probes. Stop once evidence identifies the root cause; do not add every probe blindly.

## Blank Or Black Screen

1. Confirm the app is not panicking and the render loop is running: logs, `RUST_BACKTRACE=1`, frame counter, diagnostics.
2. Query cameras: exactly one expected active camera, correct `Camera2d`/`Camera3d`, transform, projection, target window, render layers, order.
3. Query visible entities: marker/name, `Transform`, `GlobalTransform`, `Visibility`, `InheritedVisibility`, `ViewVisibility`, sprite/mesh/material components.
4. Check asset load state: paths, case sensitivity, image/model/audio format feature flags, handle lifetime, glTF scene hierarchy.
5. For 2D: check camera scale, z-order, sprite color alpha, custom size, texture atlas index, render layers.
6. For 3D: check lights, material alpha/culling, mesh scale, camera near/far plane, object behind camera, ambient light, shadow-only assumptions.
7. Add gizmos for camera origin/frustum, world axes, object bounds, spawn points.
8. Capture screenshot and ECS snapshot in the same scenario/frame.

Common root causes: no camera, camera facing away, object outside frustum, missing render components, invisible hierarchy, asset not loaded, z-order behind background, alpha zero, unlit/lit material mismatch, transform scale zero or NaN.

## Entity Missing Or Wrong Data

1. Query for marker components and `Name`.
2. Check spawn systems actually run: schedule, run conditions, states, events/messages, startup order.
3. Check deferred `Commands`: data inserted with `commands` is not visible until command application points.
4. Search for despawn/removal systems and state-scoped cleanup.
5. Inspect parent-child relationships when children disappear with a parent.
6. Add a one-frame spawn/despawn/change log with entity IDs and names.

Common root causes: query filter excludes entity, state-scoped entity cleaned up, system never runs, commands observed too early, `Without<T>` filter is too broad, entity spawned in a different state or world.

## System Not Running

1. Dump or inspect the schedule containing the system.
2. Check the schedule label: `Startup`, `Update`, `FixedUpdate`, `OnEnter`, `OnExit`, custom schedules.
3. Check run conditions: state, resource existence, input condition, feature gate, paused flag.
4. Check plugin registration order and whether the plugin is added in this app mode/test harness.
5. Add targeted `info_once!` at system entry only after static schedule evidence is insufficient.
6. Use stepping when ordering or skipped systems are unclear.

Common root causes: wrong schedule, state never entered, run condition false, plugin not added in test/dev target, fixed timestep not advancing, system removed or gated by feature.

## Input Or Picking Bug

1. Log raw input resources/events before gameplay mapping.
2. Check focus capture: UI focus policy, modal overlays, input focus resources, window focus.
3. For cursor bugs, log window cursor position and camera viewport-to-world conversion.
4. Enable picking debug for pointer hits, hovered entities, and blocked paths.
5. Query `Interaction` for buttons only with `Changed<Interaction>` after confirming the button entities exist.
6. Check render layers and target cameras when picking 2D/3D objects.

Common root causes: UI node blocks world input, wrong camera for cursor conversion, window unfocused, target camera mismatch, pointer not over entity bounds, picking backend feature missing, action mapping consumes input.

## UI Bug

1. Snapshot the UI entity tree: names, active screen/state, root nodes, `Node`, `Display`, `Visibility`, z-index, target camera.
2. Check buttons: `Button`, `Interaction`, disabled marker, action marker, focus policy, observers/systems.
3. Check text/images: font/image handles loaded, text color alpha, node size, overflow clipping.
4. Capture screenshots at desktop and smallest supported viewport if layout is involved.
5. Use deterministic fixtures for menus/settings rather than live backend state.

Common root causes: root node hidden, wrong target camera, clipped child, transparent text/background, click-through or blocked focus, z-index conflict, state cleanup despawned UI, button lacks action marker.

## Physics Or Collision Bug

1. Confirm the physics plugin and dimensionality match the world: 2D vs 3D.
2. Query rigid bodies, colliders, sensors, collision layers/groups, transforms, and velocity.
3. Enable physics debug rendering or draw colliders with gizmos.
4. Check fixed timestep and whether gameplay reads physics results before/after simulation.
5. Check scale: non-uniform or tiny/huge scales often make collision evidence misleading.
6. Inspect contacts/events and whether sensors are expected to generate collisions or only overlap events.

Common root causes: collider missing, sensor vs solid mismatch, layer/group mask excludes pair, body type wrong, transform/physics sync order, fixed update not advancing, shape offset from visual mesh.

## Schedule, State, Or Ordering Bug

1. Dump the relevant schedule graph and identify system sets, ordering edges, and ambiguous systems.
2. Log state transitions and `OnEnter`/`OnExit` execution.
3. Check same-frame assumptions: events/messages, state transitions, and commands may be applied later than expected.
4. Use explicit `.before()`/`.after()` or sets only after proving the ordering dependency.
5. Convert ordering-sensitive behavior into a test that advances frames one at a time.

Common root causes: missing ordering edge, event reader runs before writer, command application boundary, state transition applied after current schedule, fixed/update mismatch.

## Asset Loading Bug

1. Inspect logs first; Bevy usually reports missing or failed assets.
2. Check exact path and case relative to the asset root.
3. Query load state for the handle or asset collection.
4. Check Bevy features for formats: `png`, `jpeg`, `webp`, `gltf`, audio codecs, etc.
5. For glTF, distinguish the file asset, scene asset, mesh/material assets, and spawned scene hierarchy.
6. Verify the entity keeps the handle alive when required.

Common root causes: wrong asset root, case mismatch on Linux, missing feature for format, treating async load as immediate, spawning glTF asset instead of scene handle, material texture not ready.

## Performance Or Stutter

1. Add diagnostics: frame time, FPS, entity count, system information.
2. Use frame-time graph or trace features to find spikes.
3. Look for spawn/despawn churn, asset loads during gameplay, excessive logging, broad changed queries, unnecessary hierarchy rebuilds.
4. Check debug build profile; Bevy dev builds often need optimized dependencies.
5. Compare headless logic timing and rendered timing to separate gameplay cost from render/GPU cost.

Common root causes: unoptimized dependency profile, per-frame asset loading, large query work with no change filters, too many gizmos/logs, expensive mesh/material churn, debug-only inspector overhead.

