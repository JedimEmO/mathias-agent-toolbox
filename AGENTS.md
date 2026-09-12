# AGENTS.md

This repository contains shared Claude Code and Codex plugins. Source content lives under
`plugins/`; generated book directories are disposable.

## Source of truth

- Keep shared skills and references in `plugins/PLUGIN_NAME/skills/`; do not duplicate them for Codex.
- When install-facing metadata changes, update both marketplace registries and both per-plugin manifests.
- Codex manifests point to shared skills with `"skills": "./skills/"`.
- If a plugin has `.mcp.json`, wire it explicitly with `"mcpServers": "./.mcp.json"` in the Codex manifest.

## Relevant checks

Run the check that matches the change:

```bash
tools/audit-skills.mjs
./build-book.sh
```

Use `./build-book.sh serve` for local book development. Use `./build-book.sh clean` only when
regenerating disposable `book-src/` and `book-out/` directories.

## Generated content

Do not edit `book-src/` or `book-out/` directly. The book pipeline generates them from
`plugins/` through `tools/generate-summary.mjs`.

Scaffold templates may contain source fixtures, but do not commit `node_modules`, `dist`,
`target`, or other generated build output.

## Repository metadata

- `.claude-plugin/marketplace.json` is the Claude registry.
- `.agents/plugins/marketplace.json` is the Codex registry.
- `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` hold per-plugin metadata.
- CI deploys the book on pushes to `master`.
