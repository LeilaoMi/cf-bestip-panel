# 版本说明

本文档记录当前交付包的主要版本演进和关键能力。

## 当前版本：v12

当前压缩包：

```text
cf-bestip-panel-cloudflare-optimized-v12.zip
```

当前项目状态：

```text
Cloudflare Pages 适配完成
Pages Functions API 完成
静态数据产物完成
GitHub Actions 自动构建完成
管理接口鉴权完成
核心构建逻辑模块化完成
单元测试与 smoke test 完成
统一测试报告完成
部署/运维/测试/交付文档完成
```

上线前标准：

```bash
npm run predeploy
```

必须通过：

```text
check
unit
smoke test
report
predeploy-check
```

## v12

新增：

- `docs/ARTIFACTS.md`：交付包清单；
- `docs/RELEASE_NOTES.md`：版本说明；
- README 增补交付清单与版本说明入口；
- `predeploy-check` 增加交付清单和版本说明检查。

价值：

- 明确交付包包含哪些关键文件；
- 明确不同目录职责；
- 明确上线相关产物；
- 明确版本演进；
- 方便交付、验收和后续维护。

## v11

新增：

- `docs/DEPLOY.md`：Cloudflare Pages 部署说明；
- `docs/OPERATIONS.md`：日常运维说明；
- `docs/TESTING.md`：测试体系说明；
- README 增加交付文档入口；
- `predeploy-check` 增加交付文档完整性检查。

价值：

- 部署、运维、测试职责拆分；
- 上线流程更清晰；
- 交付给第三方时更易接手。

## v10

新增：

- `scripts/test-report.mjs`；
- `npm run report`；
- `predeploy` 接入统一测试报告；
- `predeploy-check` 增加 report 脚本检查；
- README 增加统一测试报告说明。

价值：

- 汇总 package 脚本、模块化文件、单元测试文件、产物、manifest、health、Actions、headers；
- 提供 Markdown 风格摘要和 JSON 报告；
- 提升交付可读性。

## v9

新增：

- `scripts/lib/source-fetch.mjs`；
- `scripts/source-fetch-unit-test.mjs`；
- `npm run source-fetch-unit`；
- `unit` 接入源拉取单元测试；
- `predeploy-check` 增加源拉取模块检查。

模块职责：

- 源拉取；
- 响应体大小限制；
- Base64 解码；
- 有效行过滤；
- 标签规范化；
- HTTP / 网络错误处理。

价值：

- 构建源拉取逻辑可单独测试；
- `build-dataset.mjs` 更接近 orchestration 脚本。

## v8

新增：

- `scripts/lib/build-output.mjs`；
- `scripts/build-output-unit-test.mjs`；
- `npm run build-output-unit`；
- `unit` 接入构建输出单元测试；
- `predeploy-check` 增加构建输出模块检查。

模块职责：

- all/ipv4/ipv6/domain/proxyip/cidr 文本生成；
- full/health/report/manifest 生成；
- 构建 summary；
- 分类统计。

价值：

- 数据产物生成逻辑可单独测试；
- 降低构建脚本复杂度。

## v7

新增：

- `scripts/lib/address.mjs`；
- `scripts/address-unit-test.mjs`；
- `npm run address-unit`；
- `unit` 接入地址分类测试；
- README 增加地址分类模块说明。

模块职责：

- 地址清理；
- IPv4 校验；
- IPv6 校验；
- CIDR 校验；
- 域名校验；
- 端口校验；
- 输出分类。

价值：

- 地址分类逻辑从构建脚本中抽离；
- 提高分类准确性和可维护性。

## v6

新增：

- `.env.example`；
- `_headers`；
- `docs/cloudflare-deploy-checklist.md`；
- `scripts/predeploy-check.mjs`；
- `npm run predeploy`；
- GitHub Actions 检查强化。

价值：

- 上线前自动检查；
- 安全响应头与缓存策略明确；
- 环境变量示例规范化。

## v5

新增：

- GitHub Actions 构建数据产物；
- 静态产物自动提交；
- workflow 检查 `npm run check`、`npm run unit`、`npm run build:dataset`、`npm test`；
- Cloudflare Pages 线上禁用动态 build API。

价值：

