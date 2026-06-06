const cache = globalThis.__bestipCache || new Map();
globalThis.__bestipCache = cache;
const MAX_CACHE_ENTRIES = 100;
function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) { cache.delete(key); return null; }
  return item.value;
}
function setCache(key, value, ttlMs = 30 * 60 * 1000) {
  if (!cache.has(key) && cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, { value, createdAt: Date.now(), expiresAt: Date.now() + ttlMs });
}
function clearCache() { const size = cache.size; cache.clear(); return size; }
function cacheStatus() {
  const now = Date.now();
  for (const [key, item] of cache.entries()) if (now > item.expiresAt) cache.delete(key);
  return [...cache.entries()].map(([key, item]) => ({ key, createdAt: new Date(item.createdAt).toISOString(), expiresAt: new Date(item.expiresAt).toISOString(), ttlSeconds: Math.max(0, Math.floor((item.expiresAt - now) / 1000)) }));
}
export { getCache, setCache, clearCache, cacheStatus };
