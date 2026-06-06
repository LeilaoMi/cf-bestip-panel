# 测试说明

本文档说明项目当前测试体系、执行顺序和各测试脚本职责。

## 1. 推荐执行顺序

上线前执行：

```bash
npm run predeploy
```

该命令会依次运行：

```text
npm run check
npm run unit
npm test
npm run report
node scripts/predeploy-check.mjs
```

任何一步失败都不建议上线。

## 2. 语法检查

执行：

```bash
npm run check
```

职责：

- 使用 `node --check` 检查 JS/MJS 文件语法；
- 覆盖 API、前端脚本、构建脚本、单元测试脚本和检查脚本；
- 不运行代码逻辑，只做语法层验证。

适合场景：

- 修改 JS/MJS 文件后快速确认语法；
- CI 早期失败拦截；
- 排查导入或语法错误。

## 3. 单元测试

执行：

```bash
npm run unit
```

当前包含四组：

```text
node scripts/unit-test.mjs
node scripts/address-unit-test.mjs
node scripts/build-output-unit-test.mjs
node scripts/source-fetch-unit-test.mjs
```

### 3.1 API / 安全核心单元测试

单独执行：

```bash
node scripts/unit-test.mjs
```

覆盖：

- `ADMIN_TOKEN` 鉴权；
- Bearer Token 接受/拒绝；
- Cloudflare-like 空 Token 安全策略；
- 配置 URL 校验；
- 阻止 localhost / 内网 / 非安全 scheme；
- 配置结构校验；
- 重复 ID；
- 响应体大小限制。

### 3.2 地址分类单元测试

单独执行：

```bash
npm run address-unit
```

覆盖：

- `cleanAddress`；
- 端口范围；
- IPv4，包括前导零拒绝；
- IPv6；
- CIDR；
- 域名和可选端口；
- 分类输出：`subscription`、`ipv4`、`ipv4-port`、`ipv6`、`cidr`、`domain`、`other`。

### 3.3 构建输出单元测试

单独执行：

```bash
npm run build-output-unit
```

覆盖：

- 标准产物文件名；
- all/ipv4/ipv6/domain/proxyip/cidr 文本生成；
- summary 统计；
- health/full/manifest 结构；
- report 生成；
- artifact contents 生成。

### 3.4 源拉取单元测试

单独执行：

```bash
npm run source-fetch-unit
```

覆盖：

- 有效行过滤；
- Base64 解码；
- 标签规范化；
- 注入 fetch；
- 响应体大小限制；
- local 源；
- HTTP 错误；
- 网络错误。

## 4. Smoke test

执行：

```bash
npm test
```

职责：

- 临时启动本地服务；
- 调用关键 API；
- 验证核心端到端行为。

覆盖接口包括：

```text
/api/config
/api/source-health
/api/export-all?format=json&mode=ip-port
/api/export-all?format=json&mode=ip-port&ID=移动&refresh=1
/api/export-all?format=json&mode=ip-port&category=CM优选&refresh=1
/api/edge_ips?regions=US,JP&limit=2
/api/self-test
/api/artifacts
/api/artifact?name=all.txt
/api/cache-status
/api/build-dataset
/api/source-raw
/api/cache-clear
```

重点断言：

- API 可用；
- 数据源可拉取；
- 导出有数据；
- 静态产物 API 可读；
- `/api/build-dataset` 线上保持禁用；
- 管理接口无 Token 返回 401。

## 5. 统一测试报告

执行：

```bash
npm run report
```

职责：

- 汇总 package 脚本；
- 汇总模块化文件；
- 汇总单元测试文件；
- 检查 `artifacts/latest`；
- 检查 `public/artifacts/latest`；
- 检查 manifest；
- 检查 health；
- 检查 GitHub Actions；
- 检查 `_headers`。

输出形式：

- Markdown 风格摘要；
- JSON 报告。

示例目标：

```text
summary: 58/58 passed, 0 failed
```

## 6. 部署前结构检查

执行：

```bash
node scripts/predeploy-check.mjs
```

职责：

- 检查必要文件；
- 检查静态产物；
- 检查 headers；
- 检查 `.env.example`；
- 检查 GitHub Actions；
- 检查安全策略；
- 检查模块导出；
- 检查 package 脚本。

示例目标：

```json
{
  "ok": true,
  "total": 64,
  "failed": 0
}
```

## 7. 数据构建测试

执行：

```bash
npm run build:dataset
npm run report
```

验证点：

- 是否成功拉取所有源；
- `health.summary.ok` 是否合理；
- `health.summary.failed` 是否异常；
- `deduped` 是否大于 0；
- public 产物是否同步。

## 8. 测试失败处理

### 8.1 `npm run check` 失败

处理：

- 查看具体文件名；
- 修复语法；
- 重新执行 `npm run check`。

### 8.2 `npm run unit` 失败

处理：

- 根据失败分组定位：API、安全、地址、构建输出、源拉取；
- 优先修复真实逻辑问题；
- 如果是测试预期过期，应同步更新测试和文档。

### 8.3 `npm test` 失败

处理：

- 查看本地服务是否可启动；
- 查看端口是否被占用；
- 查看上游源是否临时失败；
- 查看管理接口是否仍返回 401。

### 8.4 `npm run report` 失败

处理：

- 检查产物是否缺失；
- 重新执行 `npm run build:dataset`；
- 确认 `public/artifacts/latest` 是否同步；
- 检查 workflow、headers、package 脚本是否被误改。

### 8.5 `predeploy-check` 失败

处理：

- 按失败项逐项修复；
- 不建议跳过；
- 修复后重新执行 `npm run predeploy`。

## 9. 当前测试矩阵

