const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[0-9a-fA-F:]+$/;
const DOMAIN_RE = /^(?!\d+\.\d+\.\d+\.\d+$)(?=.{1,253}(?::\d{1,5})?$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?::\d{1,5})?$/;

export function cleanAddress(line) {
  return String(line || "").replace(/#.*$/, "").trim();
}

export function isValidPort(port) {
  const n = Number(port);
  return Number.isInteger(n) && n >= 1 && n <= 65535;
}

export function isValidIPv4(ip) {
  if (!IPV4_RE.test(ip)) return false;
  return ip.split(".").every(part => {
    const n = Number(part);
    return String(n) === part && n >= 0 && n <= 255;
  });
}

export function isValidIPv6(ip) {
  if (!ip.includes(":") || !IPV6_RE.test(ip)) return false;
  try { return new URL(`http://[${ip}]`).hostname.length > 0; } catch { return false; }
}

export function splitHostPort(address) {
  const text = String(address || "").trim();
  const ipv6Port = text.match(/^\[([^\]]+)\]:(\d{1,5})$/);
  if (ipv6Port) return { host: ipv6Port[1], port: ipv6Port[2] };
  const m = text.match(/^([^\s,#:]+):(\d{1,5})$/);
  if (m) return { host: m[1], port: m[2] };
  return { host: text, port: "" };
}

export function isValidCidr(address) {
  const m = String(address || "").trim().match(/^(.+)\/(\d{1,3})$/);
  if (!m) return false;
  const host = m[1];
  const prefix = Number(m[2]);
  if (isValidIPv4(host)) return prefix >= 0 && prefix <= 32;
  if (isValidIPv6(host)) return prefix >= 0 && prefix <= 128;
  return false;
}

export function isValidDomain(address) {
  const text = String(address || "").trim();
  const { host, port } = splitHostPort(text);
  if (port && !isValidPort(port)) return false;
  if (!DOMAIN_RE.test(text)) return false;
  return host.includes(".") || /^[a-zA-Z0-9-]+$/.test(host);
}

export function classify(line) {
  const text = String(line || "").trim();
  const address = cleanAddress(text);
  if (text.includes("://")) return "subscription";
  if (isValidCidr(address)) return "cidr";
  const { host, port } = splitHostPort(address);
  if (port) {
    if (!isValidPort(port)) return "other";
    if (isValidIPv4(host)) return "ipv4-port";
    if (isValidDomain(address)) return "domain";
    return "other";
  }
  if (isValidIPv4(address)) return "ipv4";
  if (isValidIPv6(address)) return "ipv6";
  if (isValidDomain(address)) return "domain";
  return "other";
}
