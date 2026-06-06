export const ARTIFACT_FILE_NAMES = [
  "all.txt",
  "ipv4.txt",
  "ipv6.txt",
  "domain.txt",
  "proxyip.txt",
  "cidr.txt",
  "full.json",
  "health.json",
  "report.md"
];

export function linesByTypes(records, types) {
  const set = new Set(types);
  return records.filter(record => set.has(record.type)).map(record => record.line).join("\n") + "\n";
}

export function allLines(records) {
  return records.map(record => record.line).join("\n") + "\n";
}

export function proxyIpLines(records) {
  return records.filter(record => /proxy/i.test(record.groupName + record.sourceId)).map(record => record.line).join("\n") + "\n";
}

export function summarizeResults(jobs, results, records) {
  return {
    sources: jobs.length,
    ok: results.filter(result => result.ok).length,
    failed: results.filter(result => !result.ok).length,
    rawLines: results.reduce((total, result) => total + result.count, 0),
    deduped: records.length
  };
}

export function buildHealth({ generatedAt, durationMs, jobs, results, records }) {
  return {
    generatedAt,
    durationMs,
    summary: summarizeResults(jobs, results, records),
    sources: results.map(({ lines, ...rest }) => rest)
  };
}

export function buildFull({ generatedAt, summary, records }) {
  return { generatedAt, summary, records };
}

export function countByType(records) {
  return records.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + 1;
    return acc;
  }, {});
}

export function buildReport(health, records) {
  return [
    "# BestIP 数据构建报告",
    "",
    `- 生成时间：${health.generatedAt}`,
    `- 源总数：${health.summary.sources}`,
    `- 可用源：${health.summary.ok}`,
    `- 失败源：${health.summary.failed}`,
    `- 原始行数：${health.summary.rawLines}`,
    `- 去重后：${health.summary.deduped}`,
    "",
    "## 失败源",
    ...health.sources.filter(source => !source.ok).map(source => `- [${source.groupName}] ${source.id}: ${source.error}`),
    health.sources.some(source => !source.ok) ? "" : "无",
    "",
    "## 分类统计",
    ...Object.entries(countByType(records)).map(([type, count]) => `- ${type}: ${count}`),
    ""
  ].join("\n");
}

export function buildManifest({ generatedAt, health, files = ARTIFACT_FILE_NAMES }) {
  return {
    ok: true,
    generatedAt,
    files: files.map(name => ({ name })),
    health
  };
}

export function buildArtifactContents({ health, full, report, records }) {
  return new Map([
    ["all.txt", allLines(records)],
    ["ipv4.txt", linesByTypes(records, ["ipv4", "ipv4-port"])],
    ["ipv6.txt", linesByTypes(records, ["ipv6"])],
    ["domain.txt", linesByTypes(records, ["domain"])],
    ["proxyip.txt", proxyIpLines(records)],
    ["cidr.txt", linesByTypes(records, ["cidr"])],
    ["full.json", JSON.stringify(full, null, 2) + "\n"],
    ["health.json", JSON.stringify(health, null, 2) + "\n"],
    ["report.md", report]
  ]);
}
