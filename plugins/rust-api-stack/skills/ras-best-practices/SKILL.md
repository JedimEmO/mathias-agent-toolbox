---
name: ras-best-practices
description: Use when hardening Rust API Stack services with errors, observability, generated clients, permissions, service communication, or integration tests.
---

# RAS Best Practices - Observability, Errors, Clients & Testing

Production Rust API Stack (RAS) services need structured errors, explicit auth metadata, observability hooks, generated clients, and testable handler implementations. This skill covers the patterns between a working macro invocation and a deployable service.

## Error Handling

RAS error handling follows the **rust-architecture** convention: `thiserror` for library/domain errors, `anyhow` only in binaries.

### Domain Errors to REST Errors

```rust
use ras_rest_core::{RestError, RestResponse, RestResult};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum TaskError {
    #[error("task not found: {0}")]
    NotFound(String),
    #[error("duplicate title: {0}")]
    DuplicateTitle(String),
    #[error("storage error")]
    Storage(#[source] anyhow::Error),
}

impl From<TaskError> for RestError {
    fn from(e: TaskError) -> Self {
        match e {
            TaskError::NotFound(msg) => RestError::not_found(msg),
            TaskError::DuplicateTitle(msg) => RestError::bad_request(msg),
            TaskError::Storage(e) => RestError::with_internal(500, "internal error", e),
        }
    }
}
```

Rules:

- Client errors (4xx) can include messages the caller can act on.
- Server errors (5xx) should use `RestError::with_internal()` so the real source is logged but not exposed.
- Domain logic returns domain errors; handlers convert to RAS errors at the transport boundary.

### JSON-RPC Errors

```rust
use ras_jsonrpc_types::JsonRpcError;

impl From<TaskError> for JsonRpcError {
    fn from(e: TaskError) -> Self {
        match e {
            TaskError::NotFound(msg) => JsonRpcError::new(-32001, msg, None),
            TaskError::DuplicateTitle(msg) => JsonRpcError::new(-32002, msg, None),
            TaskError::Storage(_) => JsonRpcError::internal_error(),
        }
    }
}
```

## Observability

RAS service builders expose `with_usage_tracker` and `with_method_duration_tracker` where supported. `ras-observability-otel` provides OpenTelemetry/Prometheus-backed trackers.

```rust
use ras_observability_core::{MethodDurationTracker, RequestContext, UsageTracker};
use ras_observability_otel::standard_setup;

let otel = standard_setup("my-service")?;

let router = TaskServiceBuilder::new(service_impl)
    .auth_provider(auth)
    .with_usage_tracker({
        let tracker = otel.usage_tracker();
        move |headers, user, method, path| {
            let headers = headers.clone();
            let user = user.cloned();
            let context = RequestContext::rest(method, path);
            let tracker = tracker.clone();

            async move {
                tracker.track_request(&headers, user.as_ref(), &context).await;
            }
        }
    })
    .with_method_duration_tracker({
        let tracker = otel.method_duration_tracker();
        move |method, path, user, duration| {
            let user = user.cloned();
            let context = RequestContext::rest(method, path);
            let tracker = tracker.clone();

            async move {
                tracker.track_duration(&context, user.as_ref(), duration).await;
            }
        }
    })
    .build();

let app = axum::Router::new()
    .merge(router)
    .merge(otel.metrics_router());
```

Keep metric labels low-cardinality. Use structured logs for user IDs, request IDs, tenant IDs, and other high-cardinality data.

Read `references/observability-config.md` for Prometheus scrape config and Grafana query examples.

## Generated Rust Clients

Each RAS macro can generate a type-safe async client in the API crate. Server crates enable `server`; outbound callers enable `client`.

```toml
[dependencies]
task-api = { path = "../task-api", default-features = false, features = ["client"] }
```

REST API crates should forward the reqwest client feature through `ras-transport-core`:

```toml
[features]
default = []
client = ["ras-rest-macro/reqwest", "ras-transport-core/reqwest"]
```

For JSON-RPC and file APIs, use the equivalent forwarding:

```toml
client = ["ras-jsonrpc-macro/reqwest", "ras-transport-core/reqwest"]
client = ["ras-file-macro/reqwest", "ras-transport-core/reqwest"]
fs = ["ras-file-macro/fs", "ras-transport-core/fs"]
```

The macro crate's `client` feature emits generated client types and `build_with_transport(...)`. The `reqwest` feature also emits the default reqwest-backed `build()`. For custom transports, forward `/client` plus `dep:ras-transport-core` instead of `/reqwest`.

REST client usage:

```rust
let mut client = TaskServiceClient::builder("http://localhost:3000")
    .with_timeout(std::time::Duration::from_secs(10))
    .build()?;

client.set_bearer_token(Some(jwt_token));

let tasks = client.get_tasks().await?;
let task = client.get_tasks_by_id("task-123".to_string()).await?;
let created = client.post_tasks(CreateTaskRequest {
    title: "New task".into(),
    description: "Details".into(),
}).await?;
```

