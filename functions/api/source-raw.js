import { findNode, isAuthorized, loadConfig } from "./_config.js";
import { SAMPLE_DATA } from "./_data.js";
import { fetchTextWithLimit } from "./_http.js";

export async function onRequestGet({ request, env }) {
  if (!isAuthorized(request, env)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("ID") || "";
  if (!id) return Response.json({ error: "Missing ID" }, { status: 400 });

  const match = findNode(await loadConfig(request, env), id);
  if (!match) return Response.json({ error: "Node not found" }, { status: 404 });

  const started = Date.now();
  try {
    let status = 200;
    let text = "";
    if (match.node.url?.startsWith("local:")) {
      text = SAMPLE_DATA[match.node.url.slice(6)] || "";
    } else {
      const { res: upstream, text: body } = await fetchTextWithLimit(match.node.url, {
        headers: { "user-agent": "cf-bestip-panel/1.0" },
        signal: AbortSignal.timeout(15000)
      }, 1024 * 1024);
      status = upstream.status;
      text = body;
    }

    return Response.json({
      groupName: match.groupName,
      id: match.node.ID,
      url: match.node.url,
      extract: Boolean(match.node.extract),
      status,
      ok: status >= 200 && status < 400,
      bytes: new TextEncoder().encode(text).length,
      ms: Date.now() - started,
      text
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
      text: ""
    }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
