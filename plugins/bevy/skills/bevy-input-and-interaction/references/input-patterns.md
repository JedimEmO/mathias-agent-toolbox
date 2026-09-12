# Bevy Input Patterns

## Contents

- Player Movement
- FPS Camera Control
- Orbit Camera
- Drag and Drop with Picking

## Common Patterns

### Player Movement (WASD + Arrow Keys)

```rust
fn player_movement(
    keys: Res<ButtonInput<KeyCode>>,
    mut query: Query<&mut Transform, With<Player>>,
    time: Res<Time>,
) {
    let mut direction = Vec2::ZERO;

    if keys.pressed(KeyCode::KeyW) || keys.pressed(KeyCode::ArrowUp) {
        direction.y += 1.0;
    }
    if keys.pressed(KeyCode::KeyS) || keys.pressed(KeyCode::ArrowDown) {
        direction.y -= 1.0;
    }
    if keys.pressed(KeyCode::KeyA) || keys.pressed(KeyCode::ArrowLeft) {
        direction.x -= 1.0;
    }
    if keys.pressed(KeyCode::KeyD) || keys.pressed(KeyCode::ArrowRight) {
        direction.x += 1.0;
    }

    // Normalize to prevent diagonal speed boost
    let direction = direction.normalize_or_zero();
    let speed = 200.0;

    for mut transform in &mut query {
        transform.translation.x += direction.x * speed * time.delta_secs();
        transform.translation.y += direction.y * speed * time.delta_secs();
    }
}
```

### FPS Camera Control (Mouse Look)

```rust
#[derive(Component)]
struct FpsCamera {
    sensitivity: f32,
    pitch: f32,
    yaw: f32,
}

fn fps_camera_look(
    mut motion: MessageReader<MouseMotion>,
    mut camera: Query<(&mut Transform, &mut FpsCamera)>,
) {
    let (mut transform, mut fps) = camera.single_mut();

    for event in motion.read() {
        fps.yaw -= event.delta.x * fps.sensitivity;
        fps.pitch -= event.delta.y * fps.sensitivity;
        fps.pitch = fps.pitch.clamp(-89.0_f32.to_radians(), 89.0_f32.to_radians());
    }

    transform.rotation =
        Quat::from_rotation_y(fps.yaw) * Quat::from_rotation_x(fps.pitch);
}
```

Lock the cursor for FPS controls:

```rust
fn grab_cursor(mut windows: Query<&mut Window>) {
    let mut window = windows.single_mut();
    window.cursor_options.grab_mode = CursorGrabMode::Locked;
    window.cursor_options.visible = false;
}
```

### Orbit Camera

```rust
#[derive(Component)]
struct OrbitCamera {
    focus: Vec3,
    radius: f32,
    pitch: f32,
    yaw: f32,
}

fn orbit_camera_system(
    mut scroll: MessageReader<MouseWheel>,
    mut motion: MessageReader<MouseMotion>,
    buttons: Res<ButtonInput<MouseButton>>,
    mut camera: Query<(&mut Transform, &mut OrbitCamera)>,
) {
    let (mut transform, mut orbit) = camera.single_mut();

    // Zoom with scroll wheel
    for event in scroll.read() {
        orbit.radius -= event.y * 0.5;
        orbit.radius = orbit.radius.clamp(2.0, 50.0);
    }

    // Rotate with middle mouse button
    if buttons.pressed(MouseButton::Middle) {
        for event in motion.read() {
            orbit.yaw -= event.delta.x * 0.005;
            orbit.pitch -= event.delta.y * 0.005;
            orbit.pitch = orbit.pitch.clamp(-1.5, 1.5);
        }
    }

    // Update camera transform
    let rotation = Quat::from_rotation_y(orbit.yaw) * Quat::from_rotation_x(orbit.pitch);
    transform.translation = orbit.focus + rotation * Vec3::new(0.0, 0.0, orbit.radius);
    transform.look_at(orbit.focus, Vec3::Y);
}
```

### Drag and Drop with Picking

```rust
#[derive(Component)]
struct Draggable;

#[derive(Component)]
struct Dragging {
    offset: Vec2,
}

fn setup_draggable(mut commands: Commands) {
    commands.spawn((
        Sprite {
            custom_size: Some(Vec2::new(64.0, 64.0)),
            ..default()
        },
        Draggable,
    ))
    .observe(on_drag_start)
    .observe(on_drag)
    .observe(on_drag_end);
}

fn on_drag_start(
    trigger: On<Pointer<DragStart>>,
    mut commands: Commands,
    transforms: Query<&Transform>,
) {
    let entity = trigger.entity;
    let pointer_pos = trigger.event().pointer_location.position;
    if let Ok(transform) = transforms.get(entity) {
        let offset = Vec2::new(transform.translation.x, transform.translation.y) - pointer_pos;
        commands.entity(entity).insert(Dragging { offset });
    }
}

fn on_drag(
    trigger: On<Pointer<Drag>>,
    mut transforms: Query<(&mut Transform, &Dragging)>,
) {
    let entity = trigger.entity;
    let pointer_pos = trigger.event().pointer_location.position;
    if let Ok((mut transform, dragging)) = transforms.get_mut(entity) {
        let new_pos = pointer_pos + dragging.offset;
        transform.translation.x = new_pos.x;
        transform.translation.y = new_pos.y;
    }
}

fn on_drag_end(trigger: On<Pointer<DragEnd>>, mut commands: Commands) {
    commands.entity(trigger.entity).remove::<Dragging>();
}
```
