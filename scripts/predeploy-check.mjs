import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const checks = [];

function add(name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
}

async function readText(rel) {
  return readFile(join(root, rel), "utf8");
}

async function fileExists(rel) {
  return existsSync(join(root, rel));
}

async function fileNonEmpty(rel) {
  try {
    const info = await stat(join(root, rel));
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

async function jsonFile(rel) {
  try {
    return JSON.parse(await readText(rel));
  } catch {
    return null;
  }
}

const requiredFiles = [
  "index.html",
  "assets/app.js",
  "assets/js/download.js",
  "assets/js/api-client.js",
  "assets/js/dom.js",
  "assets/js/constants.js",
  "config.json",
  "functions/api/_config.js",
  "functions/api/_http.js",
  "functions/api/config.js",
  "functions/api/export-all.js",
  "functions/api/build-dataset.js",
  "scripts/self-test.mjs",
  "scripts/build-dataset.mjs",
  "scripts/lib/address.mjs",
  "scripts/lib/build-output.mjs",
  "scripts/lib/source-fetch.mjs",
  "scripts/predeploy-check.mjs",
  "scripts/unit-test.mjs",
  "scripts/address-unit-test.mjs",
  "scripts/build-output-unit-test.mjs",
  "scripts/source-fetch-unit-test.mjs",
  "scripts/test-report.mjs",
  "scripts/ui-smoke-test.mjs",
  "scripts/config-validator-unit-test.mjs",
  "assets/js/config-validator.js",
  "scripts/config-diff-unit-test.mjs",
  "assets/js/config-diff.js",
  ".github/workflows/build-dataset.yml",
  "_headers",
  ".env.example",
  "docs/cloudflare-deploy-checklist.md"
];

for (const rel of requiredFiles) {
  add(`required file: ${rel}`, await fileNonEmpty(rel));
}

const manifest = await jsonFile("artifacts/latest/manifest.json");
add("artifacts manifest exists and is valid JSON", manifest?.ok === true && Array.isArray(manifest.files), manifest ? `${manifest.files?.length || 0} files` : "missing/invalid");

const publicManifest = await jsonFile("public/artifacts/latest/manifest.json");
add("public artifacts manifest exists and is valid JSON", publicManifest?.ok === true && Array.isArray(publicManifest.files), publicManifest ? `${publicManifest.files?.length || 0} files` : "missing/invalid");

for (const rel of ["artifacts/latest/all.txt", "artifacts/latest/health.json", "public/artifacts/latest/all.txt", "public/artifacts/latest/health.json"]) {
  add(`artifact non-empty: ${rel}`, await fileNonEmpty(rel));
}

const headers = await readText("_headers").catch(() => "");
add("_headers has no-store for /api/*", /\/api\/\*\s+Cache-Control: no-store/s.test(headers));
add("_headers has no-store for manifest", /\/artifacts\/latest\/manifest\.json\s+Cache-Control: no-store/s.test(headers));
add("_headers has security headers", ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"].every(h => headers.includes(h)));

const envExample = await readText(".env.example").catch(() => "");
add(".env.example documents ADMIN_TOKEN", envExample.includes("ADMIN_TOKEN="));
add(".env.example documents build limits", envExample.includes("BUILD_CONCURRENCY=") && envExample.includes("BUILD_MAX_SOURCE_BYTES="));

const workflow = await readText(".github/workflows/build-dataset.yml").catch(() => "");
add("workflow runs npm run check", workflow.includes("npm run check"));
add("workflow runs npm run unit", workflow.includes("npm run unit"));
add("workflow runs npm run build:dataset", workflow.includes("npm run build:dataset"));
add("workflow runs npm test", workflow.includes("npm test"));
add("workflow uploads artifacts", workflow.includes("actions/upload-artifact@v4"));
add("workflow commits artifacts", workflow.includes("stefanzweifel/git-auto-commit-action@v5"));

const configApi = await readText("functions/api/config.js").catch(() => "");
add("config POST uses authorization", configApi.includes("isAuthorized") && configApi.includes("Unauthorized"));
add("config POST validates config", configApi.includes("validateConfig"));

const cacheClearApi = await readText("functions/api/cache-clear.js").catch(() => "");
add("cache-clear requires authorization", cacheClearApi.includes("isAuthorized") && cacheClearApi.includes("Unauthorized"));

const sourceRawApi = await readText("functions/api/source-raw.js").catch(() => "");
add("source-raw requires authorization", sourceRawApi.includes("isAuthorized") && sourceRawApi.includes("Unauthorized"));

const buildApi = await readText("functions/api/build-dataset.js").catch(() => "");
add("online build-dataset API is disabled", buildApi.includes("status: 403") && buildApi.includes("不支持在线生成"));

const configCore = await readText("functions/api/_config.js").catch(() => "");
add("config validator blocks private hosts", ["localhost", "127.0.0.1", "192.168.", "10."].every(s => configCore.includes(s)));
add("config validator allows only http/https/local", configCore.includes("validateSourceUrl") && configCore.includes("http:") && configCore.includes("https:") && configCore.includes("local:"));

const addressCore = await readText("scripts/lib/address.mjs").catch(() => "");
add("address module exposes classify", addressCore.includes("export function classify"));
add("address module exposes IPv4/IPv6/CIDR/domain validators", ["isValidIPv4", "isValidIPv6", "isValidCidr", "isValidDomain"].every(name => addressCore.includes(`export function ${name}`)));
const buildOutputCore = await readText("scripts/lib/build-output.mjs").catch(() => "");
add("build-output module exposes artifact builders", ["buildHealth", "buildFull", "buildReport", "buildManifest", "buildArtifactContents"].every(name => buildOutputCore.includes(`export function ${name}`)));
const sourceFetchCore = await readText("scripts/lib/source-fetch.mjs").catch(() => "");
add("source-fetch module exposes fetch helpers", ["fetchTextWithLimit", "usefulLines", "tryDecodeBase64", "normalize", "fetchSource"].every(name => new RegExp(`export\\s+(async\\s+)?function\\s+${name}\\b`).test(sourceFetchCore)));

const deployDoc = await readText("docs/DEPLOY.md").catch(() => "");
const operationsDoc = await readText("docs/OPERATIONS.md").catch(() => "");
const testingDoc = await readText("docs/TESTING.md").catch(() => "");
add("delivery docs include deploy operations testing", deployDoc.includes("Cloudflare Pages") && operationsDoc.includes("运维") && testingDoc.includes("npm run predeploy"));

const frontendConstants = await readText("assets/js/constants.js").catch(() => "");
const frontendDom = await readText("assets/js/dom.js").catch(() => "");
const frontendApi = await readText("assets/js/api-client.js").catch(() => "");
const frontendDownload = await readText("assets/js/download.js").catch(() => "");
const frontendApp = await readText("assets/app.js").catch(() => "");
const localServer = await readText("local-server.js").catch(() => "");
const indexHtml = await readText("index.html").catch(() => "");
const appCss = await readText("assets/app.css").catch(() => "");
const configValidator = await readText("assets/js/config-validator.js").catch(() => "");
add("config import dry-run validator is wired", configValidator.includes("validateConfigDetailed") && configValidator.includes("validateSourceUrl") && frontendApp.includes("导入 dry-run 校验") && frontendApp.includes("validateConfigDetailed(data,{normalize:true})"));
add("config import preview ui is wired", indexHtml.includes("config-import-preview") && appCss.includes(".import-preview") && frontendApp.includes("renderImportPreview") && frontendApp.includes("btn-import-apply") && frontendApp.includes("pendingImportConfig"));
const configDiff = await readText("assets/js/config-diff.js").catch(() => "");
add("config save change summary is wired", configDiff.includes("summarizeConfigChanges") && configDiff.includes("formatConfigChangeSummary") && frontendApp.includes("保存配置前变更摘要") && frontendApp.includes("summarizeConfigChanges(globalConfig,adminConfig)"));
add("config save preview ui is wired", indexHtml.includes("config-save-preview") && appCss.includes(".save-preview") && frontendApp.includes("renderSavePreview") && frontendApp.includes("btn-save-apply") && frontendApp.includes("pendingSaveSnapshot") && frontendApp.includes("配置已在预览后发生变化"));
add("config save snapshot exports are wired", frontendApp.includes("exportSaveBeforeSnapshot") && frontendApp.includes("exportSaveAfterSnapshot") && frontendApp.includes("exportSaveChangeSummary") && frontendApp.includes("btn-save-export-before") && frontendApp.includes("bestip-config-before-save") && frontendApp.includes("bestip-config-change-summary"));
add("config save local archive is wired", frontendApp.includes("SAVE_ARCHIVE_KEY") && frontendApp.includes("bestip-config-save-archives") && frontendApp.includes("autoArchiveSavePreview") && frontendApp.includes("exportSaveArchive") && frontendApp.includes("btn-save-export-archive") && frontendApp.includes("bestip-config-local-archives"));
add("config local archive manager is wired", indexHtml.includes("btn-archive-toggle") && indexHtml.includes("config-archive-panel") && appCss.includes(".archive-panel") && frontendApp.includes("renderArchivePanel") && frontendApp.includes("restoreArchiveConfig") && frontendApp.includes("deleteArchiveItem") && frontendApp.includes("clearAllArchives") && frontendApp.includes("bestip-config-archive"));
add("config archive search filter is wired", indexHtml.includes("archive-search") && indexHtml.includes("archive-filter") && appCss.includes(".archive-filter-summary") && frontendApp.includes("archiveMatchesFilter") && frontendApp.includes("renderArchiveList") && frontendApp.includes("btn-archive-search-clear") && frontendApp.includes("包含 URL 变更"));
add("config archive restore preview is wired", frontendApp.includes("pendingArchiveRestore") && frontendApp.includes("archive-restore-preview") && frontendApp.includes("renderArchiveRestorePreview") && frontendApp.includes("confirmArchiveRestore") && frontendApp.includes("exportArchiveRestoreTarget") && frontendApp.includes("btn-archive-restore-confirm") && frontendApp.includes("bestip-config-restore-target"));
add("local tcp speedtest is wired", localServer.includes("node:net") && localServer.includes("handleTcpSpeedtest") && localServer.includes("/api/tcp-speedtest") && frontendApp.includes("renderSpeedtestResults") && frontendApp.includes("/api/tcp-speedtest") && frontendApp.includes("浏览器无法可靠测 Cloudflare 裸 IP"));
add("speedtest native tool workflow is wired", indexHtml.includes("st-export-candidates") && indexHtml.includes("st-cfst-file") && frontendApp.includes("speedtestCandidates") && frontendApp.includes("exportSpeedtestCandidates") && frontendApp.includes("exportCfstCommand") && frontendApp.includes("parseCfstRows") && frontendApp.includes("handleCfstFile") && frontendApp.includes("CloudflareST -f"));
add("speedtest quality controls are wired", indexHtml.includes("st-max-latency") && indexHtml.includes("st-top-n") && indexHtml.includes("st-export-format") && indexHtml.includes("st-quality-summary") && indexHtml.includes("st-export-filtered") && frontendApp.includes("filteredSpeedtestResults") && frontendApp.includes("applySpeedtestVisualFilter") && frontendApp.includes("exportFilteredSpeedtest") && frontendApp.includes("bestip-speedtest-filtered"));
add("speedtest history module is wired", indexHtml.includes("st-save-history") && indexHtml.includes("st-history-panel") && frontendApp.includes("SPEEDTEST_HISTORY_KEY") && frontendApp.includes("saveSpeedtestHistory") && frontendApp.includes("renderSpeedtestHistory") && frontendApp.includes("restoreSpeedtestHistory") && frontendApp.includes("compareSpeedtestHistory"));


add("frontend lightweight modules exported", frontendConstants.includes("export const REGION_MAP") && frontendDom.includes("export const $") && frontendApi.includes("export async function api") && frontendDownload.includes("export function downloadBlob"));
add("app imports lightweight frontend modules", frontendApp.includes("./js/constants.js") && frontendApp.includes("./js/dom.js") && frontendApp.includes("./js/api-client.js") && frontendApp.includes("./js/download.js"));

const uiSmokeCore = await readText("scripts/ui-smoke-test.mjs").catch(() => "");
add("ui smoke test checks frontend structure", uiSmokeCore.includes("requiredHtmlSnippets") && uiSmokeCore.includes("requiredJsSnippets") && uiSmokeCore.includes("local-server.js"));

const finalHandoffDoc = await readText("docs/FINAL_HANDOFF.md").catch(() => "");
add("final handoff doc covers delivery essentials", ["项目定位", "Cloudflare Pages 部署要点", "环境变量", "上线后验收", "已知限制"].every(text => finalHandoffDoc.includes(text)));

const artifactsDoc = await readText("docs/ARTIFACTS.md").catch(() => "");
const releaseNotesDoc = await readText("docs/RELEASE_NOTES.md").catch(() => "");
add("release docs include artifacts and release notes", artifactsDoc.includes("交付包清单") && releaseNotesDoc.includes("当前版本：v12"));

const testReportCore = await readText("scripts/test-report.mjs").catch(() => "");
add("test-report script checks artifacts and scripts", testReportCore.includes("requiredArtifacts") && testReportCore.includes("requiredScripts"));

const httpCore = await readText("functions/api/_http.js").catch(() => "");
add("fetchTextWithLimit exists", httpCore.includes("fetchTextWithLimit") && httpCore.includes("Response too large"));

const app = await readText("assets/app.js").catch(() => "");
add("frontend does not hard-code ADMIN_TOKEN value", !/Bearer\s+[A-Za-z0-9_-]{16,}/.test(app));
add("frontend uses static artifact path", app.includes("/artifacts/latest/manifest.json") || app.includes("/artifacts/latest/"));

const pkg = await jsonFile("package.json");
add("package has check script", Boolean(pkg?.scripts?.check));
add("package has test script", Boolean(pkg?.scripts?.test));
add("package has unit script", Boolean(pkg?.scripts?.unit));
add("package has address-unit script", Boolean(pkg?.scripts?.["address-unit"]));
add("package has build-output-unit script", Boolean(pkg?.scripts?.["build-output-unit"]));
add("package has source-fetch-unit script", Boolean(pkg?.scripts?.["source-fetch-unit"]));
add("package has build:dataset script", Boolean(pkg?.scripts?.["build:dataset"]));
add("package has predeploy script", Boolean(pkg?.scripts?.predeploy));
add("package has report script", Boolean(pkg?.scripts?.report));
add("package has ui-smoke script", Boolean(pkg?.scripts?.["ui-smoke"]));

const failed = checks.filter(item => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "✓" : "✗"} ${item.name}${item.detail ? ` — ${item.detail}` : ""}`);
}

console.log(JSON.stringify({ ok: failed.length === 0, total: checks.length, failed: failed.length }, null, 2));

if (failed.length) process.exitCode = 1;
