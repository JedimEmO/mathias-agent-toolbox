# RAS Macro Syntax Reference

## Contents

- `rest_service!`
- `jsonrpc_service!`
- `file_service!`
- `jsonrpc_bidirectional_service!`
- Auth Requirements
- Type Requirements
- REST Path & Query Parameter Syntax
- RestResult Responses
- Generated Rust Clients
- Permission Metadata
- Feature Flags

## `rest_service!`

```rust
rest_service!({
    service_name: Name,              // Required
    base_path: "/prefix",            // Required
    openapi: true,                   // Optional, or { output: "path.json" }
    serve_docs: true,                // Optional built-in API explorer
    docs_path: "/docs",              // Optional, default "/docs"
    endpoints: [
        METHOD AUTH path/{param: Type}/more ? query: Type & opt: Option<Type> (Body) -> Response,
    ]
});
```

Methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`.

Generated names:

- Trait: `{ServiceName}Trait`
- Builder: `{ServiceName}Builder`
- Client: `{ServiceName}Client`
- REST methods: `{method}_{path_segments}`, for example `GET users/{id}` becomes `get_users_by_id`

Hosted docs: `serve_docs: true` serves the explorer at `base_path + docs_path` and OpenAPI JSON at `base_path + docs_path + "/openapi.json"`.

## `jsonrpc_service!`

```rust
jsonrpc_service!({
    service_name: Name,              // Required
    openrpc: true,                   // Optional OpenRPC spec generation
    methods: [
        AUTH method_name(RequestType) -> ResponseType,
    ]
});
```

Generated names:

- Trait: `{ServiceName}Trait`
- Builder: `{ServiceName}Builder`
- Client builder: `{ServiceName}ClientBuilder`

The Rust method name is the JSON-RPC wire method unless a versioned method block sets an explicit wire name.

## `file_service!`

```rust
file_service!({
    service_name: Name,
    base_path: "/prefix",
    openapi: true,
    endpoints: [
        UPLOAD AUTH upload multipart {
            max_total_bytes: 52428800,
            reject_unknown_fields: true,
            parts: [
                file file {
                    required: true,
                    max_count: 1,
                    max_bytes: 52428800,
                    content_types: ["application/pdf"],
                    filename: optional,
                },
                json metadata: Metadata {
                    required: false,
                    max_bytes: 4096,
                    content_types: ["application/json"],
                },
            ],
        } -> UploadResponse,

        DOWNLOAD AUTH download/{file_id: String} {
            content_types: ["application/octet-stream"],
            ranges: true,
        },
    ]
});
```

Uploads are handled through generated lifecycle hooks: `*_begin`, `*_part`, `*_finish`, and optionally `*_abort`. Downloads return `ras_file_core::DownloadResponse`.

## `jsonrpc_bidirectional_service!`

```rust
jsonrpc_bidirectional_service!({
    service_name: Name,
    client_to_server: [
        AUTH method_name(RequestType) -> ResponseType,
    ],
    server_to_client: [
        notification_name(NotificationType),
    ]
});
```

## Auth Requirements

| Syntax | Meaning |
|--------|---------|
| `UNAUTHORIZED` | Public operation; no user param in handler |
| `WITH_PERMISSIONS(["a"])` | Authenticated user must have `a` |
| `WITH_PERMISSIONS(["a", "b"])` | Authenticated user must have `a` and `b` |
| `WITH_PERMISSIONS(["a"] \| ["b"])` | Authenticated user must satisfy either group |
| `WITH_PERMISSIONS(["a"] \| ["b", "c"])` | Authenticated user must have `a`, or both `b` and `c` |
| `WITH_PERMISSIONS([])` | Authenticated-only; no permission strings required |

Protected handlers receive `&AuthenticatedUser` or the file request context before path, query, and body arguments.

## Type Requirements

All JSON request/response types should derive:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
```

- `Serialize` and `Deserialize` are from `serde`.
- `JsonSchema` is from `schemars` and is required for OpenAPI/OpenRPC generation.

## REST Path & Query Parameter Syntax

```text
path/{name: Type}                    # path param
path ? key: Type                     # required query param
path ? key: Option<Type>             # optional query param
path ? a: Type & b: Option<Type>     # multiple query params
path/{id: String} ? detail: bool     # path + query combined
```

## RestResult Responses

```rust
Ok(RestResponse::ok(value))                    // 200
Ok(RestResponse::created(value))               // 201
Ok(RestResponse::with_status(202, value))      // custom status
Err(RestError::bad_request("msg"))             // 400
Err(RestError::unauthorized("msg"))            // 401
Err(RestError::forbidden("msg"))               // 403
Err(RestError::not_found("msg"))               // 404
Err(RestError::with_internal(500, "msg", err)) // 500, logs err but sends msg
```

## Generated Rust Clients

REST clients receive the server origin; REST `base_path` is joined automatically:

```rust
let mut client = ServiceNameClient::builder("http://localhost:3000")
    .with_timeout(std::time::Duration::from_secs(10))
    .build()?;
client.set_bearer_token(Some("jwt-token"));

let result = client.get_things().await?;
let item = client.get_things_by_id("id".to_string()).await?;
let created = client.post_things(CreateRequest { /* ... */ }).await?;
```

JSON-RPC clients receive the RPC endpoint URL:

```rust
let mut client = ServiceNameClientBuilder::new("http://localhost:3000/rpc")
    .build()?;
client.set_bearer_token(Some("jwt-token"));
let result = client.some_method(request).await?;
```

The macro crate's `client` feature emits generated client types and `build_with_transport(...)`. The `reqwest` feature also emits the default reqwest-backed `build()`.

## Permission Metadata

OpenAPI/OpenRPC documents include:

- `x-permissions`: flattened compatibility list.
- `x-permission-groups`: the original OR/AND groups.

When the macro crate's `permissions` feature is enabled, services also emit `generate_*_permission_manifest()` plus generated permission constants.

## Feature Flags

REST API crate:

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
permissions = ["ras-rest-macro/permissions"]
```

JSON-RPC API crate:

```toml
[features]
default = []
server = ["ras-jsonrpc-macro/server", "dep:ras-jsonrpc-core", "dep:axum", "dep:tokio"]
client = ["ras-jsonrpc-macro/reqwest", "ras-transport-core/reqwest"]
permissions = ["ras-jsonrpc-macro/permissions"]
```

File API crate:

```toml
[features]
default = []
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
permissions = ["ras-file-macro/permissions"]
```
