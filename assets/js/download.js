export function stamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function safeFilePart(text) {
  return String(text || "source")
    .replace(/[^a-zA-Z0-9._\u4e00-\u9fa5-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "source";
}

export function downloadBlob(text, name, type) {
  if (name === "bestip-result.txt") name = `bestip-result-${stamp()}.txt`;
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}