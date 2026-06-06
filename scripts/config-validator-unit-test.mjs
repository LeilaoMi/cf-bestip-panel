import assert from "node:assert/strict";
import { formatConfigDryRun, validateConfig, validateConfigDetailed, validateSourceUrl } from "../assets/js/config-validator.js";

const checks = [];
function test(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error: error.message });
  }
}

test("valid config passes and normalizes extract", () => {
  const result = validateConfigDetailed([
    { groupName: "A", nodes: [{ ID: "one", url: "https://example.com/list.txt", extract: "yes" }] },
    { groupName: "B", nodes: [{ ID: "two", url: "local:sample", extract: false }] }
  ], { normalize: true });
  assert.equal(result.ok, true);
  assert.equal(result.summary.groups, 2);
  assert.equal(result.summary.nodes, 2);
  assert.equal(result.summary.remote, 1);
  assert.equal(result.summary.local, 1);
  assert.equal(result.config[0].nodes[0].extract, true);
  assert.equal(result.warnings.length, 1);
});

test("duplicate ID is rejected", () => {
  const err = validateConfig([
    { groupName: "A", nodes: [{ ID: "dup", url: "https://example.com/a" }] },
    { groupName: "B", nodes: [{ ID: "dup", url: "https://example.com/b" }] }
  ]);
  assert.match(err, /重复/);
});

test("private URL is rejected", () => {
  const result = validateSourceUrl("http://127.0.0.1/config");
  assert.equal(result.ok, false);
  assert.match(result.error, /内网|本地/);
});

test("unsupported protocol is rejected", () => {
  const result = validateSourceUrl("file:///tmp/a.txt");
  assert.equal(result.ok, false);
  assert.match(result.error, /http/);
});

test("local source is accepted", () => {
  const result = validateSourceUrl("local:cloudflare");
  assert.equal(result.ok, true);
  assert.equal(result.type, "local");
});

test("missing groupName and nodes are reported", () => {
  const result = validateConfigDetailed([{ nodes: "bad" }]);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("groupName")));
  assert.ok(result.errors.some(error => error.includes("nodes")));
});

test("formatConfigDryRun includes summary and warnings", () => {
  const result = validateConfigDetailed([
    { groupName: "A", nodes: [{ ID: "one", url: "local:sample", extract: 1 }] }
  ], { normalize: true });
  const text = formatConfigDryRun(result);
  assert.match(text, /分类：1/);
  assert.match(text, /线路：1/);
  assert.match(text, /警告/);
});

const failed = checks.filter(check => !check.ok);
console.log(JSON.stringify({ ok: failed.length === 0, total: checks.length, failed: failed.length, checks }, null, 2));
if (failed.length) process.exitCode = 1;