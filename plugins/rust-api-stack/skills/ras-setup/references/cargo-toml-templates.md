# Cargo.toml Templates for RAS Projects

## Contents

- Workspace Root
- API Crate (REST)
- API Crate (JSON-RPC)
- API Crate (File Service)
- Service / Binary Crate
- Core / Domain Crate
- Test Utilities Crate

## Workspace Root

```toml
[workspace]
members = ["crates/*"]
resolver = "3"

[workspace.package]
edition = "2024"
rust-version = "1.88"

[workspace.dependencies]
# Rust API Stack (RAS). Include only the crates you use.
ras-rest-macro = { git = "https://github.com/JedimEmO/rust-api-stack.git", default-features = false }
ras-rest-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-jsonrpc-macro = { git = "https://github.com/JedimEmO/rust-api-stack.git", default-features = false }
ras-jsonrpc-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-jsonrpc-types = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-file-macro = { git = "https://github.com/JedimEmO/rust-api-stack.git", default-features = false }
ras-file-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-jsonrpc-bidirectional-macro = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-jsonrpc-bidirectional-server = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-jsonrpc-bidirectional-client = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-auth-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-transport-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-permission-manifest = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-identity-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-identity-session = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-identity-local = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-identity-oauth2 = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-observability-core = { git = "https://github.com/JedimEmO/rust-api-stack.git" }
ras-observability-otel = { git = "https://github.com/JedimEmO/rust-api-stack.git" }

# Standard
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
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4", "serde"] }

# Testing
axum-test = "18"

[workspace.lints.clippy]
pedantic = { level = "warn", priority = -1 }
module_name_repetitions = "allow"
must_use_candidate = "allow"
missing_errors_doc = "allow"
missing_panics_doc = "allow"
unwrap_used = "warn"

[workspace.lints.rust]
unsafe_code = "deny"
```

## API Crate (REST)

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

my-core = { path = "../my-core" }

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

For a custom transport without reqwest-backed `build()`, use:

```toml
client = ["ras-rest-macro/client", "dep:ras-transport-core"]
```

## API Crate (JSON-RPC)

```toml
[package]
name = "my-rpc-api"
version = "0.1.0"
edition.workspace = true

[lints]
workspace = true

[dependencies]
ras-jsonrpc-macro.workspace = true
ras-jsonrpc-core = { workspace = true, optional = true }
ras-jsonrpc-types.workspace = true
ras-transport-core = { workspace = true, optional = true }
ras-permission-manifest = { workspace = true, optional = true }
serde.workspace = true
serde_json.workspace = true
schemars.workspace = true
axum = { workspace = true, optional = true }
tokio = { workspace = true, optional = true }

my-core = { path = "../my-core" }

[features]
default = []
server = ["ras-jsonrpc-macro/server", "dep:ras-jsonrpc-core", "dep:axum", "dep:tokio"]
client = ["ras-jsonrpc-macro/reqwest", "ras-transport-core/reqwest"]
permissions = ["ras-jsonrpc-macro/permissions", "dep:ras-permission-manifest"]
```

## API Crate (File Service)

```toml
[package]
name = "my-file-api"
version = "0.1.0"
edition.workspace = true

[lints]
workspace = true

[dependencies]
ras-file-macro.workspace = true
ras-file-core = { workspace = true, optional = true }
ras-auth-core = { workspace = true, optional = true }
ras-transport-core = { workspace = true, optional = true }
ras-permission-manifest = { workspace = true, optional = true }
serde.workspace = true
serde_json = { workspace = true, optional = true }
schemars = { workspace = true, optional = true }
async-trait = { workspace = true, optional = true }
axum = { workspace = true, optional = true }

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
permissions = ["ras-file-macro/permissions", "dep:ras-permission-manifest"]
```

## Service / Binary Crate

```toml
[package]
name = "my-service"
version = "0.1.0"
edition.workspace = true

[lints]
workspace = true

[dependencies]
my-core = { path = "../my-core" }
my-api = { path = "../my-api", features = ["server"] }

ras-auth-core.workspace = true
ras-rest-core.workspace = true
ras-identity-session.workspace = true
ras-identity-local.workspace = true
ras-observability-otel.workspace = true

axum.workspace = true
tokio.workspace = true
anyhow.workspace = true
tracing.workspace = true
async-trait.workspace = true

[dev-dependencies]
my-testutils = { path = "../my-testutils" }
axum-test.workspace = true
```

## Core / Domain Crate

```toml
[package]
name = "my-core"
version = "0.1.0"
edition.workspace = true

[lints]
workspace = true

[dependencies]
serde.workspace = true
thiserror.workspace = true
chrono.workspace = true
uuid.workspace = true
async-trait.workspace = true
```

No RAS dependencies here. The domain crate stays pure.

## Test Utilities Crate

```toml
[package]
name = "my-testutils"
version = "0.1.0"
edition.workspace = true

[lints]
workspace = true

[dependencies]
my-core = { path = "../my-core" }
ras-auth-core.workspace = true
serde.workspace = true
async-trait.workspace = true
```

This crate exports hand-written fakes such as `FakeAuthProvider`, fake repositories, and test fixture builders. Only reference it as a dev-dependency from crates that test through those fakes.
