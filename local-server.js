import { createServer } from "node:http";
import net from "node:net";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const port = Number(process.env.PORT || 8788);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

globalThis.__saveConfigForLocalDev = async config => {
  const text = `${JSON.stringify(config, null, 2)}\n`;
  await writeFile(join(root, "public/config.json"), text, "utf8");
  await writeFile(join(root, "config.json"), text, "utf8");
};

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const file = resolve(root, target);
  const rel = relative(root, file);
  if (rel.startsWith("..") || rel === "") throw new Error("Forbidden path");
  return file;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}


function tcpProbe(ip, port, timeout = 1800) {
  return new Promise(resolve => {
    const start = Date.now();
    const socket = net.createConnection({ host: ip, port, timeout });
    let done = false;
    const finish = ok => {
      if (done) return;
      done = true;
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ ok, latency });
    };
    socket.on("connect", () => finish(true));
    socket.on("timeout", () => finish(false));
    socket.on("error", () => finish(false));
  });
}

async function handleTcpSpeedtest(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  const body = await readBody(req);
  const input = JSON.parse(body.toString("utf8") || "{}");
  const timeout = Math.max(300, Math.min(Number(input.timeout || 1800), 5000));
  const threads = Math.max(1, Math.min(Number(input.threads || 20), 80));
  const ips = Array.isArray(input.ips) ? input.ips.slice(0, 1000) : [];
  const results = [];
  let idx = 0;
  const worker = async () => {
    while (idx < ips.length) {
      const item = ips[idx++];
      const ip = String(item.ip || "").trim();
      const port = Number(item.port || 443);
      if (!ip || !Number.isInteger(port) || port < 1 || port > 65535) continue;
      const r = await tcpProbe(ip, port, timeout);
      if (r.ok) results.push({ ip, port: String(port), cc: String(item.cc || "-"), latency: r.latency });
    }
  };
  await Promise.all(Array.from({ length: Math.min(threads, Math.max(ips.length, 1)) }, worker));
  results.sort((a, b) => a.latency - b.latency);
  res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ ok: true, mode: "local-tcp", tested: ips.length, results }));
}

async function handleApi(req, res, url) {
  const name = url.pathname.replace("/api/", "");
  if (!/^[a-z0-9_-]+$/i.test(name)) {
    res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Bad API name" }));
    return;
  }
  const file = join(root, "functions/api", `${name}.js`);
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  const handler = req.method === "POST" ? mod.onRequestPost : mod.onRequestGet;
  if (!handler) {
    res.writeHead(405, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
  const request = new Request(`http://localhost:${port}${url.pathname}${url.search}`, {
    method: req.method,
    headers: req.headers,
    body
  });
  const response = await handler({ request, env: { ADMIN_TOKEN: process.env.ADMIN_TOKEN || "" } });
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    if (url.pathname === "/api/tcp-speedtest") return await handleTcpSpeedtest(req, res);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    const file = safePath(url.pathname);
    const data = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Not found: ${error.message}`);
  }
}).listen(port, host, () => {
  console.log(`cf-bestip-panel listening on http://${host}:${port}`);
});
