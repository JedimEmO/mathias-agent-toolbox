---
name: scaffold-desktop
description: Use when generating a Tauri 2 desktop starter with a dwind/dominator frontend and testable Rust core.
---

# Desktop Scaffold — Tauri 2 Backend + dwind Frontend

A compilable, tested Tauri 2 desktop application template. Copy it, rename the `app-` prefix to your project name, and replace the Item domain with your own.

## Architecture

```
template/
├── Cargo.toml                     # Parent workspace (edition 2024, resolver 3)
├── .rustfmt.toml                  # max_width = 100
├── justfile                       # fmt, check, test, ci, dev, build targets
├── .github/workflows/ci.yml      # GitHub Actions: check + test + frontend build
│
├── crates/
│   ├── app-core/                  # Domain layer — pure, no IO deps
│   │   └── src/
│   │       ├── domain/mod.rs      # Item, ItemId (Uuid-backed)
│   │       ├── dto.rs             # CreateItemRequest, ItemResponse, ItemListResponse
│   │       ├── error.rs           # ItemError (thiserror): NotFound, AlreadyExists, Storage
│   │       └── ports/mod.rs       # ItemRepository trait (async_trait, Send + Sync)
│   │
│   ├── app-adapters/              # Trait implementations
│   │   └── src/
│   │       └── in_memory.rs       # InMemoryItemRepository (Mutex<HashMap>)
│   │
│   ├── app-testutils/             # Test support crate
│   │   └── src/
│   │       ├── fakes.rs           # FakeItemRepository (configurable failure)
│   │       └── builders.rs        # ItemBuilder with an_item() convenience
│   │
│   ├── app-tauri/                 # Tauri backend (joins parent workspace)
│   │   ├── Cargo.toml            # Depends on app-core, app-adapters
│   │   ├── build.rs              # tauri_build::build()
│   │   ├── tauri.conf.json       # Window config, Trunk integration, withGlobalTauri
│   │   ├── icons/                # Placeholder app icons (32x32, 128x128)
│   │   ├── capabilities/
│   │   │   └── default.json      # core:default permissions
│   │   └── src/
│   │       ├── main.rs           # DI wiring, command registration
│   │       ├── commands.rs       # get_items, create_item, delete_item
│   │       └── state.rs          # AppState with Arc<dyn ItemRepository>
│   │
│   └── app/                       # Frontend WASM crate (own workspace, edition 2021)
│       ├── Cargo.toml             # cdylib, standalone [workspace]
│       ├── Trunk.toml             # WASM bundler config (port 1420)
│       ├── public/index.html      # HTML shell with Trunk directive
│       └── src/
│           ├── lib.rs             # wasm_bindgen(start) entry, dwind stylesheet init
│           ├── tauri_ipc.rs       # IPC bridge to Tauri backend via window.__TAURI__
│           ├── types.rs           # Frontend-local DTOs (String ids/dates)
│           └── components/
│               ├── app.rs         # Root layout
│               ├── items.rs       # Item list + create form (calls IPC commands)
│               └── state.rs       # AppState with MutableVec<ItemResponse>
```

## Workspace Isolation

The frontend and backend are **separate workspaces**. This is required because dwind's path dependencies resolve against dwind's own workspace and cannot coexist with the parent workspace.

- **Parent workspace** (`Cargo.toml` at root): includes `app-core`, `app-adapters`, `app-testutils`, and `app-tauri`
- **Frontend workspace** (`crates/app/Cargo.toml`): standalone with its own `[workspace]`

The frontend uses `edition = "2021"` (hardcoded, not inherited). The parent workspace uses `edition = "2024"`.

**Frontend types are local** — `crates/app/src/types.rs` mirrors `app-core::dto` with `String` ids/dates instead of `Uuid`/`DateTime<Utc>`. This avoids cross-workspace path dependencies.

## How to Use This Scaffold

1. **Read the template directory** to understand the complete file structure
2. **Copy the template** into the user's target directory
3. **Rename** all `app-` prefixes to the user's project name (e.g., `app-core` → `myapp-core`, `app-tauri` → `myapp-tauri`)
4. **Replace the domain** — swap `Item`/`ItemId`/`ItemRepository` with the user's domain types
5. **Update Tauri commands** in `commands.rs` to match the new domain
6. **Update the frontend** — replace `types.rs` DTOs and `items.rs` component
7. **Update `tauri.conf.json`** — change `productName`, `identifier`, window `title`
8. **Run `just ci`** to verify parent workspace compiles and tests pass
9. **Run `just dev`** to launch the desktop app with hot-reload

## Key Patterns Demonstrated

- **Trait-as-Interface DI** — domain traits in core, implementations in adapters, wiring in Tauri main (see **rust-architecture** skill)
- **Workspace-first layout** — all crates under `crates/`, shared deps in `[workspace.dependencies]` (see **rust-project-setup** skill)
- **Workspace isolation** — frontend WASM crate excluded from parent workspace (see **dwind-tauri** skill)
- **Tauri IPC bridge** — `tauri_ipc.rs` uses `wasm_bindgen` inline JS to call `window.__TAURI__` (see **dwind-tauri** skill)
- **Hand-written fakes** — `FakeItemRepository` with `Mutex` for `Send + Sync` (see **rust-testing** skill)
- **Frontend-local DTOs** — `types.rs` mirrors backend types with simpler serialization (String ids/dates)
- **Reactive UI** — dwind/dominator with `MutableVec` for live item list updates
- **thiserror/anyhow split** — `thiserror` for domain errors, `anyhow` only in the Tauri binary crate
- **Clippy pedantic** — workspace-level lints, `unwrap_used` warning (see **rust-ci-tooling** skill)

## Build & Test Commands

```bash
# Prerequisites
rustup target add wasm32-unknown-unknown
cargo install trunk
cargo install tauri-cli

# Development (starts Trunk + Tauri together, hot-reload)
just dev

# Full CI: fmt + clippy + test
just ci

# Production build (creates native installer)
just build

# Backend tests only
cargo test --workspace

# Build frontend WASM only
cd crates/app && trunk build
```

## IPC Communication

The frontend calls the backend via Tauri commands, not HTTP:

| Frontend (WASM) | Backend (native) | What |
|---|---|---|
| `tauri_ipc::get_items()` | `commands::get_items` | List all items |
| `tauri_ipc::create_item(name, qty)` | `commands::create_item` | Create a new item |
| `tauri_ipc::delete_item(id)` | `commands::delete_item` | Delete by UUID |

### Adding New Commands

1. Add a `#[tauri::command]` function in `commands.rs`
2. Register it in `main.rs` via `tauri::generate_handler![...]`
3. Add a typed wrapper in `tauri_ipc.rs`
4. Add capability permissions in `capabilities/default.json` if using Tauri plugins

## Notes

- The frontend uses `wasm_log` for logging — messages appear in the Tauri devtools console
- Tauri command argument names must be camelCase in the JSON (IPC serialization), even though Rust uses snake_case
- `cargo tauri dev` automatically runs `trunk serve` and opens the app window
- For the `asset://` protocol (serving local files in the webview), add `features = ["protocol-asset"]` to the Tauri dependency
