import { spawn } from "node:child_process";

const port = Number(process.env.TEST_PORT || 8800 + Math.floor(Math.random() * 1000));
const base = `http://127.0.0.1:${port}`;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(path, timeout = 60000, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(base + path, { ...options, signal: controller.signal });
    const text = await res.text();
    return { res, text };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(path, timeout = 60000, options = {}) {
  const { res, text } = await fetchWithTimeout(path, timeout, options);
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

async function fetchText(path, timeout = 60000, options = {}) {
  const { res, text } = await fetchWithTimeout(path, timeout, options);
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}: ${text.slice(0, 200)}`);
  return text;
}

const server = spawn(process.execPath, ["local-server.js"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", ADMIN_TOKEN: "self-test-token" },
  stdio: ["ignore", "pipe", "pipe"]
});

let logs = "";
server.stdout.on("data", chunk => { logs += chunk.toString(); });
server.stderr.on("data", chunk => { logs += chunk.toString(); });

try {
  await wait(1200);

  const index = await fetchText("/", 15000);
  if (!index.includes("优选 IP 管理台")) throw new Error("/ did not return app shell");

  const config = await fetchJson("/api/config", 15000);
  if (!Array.isArray(config) || config.length < 1) throw new Error("/api/config returned empty config");

  const health = await fetchJson("/api/source-health", 60000);
  if (!health.summary || health.summary.total < 1) throw new Error("/api/source-health missing summary");

  const exportData = await fetchJson("/api/export-all?format=json&mode=ip-port", 60000);
  if (!exportData.summary || exportData.summary.lines < 1) throw new Error("/api/export-all returned no lines");

  const singleExport = await fetchJson("/api/export-all?format=json&mode=ip-port&ID=%E7%A7%BB%E5%8A%A8&refresh=1", 60000);
  if (singleExport.summary?.sources !== 1 || singleExport.summary.ok !== 1 || singleExport.summary.lines < 1) {
    throw new Error("/api/export-all single-source export failed");
  }

  const categoryExport = await fetchJson("/api/export-all?format=json&mode=ip-port&category=CM%E4%BC%98%E9%80%89&refresh=1", 60000);
  if (categoryExport.summary?.sources < 1 || categoryExport.summary.ok < 1 || categoryExport.summary.lines < 1 || categoryExport.summary.category !== "CM优选") {
    throw new Error("/api/export-all category export failed");
  }

  const edge = await fetchText("/api/edge_ips?regions=US,JP&limit=2", 20000);
  if (!edge.trim()) throw new Error("/api/edge_ips returned empty text");

  const parsedSource = await fetchJson("/api/source-parse?ID=%E7%A7%BB%E5%8A%A8", 20000);
  if (!parsedSource.ok || parsedSource.parsedLines < 1 || !parsedSource.lines?.length) throw new Error("/api/source-parse returned no parsed lines");

  const rawUnauthorized = await fetchWithTimeout("/api/source-raw?ID=%E7%A7%BB%E5%8A%A8", 20000);
  if (rawUnauthorized.res.status !== 401) throw new Error("/api/source-raw should require authorization");

  const buildDisabled = await fetchWithTimeout("/api/build-dataset", 20000);
  if (buildDisabled.res.status !== 403) throw new Error("/api/build-dataset should be disabled in Cloudflare mode");

  const artifacts = await fetchJson("/api/artifacts", 15000);
  if (!artifacts.ok || !artifacts.files?.some(file => file.name === "all.txt")) {
    throw new Error("/api/artifacts missing all.txt; run npm run build:dataset first");
  }

  const manifest = await fetchJson("/artifacts/latest/manifest.json", 15000);
  if (!manifest.ok || !manifest.files?.length) throw new Error("static manifest missing files");

  const artifactAll = await fetchText("/artifacts/latest/all.txt", 15000);
  if (!artifactAll.trim()) throw new Error("/artifacts/latest/all.txt returned empty text");

  const cacheStatus = await fetchJson("/api/cache-status", 15000);
  if (!Array.isArray(cacheStatus.entries)) throw new Error("/api/cache-status missing entries[]");

  const cacheClearUnauthorized = await fetchWithTimeout("/api/cache-clear", 15000, { method: "POST" });
  if (cacheClearUnauthorized.res.status !== 401) throw new Error("/api/cache-clear should require authorization");

  console.log(JSON.stringify({
    ok: true,
    configGroups: config.length,
    sourceTotal: health.summary.total,
    sourceOk: health.summary.ok,
    exportLines: exportData.summary.lines,
    singleExportLines: singleExport.summary.lines,
    categoryExportLines: categoryExport.summary.lines,
    parsedSourceLines: parsedSource.parsedLines,
    artifactFiles: artifacts.files.length,
    cacheEntries: cacheStatus.entries.length,
    buildDatasetDisabled: buildDisabled.res.status === 403,
    rawSourceProtected: rawUnauthorized.res.status === 401,
    cacheClearProtected: cacheClearUnauthorized.res.status === 401
  }, null, 2));
} catch (error) {
  console.error(logs);
  console.error(error);
  process.exitCode = 1;
} finally {
  server.kill();
}
