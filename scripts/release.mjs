import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as readline from "node:readline/promises";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packagePath = resolve(root, "package.json");
const changelogPath = resolve(root, "CHANGELOG.md");
const readmePath = resolve(root, "README.md");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function usage() {
  console.log(`Usage: npm run release -- [version|patch|minor|major] [options]

Options:
  --notes <text>  Add a changelog bullet; may be repeated
  --push          Commit, tag, and push the release from main
  --help          Show this help

Examples:
  npm run release -- 0.1.4
  npm run release -- 0.1.4 --notes "Improve library-function highlighting"
  npm run release -- 0.1.4 --push`);
}

function fail(message) {
  console.error(`Release aborted: ${message}`);
  process.exit(1);
}

function run(command, args) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

function capture(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
}

function isStableVersion(value) {
  return /^\d+\.\d+\.\d+$/.test(value);
}

function bumpVersion(version, part) {
  if (!isStableVersion(version)) fail(`current package version is not stable semver: ${version}`);
  const [major, minor, patch] = version.split(".").map(Number);
  if (part === "major") return `${major + 1}.0.0`;
  if (part === "minor") return `${major}.${minor + 1}.0`;
  if (part === "patch") return `${major}.${minor}.${patch + 1}`;
  fail(`unknown version or bump type: ${part}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function changelogEntry(version, date, existingBody, notes) {
  const body = existingBody.trim() || [
    "### Changed",
    "",
    notes.map((note) => note.startsWith("-") ? note : `- ${note}`).join("\n")
  ].join("\n");
  return `## [${version}] - ${date}\n\n${body}`;
}

function updateChangelog(content, version, date, notes) {
  const versionPattern = new RegExp(`^## \\[${escapeRegExp(version)}\\]`, "m");
  if (versionPattern.test(content)) fail(`CHANGELOG.md already contains version ${version}`);

  const unreleased = /^## \[Unreleased\]\s*$/m.exec(content);
  if (!unreleased || unreleased.index === undefined) fail("CHANGELOG.md has no [Unreleased] section");

  const bodyStart = unreleased.index + unreleased[0].length;
  const nextHeading = content.indexOf("\n## [", bodyStart);
  const bodyEnd = nextHeading === -1 ? content.length : nextHeading;
  const existingBody = content.slice(bodyStart, bodyEnd).trim();
  const before = content.slice(0, bodyStart).trimEnd();
  const after = nextHeading === -1 ? "" : content.slice(nextHeading + 1).trimStart();
  const entry = changelogEntry(version, date, existingBody, notes);

  return `${before}\n\n${entry}\n\n${after}`.trimEnd() + "\n";
}

function releaseNotes(explicitNotes) {
  if (explicitNotes.length > 0) return explicitNotes;

  let previousTag = "";
  try {
    previousTag = capture("git", ["describe", "--tags", "--abbrev=0"]);
  } catch {
    // A repository without a previous tag can still use recent commit subjects.
  }

  const range = previousTag ? `${previousTag}..HEAD` : "-10";
  const subjects = capture("git", ["log", "--format=%s", range])
    .split("\n")
    .map((subject) => subject.trim())
    .filter(Boolean)
    .filter((subject) => !/^Release Codefolk\b/.test(subject));

  if (subjects.length === 0) {
    fail("no release notes found; pass one or more --notes options");
  }
  return subjects;
}

const args = process.argv.slice(2);
let requestedVersion;
let shouldPush = false;
const explicitNotes = [];

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];
  if (argument === "--help") {
    usage();
    process.exit(0);
  }
  if (argument === "--push") {
    shouldPush = true;
    continue;
  }
  if (argument === "--notes") {
    const note = args[index + 1];
    if (!note || note.startsWith("--")) fail("--notes requires text");
    explicitNotes.push(note);
    index += 1;
    continue;
  }
  if (argument.startsWith("--notes=")) {
    explicitNotes.push(argument.slice("--notes="));
    continue;
  }
  if (argument.startsWith("-")) fail(`unknown option: ${argument}`);
  if (requestedVersion) fail("only one version or bump type may be supplied");
  requestedVersion = argument;
}

const manifest = JSON.parse(readFileSync(packagePath, "utf8"));
const version = requestedVersion
  ? isStableVersion(requestedVersion) ? requestedVersion : bumpVersion(manifest.version, requestedVersion)
  : bumpVersion(manifest.version, "patch");
const tag = `v${version}`;

if (capture("git", ["status", "--porcelain"])) {
  fail("working tree is not clean; commit or stash existing changes first");
}
if (capture("git", ["tag", "--list", tag])) fail(`tag ${tag} already exists`);
if (shouldPush && capture("git", ["branch", "--show-current"]) !== "main") {
  fail("--push is only allowed from the main branch");
}

const notes = releaseNotes(explicitNotes);
const date = new Date().toLocaleDateString("sv-SE");
const changelog = readFileSync(changelogPath, "utf8");

run(npm, ["version", version, "--no-git-tag-version"]);
writeFileSync(changelogPath, updateChangelog(changelog, version, date, notes));

const readme = readFileSync(readmePath, "utf8");
const installCommand = /code --install-extension dist\/codefolk-[^`\s]+\.vsix/;
if (!installCommand.test(readme)) fail("could not find the VSIX install command in README.md");
writeFileSync(
  readmePath,
  readme.replace(installCommand, `code --install-extension dist/codefolk-${version}.vsix`)
);

run(npm, ["run", "generate"]);
run(npm, ["test"]);
run(npm, ["run", "package"]);

console.log(`\nPrepared Codefolk ${version}.`);
console.log(`VSIX: dist/codefolk-${version}.vsix`);

if (!shouldPush) {
  console.log("No commit or tag was created. Review the changes, then commit and tag when ready.");
  process.exit(0);
}

const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = await prompt.question(`Push main and ${tag}, which will trigger the Marketplace release? Type "release" to continue: `);
prompt.close();
if (answer.trim().toLowerCase() !== "release") {
  console.log("Push cancelled. Prepared files were left in the working tree.");
  process.exit(0);
}

run("git", ["add", "package.json", "package-lock.json", "README.md", "CHANGELOG.md", "themes"]);
run("git", ["diff", "--cached", "--check"]);
run("git", ["commit", "-m", `Release Codefolk ${version}`]);
run("git", ["tag", "-a", tag, "-m", `Release Codefolk ${version}`]);
run("git", ["push", "origin", "main"]);
run("git", ["push", "origin", tag]);

console.log(`\nRelease ${version} pushed. Approve the marketplace environment in GitHub Actions.`);
