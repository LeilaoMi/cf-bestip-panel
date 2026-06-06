export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  try {
    const res = await fetch(`${url.origin}/artifacts/latest/manifest.json`, { headers: { "cache-control": "no-cache" } });
    if (res.ok) return Response.json(await res.json(), { headers: { "cache-control": "no-store" } });
  } catch (_) {}
  return Response.json({ ok: false, error: "manifest.json not found", files: [] }, { status: 404 });
}
