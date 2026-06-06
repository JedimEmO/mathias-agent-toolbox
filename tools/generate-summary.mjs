#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const PLUGINS_DIR = "plugins";
const SKIP_DIRS = new Set([".claude-plugin", ".codex-plugin", ".git", "node_modules"]);
const SKIP_FILES = new Set(["SUMMARY.md"]);

function humanize(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function extractTitle(filePath) {
  try {
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    let inFrontmatter = false;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line === "---") {
        inFrontmatter = !inFrontmatter;
        continue;
      }
      if (inFrontmatter) continue;
      const match = line.match(/^#\s+(.+)/);
      if (match) return match[1].trim();
    }
  } catch {
    // Fall back to filename below.
  }

  const parsed = path.parse(filePath);
  if (parsed.name === "SKILL") {
    return humanize(path.basename(path.dirname(filePath)));
  }
  return humanize(parsed.name);
}

function pluginTitle(pluginDir, fallbackName) {
  const readmePath = path.join(pluginDir, "README.md");
  if (fs.existsSync(readmePath)) return extractTitle(readmePath);

  for (const manifestPath of [
    path.join(pluginDir, ".codex-plugin", "plugin.json"),
    path.join(pluginDir, ".claude-plugin", "plugin.json"),
  ]) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      if (manifest.interface?.displayName) return manifest.interface.displayName;
      if (manifest.displayName) return manifest.displayName;
    } catch {
      // Fall back to the directory name below.
    }
  }

  return humanize(fallbackName);
}

function findMarkdownFiles(directory) {
  const results = [];
  if (!fs.existsSync(directory)) return results;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        results.push(...findMarkdownFiles(fullPath));
      }
      continue;
    }
    if (entry.name.endsWith(".md") && !SKIP_FILES.has(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function relativeLink(pluginName, filePath) {
  return path.relative(path.join(PLUGINS_DIR, pluginName), filePath).split(path.sep).join("/");
}

const output = [];
output.push("# Summary", "");
output.push("[Introduction](index.md)", "");

if (fs.existsSync(PLUGINS_DIR)) {
  for (const entry of fs.readdirSync(PLUGINS_DIR, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const pluginName = entry.name;
    const pluginDir = path.join(PLUGINS_DIR, pluginName);
    const skillsDir = path.join(pluginDir, "skills");

    output.push(`# ${pluginTitle(pluginDir, pluginName)}`, "");

    if (!fs.existsSync(skillsDir)) {
      for (const md of findMarkdownFiles(pluginDir)) {
        output.push(`- [${extractTitle(md)}](${pluginName}/${relativeLink(pluginName, md)})`);
      }
      output.push("");
      continue;
    }

    for (const skillEntry of fs.readdirSync(skillsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!skillEntry.isDirectory() || skillEntry.name.startsWith(".")) continue;
      const skillDir = path.join(skillsDir, skillEntry.name);
      const skillMd = path.join(skillDir, "SKILL.md");

      if (fs.existsSync(skillMd)) {
        output.push(`- [${extractTitle(skillMd)}](${pluginName}/${relativeLink(pluginName, skillMd)})`);
      } else {
        output.push(`- [${humanize(skillEntry.name)}]()`);
      }

      for (const refMd of findMarkdownFiles(skillDir).filter((filePath) => filePath !== skillMd)) {
        output.push(`  - [${extractTitle(refMd)}](${pluginName}/${relativeLink(pluginName, refMd)})`);
      }
    }

    const agentsDir = path.join(pluginDir, "agents");
    for (const agentMd of findMarkdownFiles(agentsDir)) {
      output.push(`- [${extractTitle(agentMd)}](${pluginName}/${relativeLink(pluginName, agentMd)})`);
    }

    output.push("");
  }
}

process.stdout.write(`${output.join("\n")}\n`);
