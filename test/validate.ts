import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ColorTheme, SemanticStyle } from "../src/types.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function json<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(resolve(root, path), "utf8")) as T;
}

const manifest = await json<Record<string, any>>("package.json");
const registry = await json<{ vscodeVersion: string; colors: string[] }>(
  "test/fixtures/workbench-colors-1.129.1.json"
);
const themes = await Promise.all([
  json<ColorTheme>("themes/codefolk-light-color-theme.json"),
  json<ColorTheme>("themes/codefolk-dark-color-theme.json")
]);

assert.equal(manifest.name, "codefolk");
assert.equal(manifest.publisher, "kuranai");
assert.equal(manifest.version, "0.1.1");
assert.equal(manifest.preview, true);
assert.equal(manifest.engines.vscode, "^1.100.0");
assert.deepEqual(
  manifest.contributes.themes.map((theme: Record<string, string>) => [theme.label, theme.uiTheme, theme.path]),
  [
    ["Codefolk Light", "vs", "./themes/codefolk-light-color-theme.json"],
    ["Codefolk Dark", "vs-dark", "./themes/codefolk-dark-color-theme.json"]
  ]
);

const allowedColors = new Set(registry.colors);
const hexColor = /^#[0-9a-f]{3,4}(?:[0-9a-f]{3,4})?$/i;
const semanticSelector = /^(?:\*|[A-Za-z_][\w-]*)(?:\.[A-Za-z_][\w-]*)*(?::[A-Za-z_][\w-]*)?$/;
const allowedFontStyles = new Set(["", "italic", "bold", "underline", "strikethrough"]);
const deprecatedKeys = new Set([
  "editorIndentGuide.background",
  "editorIndentGuide.activeBackground",
  "editorBracketHighlight.foreground"
]);

for (const theme of themes) {
  assert.equal(theme.$schema, "vscode://schemas/color-theme");
  assert.equal(theme.semanticHighlighting, true);
  assert.ok(Object.keys(theme.colors).length >= 500, `${theme.name} lacks modern workbench coverage`);

  for (const [key, color] of Object.entries(theme.colors)) {
    assert.ok(allowedColors.has(key), `${theme.name}: unknown VS Code ${registry.vscodeVersion} color: ${key}`);
    assert.ok(!deprecatedKeys.has(key), `${theme.name}: deprecated color key: ${key}`);
    assert.match(color, hexColor, `${theme.name}: invalid color ${color} for ${key}`);
  }

  for (const rule of theme.tokenColors) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    assert.ok(scopes.length > 0 && scopes.every(Boolean), `${theme.name}: empty TextMate scope`);
    if (rule.settings.foreground) assert.match(rule.settings.foreground, hexColor);
    if (rule.settings.background) assert.match(rule.settings.background, hexColor);
    if (rule.settings.fontStyle !== undefined) {
      for (const style of rule.settings.fontStyle.split(/\s+/).filter(Boolean)) {
        assert.ok(allowedFontStyles.has(style), `${theme.name}: invalid fontStyle ${style}`);
      }
    }
  }

  for (const [selector, style] of Object.entries(theme.semanticTokenColors)) {
    assert.match(selector, semanticSelector, `${theme.name}: invalid semantic selector ${selector}`);
    const foreground = typeof style === "string" ? style : style.foreground;
    if (foreground) assert.match(foreground, hexColor);
    validateSemanticStyle(theme.name, selector, style);
  }

  for (const required of ["class", "function", "parameter", "property", "variable.readonly", "*.deprecated"]) {
    assert.ok(required in theme.semanticTokenColors, `${theme.name}: missing semantic rule ${required}`);
  }
}

assert.deepEqual(Object.keys(themes[0]!.colors), Object.keys(themes[1]!.colors), "Light/dark color keys drifted");

const lightTheme = themes.find((theme) => theme.type === "light")!;
const darkTheme = themes.find((theme) => theme.type === "dark")!;
const lightTextMateExpectations: Record<string, string> = {
  Comments: "#999999",
  Strings: "#1794FAF0",
  Numbers: "#0025F5",
  "Built-in constants": "#DE5CFF",
  "User constants": "#AE81FF",
  Keywords: "#FF3333",
  Functions: "#1DA11D",
  Types: "#124CFA",
  Parameters: "#FD8B19"
};

