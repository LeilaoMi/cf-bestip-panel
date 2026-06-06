import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";

import { isAuthorized, validateConfig, validateSourceUrl } from "../functions/api/_config.js";
import { fetchTextWithLimit } from "../functions/api/_http.js";

function requestWithAuth(value = "") {
  return new Request("https://example.test/api", {
    headers: value ? { authorization: value } : {}
  });
}

function validConfig(overrides = {}) {
  return [{
    groupName: "测试分组",
    nodes: [{ ID: "node-1", url: "https://example.com/list.txt", ...overrides }]
  }];
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test("isAuthorized rejects missing token when ADMIN_TOKEN exists", () => {
  assert.equal(isAuthorized(requestWithAuth(), { ADMIN_TOKEN: "secret" }), false);
});

test("isAuthorized accepts Bearer token", () => {
  assert.equal(isAuthorized(requestWithAuth("Bearer secret"), { ADMIN_TOKEN: "secret" }), true);
});

test("isAuthorized rejects wrong Bearer token", () => {
  assert.equal(isAuthorized(requestWithAuth("Bearer wrong"), { ADMIN_TOKEN: "secret" }), false);
});

test("isAuthorized never accepts token when ADMIN_TOKEN is empty in Cloudflare-like env", () => {
  const old = globalThis.__saveConfigForLocalDev;
  try {
    delete globalThis.__saveConfigForLocalDev;
    assert.equal(isAuthorized(requestWithAuth("Bearer secret"), {}), false);
  } finally {
    if (old) globalThis.__saveConfigForLocalDev = old;
  }
});

test("validateSourceUrl allows https/http/local", () => {
  assert.equal(validateSourceUrl("https://example.com/a.txt"), true);
  assert.equal(validateSourceUrl("http://example.com/a.txt"), true);
  assert.equal(validateSourceUrl("local:demo"), true);
});

test("validateSourceUrl blocks private and unsafe schemes", () => {
  for (const url of [
    "ftp://example.com/a.txt",
    "file:///etc/passwd",
    "http://localhost/a.txt",
    "http://127.0.0.1/a.txt",
    "http://0.0.0.0/a.txt",
    "http://10.0.0.1/a.txt",
    "http://172.16.0.1/a.txt",
    "http://172.31.255.255/a.txt",
    "http://192.168.1.1/a.txt",
    "http://169.254.1.1/a.txt"
  ]) {
    assert.equal(validateSourceUrl(url), false, url);
  }
});

test("validateConfig accepts valid config and normalizes extract boolean", () => {
  const config = validConfig({ extract: 1 });
  assert.equal(validateConfig(config), "");
  assert.equal(config[0].nodes[0].extract, true);
});

test("validateConfig rejects malformed config", () => {
  assert.match(validateConfig({}), /配置必须是数组/);
  assert.match(validateConfig([{ groupName: "x" }]), /groupName 和 nodes/);
  assert.match(validateConfig([{ groupName: "x", nodes: [{}] }]), /ID 和 url/);
});

test("validateConfig rejects duplicate IDs", () => {
  const config = [{ groupName: "x", nodes: [
    { ID: "dup", url: "https://example.com/a" },
    { ID: "dup", url: "https://example.com/b" }
  ] }];
  assert.match(validateConfig(config), /重复/);
});

test("validateConfig rejects unsafe source URL", () => {
  assert.match(validateConfig(validConfig({ url: "http://127.0.0.1/a" })), /不安全|无效/);
});

test("fetchTextWithLimit returns small response body", async () => {
  const server = createServer((_, res) => res.end("hello"));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  try {
    const { res, text } = await fetchTextWithLimit(`http://127.0.0.1:${port}/`, {}, 10);
    assert.equal(res.ok, true);
    assert.equal(text, "hello");
  } finally {
    server.close();
  }
});

test("fetchTextWithLimit rejects oversized response body", async () => {
  const server = createServer((_, res) => res.end("0123456789abcdef"));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  try {
    await assert.rejects(
      () => fetchTextWithLimit(`http://127.0.0.1:${port}/`, {}, 8),
      /Response too large/
    );
  } finally {
    server.close();
  }
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
