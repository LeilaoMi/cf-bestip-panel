export const DEFAULT_MAX_SOURCE_BYTES = 1024 * 1024;
export const DEFAULT_FETCH_TIMEOUT_MS = 20000;
export const DEFAULT_USER_AGENT = "cf-bestip-panel-build/1.0";

export async function fetchTextWithLimit(url, options = {}, maxBytes = DEFAULT_MAX_SOURCE_BYTES, fetchImpl = fetch) {
  const res = await fetchImpl(url, options);
  if (!res.body) return { res, text: await res.text() };
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      try { await reader.cancel(); } catch {}
      throw new Error(`Response too large: > ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  return { res, text: Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString("utf8") };
}

export function usefulLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("//") && !line.startsWith("/*"));
}

export function tryDecodeBase64(text) {
  const source = String(text || "");
  const clean = source.trim().replace(/\s+/g, "");
  if (!clean || source.includes("://")) return source;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(clean)) return source;
  try {
    const normalized = clean.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64").toString("utf8");
    return decoded.includes("://") || decoded.includes("\n") ? decoded : source;
  } catch {
    return source;
  }
}

export function normalize(line, groupName, sourceId) {
  const text = String(line || "");
  if (text.includes("://")) return text;
  if (text.includes("#")) return text;
  return `${text}#${groupName}_${sourceId}`;
}

export async function fetchSource(groupName, node, options = {}) {
  const {
    fetchText = fetchTextWithLimit,
    maxBytes = Number(process.env.BUILD_MAX_SOURCE_BYTES || DEFAULT_MAX_SOURCE_BYTES),
    timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
    userAgent = DEFAULT_USER_AGENT
  } = options;
  const started = Date.now();
  try {
    let text;
    if (node.url.startsWith("local:")) {
      text = "";
    } else {
      const signal = typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined;
      const { res, text: body } = await fetchText(node.url, {
        headers: { "user-agent": userAgent },
        ...(signal ? { signal } : {})
      }, maxBytes);
      text = body;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
    if (node.extract) text = tryDecodeBase64(text);
    const lines = usefulLines(text).map(line => normalize(line, groupName, node.ID));
    return { groupName, id: node.ID, url: node.url, ok: true, ms: Date.now() - started, lines, count: lines.length };
  } catch (error) {
    return { groupName, id: node.ID, url: node.url, ok: false, ms: Date.now() - started, lines: [], count: 0, error: error.message };
  }
}
