#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PLUGINS = path.join(ROOT, "plugins");
const GENERATED_DIRS = new Set(["node_modules", "dist", "target", "book-out", ".cache"]);

function walk(dir, predicate = () => true, prune = () => false) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (prune(fullPath, entry.name)) continue;
      out.push(...walk(fullPath, predicate, prune));
    } else if (predicate(fullPath, entry.name)) {
      out.push(fullPath);
    }
  }
  return out;
}

function parseFrontmatter(text, filePath) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    return { fields: {}, body: text, errors: [`${filePath}: missing YAML frontmatter`] };
  }

  const fields = {};
  const errors = [];
  let current = null;
  for (const rawLine of match[1].split("\n")) {
    if (!rawLine.trim()) continue;
    if (rawLine.startsWith(" ") && current) {
      fields[current] = `${fields[current]} ${rawLine.trim()}`.trim();
      continue;
    }
    const colon = rawLine.indexOf(":");
    if (colon === -1) {
      errors.push(`${filePath}: invalid frontmatter line: ${rawLine}`);
      continue;
    }
    current = rawLine.slice(0, colon).trim();
    fields[current] = rawLine.slice(colon + 1).trim().replace(/^"|"$/g, "");
  }

  return { fields, body: text.slice(match[0].length), errors };
}

function hasContents(text) {
  return /^## Contents\b|^# Contents\b|^## Table of Contents\b/m.test(text);
}

const errors = [];
const warnings = [];
const skillFiles = walk(
  PLUGINS,
  (filePath, name) => name === "SKILL.md",
  (_filePath, name) => name.startsWith(".") || GENERATED_DIRS.has(name),
);

if (skillFiles.length === 0) {
  errors.push("plugins/: no skills found");
}

for (const skill of skillFiles) {
  const text = fs.readFileSync(skill, "utf8");
  const { fields, body, errors: frontmatterErrors } = parseFrontmatter(text, skill);
  errors.push(...frontmatterErrors);

  const extra = Object.keys(fields).filter((key) => key !== "name" && key !== "description").sort();
  if (extra.length > 0) {
    errors.push(`${skill}: frontmatter has unsupported fields: ${extra.join(", ")}`);
  }

  const name = fields.name ?? "";
  const description = fields.description ?? "";
  if (!/^[a-z0-9-]{1,64}$/.test(name)) {
    errors.push(`${skill}: invalid or missing skill name`);
  }
  if (!description) {
    errors.push(`${skill}: missing description`);
  }
  if (description.length > 1024) {
    errors.push(`${skill}: description is ${description.length} chars, max 1024`);
  }

  const bodyLines = body.split("\n").length;
  if (bodyLines > 500) {
    errors.push(`${skill}: body is ${bodyLines} lines, max 500`);
  }

  const agentsMetadata = path.join(path.dirname(skill), "agents", "openai.yaml");
  if (!fs.existsSync(agentsMetadata)) {
    errors.push(`${skill}: missing agents/openai.yaml`);
  }

  const referencesDir = path.join(path.dirname(skill), "references");
  for (const reference of walk(referencesDir, (filePath, fileName) => fileName.endsWith(".md"))) {
    const referenceText = fs.readFileSync(reference, "utf8");
    const referenceLines = referenceText.split("\n").length;
    if (referenceLines > 100 && !hasContents(referenceText)) {
      errors.push(`${reference}: ${referenceLines} lines but no Contents section`);
    }
  }
}

const stack = [PLUGINS];
while (stack.length > 0) {
  const current = stack.pop();
  if (!current || !fs.existsSync(current)) continue;
  for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(current, entry.name);
    if (GENERATED_DIRS.has(entry.name)) {
      warnings.push(`${fullPath}: generated artifact directory is present`);
      continue;
    }
    stack.push(fullPath);
  }
}

for (const message of errors) console.log(`ERROR: ${message}`);
for (const message of warnings) console.log(`WARN: ${message}`);

if (errors.length > 0) {
  console.log(`\nSkill audit failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`Skill audit passed: ${skillFiles.length} skill(s), ${warnings.length} warning(s).`);
