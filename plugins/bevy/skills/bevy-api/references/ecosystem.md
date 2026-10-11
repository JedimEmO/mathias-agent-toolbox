# Ecosystem crates and Bevy versions

A Bevy plugin crate is locked to one Bevy release. A crate that requires `bevy = "0.19"` does
not build against 0.20, and Cargo's error for it is a wall of mismatched trait bounds rather
than a clear message.

## Check, do not assume

The table further down is a snapshot. Ask crates.io which Bevy a version requires:

```bash
curl -s -A "bevy-compat-check (you@example.com)" \
  https://crates.io/api/v1/crates/avian3d/0.7.0/dependencies \
  | python3 -c "import json,sys; print({d['crate_id']: d['req'] for d in json.load(sys.stdin)['dependencies'] if d['crate_id'].startswith('bevy')})"
```

crates.io rejects requests without a `User-Agent` that identifies the caller. Drop the
version from the path and read `versions` to list a crate's releases.

When a crate has no release for the Bevy version you need, look for a release candidate or a
tracking branch in its repository, and pin that by `git` and `rev`. If there is neither, the
game stays on the older Bevy until there is.

## Snapshot, 2026-10-11

Three days after the 0.20.0 release. Most of the crates below will have moved by the time you
read this.

| Crate | For Bevy 0.19 | For Bevy 0.20 |
| --- | --- | --- |
| `avian2d`, `avian3d` | 0.7 | not yet released |
| `bevy_rapier2d`, `bevy_rapier3d` | 0.36 | 0.37 |
| `leafwing-input-manager` | 0.21 | not yet released |
| `bevy_enhanced_input` | 0.26 | not yet released |
| `bevy_egui` | 0.42 | 0.43 |
| `bevy-inspector-egui` | 0.37 | not yet released |
| `bevy_asset_loader` | 0.27 | 0.28 |
| `bevy_kira_audio` | 0.26 | 0.27 |
| `bevy_hanabi` | 0.19 | not yet released |
| `bevy_ecs_tilemap` | 0.19 | not yet released |
| `bevy_tweening` | 0.16 | not yet released |
| `bevy_replicon` | 0.44 | not yet released |
| `lightyear` | 0.30 | not yet released |

## Choosing a crate

Prefer what Bevy ships before adding a dependency: picking, gizmos, states, `bevy_ui_widgets`
and the remote protocol are all built in. Each third-party plugin is one more crate an
upgrade has to wait for.

For physics, pick one backend and keep it. `avian` is ECS-native and configured through
components; `bevy_rapier` wraps the Rapier engine and tends to publish for a new Bevy release
sooner.

Add third-party crates with `default-features = false` and name the features the game uses,
so an upgrade does not pull in a renderer or an audio backend the game never asked for.
