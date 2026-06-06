import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const requiredScripts = ["check", "unit", "test", "ui-smoke", "build:dataset", "predeploy"];
const unitScripts = ["unit", "address-unit", "build-output-unit", "source-fetch-unit", "config-validator-unit", "config-diff-unit"];
const requiredArtifacts = ["all.txt", "ipv4.txt", "ipv6.txt", "domain.txt", "proxyip.txt", "cidr.txt", "full.json", "health.json", "report.md", "manifest.json"];
const requiredModules = [
  "assets/js/constants.js",
  "assets/js/dom.js",
  "assets/js/api-client.js",
  "assets/js/download.js",
  "assets/js/config-validator.js",
  "assets/js/config-diff.js",
  "scripts/lib/address.mjs",
  "scripts/lib/build-output.mjs",
  "scripts/lib/source-fetch.mjs"
];
const requiredDocs = [
  "docs/DEPLOY.md",
  "docs/OPERATIONS.md",
  "docs/TESTING.md",
  "docs/ARTIFACTS.md",
  "docs/RELEASE_NOTES.md",
  "docs/FINAL_HANDOFF.md"
];

const requiredUnitFiles = [
  "scripts/unit-test.mjs",
  "scripts/address-unit-test.mjs",
  "scripts/build-output-unit-test.mjs",
  "scripts/source-fetch-unit-test.mjs",
  "scripts/ui-smoke-test.mjs",
  "scripts/config-validator-unit-test.mjs",
  "scripts/config-diff-unit-test.mjs"
];

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

async function fileSize(path) {
  try {
    return (await stat(join(root, path))).size;
  } catch {
    return 0;
  }
}

function status(ok) {
  return ok ? "PASS" : "FAIL";
}

const checks = [];
function add(name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
}

const pkg = await readJson("package.json");
for (const name of requiredScripts) add(`package script: ${name}`, Boolean(pkg.scripts?.[name]));
for (const name of unitScripts) add(`unit script: ${name}`, Boolean(pkg.scripts?.[name]));

for (const file of requiredModules) add(`module exists: ${file}`, existsSync(join(root, file)));
for (const file of requiredUnitFiles) add(`unit file exists: ${file}`, existsSync(join(root, file)));
for (const file of requiredDocs) add(`doc exists: ${file}`, existsSync(join(root, file)));

const manifestPath = "artifacts/latest/manifest.json";
const publicManifestPath = "public/artifacts/latest/manifest.json";
let manifest;
let publicManifest;
try {
  manifest = await readJson(manifestPath);
  add("artifacts manifest valid", manifest?.ok === true);
} catch (error) {
  add("artifacts manifest valid", false, error.message);
}
try {
  publicManifest = await readJson(publicManifestPath);
  add("public artifacts manifest valid", publicManifest?.ok === true);
} catch (error) {
  add("public artifacts manifest valid", false, error.message);
}

for (const name of requiredArtifacts) {
  const artifact = `artifacts/latest/${name}`;
  const pub = `public/artifacts/latest/${name}`;
  add(`artifact non-empty: ${name}`, await fileSize(artifact) > 0);
  add(`public artifact non-empty: ${name}`, await fileSize(pub) > 0);
}

if (manifest?.files) {
  const listed = new Set(manifest.files.map(file => file.name));
  for (const name of requiredArtifacts.filter(name => name !== "manifest.json")) add(`manifest lists: ${name}`, listed.has(name));
}

if (publicManifest?.files && manifest?.files) {
  add("manifest file count matches public", publicManifest.files.length === manifest.files.length, `${manifest.files.length}/${publicManifest.files.length}`);
}

let health;
try {
  health = await readJson("artifacts/latest/health.json");
  add("health summary exists", Boolean(health.summary));
  add("health sources count positive", Number(health.summary?.sources || 0) > 0, String(health.summary?.sources || 0));
  add("health ok count positive", Number(health.summary?.ok || 0) > 0, String(health.summary?.ok || 0));
  add("health deduped count positive", Number(health.summary?.deduped || 0) > 0, String(health.summary?.deduped || 0));
} catch (error) {
  add("health json valid", false, error.message);
}

const workflow = await readFile(join(root, ".github/workflows/build-dataset.yml"), "utf8").catch(() => "");
for (const cmd of ["npm run check", "npm run unit", "npm run build:dataset", "npm test"]) {
  add(`workflow includes: ${cmd}`, workflow.includes(cmd));
}

const headers = await readFile(join(root, "_headers"), "utf8").catch(() => "");
add("headers protect api cache", headers.includes("/api/*") && headers.includes("Cache-Control: no-store"));
add("headers include security headers", ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy"].every(name => headers.includes(name)));

const passed = checks.filter(check => check.ok).length;
const failed = checks.length - passed;
const report = {
  ok: failed === 0,
  generatedAt: new Date().toISOString(),
  summary: { total: checks.length, passed, failed },
  package: {
    name: pkg.name,
    version: pkg.version,
    scripts: requiredScripts.reduce((acc, name) => ({ ...acc, [name]: pkg.scripts?.[name] || null }), {})
  },
  health: health?.summary || null,
  checks
};

console.log("# cf-bestip-panel test report");
console.log(`generatedAt: ${report.generatedAt}`);
console.log(`summary: ${passed}/${checks.length} passed, ${failed} failed`);
if (report.health) console.log(`artifacts: sources=${report.health.sources}, ok=${report.health.ok}, deduped=${report.health.deduped}`);
console.log("");
for (const check of checks) console.log(`${status(check.ok)} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
console.log("");
console.log(JSON.stringify(report, null, 2));

if (failed) process.exitCode = 1;
