---
name: ras-setup
description: Use when the user asks to create a new RAS project, set up a Rust API Stack workspace, configure Cargo.toml for RAS crates, add RAS dependencies, scaffold a service crate, or asks about RAS workspace structure and crate organization.
---

# RAS Project Setup - Rust API Stack Workspace Scaffolding

Rust API Stack (RAS) projects follow the workspace-first, crate-split conventions from the **rust-project-setup** skill. The key addition is a shared API crate where macro invocations define the service contract. That crate sits between the pure domain core and the binary that wires adapters, auth, observability, and generated builders together.

> Starter template: For a ready-to-compile RAS project with tests, see the **scaffold-fullstack** skill.

## Project Structure

```text
my-project/
├── Cargo.toml
├── crates/
│   ├── my-core/          # domain types, traits, pure logic
│   ├── my-api/           # RAS macros + request/response types
│   ├── my-service/       # binary: generated builders + adapters + auth
│   └── my-testutils/     # fakes, builders, fixtures
```

- `my-core`: Domain types and port traits. No IO dependencies. No RAS dependency.
- `my-api`: Invokes `rest_service!`, `jsonrpc_service!`, `file_service!`, or `jsonrpc_bidirectional_service!`. Defines request/response types. Depends on RAS macro crates plus shared domain types.
- `my-service`: Implements generated service traits, constructs adapters, wires auth with `Arc<dyn AuthProvider>`, and runs the Axum server.
- `my-testutils`: Hand-written fakes such as `FakeAuthProvider`. Use only as a dev-dependency.

The API crate exists because macros can generate both server traits and native Rust clients. Server crates depend on it with `features = ["server"]`; Rust callers or WASM/browser crates depend on the same crate with `features = ["client"]`.

## Where RAS Macros Live

Macros belong in the API crate, not the domain crate:

```rust
// crates/my-api/src/lib.rs
use ras_rest_macro::rest_service;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct TasksResponse {
    pub tasks: Vec<Task>,
    pub total: usize,
}

rest_service!({
    service_name: TaskService,
    base_path: "/api/v1",
    openapi: true,
    serve_docs: true,
    endpoints: [
        GET UNAUTHORIZED tasks() -> TasksResponse,
        POST WITH_PERMISSIONS(["tasks:write"]) tasks(CreateTaskRequest) -> Task,
        GET UNAUTHORIZED tasks/{id: String}() -> Task,
        DELETE WITH_PERMISSIONS(["admin"] | ["tasks:delete"]) tasks/{id: String}() -> (),
    ]
});
```

With `serve_docs: true`, the router hosts the built-in API explorer at `/api/v1/docs` and OpenAPI JSON at `/api/v1/docs/openapi.json`. The explorer keeps bearer tokens in browser `sessionStorage`.

## Workspace Cargo.toml

Rust API Stack currently targets Rust 1.88 or newer for Rust 2024 edition crates.

```toml
[workspace]
members = ["crates/*"]
resolver = "3"

[workspace.package]
edition = "2024"
rust-version = "1.88"

[workspace.dependencies]
ras-rest-macro = { git = "https://github.com/JedimEmO/rust-api-stack.git", default-features = false }
ras-rest-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-jsonrpc-macro = { git = "https://github.com/JedimEmO/rust-api-stack.git", default-features = false }
ras-jsonrpc-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-file-macro = { git = "https://github.com/JedimEmO/rust-api-stack.git", default-features = false }
ras-file-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-auth-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-transport-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-permission-manifest = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-identity-session = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-identity-local = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-identity-oauth2 = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-observability-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-observability-otel = { git = "https://github.com/JedimEmO/rust-api-stack.git" }

serde = { version = "1", features = ["derive"] }
serde_json = "1"
schemars = "1.0.0-alpha.20"
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
axum = "0.8"
axum-extra = { version = "0.10", features = ["query"] }
anyhow = "1"
thiserror = "2"
tracing = "0.1"
async-trait = "0.1"
```

