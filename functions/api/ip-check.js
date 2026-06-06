export async function onRequestGet({ request }) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const country = request.cf?.country || "CN";
  return Response.json({
    ip,
    country,
    isCN: country === "CN",
    note: "本地预览默认放行；Cloudflare Pages 线上会使用 cf-connecting-ip 与 request.cf.country。"
  });
}