for (const [name, expected] of Object.entries(lightTextMateExpectations)) {
  const rule = lightTheme.tokenColors.find((candidate) => candidate.name === name);
  assert.equal(rule?.settings.foreground?.toUpperCase(), expected, `Codefolk Light drifted from escook ${name}`);
}

const lightFunctionRule = lightTheme.tokenColors.find((candidate) => candidate.name === "Functions")!;
assert.deepEqual(lightFunctionRule.scope, "entity.name.function", "Codefolk Light must not over-color ordinary function calls");
const lightLibraryFunctionRule = lightTheme.tokenColors.find((candidate) => candidate.name === "Library functions")!;
assert.equal(lightLibraryFunctionRule.settings.foreground, "#FFCD03");

const lightSemanticExpectations: Record<string, string> = {
  keyword: "#FF3333",
  string: "#1794FA",
  number: "#0025F5",
  function: "#1DA11D",
  parameter: "#FD8B19",
  type: "#124CFA"
};

for (const [selector, expected] of Object.entries(lightSemanticExpectations)) {
  const style = lightTheme.semanticTokenColors[selector];
  const foreground = typeof style === "string" ? style : style?.foreground;
  assert.equal(foreground?.toUpperCase(), expected, `Codefolk Light semantic ${selector} drifted from escook`);
}

const escookWorkbenchExpectations: Record<string, string> = {
  "activityBar.activeBackground": "#4D366F",
  "activityBar.activeBorder": "#FFFFFF00",
  "activityBar.activeFocusBorder": "#FFFFFF00",
  "sideBarSectionHeader.background": "#F0F0F0",
  "sideBarSectionHeader.foreground": "#616161",
  "tab.activeBorder": "#FF9940",
  "tab.activeBorderTop": "#00000000",
  "tab.inactiveBackground": "#F0F0F0",
  "tab.inactiveForeground": "#777777",
  "gitDecoration.addedResourceForeground": "#587C0C",
  "gitDecoration.modifiedResourceForeground": "#895503",
  "gitDecoration.deletedResourceForeground": "#AD0707",
  "gitDecoration.renamedResourceForeground": "#007100",
  "gitDecoration.untrackedResourceForeground": "#007100",
  "gitDecoration.ignoredResourceForeground": "#8E8E90",
  "gitDecoration.conflictingResourceForeground": "#AD0707",
  "gitDecoration.stageModifiedResourceForeground": "#895503",
  "gitDecoration.stageDeletedResourceForeground": "#AD0707"
};

for (const [key, expected] of Object.entries(escookWorkbenchExpectations)) {
  assert.equal(lightTheme.colors[key]?.toUpperCase(), expected, `Codefolk Light workbench color drifted from escook: ${key}`);
}

const darkTextMateExpectations: Record<string, string> = {
  Comments: "#4CAE4C",
  "Line comments": "#5C7E8C",
  Strings: "#C3E88D",
  "Numbers and constants": "#F77669",
  Keywords: "#C792EA",
  Storage: "#C792EA",
  Operators: "#39ADB5",
  Punctuation: "#D9F5DD",
  Functions: "#89DDFF",
  "Types and classes": "#FFCB6B",
  "Type annotations": "#1290BF",
  Variables: "#FF5370",
  Parameters: "#FD8B19",
  Properties: "#FEDD6E",
  Tags: "#FF5370",
  Attributes: "#FFCB6B"
};

for (const [name, expected] of Object.entries(darkTextMateExpectations)) {
  const rule = darkTheme.tokenColors.find((candidate) => candidate.name === name);
  assert.equal(rule?.settings.foreground?.toUpperCase(), expected, `Codefolk Dark drifted from escook ${name}`);
}

const darkCommentRule = darkTheme.tokenColors.find((candidate) => candidate.name === "Comments")!;
assert.equal(darkCommentRule.settings.fontStyle, "", "Codefolk Dark comments should retain escook's upright style");

const darkSemanticExpectations: Record<string, string> = {
  class: "#FFCB6B",
  comment: "#4CAE4C",
  function: "#89DDFF",
  interface: "#1290BF",
  keyword: "#C792EA",
  number: "#F77669",
  operator: "#39ADB5",
  parameter: "#FD8B19",
  property: "#FEDD6E",
  string: "#C3E88D",
  type: "#1290BF",
  variable: "#FF5370"
};

