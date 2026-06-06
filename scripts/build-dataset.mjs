import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { classify, cleanAddress } from "./lib/address.mjs";
import { buildArtifactContents, buildFull, buildHealth, buildManifest, buildReport } from "./lib/build-output.mjs";
import { fetchSource } from "./lib/source-fetch.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(root, "artifacts/latest");
const config = JSON.parse(await readFile(join(root, "config.json"), "utf8"));

const startedAt = new Date();
const jobs = [];
for (const group of config) for (const node of group.nodes || []) jobs.push({ groupName: group.groupName, node });

const results = [];
let index = 0;
const concurrency = Number(process.env.BUILD_CONCURRENCY || 8);
async function worker() {
  while (index < jobs.length) {
    const job = jobs[index++];
    results.push(await fetchSource(job.groupName, job.node));
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
results.sort((a, b) => a.groupName.localeCompare(b.groupName, "zh-CN") || a.id.localeCompare(b.id, "zh-CN"));

const seen = new Set();
const records = [];
for (const result of results) {
  for (const line of result.lines) {
    const address = cleanAddress(line);
    if (!address || seen.has(address)) continue;
    seen.add(address);
    records.push({
      line,
      address,
      type: classify(line),
      groupName: result.groupName,
      sourceId: result.id,
      sourceUrl: result.url
    });
  }
}

const generatedAt = new Date().toISOString();
const health = buildHealth({
  generatedAt,
  durationMs: Date.now() - startedAt.getTime(),
  jobs,
  results,
  records
});

const full = buildFull({ generatedAt: health.generatedAt, summary: health.summary, records });
const report = buildReport(health, records);
const manifest = buildManifest({ generatedAt: new Date().toISOString(), health });
const artifactContents = buildArtifactContents({ health, full, report, records });

await mkdir(outDir, { recursive: true });
for (const [name, content] of artifactContents) {
  await writeFile(join(outDir, name), content);
}
await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const publicOutDir = join(root, "public/artifacts/latest");
await mkdir(publicOutDir, { recursive: true });
for (const name of manifest.files.map(file => file.name).concat("manifest.json")) {
  await writeFile(join(publicOutDir, name), await readFile(join(outDir, name)));
}

console.log(JSON.stringify({ ok: true, outDir, publicOutDir, summary: health.summary }));
if (!existsSync(join(outDir, "all.txt"))) process.exitCode = 1;
