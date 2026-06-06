import { clearCache } from "./_cache.js";
import { CONFIG_KEY, isAuthorized, json, loadConfig, validateConfig } from "./_config.js";
export async function onRequestGet({ request, env }) { return json(await loadConfig(request, env)); }
export async function onRequestPost({ request, env }) {
  if (!isAuthorized(request, env)) return json({ error: "Unauthorized" }, { status: 401 });
  let config;
  try { config = await request.json(); } catch (_) { return json({ error: "请求体必须是合法 JSON" }, { status: 400 }); }
  const error = validateConfig(config);
  if (error) return json({ error }, { status: 400 });
  if (env?.BESTIP_KV) { await env.BESTIP_KV.put(CONFIG_KEY, JSON.stringify(config)); clearCache(); return json({ ok: true, storage: "kv" }); }
  if (globalThis.__saveConfigForLocalDev) { await globalThis.__saveConfigForLocalDev(config); clearCache(); return json({ ok: true, storage: "local-file" }); }
  return json({ error: "当前环境未配置 BESTIP_KV，无法保存" }, { status: 501 });
}
