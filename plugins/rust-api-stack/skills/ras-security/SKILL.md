---
name: ras-security
description: Use when the user asks about authentication, authorization, permissions, JWT, OAuth2, session management, AuthProvider, IdentityProvider, securing Rust API Stack/RAS endpoints, token validation, RBAC, permission guards, permission manifests, or the UNAUTHORIZED/WITH_PERMISSIONS auth levels in RAS services.
---

# RAS Security - Auth, Permissions & Identity

Rust API Stack (RAS) keeps authentication and authorization in the API contract. Generated routers reject unauthorized requests before handlers run, generated docs expose auth requirements, and generated permission manifests can feed audits, admin UIs, tests, and token issuing code.

RAS uses pluggable authentication through `AuthProvider` and identity/session crates such as `ras-identity-session`, `ras-identity-local`, and `ras-identity-oauth2`.

## Auth Requirements in Macros

Every operation declares its auth requirement:

```rust
endpoints: [
    // Public: no credential required, no user parameter in handler.
    GET UNAUTHORIZED health() -> HealthStatus,

    // Authenticated plus one permission.
    POST WITH_PERMISSIONS(["tasks:write"]) tasks(CreateTaskRequest) -> Task,

    // Authenticated plus both permissions in the group.
    PUT WITH_PERMISSIONS(["moderator", "editor"]) posts/{id: String}(UpdatePostRequest) -> Post,

    // Authenticated plus either "admin", or both "moderator" and "editor".
    DELETE WITH_PERMISSIONS(["admin"] | ["moderator", "editor"]) posts/{id: String}() -> (),

    // Authenticated-only: valid user, no permission strings required.
    GET WITH_PERMISSIONS([]) profile() -> Profile,
]
```

Auth syntax is accepted by REST, JSON-RPC, file, and bidirectional JSON-RPC macros.

How auth affects generated handler signatures:

```rust
// UNAUTHORIZED: no user parameter.
async fn get_health(&self) -> RestResult<HealthStatus> {
    /* ... */
}

// WITH_PERMISSIONS: receives &AuthenticatedUser.
async fn post_tasks(
    &self,
    user: &AuthenticatedUser,
    req: CreateTaskRequest,
) -> RestResult<Task> {
    /* user.user_id and user.permissions are available here */
}
```

## The `AuthProvider` Trait

`AuthProvider` validates credentials and checks permission groups:

```rust
use ras_auth_core::{AuthFuture, AuthProvider, AuthenticatedUser, AuthResult};

pub trait AuthProvider: Send + Sync + 'static {
    fn authenticate(&self, token: String) -> AuthFuture<'_>;

    fn check_permissions(
        &self,
        user: &AuthenticatedUser,
        required_permissions: &[String],
    ) -> AuthResult<()> {
        /* default requires all permissions in this group */
    }
}
```

The default `check_permissions` implementation requires every permission in a single group. Generated code handles OR groups by calling `check_permissions` for each group until one succeeds. Override `check_permissions` only when policy needs more than simple string membership.

Wire auth with `Arc<dyn AuthProvider>`:

```rust
let auth: Arc<dyn AuthProvider> = Arc::new(JwtAuthProvider::new(session_service));

let router = TaskServiceBuilder::new(service_impl)
    .auth_provider(auth)
    .build();
```

## Identity Providers and Sessions

`IdentityProvider` verifies credentials such as username/password or OAuth2 callback payloads and returns a verified identity. `SessionService` turns verified identities into JWT sessions and gives the service macros a `JwtAuthProvider`.

```rust
use ras_identity_session::{JwtAuthProvider, SessionConfig, SessionService};
use std::sync::Arc;

let mut config = SessionConfig::new(
    std::env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
)?;
config.refresh_enabled = false;

let session_service = Arc::new(SessionService::new(config)?);

// Register identity providers such as LocalUserProvider or OAuth2Provider.
session_service.register_provider(Box::new(local_provider)).await;

let auth: Arc<dyn AuthProvider> = Arc::new(JwtAuthProvider::new(session_service.clone()));
```

Session lifecycle:

```rust
let jwt = session_service
    .begin_session("local", serde_json::json!({
        "username": "alice",
        "password": "secure_password"
    }))
    .await?;

let user = session_service.verify_session(&jwt).await?;
session_service.end_session(&jti).await;
```

