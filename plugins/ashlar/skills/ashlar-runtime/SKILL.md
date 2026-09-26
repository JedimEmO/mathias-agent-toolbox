---
name: ashlar-runtime
description: Use when a Bevy game consumes spawned ashlar buildings at runtime - physics colliders from AshlarCollider, which room a player is in, portals for AI and audio, storey cuts and hiding exteriors, damage and destruction, level-of-detail behaviour, or frame-time problems with many ashlar pieces (especially WebGL2 and phones).
---

# ashlar at runtime

Everything below arrives on or under the `AshlarBuilding` root once `AshlarBuildingSpawned`
fires (see `ashlar-game-setup`). All data is in the **building's frame**; the root's
`GlobalTransform` places it in the world.

## Physics

Each collision proxy is a child entity (identity `Transform`, so it inherits the building's
placement) with `AshlarCollider { instance, element, vertices: Vec<Vec3> }`: points of a tight
convex solid. Build a convex-hull collider on that same entity:

```rust
// avian3d; rapier is the same with its own convex_hull.
fn add_colliders(add: On<Add, AshlarCollider>, proxies: Query<&AshlarCollider>, mut commands: Commands) {
    let Ok(proxy) = proxies.get(add.entity) else { return };
    if let Some(shape) = Collider::convex_hull(proxy.vertices.clone()) {
        commands.entity(add.entity).insert((RigidBody::Static, shape));
    }
}
```

Proxies are level 0's at every distance (physics does not coarsen), one per wall run, so doorways
are gaps between proxies and rooms are never filled. Decorative elements have none.

## Rooms and portals

`AshlarSpaces { rooms, portals }` on the root:

- `Room { id, size, pose, group, portals }`: a declared box. `room.contains(point)` takes a
  building-frame `DVec3`.
- `Portal { id, instance, element, corners: [DVec3; 4], normal, storey }`: one per placed
  opening (door/window cutter marked `portal`), a rectangle at the wall's mid-plane.
  A room lists the portal ids that open onto it.

```rust
fn room_of<'a>(world: Vec3, root: &GlobalTransform, spaces: &'a AshlarSpaces) -> Option<&'a Room> {
    let p = root.affine().inverse().transform_point3(world);
    let p = ashlar::glam::DVec3::new(p.x.into(), p.y.into(), p.z.into());
    spaces.rooms.iter().find(|room| room.contains(p))
}
```

Uses: "which room is the player in", room-to-room graphs for AI and audio occlusion through
portals, triggers. A server can do the same with `ashlar` alone (no Bevy, no kernel).

## Storeys and exteriors (top-down, cutaway, interiors)

Every piece has `AshlarPiece { level, label, storey: Option<i32>, side: Side }`. Culling policy
is the game's:

```rust
fn cutaway(max_storey: Option<i32>, hide_exterior: bool, mut pieces: Query<(&AshlarPiece, &mut Visibility)>) {
    for (piece, mut visibility) in &mut pieces {
        let shown = max_storey.is_none_or(|cut| piece.storey.is_none_or(|s| s <= cut))
            && !(hide_exterior && piece.side == ashlar::Side::Exterior);
        visibility.set_if_neq(if shown { Visibility::Inherited } else { Visibility::Hidden });
    }
}
```

Storeys come from merge groups or storey-tagged recipes; interiors from `Element::interior()`.
Coarse levels drop interiors, so an opened building far away shows nothing inside by design.

## Damage

Damage is data (`DamageLog` of `Damage::blast(centre, radius, slot)` etc.), applies to
**merged** buildings only, and computing the new shape needs the geometry kernel
(`ashlar-manifold`'s `GroupSolids::apply`, ~10 ms per hit, run it on a task). So it runs in a
tool, a server, or a game that accepts linking the kernel and a C++ toolchain. The log is the
save and wire format: every client replays the same holes. Results are re-meshed groups
(draw with `ashlar_bevy::batch_drawables`, replacing that group's pieces), `Debris` chunks with
volume and centre, and a triangle collider for any hit group. Standalone elements (glass,
doors) are reported via `standalone_touched`; what they do is the game's call.

## Levels of detail

Each piece carries a `VisibilityRange`; Bevy culls to it. A piece a coarser level did not change
is one entity spanning both bands. Hiding a piece yourself uses `Visibility` as usual. To force
one level for debugging, remove the piece's `VisibilityRange` and show only that level.

## Frame time with many pieces

Entities ≈ placed elements × levels. A 4×4-block city is ~114k piece entities. Natively,
Bevy's GPU preprocessing copes; on **WebGL2/wasm** every entity is culled, range-checked,
extracted and batched on one CPU thread, so the entity count is the frame time.

Levers, biggest first (measured on the ashlar demo: 21 → 10 ms over a city at night):

1. **Stream out-of-range pieces with Bevy's `Disabled`.** Group pieces by (ground cell ~40 m,
   band from `VisibilityRange`, side). A group whose band cannot reach the camera from anywhere
   in its cell gets `Disabled`; add hysteresis. On re-enable, re-insert its `Transform` and
   `Visibility` so propagation recomputes what went stale. Systems that must still see the
   pieces (storey cut, material swaps) query with `Allow<Disabled>`. Give interiors a short reach
   (~40 m) unless the building is opened. Reference: `examples/web/src/streaming.rs` in ashlar.
2. **Shadows redraw everything in reach.** The directional shadow pass was a third of a
   browser frame. Mark interiors `NotShadowCaster`, drop shadows where they don't read (night,
   phones). Shortening the cascade loses tall casters on WebGL2 (no depth clamp).
3. **Author fewer, larger elements** on repeated parts, and tune `LodPolicy` distances; a far
   level is still one instance per placed element.
4. **Phones**: no MSAA, no shadow map, a small budget of lit point lights (WebGL2 clusters at
   most 204); detect with the `(pointer: coarse)` media query.
5. **Web build profile**: size-optimised wasm, but `opt-level = 3` for `bevy_ecs`,
   `bevy_render`, `bevy_pbr`, `bevy_camera`, `wgpu*` gave ~12% for ~1.2 MB gzipped.