| 类型 | 命令 | 职责 |
| --- | --- | --- |
| 语法检查 | `npm run check` | JS/MJS 语法 |
| 单元测试 | `npm run unit` | 核心纯逻辑与安全逻辑 |
| Smoke test | `npm test` | 本地端到端 API |
| 统一报告 | `npm run report` | 交付状态汇总 |
| 部署前检查 | `node scripts/predeploy-check.mjs` | 文件、产物、安全、CI 检查 |
| 一键全量 | `npm run predeploy` | 上述全部流程 |

## 10. 通过标准

上线前最低标准：

```text
npm run predeploy 通过
npm run report 无失败项
predeploy-check failed = 0
unit failed = 0
smoke test ok = true
```

## 11. 前端 UI Smoke Test

执行：

```bash
npm run ui-smoke
```

职责：

- 启动 `local-server.js`；
- 请求 `/`、`/assets/app.css`、`/assets/app.js`；
- 检查导航、五个页面 section、关键按钮和区域 ID；
- 检查前端初始化与事件绑定函数存在；
- 检查 `/api/config` 返回配置数组；
- 检查 `/artifacts/latest/manifest.json` 可读取。

该测试不依赖浏览器自动化框架，适合作为轻量前端结构 smoke test。


## 12. 前端模块检查

`npm run check` 会检查 `assets/js/*.js` 语法。`npm run ui-smoke` 会检查前端公共模块可通过本地服务访问，并确认 `assets/app.js` 导入这些模块。


## 13. 配置导入 dry-run 测试

`npm run unit` 已包含 `scripts/config-validator-unit-test.mjs`，覆盖合法配置、重复 ID、内网 URL、非法协议、本地源、缺失字段、摘要格式和 `extract` 规范化。


## 14. 配置导入预览 UI 检查

`npm run ui-smoke` 会检查 `config-import-preview`、`btn-import-apply`、`btn-import-cancel`、`renderImportPreview`、`applyImportPreview` 等关键前端结构，避免导入预览 UI 断裂。


## 15. 配置变更摘要测试

`npm run unit` 已包含 `scripts/config-diff-unit-test.mjs`，覆盖新增/删除分类、新增/删除线路、URL 变更、extract 变更、无变化检测和摘要格式。


## 16. 保存配置预览 UI 检查

`npm run ui-smoke` 会检查 `config-save-preview`、`btn-save-apply`、`btn-save-cancel`、`renderSavePreview`、`submitConfigSave`、`pendingSaveSnapshot` 和 stale summary 防护文案。


## 17. 保存预览快照导出检查

`npm run ui-smoke` 会检查 `btn-save-export-before`、`btn-save-export-after`、`btn-save-export-summary`、`exportSaveBeforeSnapshot`、`exportSaveAfterSnapshot`、`exportSaveChangeSummary` 以及导出文件名前缀。


## 18. 保存预览自动本地留档检查

`npm run ui-smoke` 会检查 `SAVE_ARCHIVE_KEY`、`bestip-config-save-archives`、`autoArchiveSavePreview`、`exportSaveArchive`、`btn-save-export-archive`、`bestip-config-local-archives` 等自动本地留档关键结构。


## 19. 本地快照档案管理 UI 检查

`npm run ui-smoke` 会检查 `btn-archive-toggle`、`config-archive-panel`、`renderArchivePanel`、`restoreArchiveConfig`、`deleteArchiveItem`、`clearAllArchives`、恢复按钮和单条导出文件名前缀。


## 20. 本地快照搜索和筛选检查

`npm run ui-smoke` 会检查 `archive-search`、`archive-filter`、`btn-archive-search-clear`、`archiveMatchesFilter`、`renderArchiveList`、筛选项和空结果文案。


## 21. 快照恢复差异预览检查

`npm run ui-smoke` 会检查 `pendingArchiveRestore`、`archive-restore-preview`、`renderArchiveRestorePreview`、`confirmArchiveRestore`、`exportArchiveRestoreTarget`、确认/导出/取消按钮和目标快照导出文件名前缀。

## 22. 本地 TCP 测速检查

本地运行 `node local-server.js` 后，可执行：

```bash
curl -sS -X POST http://127.0.0.1:8788/api/tcp-speedtest \
  -H "content-type: application/json" \
  --data '{"ips":[{"ip":"104.21.1.1","port":"443","cc":"US"}],"threads":1,"timeout":1200}'
```

期望返回 `mode: local-tcp` 和 `results` 数组。

## 23. 原生测速工具闭环检查

`npm run ui-smoke` 会检查：

- `st-export-candidates`；
- `st-export-cfst-command`；
- `st-import-cfst`；
- `st-cfst-file`；
- `speedtestCandidates`；
- `exportSpeedtestCandidates`；
- `exportCfstCommand`；
- `parseCfstRows`；
- `handleCfstFile`。


## 24. 测速结果质量控制检查

`npm run ui-smoke` 会检查 `st-max-latency`、`st-top-n`、`st-export-format`、`st-quality-summary`、`st-export-filtered`、`filteredSpeedtestResults`、`applySpeedtestVisualFilter`、`exportFilteredSpeedtest`。


## 25. v28 UI 回归检查

UI 改造后需至少执行：

```bash
npm run check
npm run ui-smoke
node scripts/predeploy-check.mjs
npm run predeploy
```

本轮 UI 只改 CSS，不改业务 JS，重点确认测速、健康检测、配置保存和导出入口仍可用。


## 26. v29 测速历史检查

`npm run ui-smoke` 会检查历史模块入口和函数，包括 `st-save-history`、`st-toggle-history`、`st-clear-history`、`st-history-panel`、`readSpeedtestHistory`、`saveSpeedtestHistory`、`renderSpeedtestHistory`、`restoreSpeedtestHistory`、`compareSpeedtestHistory`。
