# Bevy

Skills for writing Bevy games against the API that is actually on disk.

Bevy breaks its API on every release, so a general Bevy tutorial goes stale within months.
This plugin holds only what a model gets wrong: the names that changed, the way to check a
signature against the local crate source, and a workflow for diagnosing a running game.

## Skills

- **bevy-api** — Current names for Bevy 0.19 and 0.20, the 0.19 to 0.20 upgrade, ecosystem crate compatibility, and how to verify a signature against `~/.cargo/registry`
- **bevy-debug-inspection** — Runtime inspection, deterministic debug scenarios, screenshots, diagnostics, BRP
