# Mathias Agent Toolbox

[**Browse the plugin reference book**](https://jedimemo.github.io/mathias-agent-toolbox/)

Public Claude Code and Codex plugin marketplace for reusable agent workflows, engineering skills, Rust tooling, and UI quality workflows.

## Usage

### Claude Code

Add this marketplace:

```
/plugin marketplace add https://github.com/JedimEmO/mathias-agent-toolbox.git
```

Install a plugin:

```
/plugin install <plugin-name>@mathias-agent-toolbox
```

### Codex

Add this marketplace:

```bash
codex plugin marketplace add JedimEmO/mathias-agent-toolbox
```

Then open `/plugins` in Codex, choose **Mathias Agent Toolbox**, and install the plugins you want.

## Adding a plugin

Create a plugin directory under `plugins/`:

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json
├── .codex-plugin/
│   └── plugin.json
└── skills/            # and/or commands/, agents/, hooks/, output-styles/, .mcp.json
    └── my-skill/
        └── SKILL.md
```

Then add entries to both marketplace registries.

Claude entry in `.claude-plugin/marketplace.json`:

```json
{
  "name": "my-plugin",
  "source": "my-plugin",
  "description": "What it does",
  "version": "1.0.0"
}
```

The `source` is relative to `plugins/` (configured via `pluginRoot`).

Codex entry in `.agents/plugins/marketplace.json`:

```json
{
  "name": "my-plugin",
  "source": {
    "source": "local",
    "path": "./plugins/my-plugin"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Coding"
}
```

Codex plugin manifests should point at the shared skill tree:

```json
{
  "skills": "./skills/"
}
```

If the plugin has `.mcp.json`, add `"mcpServers": "./.mcp.json"` to `plugins/my-plugin/.codex-plugin/plugin.json`.

## Quality checks

Run the skill metadata/progressive-disclosure audit:

```bash
tools/audit-skills.mjs
```

Plugin-level trigger and behavior scenarios live in `skill-evals/`.