Read `references/cargo-toml-templates.md` for complete member crate templates.

## API Crate Cargo.toml

A REST API crate should forward features to the macro crate and runtime crates that generated code references:

```toml
[package]
name = "my-api"
version = "0.1.0"
edition.workspace = true

[lints]
workspace = true

[dependencies]
ras-rest-macro.workspace = true
ras-rest-core = { workspace = true, optional = true }
ras-auth-core = { workspace = true, optional = true }
ras-transport-core = { workspace = true, optional = true }
ras-permission-manifest = { workspace = true, optional = true }
serde.workspace = true
serde_json.workspace = true
schemars.workspace = true
async-trait = { workspace = true, optional = true }
axum = { workspace = true, optional = true }
axum-extra = { workspace = true, optional = true }
tokio = { workspace = true, optional = true }

[features]
default = []
server = [
    "ras-rest-macro/server",
    "dep:ras-rest-core",
    "dep:ras-auth-core",
    "dep:async-trait",
    "dep:axum",
    "dep:axum-extra",
    "dep:tokio",
]
client = ["ras-rest-macro/reqwest", "ras-transport-core/reqwest"]
permissions = ["ras-rest-macro/permissions", "dep:ras-permission-manifest"]
```

Equivalent client forwarding for other macro crates:

```toml
client = ["ras-jsonrpc-macro/reqwest", "ras-transport-core/reqwest"]
client = ["ras-file-macro/reqwest", "ras-transport-core/reqwest"]
fs = ["ras-file-macro/fs", "ras-transport-core/fs"]
```

If callers inject a custom transport, forward the macro crate's `/client` feature plus `dep:ras-transport-core` instead of `/reqwest`.

## Binary Crate Wiring

The service crate implements the generated trait and wires `Arc<dyn AuthProvider>`:

```rust
use anyhow::Context;
use my_api::{TaskServiceBuilder, TaskServiceTrait};
use ras_auth_core::{AuthenticatedUser, AuthProvider};
use ras_identity_session::{JwtAuthProvider, SessionConfig, SessionService};
use ras_rest_core::{RestResponse, RestResult};
use std::sync::Arc;

struct TaskServiceImpl;

#[async_trait::async_trait]
impl TaskServiceTrait for TaskServiceImpl {
    async fn get_tasks(&self) -> RestResult<TasksResponse> {
        Ok(RestResponse::ok(TasksResponse { tasks: vec![], total: 0 }))
    }

    async fn post_tasks(
        &self,
        user: &AuthenticatedUser,
        request: CreateTaskRequest,
    ) -> RestResult<Task> {
        Ok(RestResponse::created(self.create_task(user, request).await?))
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let jwt_secret = std::env::var("JWT_SECRET").context("JWT_SECRET must be set")?;
    let session_service = Arc::new(SessionService::new(SessionConfig::new(jwt_secret)?)?);
    let auth: Arc<dyn AuthProvider> = Arc::new(JwtAuthProvider::new(session_service));

    let router = TaskServiceBuilder::new(TaskServiceImpl)
        .auth_provider(auth)
        .build();

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, router).await.context("server failed")?;
    Ok(())
}
```

## Adding a New Service

1. Create the API crate: `cargo new crates/my-new-api --lib`.
2. Add the relevant RAS macro crate and feature forwarding to `Cargo.toml`.
3. Define request/response types and invoke the service macro.
4. Implement the generated trait in a service crate.
5. Wire the generated router into the existing Axum app with `.merge()` or `.nest()`.

Multiple RAS services compose naturally:

```rust
let app = axum::Router::new()
    .merge(task_router)
    .merge(user_router)
    .merge(otel.metrics_router());
```

## Related Skills

For workspace conventions and crate boundaries, see the **rust-project-setup** skill.
For trait-as-interface dependency injection, see the **rust-architecture** skill.
For macro syntax and endpoint definition, see the **ras-api-design** skill.
