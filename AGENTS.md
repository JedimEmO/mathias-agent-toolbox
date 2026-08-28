# AGENTS.md

This file provides guidance to Codex when working in this repository.

## Project Overview

This repository is a shared Claude Code and Codex plugin marketplace. The reusable content is documentation-driven: skills, references, templates, scripts, and related plugin assets live under `plugins/`. The static reference book is generated with mdBook and published through GitHub Pages.

## Build Commands

```bash
./build-book.sh          # Build static HTML book to book-out/
./build-book.sh serve    # Live-reload dev server
./build-book.sh clean    # Remove generated book-src/ and book-out/
tools/audit-skills.mjs   # Check skill metadata and progressive-disclosure hygiene
```

The build pipeline runs `tools/generate-summary.mjs`, which walks `plugins/`, generates `book-src/SUMMARY.md`, symlinks Markdown files into `book-src/`, then runs `mdbook build`.

## Plugin Structure

Shared plugin content lives under `plugins/PLUGIN_NAME/` and should not be duplicated per platform:

```text
plugins/PLUGIN_NAME/
├── .claude-plugin/
│   └── plugin.json
├── .codex-plugin/
│   └── plugin.json
└── skills/
    └── SKILL_NAME/
        ├── SKILL.md
        └── references/
```

The `skills/`, `references/`, templates, scripts, and other content files are the source of truth for both Claude Code and Codex.

A plugin may also ship an `output-styles/` directory of Claude Code output styles. Codex has no equivalent, so a plugin shipping an output style should expose the same guidance as a skill under `skills/`, and the Codex manifest points at that skill tree as usual.

## Dual Marketplace Metadata

When adding, renaming, moving, or changing plugin install-facing metadata, update both platform surfaces:

- Claude marketplace registry: `.claude-plugin/marketplace.json`
- Codex marketplace registry: `.agents/plugins/marketplace.json`
- Claude per-plugin manifest: `plugins/PLUGIN_NAME/.claude-plugin/plugin.json`
- Codex per-plugin manifest: `plugins/PLUGIN_NAME/.codex-plugin/plugin.json`

Keep descriptions, versions, author or publisher metadata, keywords, categories, and display metadata aligned where both systems support them. Do not duplicate skill content for Codex; point the Codex manifest at the existing skill tree with:

```json
{
  "skills": "./skills/"
}
```

Codex marketplace entries should use a `source.path` relative to the marketplace root, include `policy.installation`, `policy.authentication`, and `category`, and point at the shared plugin directory.

## MCP Configuration

If a plugin includes plugin-local MCP configuration in `.mcp.json`, keep that file in the plugin root and wire it explicitly in the Codex manifest:

```json
{
  "mcpServers": "./.mcp.json"
}
```

Do not assume Codex auto-discovers `.mcp.json` just because the file exists. Claude MCP behavior should remain represented by the Claude plugin structure and any Claude-specific marketplace requirements.

## Install And Test Notes

Claude Code marketplace usage:

```text
/plugin marketplace add https://github.com/JedimEmO/mathias-agent-toolbox.git
/plugin install <plugin-name>@mathias-agent-toolbox
```

Codex marketplace usage:

```bash
codex plugin marketplace add <repo-or-local-root>
```

After adding or updating Codex plugin metadata, restart Codex and verify the plugin appears in `/plugins`. For repo-local development, keep `.agents/plugins/marketplace.json` in this repository and point entries at `./plugins/PLUGIN_NAME`.

## Key Files

- `.claude-plugin/marketplace.json` - Claude plugin registry
- `.agents/plugins/marketplace.json` - Codex plugin registry
- `plugins/*/.claude-plugin/plugin.json` - Claude per-plugin metadata
- `plugins/*/.codex-plugin/plugin.json` - Codex per-plugin metadata
- `tools/generate-summary.mjs` - discovers plugin Markdown and generates mdBook input
- `tools/audit-skills.mjs` - checks skill metadata and progressive-disclosure hygiene
- `book.toml` - mdBook config
- `.github/workflows/deploy-book.yml` - GitHub Pages deployment on pushes to `master`

## Architecture Notes

- `book-src/` and `book-out/` are generated and gitignored; never edit them directly.
- Build output uses symlinks from `book-src/` to `plugins/`, so edits to plugin Markdown files are visible during `./build-book.sh serve`.
- `tools/generate-summary.mjs` extracts H1 headings from Markdown files for TOC titles, falling back to humanized filenames.
- CI is triggered on pushes to `master`, not `main`.
