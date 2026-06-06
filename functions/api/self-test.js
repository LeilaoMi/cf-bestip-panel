export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const checks = [
    ["config", "/api/config"],
    ["source-health", "/api/source-health"],
    ["export-tagged", "/api/export-all?format=json&mode=tagged"],
    ["export-ip-port", "/api/export-all?format=json&mode=ip-port"],
    ["edge-ips", "/api/edge_ips?regions=US,JP&limit=2"]
  ];
  const results = [];
  for (const [name, path] of checks) {
    const start = Date.now();
    try {
      const res = await fetch(origin + path, { signal: AbortSignal.timeout(45000) });
      const text = await res.text();
      results.push({ name, ok: res.ok && text.trim().length > 0, status: res.status, ms: Date.now() - start, bytes: text.length });
    } catch (error) {
      results.push({ name, ok: false, status: 0, ms: Date.now() - start, bytes: 0, error: error.message });
    }
  }
  return Response.json({
    ok: results.every(r => r.ok),
    checkedAt: new Date().toISOString(),
    results
  }, { headers: { "cache-control": "no-store" } });
}
