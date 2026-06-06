import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const host = "127.0.0.1";
const port = Number(process.env.UI_SMOKE_PORT || 8791);
const base = `http://${host}:${port}`;

const requiredHtmlSnippets = [
  "优选 IP 管理台",
"测速历史",
"保存历史",
"清空历史",
"下载筛选结果",
"延迟 ≤",
"保留前",
"导出格式",
  'class="side-nav"',
  'data-page="dashboard"',
  'data-page="sources"',
  'data-page="global"',
  'data-page="speedtest"',
  'data-page="admin"',
  'id="page-dashboard"',
  'id="page-sources"',
  'id="page-global"',
  'id="page-speedtest"',
  'id="page-admin"',
  'id="btn-health"',
  'id="btn-export-all"',
  'id="artifact-links"',
  'id="btn-artifacts-refresh"',
  'id="cache-status"',
  'id="main-nav"',
  'id="sub-nav"',
  'id="ip-display"',
  'id="region-grid"',
  'id="st-start"',
  'id="admin-list"',
  'id="btn-save-config"',
  'type="module" src="/assets/app.js"'
];

const frontendModulePaths = ["/assets/js/constants.js", "/assets/js/dom.js", "/assets/js/api-client.js", "/assets/js/download.js", "/assets/js/config-validator.js", "/assets/js/config-diff.js"];

const requiredJsSnippets = [
  "function switchPage",
  "function bindEvents",
  "function initRegionGrid",
  "async function loadNav",
  "async function loadHealth",
  "async function loadArtifacts",
  "async function loadCacheStatus",
  "async function exportAllSources",
  "async function buildDataset",
  "function openAdminPage",
  "function renderAdmin",
  "init();",
        'exportSpeedtestHistory',
  'compareSpeedtestHistory',
  'restoreSpeedtestHistory',
  'renderSpeedtestHistory',
  'saveSpeedtestHistory',
  'writeSpeedtestHistory',
  'readSpeedtestHistory',
  'st-history-list',
  'st-history-panel',
  'st-clear-history',
  'st-toggle-history',
  'st-save-history',
        '测速结果统计',
    'bestip-speedtest-filtered',
  'exportFilteredSpeedtest',
  'applySpeedtestVisualFilter',
  'updateSpeedtestQualitySummary',
  'filteredSpeedtestResults',
  'speedtestStats',
  'st-export-filtered',
  'st-quality-summary',
  'st-export-format',
  'st-top-n',
  'st-max-latency',
  'CloudflareST -f',
  '导入测速 CSV',
  '导出 cfst 命令',
  '导出候选 IP',
  'bestip-cfst-command',
  'bestip-candidates',
  'handleCfstFile',
  'parseCfstRows',
  'exportCfstCommand',
  'exportSpeedtestCandidates',
  'speedtestCandidates',
  'st-cfst-file',
  'st-import-cfst',
  'st-export-cfst-command',
  'st-export-candidates',
  'CloudflareSpeedTest',
  '浏览器无法可靠测 Cloudflare 裸 IP',
  '本地 TCP 测速',
  'renderSpeedtestResults',
  'tcp-speedtest',
  '目标快照与当前编辑区一致',
  '取消恢复',
  '导出目标快照',
  '确认恢复到编辑区',
  '恢复快照前差异预览',
  'bestip-config-restore-target',
  'btn-archive-restore-cancel',
  'btn-archive-restore-export',
  'btn-archive-restore-confirm',
  'exportArchiveRestoreTarget',
  'confirmArchiveRestore',
  'clearArchiveRestorePreview',
  'renderArchiveRestorePreview',
  'archive-restore-preview',
  'pendingArchiveRestore',
  '没有匹配的本地快照档案',
  '包含删除分类',
  '包含新增分类',
  '包含 URL 变更',
  '包含删除线路',
  'removedGroups',
  'addedGroups',
  'changedUrls',
  'removedNodes',
  'archive-empty',
  'archive-filter-summary',
  'renderArchiveList',
  'archiveMatchesFilter',
  'btn-archive-search-clear',
  'archive-filter',
  'archive-search',
  'bestip-config-archive',
  '恢复待保存配置',
  '恢复保存前配置',
  'btn-archive-close',
  'btn-archive-clear',
  'btn-archive-export-all',
  'data-archive-delete',
  'data-archive-restore-tosave',
  'data-archive-restore-before',
  'data-archive-export',
  'setSaveArchives',
  'clearAllArchives',
  'deleteArchiveItem',
  'restoreArchiveConfig',
  'exportArchiveItem',
  'hideArchivePanel',
  'renderArchivePanel',
  'config-archive-panel',
  'btn-archive-toggle',
  '导出本地快照档案',
  '已自动写入本地快照档案',
  'pendingSaveArchiveCount',
  'bestip-config-local-archives',
  'btn-save-export-archive',
  'exportSaveArchive',
  'autoArchiveSavePreview',
  'loadSaveArchives',
  'bestip-config-save-archives',
  'SAVE_ARCHIVE_KEY',
  '导出变更摘要',
  '导出待保存快照',
  '导出保存前快照',
  'bestip-config-change-summary',
  'bestip-config-to-save',
  'bestip-config-before-save',
  'pendingSaveChanges',
  'exportSaveChangeSummary',
  'exportSaveAfterSnapshot',
  'exportSaveBeforeSnapshot',
  'btn-save-export-summary',
  'btn-save-export-after',
  'btn-save-export-before',
  "renderSavePreview(changes)",
  '配置已在预览后发生变化',
  'save-preview-grid',
  'pendingSaveSnapshot',
  'clearSavePreview',
  'submitConfigSave',
  'renderSavePreview',
  'btn-save-cancel',
  'btn-save-apply',
  'config-save-preview',
  '配置没有变化，无需保存',
  'renderSavePreview(changes)',
  'summarizeConfigChanges(globalConfig,adminConfig)',
  '保存配置前变更摘要',
  'import { formatConfigChangeSummary, hasConfigChanges, summarizeConfigChanges } from "./js/config-diff.js"',
  'import-preview-grid',
  'clearImportPreview',
  'applyImportPreview',
  'renderImportPreview',
  'btn-import-cancel',
  'btn-import-apply',
  'config-import-preview',
  '导入 dry-run 校验失败',
  '导入 dry-run 校验通过',
  'import { formatConfigDryRun, validateConfig, validateConfigDetailed } from "./js/config-validator.js"',
  'import { downloadBlob, safeFilePart, stamp } from "./js/download.js"',
  'import { api, adminHeaders } from "./js/api-client.js"',
  'import { $, esc, toast } from "./js/dom.js"',
  'import { REGION_MAP, LOCAL_POOL, PAGE_META } from "./js/constants.js"',
  "document.querySelectorAll('.nav-item')",
  "$('btn-health').onclick",
  "$('btn-export-all').onclick",
  "$('btn-artifacts-refresh').onclick",
  "$('btn-cache-refresh').onclick",
  "$('btn-save-config').onclick"
];