for (const [selector, expected] of Object.entries(darkSemanticExpectations)) {
  const style = darkTheme.semanticTokenColors[selector];
  const foreground = typeof style === "string" ? style : style?.foreground;
  assert.equal(foreground?.toUpperCase(), expected, `Codefolk Dark semantic ${selector} drifted from escook`);
}

const darkWorkbenchExpectations: Record<string, string> = {
  "activityBar.activeBackground": "#8A4B08",
  "activityBar.activeBorder": "#00000000",
  "activityBar.foreground": "#CDD3DE",
  "activityBar.inactiveForeground": "#49494B",
  "activityBarBadge.background": "#77777B",
  "editor.background": "#252526",
  "editor.foreground": "#CDD3DE",
  "editor.selectionBackground": "#80CBC420",
  "input.border": "#77777B",
  "list.hoverBackground": "#EF820C33",
  "panel.border": "#202020",
  "panelTitle.activeBorder": "#CCCCCC",
  "statusBar.foreground": "#CCCCCC",
  "tab.activeBackground": "#29292C",
  "tab.activeBorder": "#EF820C",
  "tab.activeBorderTop": "#00000000",
  "tab.inactiveBackground": "#252526",
  "tab.inactiveForeground": "#888888",
  "textLink.foreground": "#FFCC00",
  "gitDecoration.addedResourceForeground": "#C3E88D",
  "gitDecoration.modifiedResourceForeground": "#FFCF1B",
  "gitDecoration.deletedResourceForeground": "#EC5F67",
  "gitDecoration.ignoredResourceForeground": "#546E7A",
  "gitDecoration.stageModifiedResourceForeground": "#FFCF1B",
  "gitDecoration.stageDeletedResourceForeground": "#EC5F67"
};

for (const [key, expected] of Object.entries(darkWorkbenchExpectations)) {
  assert.equal(darkTheme.colors[key]?.toUpperCase(), expected, `Codefolk Dark workbench color drifted from escook: ${key}`);
}

const contrastPairs = [
  ["editor.foreground", "editor.background"],
  ["foreground", "editor.background"],
  ["input.foreground", "input.background"],
  ["sideBar.foreground", "sideBar.background"],
  ["statusBar.foreground", "statusBar.background"],
  ["button.foreground", "button.background"],
  ["badge.foreground", "badge.background"]
] as const;

for (const theme of themes) {
  for (const [foregroundKey, backgroundKey] of contrastPairs) {
    const foreground = theme.colors[foregroundKey];
    const background = theme.colors[backgroundKey];
    assert.ok(foreground && background);
    const ratio = contrast(foreground, background);
    assert.ok(
      ratio >= 4.5,
      `${theme.name}: ${foregroundKey} on ${backgroundKey} is ${ratio.toFixed(2)}:1; expected >= 4.5:1`
    );
  }
}

console.log(
  `Validated ${themes.length} themes, ${Object.keys(themes[0]!.colors).length} workbench colors each, ` +
    `${registry.colors.length} pinned VS Code ${registry.vscodeVersion} color IDs, semantic tokens, and WCAG AA core pairs.`
);

function validateSemanticStyle(themeName: string, selector: string, style: SemanticStyle): void {
  if (typeof style === "string" || style.fontStyle === undefined) return;
  for (const item of style.fontStyle.split(/\s+/).filter(Boolean)) {
    assert.ok(allowedFontStyles.has(item), `${themeName}: invalid semantic fontStyle ${item} in ${selector}`);
  }
}

function contrast(foreground: string, background: string): number {
  const bg = rgba(background);
  const fg = composite(rgba(foreground), bg);
  const lighter = Math.max(luminance(fg), luminance(bg));
  const darker = Math.min(luminance(fg), luminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

function rgba(color: string): [number, number, number, number] {
  const value = color.slice(1);
  const expanded = value.length <= 4 ? [...value].map((character) => character.repeat(2)).join("") : value;
  const alpha = expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1;
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
    alpha
  ];
}

function composite(
  foreground: [number, number, number, number],
  background: [number, number, number, number]
): [number, number, number, number] {
  const alpha = foreground[3] + background[3] * (1 - foreground[3]);
  return [
    (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
    (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
    (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
    alpha
  ];
}

function luminance(color: [number, number, number, number]): number {
  const channels = color.slice(0, 3).map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
