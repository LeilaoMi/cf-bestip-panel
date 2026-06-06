function nodeKey(groupName, nodeId) {
  return `${groupName}::${nodeId}`;
}

function normalizeConfig(config) {
  return Array.isArray(config) ? config : [];
}

function buildIndex(config) {
  const groups = new Map();
  const nodes = new Map();
  for (const group of normalizeConfig(config)) {
    const groupName = String(group?.groupName || "").trim();
    if (!groupName) continue;
    groups.set(groupName, group);
    for (const node of Array.isArray(group.nodes) ? group.nodes : []) {
      const ID = String(node?.ID || "").trim();
      if (!ID) continue;
      nodes.set(nodeKey(groupName, ID), { groupName, ID, url: String(node.url || ""), extract: Boolean(node.extract) });
    }
  }
  return { groups, nodes };
}

export function summarizeConfigChanges(beforeConfig, afterConfig) {
  const before = buildIndex(beforeConfig);
  const after = buildIndex(afterConfig);
  const summary = {
    addedGroups: [],
    removedGroups: [],
    addedNodes: [],
    removedNodes: [],
    changedUrls: [],
    changedExtract: [],
    unchangedNodes: 0
  };

  for (const groupName of after.groups.keys()) {
    if (!before.groups.has(groupName)) summary.addedGroups.push(groupName);
  }
  for (const groupName of before.groups.keys()) {
    if (!after.groups.has(groupName)) summary.removedGroups.push(groupName);
  }

  for (const [key, node] of after.nodes.entries()) {
    const old = before.nodes.get(key);
    if (!old) {
      summary.addedNodes.push(`${node.groupName}/${node.ID}`);
      continue;
    }
    let changed = false;
    if (old.url !== node.url) {
      changed = true;
      summary.changedUrls.push(`${node.groupName}/${node.ID}`);
    }
    if (old.extract !== node.extract) {
      changed = true;
      summary.changedExtract.push(`${node.groupName}/${node.ID}`);
    }
    if (!changed) summary.unchangedNodes += 1;
  }

  for (const [key, node] of before.nodes.entries()) {
    if (!after.nodes.has(key)) summary.removedNodes.push(`${node.groupName}/${node.ID}`);
  }

  summary.totalChanges = summary.addedGroups.length + summary.removedGroups.length + summary.addedNodes.length + summary.removedNodes.length + summary.changedUrls.length + summary.changedExtract.length;
  return summary;
}

function compactList(items, limit = 8) {
  if (!items.length) return "无";
  const head = items.slice(0, limit).join("、");
  return items.length > limit ? `${head} 等 ${items.length} 项` : head;
}

export function formatConfigChangeSummary(summary) {
  const lines = [
    `总变更：${summary.totalChanges}`,
    `新增分类：${summary.addedGroups.length}`,
    `删除分类：${summary.removedGroups.length}`,
    `新增线路：${summary.addedNodes.length}`,
    `删除线路：${summary.removedNodes.length}`,
    `URL 变更：${summary.changedUrls.length}`,
    `提取模式变更：${summary.changedExtract.length}`,
    `未变化线路：${summary.unchangedNodes}`
  ];

  const details = [
    ["新增分类", summary.addedGroups],
    ["删除分类", summary.removedGroups],
    ["新增线路", summary.addedNodes],
    ["删除线路", summary.removedNodes],
    ["URL 变更", summary.changedUrls],
    ["提取模式变更", summary.changedExtract]
  ].filter(([, items]) => items.length);

  if (details.length) {
    lines.push("", "详情：");
    for (const [title, items] of details) lines.push(`- ${title}：${compactList(items)}`);
  }
  return lines.join("\n");
}

export function hasConfigChanges(summary) {
  return Boolean(summary?.totalChanges);
}