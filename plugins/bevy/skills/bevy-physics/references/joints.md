# Bevy Physics Joints

## Contents

- Joints
- avian
- bevy_rapier
- 2D vs 3D

## Joints

Joints constrain how two rigid bodies move relative to each other.

### avian

```rust
use avian3d::prelude::*;

// Fixed joint — bodies stay rigidly attached
let entity_a = commands.spawn((RigidBody::Dynamic, Collider::sphere(0.5))).id();
let entity_b = commands.spawn((RigidBody::Dynamic, Collider::sphere(0.5))).id();
commands.spawn(FixedJoint::new(entity_a, entity_b));

// Revolute joint — rotation around a single axis (hinge)
commands.spawn(
    RevoluteJoint::new(entity_a, entity_b)
        .with_aligned_axis(Vec3::Z)   // axis of rotation
        .with_angle_limits(-1.0, 1.0) // radians
);

// Prismatic joint — sliding along a single axis (piston/slider)
commands.spawn(
    PrismaticJoint::new(entity_a, entity_b)
        .with_free_axis(Vec3::Y)
        .with_limits(0.0, 5.0) // min/max translation
);

// Distance/spring joint — keeps bodies within a distance range
commands.spawn(
    DistanceJoint::new(entity_a, entity_b)
        .with_limits(1.0, 5.0)
        .with_compliance(0.001) // lower = stiffer spring
);
```

### bevy_rapier

```rust
use bevy_rapier3d::prelude::*;

let entity_a = commands.spawn((RigidBody::Dynamic, Collider::ball(0.5))).id();
let entity_b = commands.spawn((RigidBody::Dynamic, Collider::ball(0.5))).id();

// Fixed joint
commands.spawn(ImpulseJoint::new(
    entity_a,
    FixedJointBuilder::new().local_anchor1(Vec3::ZERO).local_anchor2(Vec3::new(0.0, -1.0, 0.0)),
)).insert(ImpulseJoint::new(entity_a, FixedJointBuilder::new()));

// Revolute joint
let revolute = RevoluteJointBuilder::new(Vec3::Z)
    .local_anchor1(Vec3::new(1.0, 0.0, 0.0))
    .local_anchor2(Vec3::new(-1.0, 0.0, 0.0))
    .limits([-1.0, 1.0]);
commands.entity(entity_b).insert(ImpulseJoint::new(entity_a, revolute));

// Prismatic joint
let prismatic = PrismaticJointBuilder::new(Vec3::Y)
    .local_anchor1(Vec3::ZERO)
    .local_anchor2(Vec3::ZERO)
    .limits([0.0, 5.0]);
commands.entity(entity_b).insert(ImpulseJoint::new(entity_a, prismatic));

// Spring joint (via rapier's SpringJointBuilder if available, or via motor on prismatic)
let spring = SpringJointBuilder::new(2.0, 0.5, 0.1); // rest_length, stiffness, damping
commands.entity(entity_b).insert(ImpulseJoint::new(entity_a, spring));
```

## 2D vs 3D

Each physics crate ships as two separate crates — one for 2D and one for 3D. You cannot mix them in the same Bevy app.

| Dimension | avian | bevy_rapier |
|---|---|---|
| 2D | `avian2d` | `bevy_rapier2d` |
| 3D | `avian3d` | `bevy_rapier3d` |

Key differences in 2D mode:
- Positions use `Vec2`, rotations use scalar angles (radians) instead of `Quat`
- Collider shapes: `circle` instead of `sphere`, `rectangle` instead of `cuboid`
- Gravity default is `(0.0, -9.81)` as a `Vec2`
- Joints rotate around the implicit Z axis
- `LinearVelocity` and `AngularVelocity` use 2D types

Choose 2D physics when your game is truly 2D (platformer, top-down). If you have a 2D game with a 3D camera or 3D models rendered from a fixed angle, you may still want 2D physics for simplicity.
