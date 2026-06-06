import { GLOBAL_POOL } from "./_data.js";

const UPSTREAM_EDGE_API = "https://bestip.fjzf.dpdns.org/api/edge_ips";

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function fallbackText(regions, limit) {
  let rows = GLOBAL_POOL.filter(item => regions.includes(item.cc));
  rows = shuffle(rows);
  if (limit > 0) rows = rows.slice(0, limit);
  return rows.map(item => {
    const host = "example.pages.dev";
    const tag = encodeURIComponent(`${item.cc}-${item.name}-示例`);
    return `vless://00000000-0000-4000-8000-000000000001@${item.ip}:${item.port}?encryption=none&security=tls&sni=${host}&type=ws&host=${host}&path=%2F#${tag}`;
  }).join("\n");
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const regions = (url.searchParams.get("regions") || "")
    .split(",")
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
  const limit = Math.max(0, Math.min(parseInt(url.searchParams.get("limit") || "0", 10) || 0, 500));

  if (!regions.length) {
    return new Response("请选择至少一个地区", { status: 400 });
  }

  try {
    const upstream = new URL(UPSTREAM_EDGE_API);
    upstream.searchParams.set("regions", regions.join(","));
    upstream.searchParams.set("limit", String(limit));
    const res = await fetch(upstream, {
      headers: { "user-agent": "cf-bestip-panel/1.0" },
      signal: AbortSignal.timeout(12000)
    });
    const text = await res.text();
    if (res.ok && text.trim()) {
      return new Response(text, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }
  } catch (_) {
  }

  const text = fallbackText(regions, limit);
  return new Response(text || "未找到匹配地区的数据", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
