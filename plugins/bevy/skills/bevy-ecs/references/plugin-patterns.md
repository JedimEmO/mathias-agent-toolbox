# Bevy Plugin Patterns

## Contents

- Writing Custom Plugins
- Plugin Groups
- Configurable Plugins

## Writing Custom Plugins

Plugins are the standard way to organize related systems, resources, and events into reusable modules:

```rust
pub struct CombatPlugin;

impl Plugin for CombatPlugin {
    fn build(&self, app: &mut App) {
        app
            .add_message::<DamageMessage>()
            .add_message::<DeathMessage>()
            .init_resource::<CombatStats>()
            .add_systems(Update, (
                deal_damage,
                apply_damage,
                check_death,
            ).chain().in_set(GameSet::Combat));
    }
}
```

Use plugins in your app:

```rust
fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_plugins((
            CombatPlugin,
            InventoryPlugin,
            AudioPlugin,
        ))
        .run();
}
```

### Plugin Groups

Group multiple plugins together:

```rust
pub struct GamePlugins;

impl PluginGroup for GamePlugins {
    fn build(self) -> PluginGroupBuilder {
        PluginGroupBuilder::start::<Self>()
            .add(CombatPlugin)
            .add(InventoryPlugin)
            .add(MovementPlugin)
            .add(UIPlugin)
    }
}

// Use like DefaultPlugins:
fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_plugins(GamePlugins)
        .run();
}
```

### Configurable Plugins

Accept configuration by storing it in the plugin struct:

```rust
pub struct PhysicsPlugin {
    pub gravity: f32,
    pub substeps: u32,
}

impl Default for PhysicsPlugin {
    fn default() -> Self {
        Self {
            gravity: -9.81,
            substeps: 4,
        }
    }
}

impl Plugin for PhysicsPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(PhysicsConfig {
            gravity: self.gravity,
            substeps: self.substeps,
        });
        app.add_systems(FixedUpdate, (
            apply_gravity,
            resolve_collisions,
        ).chain());
    }
}
```
