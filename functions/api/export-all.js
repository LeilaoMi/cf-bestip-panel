import { getCache, setCache } from "./_cache.js";
import { loadConfig } from "./_config.js";
import { SAMPLE_DATA } from "./_data.js";
import { fetchTextWithLimit } from "./_http.js";

const FORMATS = new Set(["text", "json"]);
const MODES = new Set(["tagged", "base64", "ip-only", "ip-port", "csv"]);

function usefulLines(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("//") && !line.startsWith("/*"));
}

function tryDecodeBase64(text) {
  const clean = text.trim().replace(/\s+/g, "");
  if (!clean || text.includes("://") || clean.length < 80) return text;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(clean)) return text;
  try {
    const normalized = clean.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const decoded = new TextDecoder().decode(bytes);
    return decoded.includes("://") || decoded.includes("\n") ? decoded : text;
  } catch (_) {
    return text;
  }
}

function normalizeLine(line, groupName, nodeId) {
  if (line.includes("://") || line.includes("#")) return line;
  return `${line}#${groupName}_${nodeId}`;
}

function parseAddress(line) {
  const noTag = line.replace(/#.*$/, "").trim();
  if (noTag.includes("://")) return null;

  const ipv6Port = noTag.match(/^\[([^\]]+)\]:(\d{1,5})$/);
  if (ipv6Port) {
    const port = Number(ipv6Port[2]);
    if (port < 1 || port > 65535) return null;
    return {
      host: ipv6Port[1],
      port: String(port),
      tag: line.includes("#") ? line.split("#").slice(1).join("#") : ""
    };
  }

  const match = noTag.match(/^([^\s,#]+?)(?::(\d{1,5}))?$/);
  if (!match) return null;
  const port = Number(match[2] || 443);
  if (port < 1 || port > 65535) return null;
  return {
    host: match[1],
    port: String(port),
    tag: line.includes("#") ? line.split("#").slice(1).join("#") : ""
  };
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function transformLines(lines, mode) {
  if (mode === "tagged") return lines;
  if (mode === "base64") return [encodeBase64(lines.join("\n"))];
  const parsed = lines.map(parseAddress).filter(Boolean);
  if (mode === "ip-only") return parsed.map(item => item.host);
  if (mode === "ip-port") return parsed.map(item => `${item.host}:${item.port}`);
  if (mode === "csv") return ["host,port,tag", ...parsed.map(item => [item.host, item.port, item.tag].map(csvEscape).join(","))];
  return lines;
}

async function fetchNode(groupName, node) {
  let text = "";
  if (node.url?.startsWith("local:")) {
    text = SAMPLE_DATA[node.url.slice(6)] || "";
  } else {
    const { res, text: body } = await fetchTextWithLimit(node.url, {
      headers: { "user-agent": "cf-bestip-panel/1.0" },
      signal: AbortSignal.timeout(15000)
    }, 1024 * 1024);
    text = body;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  if (node.extract) text = tryDecodeBase64(text);
  return { groupName, id: node.ID, ok: true, lines: usefulLines(text).map(line => normalizeLine(line, groupName, node.ID)) };
}

async function buildExport(request, env, mode, dedupe, id = "", category = "") {
  const config = await loadConfig(request, env);
  const jobs = [];
  for (const group of config) {
    if (category && group.groupName !== category) continue;
    for (const node of group.nodes || []) {
      if (!id || node.ID === id) jobs.push({ groupName: group.groupName, node });
    }
  }
  if ((id || category) && jobs.length === 0) {
    return { summary: { sources: 0, ok: 0, failed: 1, lines: 0, mode, generatedAt: new Date().toISOString(), category }, lines: [], errors: [{ id, category, error: "Source not found" }] };
  }

  const results = [];
  const errors = [];
  let index = 0;
  async function worker() {
    while (index < jobs.length) {
      const job = jobs[index++];
      try {
        results.push(await fetchNode(job.groupName, job.node));
      } catch (error) {
        errors.push({ groupName: job.groupName, id: job.node.ID, error: error.message });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, jobs.length) }, worker));

  const seen = new Set();
  const lines = [];
  for (const result of results) {
    for (const line of result.lines) {
      const key = line.replace(/#.*$/, "");
      if (dedupe && seen.has(key)) continue;
      seen.add(key);
      lines.push(line);
    }
  }

  const transformed = transformLines(lines, mode);
  return { summary: { sources: jobs.length, ok: results.length, failed: errors.length, lines: transformed.length, mode, generatedAt: new Date().toISOString(), category }, lines: transformed, errors };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "text";
  const mode = url.searchParams.get("mode") || "tagged";
  if (!FORMATS.has(format)) return Response.json({ error: "Invalid format" }, { status: 400 });
  if (!MODES.has(mode)) return Response.json({ error: "Invalid mode" }, { status: 400 });

  const dedupe = url.searchParams.get("dedupe") !== "false";
  const id = url.searchParams.get("ID") || "";
  const category = url.searchParams.get("category") || "";
  const refresh = url.searchParams.get("refresh") === "1";
  const key = `export-all:${mode}:${dedupe}:${id}:${category}`;

  let data = !refresh ? getCache(key) : null;
  const cached = Boolean(data);
  if (!data) {
    data = await buildExport(request, env, mode, dedupe, id, category);
    setCache(key, data);
  }

  if (format === "json") return Response.json({ ...data, cached }, { headers: { "cache-control": "no-store" } });

  const includeHeader = mode !== "base64" && mode !== "csv";
  const header = includeHeader ? [
    "# cf-bestip-panel export",
    `# generated: ${data.summary.generatedAt}`,
    `# sources: ${data.summary.sources}, ok: ${data.summary.ok}, failed: ${data.summary.failed}, lines: ${data.summary.lines}, mode: ${mode}, cached: ${cached}`,
    ""
  ] : [];
  const body = [...header, ...data.lines].join("\n");
  const contentType = mode === "csv" ? "text/csv; charset=utf-8" : "text/plain; charset=utf-8";
  return new Response(body, { headers: { "content-type": contentType, "cache-control": "no-store" } });
}
