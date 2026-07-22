import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { dark, light } from "./palettes.js";
import { createTheme } from "./theme.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputs = [
  ["themes/codefolk-light-color-theme.json", createTheme(light)],
  ["themes/codefolk-dark-color-theme.json", createTheme(dark)]
] as const;
const check = process.argv.includes("--check");

let failed = false;
for (const [relativePath, theme] of outputs) {
  const path = resolve(root, relativePath);
  const generated = `${JSON.stringify(theme, null, 2)}\n`;
  if (check) {
    const current = await readFile(path, "utf8").catch(() => "");
    if (current !== generated) {
      console.error(`${relativePath} is not up to date. Run npm run generate.`);
      failed = true;
    }
  } else {
    await writeFile(path, generated);
    console.log(`Generated ${relativePath}`);
  }
}

if (failed) process.exitCode = 1;