- 避免 Cloudflare Pages 线上写文件；
- 用 CI 构建静态数据产物；
- 提升线上部署稳定性。

## v4

新增：

- 静态 artifacts 访问；
- `/api/artifacts`；
- `/api/artifact`；
- `public/artifacts/latest` 同步；
- 页面读取静态产物。

价值：

- Cloudflare Pages 可直接访问静态数据；
- 降低线上动态计算依赖。

## v3

新增：

- 缓存状态接口；
- 缓存清理接口；
- 原始源读取接口；
- 源解析接口；
- 管理接口鉴权强化。

价值：

- 提升调试与运维能力；
- 管理接口更安全。

## v2

新增：

- 数据产物构建脚本；
- `artifacts/latest` 标准产物；
- `health.json`；
- `report.md`；
- 构建结果同步到 public。

价值：

- 数据可离线构建；
- 有构建健康状态和报告。

## v1

初始能力：

- BestIP 管理台页面；
- 真实公开源配置；
- 仪表盘；
- 源健康检测；
- 全源导出；
- 全球优选；
- 在线测速；
- 配置中心；
- 本地 smoke test。

## 当前测试状态

最近一次全量检查目标：

```text
npm run predeploy 通过
npm run report 通过
predeploy-check failed = 0
unit failed = 0
smoke test ok = true
```

## 后续建议版本方向

### v13 建议：前端模块化

目标：

```text
拆分 assets/app.js
降低前端单文件复杂度
提升可维护性
```

### v14 建议：Wrangler Pages Dev 测试

目标：

```text
新增 npm run test:wrangler
更接近 Cloudflare Pages Runtime
```

### v15 建议：前端 UI 自动化测试

目标：

```text
增加关键页面交互测试
验证仪表盘、导出、配置中心、数据产物页面
```

## v16

新增：

- `assets/js/config-validator.js` 前端配置校验模块；
- 配置导入前 dry-run 校验和确认摘要；
- 默认配置恢复也执行 dry-run 校验；
- `scripts/config-validator-unit-test.mjs` 单元测试；
- `check`、`unit`、`ui-smoke`、`report`、`predeploy-check` 接入配置校验模块检查。

价值：

- 降低错误配置导入导致线上不可用的风险；
- 提前发现重复 ID、非法 URL、内网地址和结构错误。


## v17

新增：

- 配置导入页面内预览区域 `config-import-preview`；
- `renderImportPreview`、`clearImportPreview`、`applyImportPreview`；
- 导入流程从 `confirm()` 升级为页面内统计、错误、警告和确认按钮；
- UI smoke 和 predeploy-check 纳入导入预览 UI 检查。

价值：

- 大量配置导入时更清晰；
- 错误和警告可停留在页面上查看；
- 避免用户在 `confirm()` 弹窗中遗漏关键信息。


## v18

新增：

- `assets/js/config-diff.js` 配置差异摘要模块；
- 保存配置前变更摘要确认；
- 无变化配置提示无需保存；
- `scripts/config-diff-unit-test.mjs` 单元测试；
- `check`、`unit`、`ui-smoke`、`report`、`predeploy-check` 接入配置变更摘要检查。

价值：

- 保存前明确知道本次修改内容；
- 降低误删除分类、误改 URL、误切换提取模式的风险。


## v19

新增：

- 保存配置页面内预览区域 `config-save-preview`；
- `renderSavePreview`、`clearSavePreview`、`submitConfigSave`；
- 保存确认从 `confirm()` 升级为页面内统计、详情和确认按钮；
- `pendingSaveSnapshot` 防止预览后继续编辑导致过期摘要保存；
- UI smoke 和 predeploy-check 纳入保存预览 UI 检查。

价值：

- 大量配置修改时更易审查；
- 与导入预览 UI 交互保持一致；
- 防止 stale summary 下误保存。


## v20

新增：

- 保存预览 UI 中增加“导出保存前快照”；
- 增加“导出待保存快照”；
- 增加“导出变更摘要”；
- `pendingSaveChanges` 保存当前预览对应的差异摘要；
- 导出待保存快照和摘要时复用 stale summary 防护。

价值：

- 提交线上配置前可留存回滚依据；
- 大量配置变更可单独归档审计；
- 进一步降低误保存后的恢复成本。


