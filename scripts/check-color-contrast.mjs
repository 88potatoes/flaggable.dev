#!/usr/bin/env node
/**
 * Deterministic color guard for the product UI.
 *
 * This intentionally checks source-level patterns that are easy to regress in
 * review, plus the contrast of the semantic palette. Browser-level contrast
 * still belongs in visual QA because inherited/alpha colors need layout.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoots = [
  "apps/main/app",
  "apps/main/components",
  "apps/landing/app",
  "packages/ui/src/ui",
];
const extensions = new Set([".tsx", ".ts", ".css"]);
const errors = [];

function filesIn(directory) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  const result = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...filesIn(relative));
    else if (extensions.has(path.extname(entry.name))) result.push(relative);
  }
  return result;
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function report(file, source, offset, message) {
  errors.push(`${file}:${lineNumber(source, offset)} ${message}`);
}

// These utility colors have repeatedly been used for small text on light
// surfaces. They do not meet WCAG AA and are not allowed in product source.
const forbiddenTextUtilities =
  /\btext-(?:orange|amber|yellow|green|emerald|blue|indigo|purple|gray|zinc)-(?:400|500|600|700)\b/g;
const forbiddenRawHexInComponents = /#[0-9a-fA-F]{3,8}\b/g;
const forbiddenWhiteText = /\btext-white\b/g;

for (const file of sourceRoots.flatMap(filesIn)) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  if (file.endsWith(".tsx") || file.endsWith(".ts")) {
    for (const match of source.matchAll(forbiddenTextUtilities)) {
      report(
        file,
        source,
        match.index,
        `low-contrast color utility "${match[0]}"; use a semantic token instead`,
      );
    }
    // Components must not invent one-off colors. CSS token declarations are
    // the only place where palette values are permitted.
    for (const match of source.matchAll(forbiddenRawHexInComponents)) {
      report(
        file,
        source,
        match.index,
        `raw color "${match[0]}"; use a semantic CSS token instead`,
      );
    }
  }
}

function hexToRgb(value) {
  const hex = value.replace("#", "");
  const expanded = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((index) => Number.parseInt(expanded.slice(index, index + 2), 16) / 255);
}
function luminance(value) {
  return hexToRgb(value)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function tokensFrom(source) {
  const tokens = new Map();
  for (const match of source.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g))
    tokens.set(match[1], match[2]);
  return tokens;
}
function requireContrast(file, tokens, foreground, backgrounds, minimum) {
  const foregroundValue = tokens.get(foreground);
  if (!foregroundValue) {
    errors.push(`${file} missing semantic token --${foreground}`);
    return;
  }
  for (const background of backgrounds) {
    const backgroundValue = tokens.get(background);
    if (!backgroundValue) {
      errors.push(`${file} missing semantic token --${background}`);
      continue;
    }
    const ratio = contrast(foregroundValue, backgroundValue);
    if (ratio < minimum)
      errors.push(
        `${file} --${foreground} on --${background} is ${ratio.toFixed(2)}:1 (needs ${minimum}:1)`,
      );
  }
}

const mainCssPath = path.join(root, "apps/main/app/globals.css");
const mainCss = fs.readFileSync(mainCssPath, "utf8");
const mainTokens = tokensFrom(mainCss);
for (const token of [
  "surface-0",
  "surface-1",
  "surface-2",
  "text-primary",
  "text-muted",
  "text-subtle",
  "accent",
  "accent-hover",
  "form-error",
]) {
  if (!mainTokens.has(token))
    errors.push(`apps/main/app/globals.css missing semantic token --${token}`);
}
for (const text of ["text-primary", "text-muted", "text-subtle", "form-error"]) {
  requireContrast(
    "apps/main/app/globals.css",
    mainTokens,
    text,
    ["surface-0", "surface-1", "surface-2"],
    4.5,
  );
}
requireContrast(
  "apps/main/app/globals.css",
  mainTokens,
  "accent",
  ["surface-0", "surface-1", "surface-2"],
  4.5,
);
requireContrast(
  "apps/main/app/globals.css",
  mainTokens,
  "accent-hover",
  ["surface-0", "surface-1", "surface-2"],
  4.5,
);

const landingCssPath = path.join(root, "apps/landing/app/globals.css");
const landingTokens = tokensFrom(fs.readFileSync(landingCssPath, "utf8"));
for (const token of [
  "ink",
  "navy",
  "paper",
  "accent",
  "accent-deep",
  "light-secondary",
  "light-tertiary",
  "dark-secondary",
  "dark-tertiary",
  "success",
  "info",
  "purple",
]) {
  if (!landingTokens.has(token))
    errors.push(`apps/landing/app/globals.css missing semantic token --${token}`);
}
requireContrast("apps/landing/app/globals.css", landingTokens, "ink", ["paper"], 4.5);
requireContrast("apps/landing/app/globals.css", landingTokens, "light-secondary", ["paper"], 4.5);
requireContrast("apps/landing/app/globals.css", landingTokens, "light-tertiary", ["paper"], 4.5);
requireContrast("apps/landing/app/globals.css", landingTokens, "dark-secondary", ["navy"], 4.5);
requireContrast("apps/landing/app/globals.css", landingTokens, "dark-tertiary", ["navy"], 4.5);
requireContrast("apps/landing/app/globals.css", landingTokens, "accent-deep", ["paper"], 4.5);

if (errors.length) {
  console.error(`Color guard failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(
  "Color guard passed: semantic tokens meet WCAG AA and no forbidden source colors were found.",
);
