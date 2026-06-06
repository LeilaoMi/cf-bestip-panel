import { checkNode, loadConfig } from "./_health.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("ID") || "";
  if (!id) return Response.json({ error: "Missing ID" }, { status: 400 });

  const config = await loadConfig(request, env);
  for (const group of config) {
    for (const node of group.nodes || []) {
      if (node.ID === id) {
        return Response.json(await checkNode(group.groupName, node), {
          headers: { "cache-control": "no-store" }
        });
      }
    }
  }

  return Response.json({ error: "Node not found" }, { status: 404 });
}
