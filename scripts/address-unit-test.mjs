import assert from "node:assert/strict";
import {
  classify,
  cleanAddress,
  isValidCidr,
  isValidDomain,
  isValidIPv4,
  isValidIPv6,
  isValidPort,
  splitHostPort
} from "./lib/address.mjs";

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test("cleanAddress strips comments", () => {
  assert.equal(cleanAddress("1.1.1.1#tag"), "1.1.1.1");
  assert.equal(cleanAddress("  example.com:443 # comment "), "example.com:443");
});

test("isValidPort validates numeric range", () => {
  assert.equal(isValidPort("1"), true);
  assert.equal(isValidPort("443"), true);
  assert.equal(isValidPort("65535"), true);
  assert.equal(isValidPort("0"), false);
  assert.equal(isValidPort("65536"), false);
  assert.equal(isValidPort("abc"), false);
});

test("isValidIPv4 validates octets and leading zero policy", () => {
  assert.equal(isValidIPv4("1.1.1.1"), true);
  assert.equal(isValidIPv4("255.255.255.255"), true);
  assert.equal(isValidIPv4("256.1.1.1"), false);
  assert.equal(isValidIPv4("01.1.1.1"), false);
  assert.equal(isValidIPv4("1.1.1"), false);
});

test("isValidIPv6 validates bracket-compatible IPv6", () => {
  assert.equal(isValidIPv6("2606:4700:4700::1111"), true);
  assert.equal(isValidIPv6("::1"), true);
  assert.equal(isValidIPv6("gggg::1"), false);
  assert.equal(isValidIPv6("1.1.1.1"), false);
});

test("splitHostPort handles ipv4/domain/ipv6-bracket ports", () => {
  assert.deepEqual(splitHostPort("1.1.1.1:443"), { host: "1.1.1.1", port: "443" });
  assert.deepEqual(splitHostPort("example.com:8443"), { host: "example.com", port: "8443" });
  assert.deepEqual(splitHostPort("[2606:4700::1]:443"), { host: "2606:4700::1", port: "443" });
  assert.deepEqual(splitHostPort("2606:4700::1"), { host: "2606:4700::1", port: "" });
});

test("isValidCidr validates IPv4 and IPv6 prefixes", () => {
  assert.equal(isValidCidr("1.1.1.0/24"), true);
  assert.equal(isValidCidr("1.1.1.0/33"), false);
  assert.equal(isValidCidr("2606:4700::/32"), true);
  assert.equal(isValidCidr("2606:4700::/129"), false);
  assert.equal(isValidCidr("example.com/24"), false);
});

test("isValidDomain validates host and optional port", () => {
  assert.equal(isValidDomain("example.com"), true);
  assert.equal(isValidDomain("sub.example.com:443"), true);
  assert.equal(isValidDomain("localhost"), true);
  assert.equal(isValidDomain("bad host.com"), false);
  assert.equal(isValidDomain("example.com:65536"), false);
  assert.equal(isValidDomain("1.1.1.1"), false);
});

test("classify detects all output categories", () => {
  assert.equal(classify("https://example.com/sub"), "subscription");
  assert.equal(classify("1.1.1.1"), "ipv4");
  assert.equal(classify("1.1.1.1:443"), "ipv4-port");
  assert.equal(classify("2606:4700:4700::1111"), "ipv6");
  assert.equal(classify("1.1.1.0/24"), "cidr");
  assert.equal(classify("example.com"), "domain");
  assert.equal(classify("example.com:443"), "domain");
  assert.equal(classify("not valid address !"), "other");
});

test("classify ignores trailing tag for addresses", () => {
  assert.equal(classify("1.1.1.1#CF"), "ipv4");
  assert.equal(classify("1.1.1.1:443#CF"), "ipv4-port");
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
