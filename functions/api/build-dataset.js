export async function onRequestGet() {
  return Response.json({ ok: false, error: "Cloudflare Pages 环境不支持在线生成数据产物，请使用 npm run build:dataset 或 GitHub Actions 生成 public/artifacts/latest。" }, { status: 403, headers: { "cache-control": "no-store" } });
}
