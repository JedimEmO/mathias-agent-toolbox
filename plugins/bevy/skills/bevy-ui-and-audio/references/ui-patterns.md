# Bevy UI Patterns

## Contents

- HUD Layout
- Main Menu
- Health Bar / Progress Bar
- bevy_egui

### Common UI Patterns

**Main menu with navigation:**

```rust
#[derive(States, Debug, Clone, PartialEq, Eq, Hash, Default)]
enum MenuState {
    #[default]
    Main,
    Settings,
    Credits,
}

#[derive(Component)]
enum MenuButton {
    Play,
    Settings,
    Quit,
}

fn spawn_main_menu(mut commands: Commands) {
    commands
        .spawn((
            StateScoped(MenuState::Main),
            Node {
                width: Val::Percent(100.0),
                height: Val::Percent(100.0),
                flex_direction: FlexDirection::Column,
                justify_content: JustifyContent::Center,
                align_items: AlignItems::Center,
                row_gap: Val::Px(16.0),
                ..default()
            },
        ))
        .with_children(|parent| {
            for (label, action) in [
                ("Play", MenuButton::Play),
                ("Settings", MenuButton::Settings),
                ("Quit", MenuButton::Quit),
            ] {
                parent
                    .spawn((
                        Button,
                        action,
                        Node {
                            width: Val::Px(250.0),
                            height: Val::Px(55.0),
                            justify_content: JustifyContent::Center,
                            align_items: AlignItems::Center,
                            ..default()
                        },
                        BackgroundColor(Color::srgb(0.2, 0.2, 0.2)),
                    ))
                    .with_children(|btn| {
                        btn.spawn((
                            Text::new(label),
                            TextFont { font_size: 24.0, ..default() },
                            TextColor(Color::WHITE),
                        ));
                    });
            }
        });
}

fn handle_menu_buttons(
    query: Query<(&Interaction, &MenuButton), Changed<Interaction>>,
    mut next_state: ResMut<NextState<MenuState>>,
    mut exit: MessageWriter<AppExit>,
) {
    for (interaction, button) in &query {
        if *interaction == Interaction::Pressed {
            match button {
                MenuButton::Play => { /* transition to GameState::Playing */ }
                MenuButton::Settings => next_state.set(MenuState::Settings),
                MenuButton::Quit => { exit.write(AppExit::Success); }
            }
        }
    }
}
```

`StateScoped` despawns the entity (and its children) automatically when leaving that state — no manual cleanup needed.

**HUD overlay (health bar + score):**

```rust
#[derive(Component)]
struct HealthBar;

#[derive(Component)]
struct ScoreText;

fn spawn_hud(mut commands: Commands) {
    // Root container pinned to top of screen
    commands
        .spawn(Node {
            width: Val::Percent(100.0),
            height: Val::Px(40.0),
            justify_content: JustifyContent::SpaceBetween,
            align_items: AlignItems::Center,
            padding: UiRect::horizontal(Val::Px(16.0)),
            ..default()
        })
        .with_children(|parent| {
            // Health bar: background + fill
            parent
                .spawn(Node {
                    width: Val::Px(200.0),
                    height: Val::Px(20.0),
                    ..default()
                })
                .insert(BackgroundColor(Color::srgb(0.3, 0.0, 0.0)))
                .with_children(|bar_bg| {
                    bar_bg.spawn((
                        HealthBar,
                        Node {
                            width: Val::Percent(100.0),
                            height: Val::Percent(100.0),
                            ..default()
                        },
                        BackgroundColor(Color::srgb(0.0, 0.8, 0.0)),
                    ));
                });

            // Score text
            parent.spawn((
                ScoreText,
                Text::new("Score: 0"),
                TextFont { font_size: 20.0, ..default() },
                TextColor(Color::WHITE),
            ));
        });
}

fn update_health_bar(
    player: Query<&Health, With<Player>>,
    mut bar: Query<&mut Node, With<HealthBar>>,
) {
    if let (Ok(health), Ok(mut node)) = (player.single(), bar.single_mut()) {
        node.width = Val::Percent(health.current as f32 / health.max as f32 * 100.0);
    }
}
```

**Loading screen with progress bar:**

```rust
#[derive(Resource, Default)]
struct LoadingProgress {
    loaded: usize,
    total: usize,
}

fn update_loading_bar(
    progress: Res<LoadingProgress>,
    mut bar: Query<&mut Node, With<LoadingBar>>,
) {
    if let Ok(mut node) = bar.single_mut() {
        let pct = if progress.total > 0 {
            progress.loaded as f32 / progress.total as f32 * 100.0
        } else {
            0.0
        };
        node.width = Val::Percent(pct);
    }
}
```

### bevy_egui — Debug and Editor UI

Use `bevy_egui` for debug panels, inspector tools, and editor UI. Use `bevy_ui` for in-game UI that ships to players.

**When to choose bevy_egui:**
- Rapid prototyping — egui is immediate-mode, faster to iterate
- Debug overlays, entity inspectors, level editors
- You need text input fields, sliders, collapsible panels, drag-and-drop

**When to choose bevy_ui:**
- Final in-game UI (menus, HUD, dialogue boxes)
- You need pixel-perfect control, custom rendering, animations
- Performance-sensitive UI (bevy_ui is integrated with the render pipeline)

**Setup:**

```toml
# Cargo.toml
[dependencies]
bevy_egui = "0.34"  # Match your Bevy version
```

```rust
use bevy_egui::{egui, EguiContexts, EguiPlugin};

app.add_plugins(EguiPlugin);

fn debug_ui(mut contexts: EguiContexts) {
    egui::Window::new("Debug").show(contexts.ctx_mut(), |ui| {
        ui.label("Hello from egui");
        if ui.button("Click me").clicked() {
            // handle click
        }
    });
}
```

---
