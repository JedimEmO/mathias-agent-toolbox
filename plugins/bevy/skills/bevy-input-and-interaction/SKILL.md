---
name: bevy-input-and-interaction
description: Use when the user asks about handling keyboard input, mouse input, gamepad/controller input, touch input, picking/raycasting, UI interaction, or input mapping in Bevy. Also triggers for questions about cursor position, mouse clicks on entities, or input abstraction.
---

# Bevy Input & Interaction — Keyboard, Mouse, Gamepad & Picking

> For system registration, queries, resources, and event fundamentals, see the **bevy-ecs** skill first. This skill builds on those concepts to cover all input handling and entity interaction in Bevy 0.15+.

## Keyboard Input

Bevy exposes keyboard state through the `ButtonInput<KeyCode>` resource. Query it in any system:

```rust
fn keyboard_system(keys: Res<ButtonInput<KeyCode>>) {
    // Held down this frame
    if keys.pressed(KeyCode::KeyW) {
        // move forward
    }

    // Just pressed this frame (single-fire)
    if keys.just_pressed(KeyCode::Space) {
        // jump
    }

    // Just released this frame
    if keys.just_released(KeyCode::ShiftLeft) {
        // stop sprinting
    }
}
```

### Common KeyCode Values

| Category   | Keys                                                                 |
|------------|----------------------------------------------------------------------|
| Letters    | `KeyCode::KeyA` .. `KeyCode::KeyZ`                                  |
| Digits     | `KeyCode::Digit0` .. `KeyCode::Digit9`                              |
| Arrows     | `KeyCode::ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`          |
| Modifiers  | `KeyCode::ShiftLeft`, `ShiftRight`, `ControlLeft`, `AltLeft`, `SuperLeft` |
| Common     | `KeyCode::Space`, `Enter`, `Escape`, `Tab`, `Backspace`             |
| Function   | `KeyCode::F1` .. `KeyCode::F12`                                     |

### Text Input

For actual character input (respecting keyboard layout, IME, etc.), use `KeyboardInput` events rather than `ButtonInput`:

```rust
fn text_input_system(mut events: EventReader<KeyboardInput>) {
    for event in events.read() {
        if event.state.is_pressed() {
            if let Key::Character(ref char) = event.logical_key {
                info!("Character typed: {char}");
            }
        }
    }
}
```

## Mouse Input

### Buttons

Mouse buttons work identically to keyboard keys:

```rust
fn mouse_button_system(buttons: Res<ButtonInput<MouseButton>>) {
    if buttons.just_pressed(MouseButton::Left) {
        // primary click
    }
    if buttons.pressed(MouseButton::Right) {
        // holding secondary
    }
    if buttons.just_pressed(MouseButton::Middle) {
        // middle click
    }
}
```

### Cursor Position

Read the cursor position from the `Window` component:

```rust
fn cursor_position_system(windows: Query<&Window>) {
    let window = windows.single();
    if let Some(position) = window.cursor_position() {
        // position is in window/logical pixels, origin at top-left
        info!("Cursor at: {position}");
    }
}
```

### Screen-to-World Conversion

To get the world-space position of the cursor (essential for clicking on game objects):

```rust
fn cursor_world_position(
    windows: Query<&Window>,
    camera_q: Query<(&Camera, &GlobalTransform)>,
) {
    let window = windows.single();
    let (camera, camera_transform) = camera_q.single();

    if let Some(cursor_pos) = window.cursor_position() {
        if let Ok(world_pos) = camera.viewport_to_world_2d(camera_transform, cursor_pos) {
            info!("World cursor: {world_pos}");
        }
    }
}
```

For 3D, use `viewport_to_world` which returns a `Ray3d`:

```rust
fn cursor_ray_3d(
    windows: Query<&Window>,
    camera_q: Query<(&Camera, &GlobalTransform)>,
) {
    let window = windows.single();
    let (camera, camera_transform) = camera_q.single();

    if let Some(cursor_pos) = window.cursor_position() {
        if let Ok(ray) = camera.viewport_to_world(camera_transform, cursor_pos) {
            // ray.origin and ray.direction for raycasting
            info!("Ray origin: {}, direction: {}", ray.origin, *ray.direction);
        }
    }
}
```

### Mouse Motion and Scroll

Use events for relative mouse movement and scroll wheel:

