import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const archive = resolve(root, "dist", `codefolk-${manifest.version}.vsix`);
const vsce = process.platform === "win32" ? "vsce.cmd" : "vsce";

mkdirSync(resolve(root, "dist"), { recursive: true });
execFileSync(vsce, ["package", "--no-dependencies", "--out", archive], {
  cwd: root,
  stdio: "inherit"
});
