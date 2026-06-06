export const $ = id => document.getElementById(id);

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&#34;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.classList.add("show"), 20);
  setTimeout(() => {
    node.classList.remove("show");
    setTimeout(() => node.remove(), 250);
  }, 2600);
}
