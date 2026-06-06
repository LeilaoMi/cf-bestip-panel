import { findNode, loadConfig } from "./_config.js";
import { SAMPLE_DATA } from "./_data.js";
import { fetchTextWithLimit } from "./_http.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("ID") || "";
  if (!id) return new Response("Missing ID", { status: 400 });

  const match = findNode(await loadConfig(request, env), id);
  if (!match) return new Response("Node not found", { status: 404 });
  const node = match.node;

  if (node.url?.startsWith("local:")) {
    const key = node.url.slice(6);
    return new Response(SAMPLE_DATA[key] || "", {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
    });
  }

  try {
    const { res, text } = await fetchTextWithLimit(node.url, {
      headers: { "user-agent": "cf-bestip-panel/1.0" },
      signal: AbortSignal.timeout(15000)
    }, 1024 * 1024);
    return new Response(text, {
      status: res.ok ? 200 : res.status,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
    });
  } catch (error) {
    return new Response(`Fetch failed: ${error.message}`, { status: 502 });
  }
}
