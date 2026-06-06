import { clearCache } from "./_cache.js";
import { isAuthorized } from "./_config.js";
export async function onRequestPost({ request, env }) {
  if (!isAuthorized(request, env)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ ok: true, cleared: clearCache() }, { headers: { "cache-control": "no-store" } });
}
