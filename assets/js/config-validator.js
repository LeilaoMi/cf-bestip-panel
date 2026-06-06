const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./
];

function isPrivateHost(hostname) {
  const host = String(hostname || "").trim().toLowerCase().replace(/^\[|\]$/g, "");
  return host === "::1" || PRIVATE_HOST_PATTERNS.some(pattern => pattern.test(host));
}

export function validateSourceUrl(raw) {
  const value = String(raw || "").trim();
  if (value.startsWith("local:")) return { ok: true, type: "local" };
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return { ok: false, error: "URL 仅允许 http(s):// 或 local:" };
    if (isPrivateHost(url.hostname)) return { ok: false, error: "URL 不允许指向本地或内网地址" };
    return { ok: true, type: url.protocol.slice(0, -1) };
  } catch {
    return { ok: false, error: "URL 格式无效" };
  }
}

export function validateConfigDetailed(input, options = {}) {
  const normalize = Boolean(options.normalize);
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const normalized = [];
  const summary = { groups: 0, nodes: 0, local: 0, remote: 0, extract: 0 };

  if (!Array.isArray(input)) {
    return { ok: false, errors: ["配置必须是数组"], warnings, summary, config: input };
  }

  input.forEach((group, gi) => {
    const groupLabel = `第 ${gi + 1} 个主分类`;
    if (!group || typeof group !== "object" || Array.isArray(group)) {
      errors.push(`${groupLabel} 必须是对象`);
      return;
    }

    const groupName = String(group.groupName || "").trim();
    if (!groupName) errors.push(`${groupLabel} 缺少 groupName`);
    if (!Array.isArray(group.nodes)) errors.push(`${groupName || groupLabel} 缺少 nodes[]`);

    const nodes = [];
    if (Array.isArray(group.nodes)) {
      group.nodes.forEach((node, ni) => {
        const nodeLabel = `${groupName || groupLabel} 第 ${ni + 1} 条线路`;
        if (!node || typeof node !== "object" || Array.isArray(node)) {
          errors.push(`${nodeLabel} 必须是对象`);
          return;
        }

        const ID = String(node.ID || "").trim();
        const url = String(node.url || "").trim();
        if (!ID) errors.push(`${nodeLabel} 缺少 ID`);
        if (ID && ids.has(ID)) errors.push(`线路 ID 重复：${ID}`);
        if (ID) ids.add(ID);
        if (!url) errors.push(`${groupName || groupLabel}/${ID || `第 ${ni + 1} 条线路`} 缺少 URL`);

        const urlResult = validateSourceUrl(url);
        if (url && !urlResult.ok) errors.push(`${groupName || groupLabel}/${ID || `第 ${ni + 1} 条线路`} ${urlResult.error}`);
        if (node.extract !== undefined && typeof node.extract !== "boolean") warnings.push(`${ID || nodeLabel} 的 extract 将被规范化为布尔值`);

        if (urlResult.ok) {
          if (urlResult.type === "local") summary.local += 1;
          else summary.remote += 1;
        }
        if (Boolean(node.extract)) summary.extract += 1;
        summary.nodes += 1;

        nodes.push({ ...node, ID, url, extract: Boolean(node.extract) });
      });
    }

    summary.groups += 1;
    normalized.push({ ...group, groupName, nodes });
  });

  if (!summary.nodes) warnings.push("配置中没有任何线路节点");
  return { ok: errors.length === 0, errors, warnings, summary, config: normalize ? normalized : input };
}

export function validateConfig(input) {
  const result = validateConfigDetailed(input);
  return result.errors[0] || "";
}

export function formatConfigDryRun(result) {
  const lines = [
    `分类：${result.summary.groups}`,
    `线路：${result.summary.nodes}`,
    `远程源：${result.summary.remote}`,
    `本地源：${result.summary.local}`,
    `提取模式：${result.summary.extract}`
  ];
  if (result.warnings.length) lines.push("", "警告：", ...result.warnings.map(item => `- ${item}`));
  return lines.join("\n");
}