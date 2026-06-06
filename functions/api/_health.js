import { loadConfig } from "./_config.js";
import { fetchTextWithLimit } from "./_http.js";

function countUsefulLines(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("//") && !line.startsWith("/*"))
    .length;
}

function looksLikeBase64(text) {
  const clean = text.trim().replace(/\s+/g, "");
  return clean.length > 80 && /^[A-Za-z0-9+/=_-]+$/.test(clean) && !text.includes("://");
}

function classifyFormat(text) {
  if (!text.trim()) return "empty";
  if (text.includes("vless://") || text.includes("trojan://") || text.includes("vmess://")) return "subscription";
  if (looksLikeBase64(text)) return "base64";
  if (text.split(/\r?\n/)[0]?.includes(",")) return "csv";
  if (text.includes("#")) return "ip-with-tag";
  return "text";
}

async function checkNode(groupName, node) {
  const started = Date.now();
  if (node.url?.startsWith("local:")) {
    return { groupName, id: node.ID, url: node.url, ok: true, status: 200, ms: 0, lines: 0, format: "local-demo", error: "本地样例源" };
  }

  try {
    const { res, text } = await fetchTextWithLimit(node.url, {
      headers: { "user-agent": "cf-bestip-panel/1.0" },
      signal: AbortSignal.timeout(12000)
    }, 512 * 1024);
    const lines = countUsefulLines(text);
    return {
      groupName,
      id: node.ID,
      url: node.url,
      ok: res.ok && lines > 0,
      status: res.status,
      ms: Date.now() - started,
      lines,
      format: classifyFormat(text),
      error: res.ok ? "" : `HTTP ${res.status}`
    };
  } catch (error) {
    return {
      groupName,
      id: node.ID,
      url: node.url,
      ok: false,
      status: 0,
      ms: Date.now() - started,
      lines: 0,
      format: "error",
      error: error.name === "TimeoutError" ? "timeout" : error.message
    };
  }
}

export { checkNode, loadConfig };
