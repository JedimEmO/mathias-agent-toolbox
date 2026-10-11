---
name: bevy-api
description: Use when writing, reviewing or upgrading Bevy code - current API names for Bevy 0.19 and 0.20 where they differ from older releases, how to check a signature against the local crate source, upgrading a game to 0.20, and which ecosystem crates support which Bevy release.
---

# Bevy API: what is current, and how to check

Bevy breaks its API on every release, and most of what you remember about it is from an
older one. This skill is not a Bevy tutorial. It holds the names that changed, and the way
to check anything it does not hold.

## Find the project's version first

Read the resolved version before writing any Bevy code:

```bash
grep -A1 '^name = "bevy"$' Cargo.lock
```

Write for that version. Do not bump Bevy as a side effect of another task: an upgrade is its
own piece of work, and the physics, input and networking crates a game depends on usually
trail a Bevy release by weeks (see `references/ecosystem.md`).

## Check signatures against the source

The crate source is on disk once the project has built. Check a name there instead of
recalling it:

```bash
SRC=$(ls -d ~/.cargo/registry/src/*/ | head -1)
grep -rn "pub struct ChildOf" $SRC/bevy_ecs-0.20.0/src
grep -rn "fn set_if_different" $SRC/bevy_*-0.20.0/src
```

`bevy` itself is a facade; the code lives in `bevy_ecs`, `bevy_ui`, `bevy_pbr` and the other
`bevy_*` crates at the same version. Doc comments and `#[deprecated]` notes in the source name
the replacement when something moved. The same check works for `avian3d`, `bevy_replicon` and
any other dependency.

If `cargo check` rejects a name this skill gave you, trust the compiler and the source.

## Names that changed

Both 0.19 and 0.20 use the right-hand column unless a row says otherwise.

| If you reach for | Write |
| --- | --- |
| `SpriteBundle`, `PbrBundle`, `Camera3dBundle`, `NodeBundle`, `TextBundle` | The component itself: `Sprite`, `Mesh3d` + `MeshMaterial3d`, `Camera3d`, `Node`, `Text`. Required components fill in the rest |
| `Style { .. }` | Layout fields are on `Node` |
| `TextStyle`, text sections | `TextFont`, `TextColor`, child `TextSpan` entities |
| `Parent`, `parent.get()` | `ChildOf`, `child_of.parent()` |
| `despawn_recursive()` | `despawn()`; it takes the children with it |
| `with_children` for a fixed set | `children![..]`, or `related!` for other relationships |
| `query.get_single()` | `query.single()` returns a `Result`; `Single<D, F>` as a parameter skips the system when there is not exactly one |
| `Event`, `EventReader`, `EventWriter`, `add_event`, `send` | Buffered: `Message`, `MessageReader`, `MessageWriter`, `add_message`, `write` |
| `Trigger<E>`, `OnAdd`, `trigger_targets` | `On<E>`; `Add`, `Insert`, `Discard`, `Remove`, `Despawn`; an `EntityEvent` carries its target, read with `event_target()` |
| `StateScoped(state)` | `DespawnOnExit(state)`, `DespawnOnEnter(state)` |
| `apply_deferred` | `ApplyDeferred` |
| `timer.finished()` | `timer.is_finished()`; `just_finished()` is unchanged |
| `time.delta_seconds()` | `time.delta_secs()` |
| `Color::rgb(..)` | `Color::srgb(..)` |
| `ResMut<AmbientLight>` | `ResMut<GlobalAmbientLight>`; `AmbientLight` is a per-camera override component |
| `SceneRoot(handle)` for glTF | `WorldAssetRoot(handle)` from `bevy_world_serialization`. `bevy_scene` is now the BSN scene system: `bsn!` and `spawn_scene` |
| `window.cursor_options` | `CursorOptions` is its own component on the window entity |
| `Gamepads` resource | Each gamepad is an entity with a `Gamepad` component |
| `camera.hdr = true` | The `Hdr` component on the camera |

Rendering types moved out of `bevy_render` into `bevy_camera`, `bevy_light`, `bevy_mesh` and
`bevy_shader`. Import from `bevy::prelude` where you can, and from the named crate where the
prelude does not export the type.

## Bevy 0.20

0.20 was released on 2026-10-08. A project on 0.19 keeps the 0.19 forms in the left column.

| 0.19 | 0.20 |
| --- | --- |
| `On<Add, Health>` | `On<Add<Health>>`; the bundle moved into the event type |
| `On<Pointer<Click>>`, `click.pointer_location.position` | `On<PointerClick>`, `click.pointer.position`; same for `PointerPress`, `PointerOver`, `PointerDrag` and the rest |
| `Interaction` and `Changed<Interaction>` | Deprecated. `Hovered` (`bevy::picking::hover`) and `Pressed` (`bevy::ui`) |
| `bevy::ui::widget::Button` | Deprecated. `Button` from `bevy::ui_widgets`, which fires an `Activate` entity event |
| `BorderRadius` fields are `Val` | Fields are `CornerRadius`; a `Val` converts with `.into()` |
| `TextFont::default()` is 20 px | Default is `FontSize::Rem(1.)`; write `FontSize::Px(20.)` to keep a fixed size. `Val::Em` and `Val::Rem` exist |
| `next.set_if_neq(s)` | `next.set_if_different(s)` |
| `query.iter_many(entities)` yields items | Yields `Result`; `.matched()` restores the skipping behaviour |
| `Name::from(&str)` | Only `&'static str` converts; use `Name::new(s.to_owned())` |
| `bevy::math::primitives::*`, `bevy::math::curve::*` | `bevy::shape::*`, `bevy::curve::*` |
| `bevy_core_pipeline::tonemapping::Tonemapping` | `bevy::render::view::Tonemapping`. `Tonemapping::None` is now a full passthrough; `Linear` is the old behaviour |
| `Camera3d` brings screen-space transmission | Add `ScreenSpaceTransmission` to the camera when a material transmits |
| `#import bevy_pbr::..` in `.wgsl` | WESL: `import bevy_pbr::..;` in `.wesl`, `@if(NAME)` for `#ifdef` |
| Exclusive systems are a separate kind | `&mut World` is an ordinary system parameter |

`references/bevy-0-20.md` has the longer list, the shader changes and an upgrade order.

## Related skills

For runtime diagnosis of a running game, see the **bevy-debug-inspection** skill.
