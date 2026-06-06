import assert from "node:assert/strict";
import {
  ARTIFACT_FILE_NAMES,
  allLines,
  buildArtifactContents,
  buildFull,
  buildHealth,
  buildManifest,
  buildReport,
  countByType,
  linesByTypes,
  proxyIpLines,
  summarizeResults
} from "./lib/build-output.mjs";

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const records = [
  { line: "1.1.1.1#A", type: "ipv4", groupName: "优选", sourceId: "cf" },
  { line: "1.1.1.1:443#A", type: "ipv4-port", groupName: "优选", sourceId: "cf" },
  { line: "2606:4700::1#B", type: "ipv6", groupName: "IPv6", sourceId: "cf" },
  { line: "example.com#C", type: "domain", groupName: "域名", sourceId: "cf" },
  { line: "1.1.1.0/24#D", type: "cidr", groupName: "CIDR", sourceId: "cf" },
  { line: "proxy.example.com#P", type: "domain", groupName: "ProxyIP", sourceId: "proxy" }
];
const jobs = [{}, {}, {}];
const results = [
  { groupName: "A", id: "one", ok: true, count: 2, lines: ["x", "y"], ms: 1 },
  { groupName: "B", id: "two", ok: false, count: 0, lines: [], ms: 2, error: "HTTP 500" },
  { groupName: "C", id: "three", ok: true, count: 4, lines: ["a", "b", "c", "d"], ms: 3 }
];

test("ARTIFACT_FILE_NAMES contains expected files", () => {
  assert.deepEqual(ARTIFACT_FILE_NAMES, ["all.txt", "ipv4.txt", "ipv6.txt", "domain.txt", "proxyip.txt", "cidr.txt", "full.json", "health.json", "report.md"]);
});

test("line helpers filter records with trailing newline", () => {
  assert.equal(allLines(records).split("\n").length, records.length + 1);
  assert.equal(linesByTypes(records, ["ipv4", "ipv4-port"]), "1.1.1.1#A\n1.1.1.1:443#A\n");
  assert.equal(proxyIpLines(records), "proxy.example.com#P\n");
});

test("summarizeResults counts source and record stats", () => {
  assert.deepEqual(summarizeResults(jobs, results, records), { sources: 3, ok: 2, failed: 1, rawLines: 6, deduped: 6 });
});

test("buildHealth removes heavy lines arrays from sources", () => {
  const health = buildHealth({ generatedAt: "2026-01-01T00:00:00.000Z", durationMs: 123, jobs, results, records });
  assert.equal(health.summary.failed, 1);
  assert.equal(health.sources[0].lines, undefined);
  assert.equal(health.sources[1].error, "HTTP 500");
});

test("buildFull and buildManifest produce stable structures", () => {
  const summary = summarizeResults(jobs, results, records);
  const full = buildFull({ generatedAt: "t", summary, records });
  assert.equal(full.records.length, records.length);
  const manifest = buildManifest({ generatedAt: "m", health: { ok: true }, files: ["a.txt"] });
  assert.deepEqual(manifest.files, [{ name: "a.txt" }]);
});

test("countByType and buildReport include failures and categories", () => {
  assert.deepEqual(countByType(records), { ipv4: 1, "ipv4-port": 1, ipv6: 1, domain: 2, cidr: 1 });
  const health = buildHealth({ generatedAt: "t", durationMs: 1, jobs, results, records });
  const report = buildReport(health, records);
  assert.match(report, /BestIP 数据构建报告/);
  assert.match(report, /HTTP 500/);
  assert.match(report, /domain: 2/);
});

test("buildArtifactContents creates every artifact", () => {
  const health = buildHealth({ generatedAt: "t", durationMs: 1, jobs, results, records });
  const full = buildFull({ generatedAt: "t", summary: health.summary, records });
  const report = buildReport(health, records);
  const artifacts = buildArtifactContents({ health, full, report, records });
  assert.deepEqual([...artifacts.keys()], ARTIFACT_FILE_NAMES);
  assert.match(artifacts.get("full.json"), /"records"/);
  assert.match(artifacts.get("health.json"), /"summary"/);
  assert.match(artifacts.get("report.md"), /分类统计/);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(error);
  }
}
console.log(JSON.stringify({ ok: failed === 0, total: tests.length, failed }, null, 2));
if (failed) process.exitCode = 1;
