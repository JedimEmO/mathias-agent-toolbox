---
name: ras-api-design
description: Use when defining Rust API Stack REST, JSON-RPC, file, or WebSocket services, including macro schemas and generated API specifications.
---

# RAS API Design - Macro Syntax & Endpoint Definition

Rust API Stack (RAS) macros generate typed service traits, builders, Axum routers, native Rust clients, and OpenAPI/OpenRPC specs from declarative API contracts. Keep the macro invocation in a shared API crate so server crates can enable `server` and callers can enable `client` without pulling in the service implementation.

All service macros share the same auth syntax:

```rust
UNAUTHORIZED
WITH_PERMISSIONS(["user"])
WITH_PERMISSIONS(["admin"] | ["support", "users:write"])
WITH_PERMISSIONS([])
```

- `UNAUTHORIZED` is public and does not pass a user to the handler.
- `WITH_PERMISSIONS(["a", "b"])` requires authentication plus both permissions.
- `WITH_PERMISSIONS(["a"] | ["b", "c"])` accepts either group: `a`, or both `b` and `c`.
- `WITH_PERMISSIONS([])` means authenticated-only with no permission strings.

## `rest_service!` - REST APIs

```rust
use ras_rest_macro::rest_service;

rest_service!({
    service_name: TaskService,
    base_path: "/api/v1",
    openapi: true,
    serve_docs: true,
    docs_path: "/docs",
    endpoints: [
        GET UNAUTHORIZED tasks() -> TasksResponse,
        GET UNAUTHORIZED tasks/{id: String}() -> Task,
        GET UNAUTHORIZED search/tasks ? q: String & limit: Option<u32> () -> TasksResponse,

        POST WITH_PERMISSIONS(["tasks:write"]) tasks(CreateTaskRequest) -> Task,
        PUT WITH_PERMISSIONS(["tasks:write"]) users/{user_id: String}/tasks/{task_id: String}(UpdateTaskRequest) -> Task,
        DELETE WITH_PERMISSIONS(["admin"] | ["tasks:delete"]) tasks/{id: String}() -> (),
    ]
});
```

Endpoint syntax:

```text
METHOD AUTH_REQUIREMENT path/{param: Type}/segments ? query: Type & opt: Option<Type> (RequestBody) -> ResponseType
```

| Component | Options |
|-----------|---------|
| Method | `GET`, `POST`, `PUT`, `DELETE`, `PATCH` |
| Auth requirement | `UNAUTHORIZED`, `WITH_PERMISSIONS([...])`, `WITH_PERMISSIONS([...]\|[...])`, `WITH_PERMISSIONS([])` |
| Path params | `{name: Type}` inline in the path |
| Query params | `? param: Type & param2: Option<Type>` after the path |
| Request body | `(RequestType)`; use `()` when there is no body |
| Response | `-> ResponseType`; use `()` for empty responses |

With `serve_docs: true`, the generated router serves the built-in API explorer at `base_path + docs_path` and the OpenAPI document at `base_path + docs_path + "/openapi.json"`. For example, `base_path: "/api/v1"` and `docs_path: "/docs"` serve `/api/v1/docs` and `/api/v1/docs/openapi.json`.

## Request & Response Types

Types used in macro invocations should derive serialization and schema traits:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: String,
}
```

- `Serialize` and `Deserialize` are required for JSON encoding.
- `JsonSchema` is required when generating OpenAPI/OpenRPC specs.

## REST Handlers

Protected endpoints receive `&AuthenticatedUser` before path, query, and body arguments:

```rust
use ras_auth_core::AuthenticatedUser;
use ras_rest_core::{RestError, RestResponse, RestResult};

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
        Ok(RestResponse::created(self.create_for_user(user, request).await?))
    }
}
```

Use `RestResponse` helpers for success responses and `RestError` for failures:

```rust
Ok(RestResponse::ok(task))
Ok(RestResponse::created(task))
Ok(RestResponse::with_status(202, task))
Err(RestError::bad_request("invalid task id"))
Err(RestError::unauthorized("invalid token"))
Err(RestError::forbidden("insufficient permissions"))
Err(RestError::not_found("task not found"))
Err(RestError::with_internal(500, "internal error", db_error))
```

## Generated REST Client

The API crate must forward generated-client features. For the default reqwest-backed client:

```toml
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
```

The macro crate's `client` feature emits client types and `build_with_transport(...)`. Its `reqwest` feature also emits the default `build()`. If you inject a custom transport, forward `ras-rest-macro/client` plus `dep:ras-transport-core` instead of `ras-rest-macro/reqwest`.

Pass the server origin to the generated REST client; the macro joins `base_path` automatically:

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

## `jsonrpc_service!` - JSON-RPC

```rust
use ras_jsonrpc_macro::jsonrpc_service;

