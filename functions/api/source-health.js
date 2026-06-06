import { getCache, setCache } from "./_cache.js";
import { checkNode, loadConfig } from "./_health.js";

async function buildHealth(request, env) {
  const config = await loadConfig(request, env);
  const nodes = [];
  for (const group of config) {
    for (const node of group.nodes || []) nodes.push({ groupName: group.groupName, node });
  }

  const results = [];
  const concurrency = 8;
  let index = 0;
  async function worker() {
    while (index < nodes.length) {
      const current = nodes[index++];
      results.push(await checkNode(current.groupName, current.node));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, nodes.length) }, worker));
  results.sort((a, b) => a.groupName.localeCompare(b.groupName, "zh-CN") || a.id.localeCompare(b.id, "zh-CN"));

  const groupsMap = new Map();
  for (const item of results) {
    if (!groupsMap.has(item.groupName)) {
      groupsMap.set(item.groupName, { groupName: item.groupName, total: 0, ok: 0, failed: 0, slow: 0, lines: 0, maxMs: 0 });
    }
    const group = groupsMap.get(item.groupName);
    group.total++;
    if (item.ok) group.ok++;
    else group.failed++;
    if (item.ok && item.ms > 5000) group.slow++;
    group.lines += item.lines;
    group.maxMs = Math.max(group.maxMs, item.ms);
  }

  const summary = {
    total: results.length,
    ok: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    slow: results.filter(r => r.ok && r.ms > 5000).length,
    lines: results.reduce((sum, r) => sum + r.lines, 0),
    checkedAt: new Date().toISOString()
  };

  return { summary, groups: [...groupsMap.values()], results };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";
  const key = "source-health";
  if (!refresh) {
    const cached = getCache(key);
    if (cached) return Response.json({ ...cached, cached: true }, { headers: { "cache-control": "no-store" } });
  }

  const data = await buildHealth(request, env);
  setCache(key, data);
  return Response.json({ ...data, cached: false }, { headers: { "cache-control": "no-store" } });
}