function waitForServer(proc) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("local server did not start in time")), 8000);
    proc.stdout.on("data", chunk => {
      const text = chunk.toString();
      if (text.includes("cf-bestip-panel listening")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    proc.on("exit", code => {
      clearTimeout(timeout);
      reject(new Error(`local server exited early with code ${code}`));
    });
  });
}

async function fetchText(path) {
  const res = await fetch(base + path);
  const text = await res.text();
  assert.equal(res.ok, true, `${path} should be 2xx, got ${res.status}: ${text.slice(0, 120)}`);
  return { res, text };
}

const server = spawn(process.execPath, ["local-server.js"], {
  cwd: root,
  env: { ...process.env, HOST: host, PORT: String(port), ADMIN_TOKEN: "ui-smoke-token" },
  stdio: ["ignore", "pipe", "pipe"]
});

try {
  await waitForServer(server);

  const { res: htmlRes, text: html } = await fetchText("/");
  assert.match(htmlRes.headers.get("content-type") || "", /text\/html/);
  for (const snippet of requiredHtmlSnippets) assert.ok(html.includes(snippet), `index.html missing snippet: ${snippet}`);

  const { res: cssRes, text: css } = await fetchText("/assets/app.css");
  assert.match(cssRes.headers.get("content-type") || "", /text\/css/);
  for (const snippet of [".app-shell", ".sidebar", ".page.active", ".artifact-panel", ".health-table"]) {
    assert.ok(css.includes(snippet), `app.css missing snippet: ${snippet}`);
  }

  const { res: jsRes, text: js } = await fetchText("/assets/app.js");
  assert.match(jsRes.headers.get("content-type") || "", /javascript/);
  for (const snippet of requiredJsSnippets) assert.ok(js.includes(snippet), `app.js missing snippet: ${snippet}`);

  for (const modulePath of frontendModulePaths) {
    const moduleResponse = await fetchText(modulePath);
    assert.match(moduleResponse.res.headers.get("content-type") || "", /javascript/);
    assert.ok(moduleResponse.text.includes("export "), `${modulePath} should export helpers`);
  }

  const config = await fetchText("/api/config");
  const parsedConfig = JSON.parse(config.text);
  assert.equal(Array.isArray(parsedConfig), true, "/api/config should return config array");
  assert.ok(parsedConfig.length > 0, "/api/config should not be empty");

  const manifest = await fetchText("/artifacts/latest/manifest.json");
  const parsedManifest = JSON.parse(manifest.text);
  assert.equal(parsedManifest.ok, true, "static manifest should be ok");

  const localHtml = await readFile(join(root, "index.html"), "utf8");
  assert.equal(localHtml, html, "served index.html should match local file");

  console.log(JSON.stringify({ ok: true, checks: requiredHtmlSnippets.length + requiredJsSnippets.length + 6, base }, null, 2));
} finally {
  server.kill("SIGTERM");
}
