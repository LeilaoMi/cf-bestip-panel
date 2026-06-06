export async function api(path) {
  const res = await fetch(path);
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return JSON.parse(text);
}

export function getAdminToken() {
  let token = sessionStorage.getItem("bestipAdminToken") || "";
  if (!token) {
    token = prompt("请输入管理员 Token（Cloudflare 环境变量 ADMIN_TOKEN）") || "";
    if (token) sessionStorage.setItem("bestipAdminToken", token);
  }
  return token;
}

export function adminHeaders(extra = {}) {
  const token = getAdminToken();
  return token ? { ...extra, authorization: "Bearer " + token } : extra;
}