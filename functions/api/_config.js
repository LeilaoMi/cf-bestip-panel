const CONFIG_KEY = "panel-config";

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}

function isAuthorized(request, env) {
  if (globalThis.__saveConfigForLocalDev && !env?.ADMIN_TOKEN) return true;
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return Boolean(env?.ADMIN_TOKEN && token === env.ADMIN_TOKEN);
}

function isPrivateHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1" ||
    host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
}

function validateSourceUrl(raw) {
  if (String(raw || "").startsWith("local:")) return true;
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) && !isPrivateHost(url.hostname);
  } catch (_) {
    return false;
  }
}

async function loadConfig(request, env) {
  try {
    if (env?.BESTIP_KV) {
      const saved = await env.BESTIP_KV.get(CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load config from KV", error);
  }
  try {
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    const res = await fetch(`${origin}/config.json`, { headers: { "cache-control": "no-cache" } });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error("Failed to load static config", error);
  }
  return [];
}

function findNode(config, id) {
  for (const group of config || []) {
    for (const node of group.nodes || []) {
      if (node.ID === id) return { groupName: group.groupName, node };
    }
  }
  return null;
}

function validateConfig(config) {
  if (!Array.isArray(config)) return "配置必须是数组";
  const ids = new Set();
  for (const group of config) {
    if (!group?.groupName || !Array.isArray(group.nodes)) return "每个主分类必须包含 groupName 和 nodes[]";
    for (const node of group.nodes) {
      if (!node?.ID || !node?.url) return "每条线路必须包含 ID 和 url";
      if (ids.has(node.ID)) return `线路 ID 重复：${node.ID}`;
      ids.add(node.ID);
      if (!validateSourceUrl(node.url)) return `${node.ID} URL 不安全或格式无效`;
      node.extract = Boolean(node.extract);
    }
  }
  return "";
}

export { CONFIG_KEY, json, isAuthorized, loadConfig, findNode, validateConfig, validateSourceUrl };
