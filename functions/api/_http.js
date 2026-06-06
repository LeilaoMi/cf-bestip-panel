async function fetchTextWithLimit(url, options = {}, maxBytes = 1024 * 1024) {
  const res = await fetch(url, options);
  if (!res.body) return { res, text: await res.text() };
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      try { await reader.cancel(); } catch (_) {}
      throw new Error(`Response too large: > ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return { res, text: new TextDecoder().decode(bytes) };
}
export { fetchTextWithLimit };