## v21

新增：

- 保存预览生成时自动写入 localStorage 本地快照档案；
- localStorage 键名 `bestip-config-save-archives`；
- 最多保留 20 条快照档案；
- 保存预览中新增“导出本地快照档案”；
- `predeploy-check` 和 `ui-smoke` 纳入自动本地留档检查。

价值：

- 管理员忘记手动导出时仍有本地留档；
- 可一次性导出历史保存预览档案；
- 与手动快照导出形成双保险。


## v22

新增：

- 配置中心“本地快照档案”管理面板；
- 查看 localStorage 档案列表；
- 导出单条档案；
- 恢复保存前配置；
- 恢复待保存配置；
- 删除单条档案；
- 清空全部档案；
- 恢复后自动进入保存预览流程。

价值：

- 本地档案从“可导出”升级为“可管理、可恢复”；
- 误保存后的回滚路径更短；
- 恢复动作仍通过保存预览确认，避免直接覆盖线上配置。


## v23

新增：

- 本地快照档案搜索框；
- 按时间戳和变更摘要搜索；
- 筛选包含删除线路的快照；
- 筛选包含 URL 变更的快照；
- 筛选包含新增分类的快照；
- 筛选包含删除分类的快照；
- 搜索结果数量摘要和空结果提示。

价值：

- 本地快照多时更容易定位某次变更；
- 回滚前可快速找到相关快照；
- 为下一步恢复前差异预览打基础。


## v24

新增：

- 快照恢复前差异预览；
- 恢复保存前配置/待保存配置不再立即写入编辑区；
- 新增确认恢复到编辑区；
- 新增取消恢复；
- 新增导出目标快照；
- 确认恢复后继续进入保存预览流程。

价值：

- 避免误恢复到错误快照；
- 恢复前可查看具体变化；
- 与保存预览形成双层确认。

## v25

修复：

- 原浏览器裸 IP 图片测速不可用/不可靠；
- 新增本地 `/api/tcp-speedtest`；
- 前端测速优先调用本地 TCP 测速；
- 不支持时显示明确限制说明，不再静默失败。

说明：Cloudflare Pages 线上环境不支持 Node TCP socket，最终测速仍建议使用 CloudflareSpeedTest / cfst 或自建后端测速。

## v25

修复：

- 原浏览器裸 IP 图片测速不可用/不可靠；
- 新增本地 `/api/tcp-speedtest`；
- 前端测速优先调用本地 TCP 测速；
- 不支持时显示明确限制说明，不再静默失败。

说明：Cloudflare Pages 线上环境不支持 Node TCP socket，最终测速仍建议使用 CloudflareSpeedTest / cfst 或自建后端测速。

## v26

新增：

- 测速页导出候选 IP；
- 导出 CloudflareSpeedTest/cfst 命令模板；
- 导入原生测速 CSV；
- 将导入结果回填页面并支持导出到线路页。

价值：

- 本地可用 TCP 测速；
- 线上 Pages 环境可通过导出/导入方式完成原生测速闭环；
- 避免继续依赖浏览器裸 IP 伪测速。


## v27

新增：

- 测速结果延迟阈值过滤；
- 保留前 N；
- 当前筛选统计；
- 可见结果随筛选同步隐藏/显示；
- 筛选结果下载；
- `ip:port#地区_ms`、`ip:port`、CSV 三种导出格式。


## v28

新增/调整：

- 页面风格改为 Cloudflare SaaS + 企业后台混合风；
- 浅色正式后台；
- Cloudflare 橙色主色；
- 白色侧栏与卡片；
- 表格、按钮、输入框、测速结果、配置面板统一视觉；
- 保留 `assets/app.css.v27.backup` 用于回滚。


## v29

新增：

- 保存测速历史；
- 展示测速历史面板；
- 恢复历史测速结果；
- 单条历史导出；
- 清空历史；
- 与上一条历史对比变好/变差/持平/新增；
- predeploy 新增 `speedtest history module is wired` 检查。


### 提交前最终补强

已移除 UI 中的外部 Google Fonts 依赖，改用系统字体栈，避免 Cloudflare Pages 部署后因外部字体加载影响首屏或离线可用性。
