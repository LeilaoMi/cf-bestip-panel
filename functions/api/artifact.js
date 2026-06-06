const allowed = new Set(["all.txt", "ipv4.txt", "ipv6.txt", "domain.txt", "proxyip.txt", "cidr.txt", "full.json", "health.json", "report.md"]);
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const name = (url.searchParams.get("name") || "").split(/[\/]/).pop();
  if (!allowed.has(name)) return new Response("Not found", { status: 404 });
  return Response.redirect(`${url.origin}/artifacts/latest/${encodeURIComponent(name)}`, 302);
}