jsonrpc_service!({
    service_name: UserService,
    openrpc: true,
    methods: [
        UNAUTHORIZED sign_in(SignInRequest) -> SignInResponse,
        WITH_PERMISSIONS(["user"]) get_profile(()) -> UserProfile,
        WITH_PERMISSIONS(["admin"] | ["support", "users:write"]) disable_user(String) -> (),
    ]
});
```

JSON-RPC methods map to JSON-RPC 2.0 method strings. Protected methods receive `&AuthenticatedUser` before the request payload. Enable the API crate client with:

```toml
client = ["ras-jsonrpc-macro/reqwest", "ras-transport-core/reqwest"]
```

Use the generated builder with the JSON-RPC endpoint URL:

```rust
let mut client = UserServiceClientBuilder::new("http://localhost:3000/rpc")
    .with_timeout(std::time::Duration::from_secs(10))
    .build()?;

let signed_in = client.sign_in(SignInRequest {
    email: "alice@example.com".to_string(),
    password: "correct horse battery staple".to_string(),
}).await?;

client.set_bearer_token(Some(signed_in.token));
let profile = client.get_profile(()).await?;
```

With `openrpc: true`, the macro emits `generate_userservice_openrpc()` and `generate_userservice_openrpc_to_file()`. The generated document includes auth metadata, flattened `x-permissions`, grouped `x-permission-groups`, and version metadata when present.

## `file_service!` - File Upload/Download

Use `file_service!` for APIs that stream uploads and downloads. The generated server authenticates and checks permissions before consuming upload bodies, validates multipart fields, and streams bytes instead of buffering whole files.

```rust
use ras_file_macro::file_service;

file_service!({
    service_name: DocumentService,
    base_path: "/api/documents",
    openapi: true,
    endpoints: [
        UPLOAD WITH_PERMISSIONS(["files:write"]) upload multipart {
            max_total_bytes: 52428800,
            reject_unknown_fields: true,
            parts: [
                file file {
                    required: true,
                    max_count: 1,
                    max_bytes: 52428800,
                    content_types: ["application/pdf", "text/plain"],
                    filename: optional,
                },
                json metadata: UploadMetadata {
                    required: false,
                    max_bytes: 4096,
                    content_types: ["application/json"],
                },
            ],
        } -> UploadResponse,

        DOWNLOAD WITH_PERMISSIONS(["files:read"]) download/{file_id: String} {
            content_types: ["application/octet-stream"],
            ranges: true,
        },
    ]
});
```

File API crates usually expose:

```toml
server = [
    "ras-file-macro/server",
    "dep:ras-file-core",
    "dep:ras-auth-core",
    "dep:async-trait",
    "dep:axum",
    "dep:schemars",
    "dep:serde_json",
]
client = ["ras-file-macro/reqwest", "ras-transport-core/reqwest"]
fs = ["ras-file-macro/fs", "ras-transport-core/fs"]
```

Enable `fs` for native helpers that stream file parts from disk.

## `jsonrpc_bidirectional_service!` - WebSocket JSON-RPC

```rust
jsonrpc_bidirectional_service!({
    service_name: ChatService,
    client_to_server: [
        UNAUTHORIZED connect(ConnectRequest) -> ConnectResponse,
        WITH_PERMISSIONS(["user"]) send_message(SendMessageRequest) -> SendMessageResponse,
    ],
    server_to_client: [
        message_received(MessageNotification),
        user_joined(UserJoinedNotification),
    ]
});
```

Use bidirectional JSON-RPC for WebSocket-style workflows. It shares the same `WITH_PERMISSIONS(["a"] | ["b", "c"])` auth syntax as HTTP JSON-RPC.

## Permission Metadata

OpenAPI and OpenRPC output include both:

- `x-permissions`: flattened compatibility list.
- `x-permission-groups`: the original OR/AND groups used by runtime checks.

Enable the macro crate's `permissions` feature plus `ras-permission-manifest` when admin tooling, tests, or token issuing code should import compile-checked permission constants:

```toml
[features]
permissions = ["ras-rest-macro/permissions"]
```

For a service named `UserService`, the macro emits `generate_userservice_permission_manifest()` and a `userservice_permissions` module with permission constants and operation requirements.
