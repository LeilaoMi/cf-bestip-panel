import { cacheStatus } from "./_cache.js";

export async function onRequestGet() {
  return Response.json({ entries: cacheStatus(), now: Date.now() }, {
    headers: { "cache-control": "no-store" }
  });
}
