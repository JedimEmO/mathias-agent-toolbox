# Bevy 0.19 to 0.20

The changes most likely to touch game code, taken from the official guide and checked against
the 0.20.0 crate source. The full guide is at
<https://bevy.org/learn/migration-guides/0-19-to-0-20/>; read it before an upgrade, because
this page leaves out the render-internals and reflection items.

## Contents

- [Upgrade order](#upgrade-order)
- [ECS](#ecs)
- [Picking and input](#picking-and-input)
- [UI](#ui)
- [Rendering and assets](#rendering-and-assets)
- [BSN scenes](#bsn-scenes)
- [Changes that compile but look different](#changes-that-compile-but-look-different)

## Upgrade order

1. Check that every Bevy-dependent crate in `Cargo.toml` has a release for 0.20
   (`references/ecosystem.md`). If the physics or networking crate has none, stop there.
2. Bump `bevy` and those crates together, in one commit with nothing else in it.
3. Run `cargo check` and fix errors crate by crate, leaf crates first. Most changes below are
   compile errors with an obvious replacement.
4. Fix the deprecation warnings next. `Interaction` and `bevy::ui::widget::Button` still
   compile in 0.20 and are removed after it.
5. Run the game and look at it. The items under *Changes that compile but look different* do
   not produce errors.

## ECS

- **Lifecycle observers.** `On<Add, T>` is `On<Add<T>>`, and the same for `Insert`,
  `Discard`, `Remove` and `Despawn`. An observer on a dynamic component is `On<Add<()>>`.
  `On` has one type parameter.
- **Many-iterators.** `iter_many`, `iter_many_mut`, `iter_many_unique` and the parallel
  versions yield `Result<Item, QueryEntityError>`. Call `.matched()` to skip entities that do
  not match, as before.
- **Exclusive systems.** `&mut World` is a normal `SystemParam` and may appear anywhere in
  the parameter list. `ExclusiveSystemParam` and `ExclusiveFunctionSystem` are gone.
- **States.** `NextState::set_if_neq` is `set_if_different`, and `set_state_if_neq` on
  `Commands` is `set_state_if_different`. The old names are deprecated wrappers.
- **Names.** `Name: From<&str>` only accepts `&'static str`. For a runtime string, use
  `Name::new(s.to_owned())`.
- **Built-in schedules.** Several chain their system sets weakly (`chain_weak`). A system that
  relied on being ordered after a built-in set through a non-ECS dependency needs an explicit
  `.after(..)`.
- **`DeferredWorld::query`** is deprecated; use `query_state.query_mut(&mut world)`.

## Picking and input

- **Pointer events are flat.** `Pointer<Click>` is `PointerClick`, `Pointer<Press>` is
  `PointerPress`, and so on for `Over`, `Out`, `Move`, `Release`, `Drag`, `DragStart`,
  `DragEnd`, `DragDrop`, `Scroll`, `Enter`, `Leave` and `Cancel`. There is no `Deref` to an
  inner event; the fields are on the struct.
- The pointer itself is the `pointer` field: `click.pointer.id`, `click.pointer.position` (a
  `Vec2`), `click.pointer.location()`.
- A handler generic over pointer events bounds on `E: PointerEvent`.

```rust
commands.spawn((Mesh3d(mesh), MeshMaterial3d(material)))
    .observe(|click: On<PointerClick>| {
        info!("clicked {} at {}", click.entity, click.pointer.position);
    });
```

## UI

- **`Interaction` is deprecated.** Query `Hovered` (`bevy::picking::hover`, a `bool` wrapper
  that only changes on enter and leave) and the `Pressed` marker (`bevy::ui`).
- **`Button` moved** to `bevy::ui_widgets`. It is headless: it keeps the `Pressed` state and
  triggers an `Activate` entity event on release. The `ui` feature set enables
  `bevy_ui_widgets`.
- **`BorderRadius` is two-dimensional.** Each corner is a `CornerRadius`; a `Val` converts
  with `.into()`, and `CornerRadius::circular(v)` is explicit. The constructors are no longer
  `const`.
- **`Val::Em` and `Val::Rem`** exist, with `em()` and `rem()` helpers. `Val::resolve` and its
  relatives take the two sizes as extra arguments.
- **Text input** needs both `EditableText` and `TextInput`. `Escape` clears focus and
  propagates. `TextScroll` is `EditableText::viewport`.
- **`CalculatedClip`** is an enum (`Rects`, `FullyClipped`).
- **UI rendering is retained.** Custom UI render code reads `ExtractedUiNodes::changed`
  instead of assuming every node is extracted each frame.

## Rendering and assets

- **Shaders are WESL.** Files with directives become `.wesl`. `#import a::{b}` is
  `import a::b;`, at the top of the file. `#ifdef NAME` is `@if(NAME)`, and `#{NAME}` is
  `constants::NAME`. `#define_import_path` is gone, and so is GLSL. Module paths moved, for
  instance `bevy_pbr::mesh_view_bindings` to `bevy_pbr::render::mesh_view_bindings`; find the
  new path by looking for the `.wesl` file under the crate's `src`.
- **`Tonemapping` and `DebandDither`** are in `bevy::render::view`. Reflected type paths
  changed with them, which matters for saved scenes and BRP keys.
- **`ScreenSpaceTransmission`** is no longer required by `Camera3d`. Add it to the camera when
  a material uses transmission.
- **Sprites** render through `Mesh2d` and `SpriteMeshMaterial`. `Sprite` has an `alpha_mode`
  field, `Blend` by default.
- **`bevy_shape` and `bevy_curve`** were split out of `bevy_math`: `bevy::shape::*` for
  primitives and bounding traits, `bevy::curve::*` for curves and splines.
- **Extraction** is generic over the target app: add `#[extract_app(RenderApp)]` to an
  `ExtractComponent` derive, and `SyncComponent` is `SyncComponent<RenderApp>`.
- **`AsBindGroup::unprepared_bind_group`** is `build_bind_group` and writes to a
  `BindGroupBuilder`.
- **`MeshTag(x)`** is `MeshTag::new(x)`.
- **`AssetId::invalid()`** is deprecated; hold an `Option<AssetId<T>>`.
- **Image compression.** The feature `compressed_image_saver` now uses BCn and ASTC; the old
  Basis Universal behaviour is `compressed_image_saver_universal`.

## BSN scenes

- A scene reference needs `@`: `@scene_variable`, `@scene_function()`, `@{expression}`.
- Separate entities in a list with `--`, and write `bsn_list! { .. }`.
- An enum used in a scene needs `Default` and `Clone`, and a variant must list all its fields.

## Changes that compile but look different

- `TextFont::default()` is `FontSize::Rem(1.)`, not 20 px. Text sized by default may change.
- `Tonemapping::None` skips grading, dithering and clamping too. `Tonemapping::Linear` is the
  old `None`, and it is the new default for `Camera2d`.
- Sprites at the same Z may draw in a different order.
- With two cameras on one target and mixed `Hdr`, the upper camera now blends over the lower.
  Set `blend_state` in `CameraOutputMode::Write` to replace instead.
- `with_luminance` on colours no longer clamps.
- A render debug overlay is in the default plugins, off until `F1`
  (`RenderDebugOverlayKeybindings`).
- On macOS, activation at startup follows `Window::focused`.