## Permission Design

Prefer capability permissions over role names:

```rust
// Good: checks capability.
POST WITH_PERMISSIONS(["tasks:write"]) tasks(CreateTaskRequest) -> Task,

// Less flexible: checks role.
POST WITH_PERMISSIONS(["admin"]) tasks(CreateTaskRequest) -> Task,
```

Use `resource:action` names:

- `tasks:read`, `tasks:write`, `tasks:delete`
- `users:read`, `users:write`, `users:manage`
- `admin:*` only when a broad administrative capability is intentional

Group permissions to express policy without duplicating handlers:

```rust
// Tenant writer, or global admin.
POST WITH_PERMISSIONS(["tenant:active", "tasks:write"] | ["admin:*"]) tasks(CreateTaskRequest) -> Task,
```

## Permission Manifests

Enable manifest generation when permission strings need to be consumed outside request handling:

```toml
[dependencies]
ras-permission-manifest.workspace = true

[features]
permissions = ["ras-rest-macro/permissions"]
```

For JSON-RPC and file APIs, use:

```toml
permissions = ["ras-jsonrpc-macro/permissions"]
permissions = ["ras-file-macro/permissions"]
```

The generated manifest distinguishes:

- public operations (`UNAUTHORIZED`)
- authenticated-only operations (`WITH_PERMISSIONS([])`)
- protected operations with OR/AND permission groups

OpenAPI/OpenRPC specs also include `x-permissions` as a flattened compatibility list and `x-permission-groups` as the preserved group model.

Use generated permission constants in token issuing code and tests instead of repeating strings:

```rust
use ras_permission_manifest::PermissionSet;
use workspace_api::userservice_permissions;

let permissions = PermissionSet::new()
    .with(userservice_permissions::TASK_WRITE)
    .into_hash_set();

assert!(
    userservice_permissions::operations::POST_USERS
        .is_satisfied_by(&permissions)
);
```

## Local and OAuth Providers

Local username/password auth should rely on `ras-identity-local` rather than storing plaintext passwords or ad hoc hashes. The local provider uses password hashing and guards against common login attacks.

OAuth2 providers should use authorization code flow with PKCE when available, validate state, and keep provider config out of source control.

```rust
use ras_identity_oauth2::{
    InMemoryStateStore, OAuth2Config, OAuth2Provider, OAuth2ProviderConfig,
};
use std::sync::Arc;

let google_config = OAuth2ProviderConfig {
    provider_id: "google".into(),
    client_id: "your-client-id".into(),
    client_secret: "your-client-secret".into(),
    authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth".into(),
    token_endpoint: "https://oauth2.googleapis.com/token".into(),
    userinfo_endpoint: Some("https://www.googleapis.com/oauth2/v2/userinfo".into()),
    redirect_uri: "http://localhost:3000/auth/callback".into(),
    scopes: vec!["openid".into(), "email".into(), "profile".into()],
    use_pkce: true,
    auth_params: Default::default(),
    user_info_mapping: None,
};

let oauth_provider = OAuth2Provider::new(
    OAuth2Config::new().add_provider(google_config),
    Arc::new(InMemoryStateStore::new()),
);
```

## Security Checklist

- HTTPS in production: terminate TLS at the load balancer or use rustls.
- Strong JWT secrets: generate cryptographically secure secrets; never hardcode.
- Short token TTLs: prefer short-lived access tokens and explicit refresh policy.
- Secret management: load secrets from environment or a secret manager, not config files.
- Rate limit auth endpoints: protect login and token refresh paths.
- Audit auth failures: log failed auth attempts with request metadata.
- Validate business constraints in handlers: serde only validates shape.
- Sanitize error responses: use `RestError::with_internal()` for server failures.
- Avoid browser `localStorage` for bearer tokens: generated explorers store entered tokens in `sessionStorage`.
- Test permission groups: include tests for each OR branch and each missing-permission case.

## Related Skills

For the trait-as-interface pattern behind `AuthProvider`, see the **rust-architecture** skill.
For auth syntax and endpoint definition, see the **ras-api-design** skill.
For testing with `FakeAuthProvider`, see the **ras-best-practices** skill.