JSON-RPC client usage:

```rust
let mut client = UserServiceClientBuilder::new("http://localhost:3000/rpc").build()?;
client.set_bearer_token(Some(jwt_token));
let profile = client.get_profile(()).await?;
```

## Permission Manifests

OpenAPI/OpenRPC specs expose flattened `x-permissions` plus grouped `x-permission-groups`. For audit tooling, admin UIs, token issuing, and regression tests, enable generated permission manifests:

```toml
[dependencies]
ras-permission-manifest.workspace = true

[features]
permissions = ["ras-rest-macro/permissions"]
```

For a service named `UserService`, the macro emits:

```rust
pub fn generate_userservice_permission_manifest()
    -> ras_permission_manifest::ServicePermissions;

pub mod userservice_permissions {
    pub const TASK_WRITE: ras_permission_manifest::PermissionRef;

    pub mod operations {
        pub const POST_USERS: ras_permission_manifest::StaticPermissionRequirement;
    }
}
```

Use operation constants in tests so permissions do not drift from the API contract:

```rust
assert!(
    userservice_permissions::operations::POST_USERS
        .is_satisfied_by(&permissions)
);
```

## Testing RAS Services

Follow the **rust-testing** skill's approach: hand-written fakes, a `TestApp` harness, and `axum-test` for in-process HTTP.

### Hand-Written `FakeAuthProvider`

The default `AuthProvider::check_permissions` requires every permission in a group. RAS macros handle OR groups by checking each group separately, so a fake usually only needs to authenticate users and let the default check apply.

```rust
use ras_auth_core::{AuthError, AuthFuture, AuthProvider, AuthenticatedUser};
use std::collections::HashSet;
use std::sync::Mutex;

pub struct FakeAuthProvider {
    users: Mutex<Vec<(String, AuthenticatedUser)>>,
}

impl FakeAuthProvider {
    pub fn new() -> Self {
        Self { users: Mutex::new(Vec::new()) }
    }

    pub fn add_user(&self, token: &str, user_id: &str, permissions: Vec<String>) {
        self.users.lock().unwrap().push((
            token.into(),
            AuthenticatedUser {
                user_id: user_id.into(),
                permissions: permissions.into_iter().collect::<HashSet<_>>(),
                metadata: None,
            },
        ));
    }
}

impl AuthProvider for FakeAuthProvider {
    fn authenticate(&self, token: String) -> AuthFuture<'_> {
        Box::pin(async move {
            self.users
                .lock()
                .unwrap()
                .iter()
                .find(|(candidate, _)| *candidate == token)
                .map(|(_, user)| user.clone())
                .ok_or(AuthError::InvalidToken)
        })
    }
}
```

### Integration Testing with `axum-test`

```rust
use axum_test::TestServer;
use std::sync::Arc;

struct TestApp {
    server: TestServer,
    auth: Arc<FakeAuthProvider>,
}

impl TestApp {
    fn new() -> Self {
        let auth = Arc::new(FakeAuthProvider::new());
        let service = TaskServiceImpl::new(/* domain fakes */);

        let router = TaskServiceBuilder::new(service)
            .auth_provider(Arc::clone(&auth) as Arc<dyn AuthProvider>)
            .build();

        let server = TestServer::new(router).unwrap();
        Self { server, auth }
    }
}

#[tokio::test]
async fn create_task_requires_auth() {
    let app = TestApp::new();

    let response = app.server
        .post("/api/v1/tasks")
        .json(&serde_json::json!({ "title": "Test", "description": "" }))
        .await;

    response.assert_status(axum::http::StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn create_task_with_valid_token() {
    let app = TestApp::new();
    app.auth.add_user("test-token", "alice", vec!["tasks:write".into()]);

    let response = app.server
        .post("/api/v1/tasks")
        .add_header("Authorization", "Bearer test-token")
        .json(&serde_json::json!({ "title": "Test", "description": "" }))
        .await;

    response.assert_status(axum::http::StatusCode::CREATED);
}
```

## Production Checklist

- Structured logs: use `tracing` with request IDs.
- Health checks: expose at least one public liveness endpoint.
- Graceful shutdown: handle `SIGTERM` before stopping the listener.
- CORS: configure `tower-http::cors::CorsLayer` for browser clients.
- Request size limits: declare limits in `file_service!`; use Tower middleware for REST if needed.
- Metrics protection: restrict `/metrics` to an internal network or protected route.
- Permission drift checks: generate permission manifests and assert expected operation requirements.

## Related Skills

For workspace setup and crate layout, see the **ras-setup** skill.
For macro syntax and endpoint definition, see the **ras-api-design** skill.
For auth provider implementation and permission design, see the **ras-security** skill.
For hand-written fake patterns and test organization, see the **rust-testing** skill.
For DI and trait boundary patterns, see the **rust-architecture** skill.
