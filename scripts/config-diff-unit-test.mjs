import assert from "node:assert/strict";
import { formatConfigChangeSummary, hasConfigChanges, summarizeConfigChanges } from "../assets/js/config-diff.js";

const checks = [];
function test(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error: error.message });
  }
}

const before = [
  { groupName: "A", nodes: [
    { ID: "same", url: "https://example.com/same.txt", extract: false },
    { ID: "url-change", url: "https://example.com/old.txt", extract: false },
    { ID: "extract-change", url: "https://example.com/extract.txt", extract: false },
    { ID: "removed", url: "https://example.com/removed.txt", extract: false }
  ] },
  { groupName: "RemovedGroup", nodes: [
    { ID: "gone", url: "https://example.com/gone.txt", extract: false }
  ] }
];

const after = [
  { groupName: "A", nodes: [
    { ID: "same", url: "https://example.com/same.txt", extract: false },
    { ID: "url-change", url: "https://example.com/new.txt", extract: false },
    { ID: "extract-change", url: "https://example.com/extract.txt", extract: true },
    { ID: "added", url: "https://example.com/added.txt", extract: false }
  ] },
  { groupName: "AddedGroup", nodes: [
    { ID: "new", url: "https://example.com/new-group.txt", extract: true }
  ] }
];

test("summarize config changes counts all change types", () => {
  const summary = summarizeConfigChanges(before, after);
  assert.deepEqual(summary.addedGroups, ["AddedGroup"]);
  assert.deepEqual(summary.removedGroups, ["RemovedGroup"]);
  assert.ok(summary.addedNodes.includes("A/added"));
  assert.ok(summary.addedNodes.includes("AddedGroup/new"));
  assert.ok(summary.removedNodes.includes("A/removed"));
  assert.ok(summary.removedNodes.includes("RemovedGroup/gone"));
  assert.deepEqual(summary.changedUrls, ["A/url-change"]);
  assert.deepEqual(summary.changedExtract, ["A/extract-change"]);
  assert.equal(summary.unchangedNodes, 1);
  assert.equal(summary.totalChanges, 8);
});

test("hasConfigChanges detects non-empty changes", () => {
  assert.equal(hasConfigChanges(summarizeConfigChanges(before, after)), true);
});

test("hasConfigChanges rejects unchanged config", () => {
  const summary = summarizeConfigChanges(before, JSON.parse(JSON.stringify(before)));
  assert.equal(summary.totalChanges, 0);
  assert.equal(hasConfigChanges(summary), false);
});

test("format summary includes counts and details", () => {
  const text = formatConfigChangeSummary(summarizeConfigChanges(before, after));
  assert.match(text, /总变更：8/);
  assert.match(text, /新增分类：1/);
  assert.match(text, /删除线路：2/);
  assert.match(text, /URL 变更：1/);
  assert.match(text, /详情/);
});

test("empty or invalid input is safe", () => {
  const summary = summarizeConfigChanges(null, [{ groupName: "A", nodes: [] }]);
  assert.equal(summary.addedGroups.length, 1);
  assert.equal(summary.totalChanges, 1);
});

const failed = checks.filter(check => !check.ok);
console.log(JSON.stringify({ ok: failed.length === 0, total: checks.length, failed: failed.length, checks }, null, 2));
if (failed.length) process.exitCode = 1;