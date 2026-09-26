---
name: ashlar-building-authoring
description: Use when writing buildings for a game with the ashlar recipe API - parts, elements, geometry and cutters, instances and sockets, material slots, collision proxies, rooms and portals, merge groups, level-of-detail-friendly authoring, or reading a ValidationError path.
---

# Authoring game buildings with ashlar

A building is plain Rust data: `Part`s (reusable solids made of named `Element`s) placed as
`Instance`s in a `Building` that binds material slots to keys. It lives in the **content crate**,
not the game; the content step meshes it (see `ashlar-game-setup`).

## Model

- **Element** = one solid (`Geometry` tree) + a material slot + UV mode + collision. Elements of a
  part stay separate meshes; fuse inside one element with `union`, `union_all`, `arrayed`, `mirrored`.
- **Geometry** primitives: `cuboid(size)` (origin to +size, so `Pose::at` sets its min corner),
  `chamfered_cuboid(size, bevel)`, `cylinder(r, h, segments)` (on Y from 0),
  `extrude(xz_profile, depth)` (along +Y), `revolve([radius, height] profile, segments)`,
  `hull(points)`, `ball(r, rings)`. Ops: `subtract`, `union`, `arrayed(count, step)`,
  `mirrored(plane)`, `.placed(Pose)`.
- **Units**: `f64` metres, right-handed, Y up. `Pose::at([x,y,z]).rotated(DQuat)`; no scale.
- **Instance**: `Instance::new(id, part).placed(pose)` or `.attach(socket, target, target_socket)`
  (faces opposed, like modules meeting) / `.attach_aligned(...)` (frames coincide, like stacking a
  storey on a `top` socket). Sockets face outward along their +Z.

```rust
use ashlar::{Building, Collision, Element, Geometry, Instance, Part, Pose, Room, Socket};

let walls = Geometry::cuboid([6.0, 3.0, 5.0])
    .subtract(Geometry::cuboid([5.4, 3.2, 4.4]).placed(Pose::at([0.3, 0.2, 0.3])))
    .subtract(Geometry::cuboid([1.0, 2.1, 0.6]).placed(Pose::at([2.5, 0.2, -0.15])).portal("door"));

let cottage = Part::builder("village:cottage")
    .element(Element::new("walls", walls, "wall").cut_material("trim").collision(Collision::Bounds))
    .element(Element::new("floor", Geometry::cuboid([5.4, 0.2, 4.4]).placed(Pose::at([0.3, 0.0, 0.3])), "floor").interior())
    .socket(Socket::new("top", Pose::at([3.0, 3.0, 2.5])))
    .build()?;

let village = Building::builder("village:green")
    .part(cottage)
    .material("wall", "library:adobe")
    .material("trim", "library:formed-concrete")
    .material("floor", "library:wood-floor")
    .instance(Instance::new("cottage-0", "village:cottage").placed(Pose::at([-10.0, 0.0, 2.0])))
    .room(Room::new("cottage-0/room", [5.4, 2.6, 4.4]).placed(Pose::at([-9.7, 0.2, 2.3])).portal("door"))
    .build()?;
```

## Rules that matter in a game

- **Cutters**: one that runs past both faces is an opening; one that stops inside is a recess.
  `cut_material(slot)` on an element (or on a cutter) dresses the cut faces. Every slot used,
  cut slots included, must be bound on the building or the instance, or `build()` fails.
- **Collision** is per element, convex and tight: `Collision::Bounds` (AABB) or `Hull`.
  A cutter does not carve the proxy, so a walkable doorway is the **gap between two elements**:
  author one element per straight run of wall; never one L-shaped wall. Trim, lights, signage
  keep the default `None`.
- **Interiors are added, never carved.** Floors, partitions, liners, furniture are elements
  marked `.interior()`. Side is declared per element; give an exterior slab a thin interior liner
  for its inside face.
- **Portals and rooms**: `Geometry::portal(id)` on a door/window cutter publishes the opening per
  placement (not under an array or mirror; mark the wall's cutter, not the liner's).
  `Room::new(id, size).placed(pose).portal(id)` declares a box volume; it is data, never meshed.
- **LOD-friendly authoring** (levels come from `LodPolicy`, which drops what is thin, judged by
  the middle of an element's three extents):
  - Make small detail its own element or union member so it can drop; a vent fused into a panel
    stays as long as the panel.
  - Union fine trim of one kind into one element so it drops together.
  - Mark anything that must read from afar because it glows (neon lines, crown lights, lamps)
    `.far()`; it survives every level.
  - Mark insides `.interior()`; coarse levels drop them.
  - Facade textures should read as windows at distance: dropped openings are carried by the map.
- **Coplanar faces**: two elements must not put same-facing faces on one plane in two materials
  (z-fighting, or slivers when merged). Offset trim by ~1 cm or share the slot.
- **UVs** are metres, set with `Element::uv(UvMode::..)`: `Planar` (default) per face, `Box` for
  continuous tiling across a wall of modules, `Cylindrical { axis }` for round things (keep the
  axis at the part origin).
- **Merging** (`Building::builder(..).merged()`, `.group(MergeGroup::new(id).storey(n))`,
  `Instance::group(id)`) unions each group into one mesh: no internal faces or seams, and it is
  the unit of damage. It **gives up instancing** and is off by default. Keep repeated kits
  unmerged; size a group like a storey or bay; mark glass, doors, lights `.standalone()`.
- **Per-instance variety**: `Instance::binding(slot, Binding::new(key).param("color",
  ParamValue::Color([r, g, b])))`. Each distinct value is one bake, shared by every instance
  using it, so prefer a few values over one per instance.
- **Instancing is the budget.** A city of repeated storey parts is cheap in memory, but every
  placed element is an entity at runtime. Fewer, larger elements per repeated part beat many
  small ones (see `ashlar-runtime`).

## Validation

`build()` returns a `ValidationError` whose path names the spot, e.g.
`parts[village:cottage].elements[walls].geometry.cutters[0]` or
`instances[cottage-0].materials[trim]`. Read the path first. Typical causes: unbound slot,
duplicate id, bevel too large (`< min(size)/2`), degenerate extrude profile, attachment cycle or
unknown socket, portal under an array/mirror.

## Checking a building

- In the ashlar repo, `tools/ashlar-preview` shows a recipe with `--clay --wireframe`; a game can
  register its own scenes with the preview library.
- In a test, mesh with `ashlar_manifold::mesh_building(&b, &ManifoldMesher::default())` (content
  crate only) and assert triangle counts, or run the content step and read the per-level
  triangle counts `ship` returns.
- Terrain: `GroundingSpec` + `GroundingPolicy` + `fit_ground(TerrainPatch)` return a world pose,
  foundation and ramp solids, or a typed `GroundError`; kernel-free, usable in the game.