```rust
fn mouse_motion_system(mut motion: EventReader<MouseMotion>) {
    for event in motion.read() {
        // event.delta is Vec2 — relative movement in pixels
        info!("Mouse moved: {:?}", event.delta);
    }
}

fn mouse_scroll_system(mut scroll: EventReader<MouseWheel>) {
    for event in scroll.read() {
        // event.x, event.y — scroll amounts
        // event.unit — Lines or Pixels
        info!("Scroll: x={} y={}", event.x, event.y);
    }
}
```

## Gamepad Input

In Bevy 0.15+, gamepads are entities with a `Gamepad` component. Buttons and axes are accessed through the `Gamepad` component directly.

### Detecting Connected Gamepads

```rust
fn gamepad_connection_system(
    gamepads: Query<(Entity, &Gamepad), Added<Gamepad>>,
) {
    for (entity, _gamepad) in &gamepads {
        info!("Gamepad connected: {entity}");
    }
}
```

### Reading Gamepad Input

```rust
fn gamepad_input_system(gamepads: Query<&Gamepad>) {
    for gamepad in &gamepads {
        // Buttons
        if gamepad.just_pressed(GamepadButton::South) {
            info!("A / Cross pressed");
        }
        if gamepad.pressed(GamepadButton::RightTrigger2) {
            info!("Right trigger held");
        }

        // Axes — returns f32 in [-1.0, 1.0]
        let left_stick_x = gamepad.get(GamepadAxis::LeftStickX).unwrap_or(0.0);
        let left_stick_y = gamepad.get(GamepadAxis::LeftStickY).unwrap_or(0.0);

        // Apply dead zone manually
        let dead_zone = 0.15;
        if left_stick_x.abs() > dead_zone || left_stick_y.abs() > dead_zone {
            info!("Left stick: ({left_stick_x}, {left_stick_y})");
        }
    }
}
```

### Common Gamepad Buttons

| GamepadButton        | Xbox         | PlayStation  |
|----------------------|--------------|--------------|
| `South`              | A            | Cross        |
| `East`               | B            | Circle       |
| `West`               | X            | Square       |
| `North`              | Y            | Triangle     |
| `LeftTrigger`        | LB           | L1           |
| `RightTrigger`       | RB           | R1           |
| `LeftTrigger2`       | LT           | L2           |
| `RightTrigger2`      | RT           | R2           |
| `LeftThumb`          | L3           | L3           |
| `RightThumb`         | R3           | R3           |
| `DPadUp/Down/Left/Right` | D-Pad   | D-Pad        |
| `Start`              | Menu         | Options      |
| `Select`             | View         | Share        |

### Common Gamepad Axes

| GamepadAxis     | Description          |
|-----------------|----------------------|
| `LeftStickX`    | Left stick horizontal  |
| `LeftStickY`    | Left stick vertical    |
| `RightStickX`   | Right stick horizontal |
| `RightStickY`   | Right stick vertical   |

## Touch Input

The `Touches` resource tracks all active touch points:

```rust
fn touch_system(touches: Res<Touches>) {
    // New touches this frame
    for touch in touches.iter_just_pressed() {
        info!(
            "Touch started: id={}, position={}",
            touch.id(),
            touch.position()  // Vec2 in window coordinates
        );
    }

    // Currently held touches (includes position and start_position)
    for touch in touches.iter() {
        let delta = touch.position() - touch.start_position();
        info!("Finger {} moved by {delta}", touch.id());
    }

    // Touches released this frame
    for touch in touches.iter_just_released() {
        info!("Touch ended: id={}", touch.id());
    }

    // Touches cancelled (e.g., interrupted by OS)
    for touch in touches.iter_just_cancelled() {
        info!("Touch cancelled: id={}", touch.id());
    }
}
```

Multi-touch finger tracking uses the `touch.id()` to correlate touches across frames. Each finger gets a stable ID for its entire press-move-release lifecycle.

## Picking (0.15+)

Bevy 0.15 ships a built-in picking system for detecting pointer interactions with entities. No third-party crate needed.

### Making Entities Pickable

Entities with meshes are pickable by default when `bevy_picking` is enabled. To explicitly control picking, add or remove the `Pickable` component:

```rust
fn setup(mut commands: Commands, asset_server: Res<AssetServer>) {
    // Pickable by default (has a mesh)
    commands.spawn((
        Mesh3d(asset_server.load("models/button.glb")),
        MeshMaterial3d(/* ... */),
    ));

    // Explicitly disable picking on an entity
    commands.spawn((
        Mesh3d(asset_server.load("models/background.glb")),
        MeshMaterial3d(/* ... */),
        Pickable::IGNORE,
    ));
}
```

### Pointer Events with Observers

