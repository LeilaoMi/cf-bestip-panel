import assert from "node:assert/strict";
import {
  fetchSource,
  fetchTextWithLimit,
  normalize,
  tryDecodeBase64,
  usefulLines
} from "./lib/source-fetch.mjs";

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test("usefulLines trims blank and comment lines", () => {
  assert.deepEqual(usefulLines(" 1.1.1.1 \n\n// skip\n/* block */\nexample.com "), ["1.1.1.1", "example.com"]);
});

test("tryDecodeBase64 decodes subscription-like or multiline content", () => {
  const encoded = Buffer.from("1.1.1.1\nexample.com", "utf8").toString("base64");
  assert.equal(tryDecodeBase64(encoded), "1.1.1.1\nexample.com");
  const sub = Buffer.from("https://example.com/sub", "utf8").toString("base64");
  assert.equal(tryDecodeBase64(sub), "https://example.com/sub");
  assert.equal(tryDecodeBase64("plain"), "plain");
});

test("normalize preserves subscriptions and existing tags", () => {
  assert.equal(normalize("https://example.com/sub", "G", "S"), "https://example.com/sub");
  assert.equal(normalize("1.1.1.1#old", "G", "S"), "1.1.1.1#old");
  assert.equal(normalize("1.1.1.1", "G", "S"), "1.1.1.1#G_S");
});

test("fetchTextWithLimit supports injected fetch and small response", async () => {
  const res = new Response("hello");
  const result = await fetchTextWithLimit("https://example.test", {}, 10, async () => res);
  assert.equal(result.text, "hello");
  assert.equal(result.res.ok, true);
});

test("fetchTextWithLimit rejects oversized response", async () => {
  await assert.rejects(
    () => fetchTextWithLimit("https://example.test", {}, 3, async () => new Response("hello")),
    /Response too large/
  );
});

test("fetchSource handles local source", async () => {
  const result = await fetchSource("G", { ID: "local", url: "local:test" });
  assert.equal(result.ok, true);
  assert.equal(result.count, 0);
  assert.deepEqual(result.lines, []);
});

test("fetchSource fetches, filters, normalizes and counts lines", async () => {
  const result = await fetchSource("Group", { ID: "node", url: "https://example.test/list" }, {
    fetchText: async (url, options, maxBytes) => {
      assert.equal(url, "https://example.test/list");
      assert.equal(options.headers["user-agent"], "cf-bestip-panel-build/1.0");
      assert.equal(maxBytes, 123);
      return { res: { ok: true, status: 200 }, text: "1.1.1.1\n//skip\nexample.com#tag\n" };
    },
    maxBytes: 123
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.lines, ["1.1.1.1#Group_node", "example.com#tag"]);
  assert.equal(result.count, 2);
});

test("fetchSource decodes extracted base64 content", async () => {
  const encoded = Buffer.from("1.1.1.1\n2.2.2.2", "utf8").toString("base64");
  const result = await fetchSource("G", { ID: "b64", url: "https://example.test/b64", extract: true }, {
    fetchText: async () => ({ res: { ok: true, status: 200 }, text: encoded })
  });
  assert.deepEqual(result.lines, ["1.1.1.1#G_b64", "2.2.2.2#G_b64"]);
});

test("fetchSource reports HTTP and fetch errors", async () => {
  const http = await fetchSource("G", { ID: "bad", url: "https://example.test/bad" }, {
    fetchText: async () => ({ res: { ok: false, status: 500 }, text: "" })
  });
  assert.equal(http.ok, false);
  assert.match(http.error, /HTTP 500/);

  const thrown = await fetchSource("G", { ID: "err", url: "https://example.test/err" }, {
    fetchText: async () => { throw new Error("network"); }
  });
  assert.equal(thrown.ok, false);
  assert.match(thrown.error, /network/);
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
