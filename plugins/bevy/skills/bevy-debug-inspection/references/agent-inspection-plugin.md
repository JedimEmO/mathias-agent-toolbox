# Agent Inspection Plugin

## Contents

- Feature Gate
- App Wiring
- Reflectable Data
- Custom Remote Methods
- Screenshot Hooks
- Localhost Safety

Use this when a Bevy project needs a reusable, agent-readable debugging surface. Keep it dev-only and easy to remove from production builds.

## Feature Gate

For Bevy 0.18-style feature names, start with:

```toml
[features]
agent_inspect = [
    "bevy/bevy_remote",
    "bevy/http",
    "bevy/serialize",
    "bevy/bevy_dev_tools",
    "bevy/bevy_debug_stepping",
]
```

Adjust for the project Bevy version. `RemoteHttpPlugin` is native-only and requires HTTP support; do not use it for WASM targets.

## App Wiring

```rust
#[cfg(feature = "agent_inspect")]
mod agent_inspect {
    use bevy::prelude::*;
    use bevy::remote::RemotePlugin;
    use bevy::remote::http::RemoteHttpPlugin;

    pub struct AgentInspectPlugin;

    impl Plugin for AgentInspectPlugin {
        fn build(&self, app: &mut App) {
            app.add_plugins((
                RemotePlugin::default(),
                RemoteHttpPlugin::default().with_port(15702),
            ));
        }
    }
}
```

Register it from the app root:

```rust
#[cfg(feature = "agent_inspect")]
app.add_plugins(agent_inspect::AgentInspectPlugin);
```

Keep the port configurable if multiple game instances may run at once.

## Reflectable Data

BRP and inspectors can only expose useful component/resource values when the data is reflectable and registered.

```rust
#[derive(Component, Reflect, Debug, Clone)]
#[reflect(Component)]
pub struct Health {
    pub current: f32,
    pub max: f32,
}

#[derive(Resource, Reflect, Debug, Clone)]
#[reflect(Resource)]
pub struct CombatDebugState {
    pub wave: u32,
    pub active_enemies: u32,
}

fn register_debug_types(app: &mut App) {
    app.register_type::<Health>()
        .register_type::<CombatDebugState>();
}
```

Use `Name` consistently:

```rust
commands.spawn((
    Name::new("player"),
    Player,
    Health { current: 100.0, max: 100.0 },
));
```

Important names should be stable across runs so artifacts can be compared.

## Custom Remote Methods

Use custom BRP methods for domain snapshots that are easier to read than raw component maps.

```rust
use bevy::ecs::prelude::{In, World};
use bevy::prelude::*;
use bevy::remote::{BrpResult, RemotePlugin};
use serde_json::{json, Value};

fn agent_player_snapshot(
    In(_params): In<Option<Value>>,
    world: &mut World,
) -> BrpResult {
    let mut query = world.query_filtered::<(Entity, Option<&Name>, &Transform, &Health), With<Player>>();

    let players = query
        .iter(world)
        .map(|(entity, name, transform, health)| {
            json!({
                "entity": format!("{entity:?}"),
                "name": name.map(|n| n.as_str()).unwrap_or("<unnamed>"),
                "translation": transform.translation.to_array(),
                "health": { "current": health.current, "max": health.max },
            })
        })
        .collect::<Vec<_>>();

    Ok(json!({ "players": players }))
}

fn add_remote_methods(app: &mut App) {
    app.add_plugins(
        RemotePlugin::default()
            .with_method("agent/player_snapshot", agent_player_snapshot),
    );
}
```

Do not duplicate `RemotePlugin`: if the project already adds it, extend that setup instead.

Useful custom methods:

- `agent/world_summary`: scenario, frame, state, entity counts by marker, current camera.
- `agent/player_snapshot`: player transform, velocity, health, input/action state.
- `agent/ui_snapshot`: active screen, focused node, hovered/pressed buttons, modal stack.
- `agent/physics_snapshot`: bodies, colliders, contacts, sensors, layers.
- `agent/set_scenario`: reset the world to a deterministic fixture.
- `agent/advance_frames`: advance N frames in a controlled harness, not in a live render loop unless the app architecture supports it.

## Screenshot Hooks

For native visual artifacts, prefer Bevy's screenshot API or `EasyScreenshotPlugin`. Pair every screenshot with a frame/scenario label and an ECS snapshot.

```rust
use bevy::prelude::*;
use bevy::render::view::screenshot::{save_to_disk, Screenshot};

fn capture_primary_window(mut commands: Commands) {
    commands
        .spawn(Screenshot::primary_window())
        .observe(save_to_disk("debug-artifacts/latest/frame-000120.png"));
}
```

For automated runs, trigger screenshots from deterministic scenario systems instead of relying on manual key presses.

## Localhost Safety

- Bind only to `127.0.0.1` unless the user explicitly needs another address.
- Prefer a feature gate plus an env var for shared machines: `--features agent_inspect` and `BEVY_AGENT_INSPECT=1`.
- Never expose mutation methods in builds distributed to players.
- Log the inspection port at startup so scripts can discover it.