The picking system fires events that you handle with observers. This is the recommended pattern — events are targeted to specific entities:

```rust
use bevy::picking::pointer::PointerInteraction;

fn setup(mut commands: Commands) {
    // Spawn a clickable entity with an observer
    commands.spawn((
        Mesh3d(/* ... */),
        MeshMaterial3d(/* ... */),
    ))
    .observe(on_click)
    .observe(on_pointer_over)
    .observe(on_pointer_out);
}

fn on_click(trigger: Trigger<Pointer<Click>>, mut commands: Commands) {
    let entity = trigger.target();
    let event = trigger.event();
    info!("Clicked entity {entity:?} at {}", event.pointer_location.position);
}

fn on_pointer_over(
    trigger: Trigger<Pointer<Over>>,
    mut materials: Query<&mut MeshMaterial3d<StandardMaterial>>,
) {
    // Highlight on hover
    let entity = trigger.target();
    if let Ok(mut material) = materials.get_mut(entity) {
        // swap to highlight material
    }
}

fn on_pointer_out(
    trigger: Trigger<Pointer<Out>>,
    mut materials: Query<&mut MeshMaterial3d<StandardMaterial>>,
) {
    // Remove highlight
    let entity = trigger.target();
    if let Ok(mut material) = materials.get_mut(entity) {
        // restore original material
    }
}
```

### Available Pointer Events

| Event              | Fires when                                        |
|--------------------|---------------------------------------------------|
| `Pointer<Over>`    | Pointer enters the entity's bounds                |
| `Pointer<Out>`     | Pointer leaves the entity's bounds                |
| `Pointer<Down>`    | Pointer button pressed while over entity          |
| `Pointer<Up>`      | Pointer button released while over entity         |
| `Pointer<Click>`   | Full press-and-release cycle on the entity        |
| `Pointer<Move>`    | Pointer moves while over entity                   |
| `Pointer<DragStart>` | Drag begins on entity                           |
| `Pointer<Drag>`    | Entity is being dragged                           |
| `Pointer<DragEnd>` | Drag ends                                         |
| `Pointer<DragEnter>` | Dragged entity enters another entity's bounds   |
| `Pointer<DragOver>` | Dragged entity hovers over another entity        |
| `Pointer<DragDrop>` | Dragged entity dropped onto another entity       |
| `Pointer<DragLeave>` | Dragged entity leaves another entity's bounds   |

Picking works with both 2D sprites and 3D meshes, and also with Bevy UI nodes.

## leafwing-input-manager (Third-Party Input Abstraction)

For games that need unified input mapping across keyboard, gamepad, and mouse, **leafwing-input-manager** is the recommended community crate. It lets you define logical actions and bind them to physical inputs.

> See the **bevy-ecosystem** skill for setup details and version compatibility.

```rust
use leafwing_input_manager::prelude::*;

// 1. Define actions
#[derive(Actionlike, PartialEq, Eq, Hash, Clone, Copy, Debug, Reflect)]
pub enum PlayerAction {
    Move,   // Axis-pair action
    Jump,
    Attack,
}

// 2. Build an input map and spawn it on the player
fn spawn_player(mut commands: Commands) {
    let input_map = InputMap::default()
        .with_dual_axis(PlayerAction::Move, KeyboardVirtualDPad::WASD)
        .with_dual_axis(PlayerAction::Move, GamepadStick::LEFT)
        .with(PlayerAction::Jump, KeyCode::Space)
        .with(PlayerAction::Jump, GamepadButton::South)
        .with(PlayerAction::Attack, MouseButton::Left)
        .with(PlayerAction::Attack, GamepadButton::West);

    commands.spawn((
        // ... player components
        InputManagerBundle::with_map(input_map),
    ));
}

// 3. Query action state in gameplay systems
fn player_movement(query: Query<&ActionState<PlayerAction>, With<Player>>) {
    let action_state = query.single();

    if action_state.pressed(&PlayerAction::Move) {
        let axis_pair = action_state.clamped_axis_pair(&PlayerAction::Move);
        let movement = Vec2::new(axis_pair.x, axis_pair.y);
        // apply movement * speed * time.delta_secs()
    }

    if action_state.just_pressed(&PlayerAction::Jump) {
        // jump
    }
}

// 4. Register the plugin
// app.add_plugins(InputManagerPlugin::<PlayerAction>::default())
```

## Common Patterns

For ready-to-adapt movement, mouse-look, orbit-camera, and drag-and-drop examples, read `references/input-patterns.md`.
