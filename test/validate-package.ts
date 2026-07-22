import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const archive = resolve(root, "dist/codefolk-0.1.3.vsix");
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
  "extension/assets/codefolk-dark.png",
  "extension/assets/codefolk-light.png",
  "extension/assets/icon.png",
  "extension/package.json",
  "extension/themes/codefolk-dark-color-theme.json",
  "extension/themes/codefolk-light-color-theme.json"
].sort();

assert.deepEqual(
  files.map((file) => file.toLowerCase()).sort(),
  expected.map((file) => file.toLowerCase()).sort(),
  "VSIX contents do not match the release allowlist"
);

console.log(`Validated VSIX allowlist (${files.length} files).`);
