---
name: ashlar-game-setup
description: Use when adding ashlar procedural buildings or materials to a Bevy game - setting up the content step crate, the game's dependencies, AshlarPlugin and AshlarBuilding, the asset layout, levels of detail, WebGL2 builds, or diagnosing AshlarFailed load errors.
---

# ashlar in a Bevy game: setup

ashlar splits the work the way a game splits art from code:

- **Content step** (a small tool binary): links the geometry kernel (C++ Manifold) and the
  material graph engine, and writes `.ashlar` buildings and KTX2 materials into the game's assets.
- **Game**: links `ashlar-bevy` with **no features** and loads those files. No kernel, no graph
  engine, no C++ toolchain, no baking in front of a frame.

The Rust recipes and graphs are the only source. Baked files are regenerated output: never commit
them, never hand-edit them.

## Dependencies

Not on crates.io; depend on git. `ashlar-bevy` pairs with exactly one Bevy release (0.19).

```toml
# content/Cargo.toml — a tool, needs cmake + a C++ compiler + git on first build
[dependencies]
ashlar = { git = "https://github.com/JedimEmO/ashlar" }
ashlar-content = { git = "https://github.com/JedimEmO/ashlar" }
ashlar-material = { git = "https://github.com/JedimEmO/ashlar" }

# game/Cargo.toml
[dependencies]
ashlar-bevy = { git = "https://github.com/JedimEmO/ashlar" }   # re-exports `ashlar`
bevy = "0.19"
```

Game features: `strands` (baked grass/moss/fur) is the only one a shipped game should enable.
`runtime-bake`, `gpu-bake`, `shader`, `strand-scatter` are **tool** features: they pull the graph
engine and bake at runtime. Use them in editors and previews, never in the shipped game.

If an activated Anaconda env exports `CC`/`CXX`, build the content crate with
`CC=/usr/bin/gcc CXX=/usr/bin/g++`; Anaconda's GCC yields a kernel that dies on SIGFPE.

## The content step

```rust
use ashlar::LodPolicy;
use ashlar_content::Content;
use ashlar_material::stdlib;

fn main() -> anyhow::Result<()> {
    let graphs = stdlib::graphs();
    let mut definitions = stdlib::materials();
    // Ship only what your buildings bind; every definition kept is a bake.
    definitions.materials.retain(|key, _| USED.contains(&key.as_str()));

    Content::new("../game/assets")
        .resolution(Some(512)) // one size for all while iterating; None = each definition's own
        .ship(
            &graphs,
            &definitions,
            "materials",
            &[("buildings/village.ashlar".to_owned(), village()?)],
            &LodPolicy::ladder(),
        )?;
    Ok(())
}
```

`ship` flattens per-instance material overrides, bakes every material, and meshes every building
at every level. `write_materials` / `write_building` do the halves separately (bake materials once,
buildings often). Writes are atomic, so a running game never reads half a file.

Output under the asset root:

| Path | Content |
| --- | --- |
| `buildings/<name>.ashlar` | all levels, colliders, portals, rooms |
| `materials/library.materials.ron` | the library the game loads |
| `materials/<ns>/<name>/{base,normal,orm,height}.ktx2` | maps with full mips, zstd |
| `materials/<ns>/<name>/set.strands` | baked strand set, when the material grows strands |
| `materials/graphs.ron` | tools only; the game never reads it |

Run it from a `just content` recipe or a pre-build step. Template: `examples/integration-content`
in the ashlar repo.

## The game

```rust
use ashlar_bevy::prelude::{AshlarBuilding, AshlarPlugin};
use bevy::prelude::*;

App::new()
    .add_plugins((DefaultPlugins, AshlarPlugin::default()))
    .add_systems(Startup, |mut commands: Commands, server: Res<AssetServer>| {
        commands.spawn((
            AshlarBuilding {
                building: server.load("buildings/village.ashlar"),
                materials: server.load("materials/library.materials.ron"),
            },
            Transform::from_xyz(0.0, 0.0, 0.0), // places the whole building
        ));
    })
    .run();
```

When both assets load, the plugin spawns each piece of each level as a child with `Mesh3d`,
`MeshMaterial3d<StandardMaterial>`, `Transform`, `AshlarPiece { level, label, storey, side }` and
a `VisibilityRange` for its band. Meshes are shared by content and materials by binding, so a
hundred copies of one file upload once and batch. Template: `examples/integration-game`.

Signals on the root entity:

- `AshlarBuildingSpawned { entity }` message once children exist, and an `AshlarSpawned` marker.
- `AshlarFailed(String)` on failure; never panics. Removing it retries. A file that finishes
  loading later clears it, so starting the game before the content step is fine.
- With Bevy's file watcher, a rewritten file respawns the building in place (hot reload).

`AshlarPlugin` fields: `preflight` (default true: opens every map at library load so a missing
file is an error naming its key; false skips it for trusted content), `crossfade` (fraction of a
band boundary two levels blend over, default 0.1), `bands` (see WebGL2).

## Levels of detail

Levels are simpler recipes, not decimated meshes. `LodPolicy { until, min_feature, segment_scale,
drop_interior }` per level; `LodPolicy::ladder()` = authored to 60 m, then no interiors / nothing
under 35 cm / half segments to 250 m, then nothing under 1.5 m / quarter segments beyond. Tune the
distances to your camera. Level 0 is the expensive one and only draws near the camera.

## WebGL2

Bevy 0.19.1 cannot crossfade a `VisibilityRange` on WebGL2 (the app would fail pipeline
validation). `Bands::Auto` (default) detects that from the render device and uses abrupt
bands cut mid-margin; `Bands::Crossfade` / `Bands::Abrupt` force one. Nothing else changes.
For frame-time on the web, see the `ashlar-runtime` skill.

## Troubleshooting (`AshlarFailed` text)

| Message | Fix |
| --- | --- |
| "the building/material library failed to load" | content step not run, wrote to another asset root, or version mismatch |
| "the material library does not dress this building" | bake materials and buildings from the same definitions (`ship` does) |
| "binds no graph parameters, so an instance cannot override" | per-instance overrides baked without `flatten_overrides`; use `ship` |
| "names a material graph" | a `Surface::Graph`/`Shader` definition reached the game; ship files via the content step |
| preflight names a map | the file is missing under the asset root or has the wrong colour space |
