---
name: ashlar-game-materials
description: Use when choosing, varying or shipping ashlar PBR materials for a game - picking from the default library, adding game-specific definitions, per-instance colours and seeds, bake resolution and download size, baked grass/moss strands, or deciding whether a new material graph is needed.
---

# ashlar materials for a game

A **material library** (`MaterialLibrary`) maps keys (`"library:brick"`) to
`MaterialDefinition`s. Building slots bind keys. The content step bakes each definition's
graph into KTX2 maps and writes a library of `Surface::Files` that the game loads; the game
never evaluates a graph. Colours in graphs are linear RGB.

## Start from the default library

`ashlar_material::stdlib::graphs()` + `stdlib::materials()`: about forty finished surfaces,
each a `Surface::Graph` definition with sensible `tile_metres`. Keys:

- Masonry/concrete: `brick`, `ashlar-blocks`, `stone-cladding`, `formed-concrete`,
  `stained-concrete`, `plaster`, `damaged-plaster`, `adobe`, `rubble`
- Ground: `paving-slabs`, `soi-cobblestone`, `asphalt`, `road`, `desert-sand`, `grass`,
  `moss-carpet`
- Metal: `steel`, `painted-metal`, `rusted-steel`, `corrugated-steel`, `tread-plate`,
  `hull-plating`
- Roof/wood/interior: `clay-roof-tiles`, `painted-boards`, `wood-floor`, `ceramic-tile`,
  `interior-panelling`
- Facade/glass/light: `glass`, `curtain-wall`, `office-window`, `window-band`, `shopfront`,
  `dark-recess`, `emissive-strip`, `holo-sign`, `signage-ink`

All prefixed `library:`. Ship only what buildings bind:
`definitions.materials.retain(|k, _| used.contains(&k.as_str()))`; every kept definition is a
bake and a download. To see a material and its sliders, use the ashlar web demo's Materials
mode or `tools/ashlar-preview` (`--scene sheet-<name>`).

A graph's parameters: `graphs.get("library:adobe").unwrap().params` (`color` is the most
common; also `wear`, `age`, `wet`, `variation`, `irregularity`, ...).

## Adding a game's own definitions

Insert into the same `MaterialLibrary` before calling `Content::ship`:

```rust
use ashlar::{Bake, MaterialDefinition, ParamValue, Surface};

// Constants only: glass, trim, lights. No maps, no bake.
definitions.materials.insert("game:hazard-light".into(), MaterialDefinition {
    base_color: [0.1, 0.1, 0.1],
    emissive: [8.0, 3.0, 0.2],      // linear HDR; glows, lights nothing
    ..Default::default()
});

// A library graph with the game's own values: one bake, one key.
let mut faction = definitions.materials["library:hull-plating"].clone();
if let Surface::Graph(bake) = &mut faction.surface {
    bake.params.insert("color".into(), ParamValue::Color([0.35, 0.05, 0.04]));
}
definitions.materials.insert("game:red-hull".into(), faction);
```

Hand-painted maps from other tools: `Surface::Files { base_color, normal, orm, .. }` with paths
under the asset root; leave `baked_from: None` so the normal map is read OpenGL (+Y) style.

Definition constants: `base_color` (multiplier), `roughness`, `metallic`, `emissive`,
`tile_metres` (physical size of one repeat; keep the graph's own unless intentionally
rescaling), `uv_offset`.

## Variety without more keys

A per-instance override on a building's slot
(`Binding::new("library:adobe").param("color", ParamValue::Color(..))`) is flattened by
`ship` into its own material. Cost is per **distinct value**: a hundred houses over three
colours are three bakes. Use a handful of palette values or a seed-like parameter
(`variation`) per district, not one per instance. The override touches graph parameters
only; a tint on the definition's constants needs its own key.

## Resolution and size

- `Content::resolution(Some(512))` bakes everything at one size, for fast iteration or smaller
  downloads; `None` uses each definition's own resolution for a release. A resolution below a
  graph's finest lattice is a bake error, and most library graphs lay a 512 lattice, so 512 is
  the practical floor for the default library. To go lower for plain graphs, set each
  definition's `Surface::Graph(bake).resolution` (no lower than
  `graph.build_in(&graphs)?.finest_lattice()`) and ship with `resolution(None)`.
- Output is KTX2 with full mips, zstd-supercompressed; Bevy needs its `ktx2` and `zstd_rust`
  features (on by default in a full Bevy; add them if you trimmed features).
- Height maps are baked but no `StandardMaterial` slot reads them; they cost download only.

## Strands: grass, moss, fur

Materials such as `library:grass` and `library:moss-carpet` grow geometry. The content step
writes `set.strands` beside the maps; the game enables `ashlar-bevy`'s `strands` feature
(a game feature: no graph engine) and grows strands on its own ground triangles with
`ashlar_bevy::strands::create_strands`. The definition's `StrandSettings` control it:

- `lod_metres([2.5, 7.0])` level distances, `card_metres(14.0)` for crossed-quad impostors
  beyond them, then the baked relief texture alone.
- `density(0.25)` removes strands for a cheaper scene without moving the ones that stay.
- `cast_shadows(false)` on anything dense; add `ashlar_bevy::wind::StrandPlugin` for sway.
- Budget: a full-detail two-metre grass repeat is ~690k triangles; set density accordingly.

Worked example: `crates/ashlar-bevy/examples/lawn.rs` in the ashlar repo.

## When to author a new graph

Prefer a library material with parameters or a constants-only definition. A new graph is
content-crate work (`ashlar_material::MaterialGraph` builder, tiled fields into a `PbrOutput`)
with its own rules: integer power-of-two periods, height in `0..=1` driving the normal, linear
colour. Inside the ashlar repo, the `.agents/skills/ashlar-materials` skill covers that
workflow; register the graph in your `MaterialGraphLibrary` and a definition that names it,
and the content step bakes it like any other.
