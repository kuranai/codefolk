import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { version: string };
const archive = resolve(root, `dist/codefolk-${manifest.version}.vsix`);
const files = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" })
  .trim()
  .split("\n")
  .sort();

const expected = [
  "[Content_Types].xml",
  "extension.vsixmanifest",
  "extension/CHANGELOG.md",
  "extension/LICENSE.txt",
  "extension/README.md",
  "extension/THIRD_PARTY_NOTICES.md",
  "extension/assets/codefolk.png",
  "extension/assets/icon.png",
  "extension/package.json",
  "extension/themes/codefolk-color-theme.json"
].sort();

assert.deepEqual(
  files.map((file) => file.toLowerCase()).sort(),
  expected.map((file) => file.toLowerCase()).sort(),
  "VSIX contents do not match the release allowlist"
);

console.log(`Validated VSIX allowlist (${files.length} files).`);
