# Blender MCP

Connect Claude Code or Codex to Blender through the community [`blender-mcp`](https://github.com/ahujasid/blender-mcp) server.

## Setup

Install `uv`, then install the Blender addon:

```bash
uvx blender-mcp install-addon
```

In Blender, enable **Interface: MCP for Blender** under Preferences → Add-ons. Open the 3D View sidebar with `N`, select the MCP for Blender tab, and start the MCP server.

The plugin starts the MCP server with `uvx blender-mcp`. Restart Claude Code or Codex after installation so it discovers the server.

## Safety

The plugin enables `BLENDER_MCP_SAFE_MODE=1` by default. The upstream server can execute Python inside Blender, so keep safe mode enabled unless the project explicitly accepts that risk. The upstream project documents the validation behavior and the additional asset-provider credentials.

Only run one `blender-mcp` server instance at a time. Blender must be running with the addon enabled before the tools can connect.
