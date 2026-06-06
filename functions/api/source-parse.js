import { findNode, loadConfig } from "./_config.js";
import { SAMPLE_DATA } from "./_data.js";
import { fetchTextWithLimit } from "./_http.js";

function usefulLines(text) {
  return text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("//") && !line.startsWith("/*"));
}

function tryDecodeBase64(text) {
  const clean = text.trim().replace(/\s+/g, "");
  if (!clean || text.includes("://")) return { text, decoded: false };
  if (!/^[A-Za-z0-9+/=_-]+$/.test(clean)) return { text, decoded: false };
  try {
    const normalized = clean.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const decodedText = new TextDecoder().decode(bytes);
    if (decodedText.includes("://") || decodedText.includes("\n")) return { text: decodedText, decoded: true };
  } catch (_) {}
  return { text, decoded: false };
}

function normalizeLine(line, groupName, nodeId) {
  if (line.includes("://")) return line;
  if (line.includes("#")) return line;
  return `${line}#${groupName}_${nodeId}`;
}

function parseAddress(line) {
  const noTag = line.replace(/#.*$/, "").trim();
  if (noTag.includes("://")) return null;
  const match = noTag.match(/^([^\s,#]+?)(?::(\d{2,5}))?$/);
  if (!match) return null;
  return {
    host: match[1],
    port: match[2] || "443",
    tag: line.includes("#") ? line.split("#").slice(1).join("#") : ""
  };
}

async function fetchSource(node) {
  if (node.url?.startsWith("local:")) {
    return { status: 200, text: SAMPLE_DATA[node.url.slice(6)] || "" };
  }
  const { res: upstream, text } = await fetchTextWithLimit(node.url, {
    headers: { "user-agent": "cf-bestip-panel/1.0" },
    signal: AbortSignal.timeout(15000)
  }, 1024 * 1024);
  return { status: upstream.status, text };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("ID") || "";
  if (!id) return Response.json({ error: "Missing ID" }, { status: 400 });

  const match = findNode(await loadConfig(request, env), id);
  if (!match) return Response.json({ error: "Node not found" }, { status: 404 });

  const started = Date.now();
  try {
    const { status, text: rawText } = await fetchSource(match.node);
    const decoded = match.node.extract ? tryDecodeBase64(rawText) : { text: rawText, decoded: false };
    const rawLines = usefulLines(rawText);
    const normalizedLines = usefulLines(decoded.text).map(line => normalizeLine(line, match.groupName, match.node.ID));
    const items = normalizedLines.map(line => ({ line, address: parseAddress(line) }));

    return Response.json({
      groupName: match.groupName,
      id: match.node.ID,
      url: match.node.url,
      extract: Boolean(match.node.extract),
      decoded: decoded.decoded,
      status,
      ok: status >= 200 && status < 400 && normalizedLines.length > 0,
      bytes: new TextEncoder().encode(rawText).length,
      rawLines: rawLines.length,
      parsedLines: normalizedLines.length,
      addressLines: items.filter(item => item.address).length,
      droppedLines: Math.max(rawLines.length - normalizedLines.length, 0),
      ms: Date.now() - started,
      lines: normalizedLines,
      items
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({
      groupName: match.groupName,
      id: match.node.ID,
      url: match.node.url,
      extract: Boolean(match.node.extract),
      ok: false,
      error: error.message,
      ms: Date.now() - started,
      lines: [],
      items: []
    }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
