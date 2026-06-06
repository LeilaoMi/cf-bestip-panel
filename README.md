# 优选 IP 管理台

一个本地已完成、可迁移到 Cloudflare Pages 的 BestIP/优选 IP 管理台。项目不是原站源码，而是基于公开页面与公开 API 重新实现的独立版本。

## 当前能力

- 📊 仪表盘：检测真实源状态、行数、耗时、失败/慢源筛选、单源重测。
- 🔗 线路提取：按 11 个分类拉取 73 条公开源内容，支持搜索、单源导出、单分类导出。
- 🌍 全球优选：按国家/地区调用真实优选接口提取结果。
- ⚡ 在线测速：浏览器端按端口/并发测试延迟，可导出到线路页。
- ⚙️ 配置中心：增删改线路、导入/导出 JSON、恢复默认真实源、保存前校验。
- 📦 一键导出全部源：支持带备注、IP:端口、纯 IP、CSV、Base64 订阅。
- 🧪 一键自检：`/api/self-test` 与 `npm test`。
- 🗂️ 数据产物：生成 `all.txt / ipv4.txt / ipv6.txt / domain.txt / proxyip.txt / cidr.txt / full.json / health.json / report.md`。
- 🧊 缓存管理：健康检测与全源导出默认 30 分钟缓存，支持手动清空/强制刷新。

## 项目结构

```text
cf-bestip-panel/
├── index.html                 # 页面入口
├── assets/
│   ├── app.css                # 左侧导航管理台样式
│   └── app.js                 # 前端交互逻辑
├── functions/api/
│   ├── _data.js               # 备用样例数据
│   ├── _health.js             # 源检测公共逻辑
│   ├── config.js              # GET/POST 配置
│   ├── ips.js                 # 按 ID 拉取线路
│   ├── edge_ips.js            # 全球优选提取
│   ├── _cache.js              # 30 分钟内存缓存
│   ├── source-health.js       # 批量健康检测
│   ├── source-check.js        # 单源重测
│   ├── export-all.js          # 全源合并导出
│   ├── artifacts.js           # 数据产物清单
│   ├── artifact.js            # 单个数据产物读取
│   ├── build-dataset.js       # 本地触发数据产物生成
│   ├── cache-status.js        # 缓存状态
│   ├── cache-clear.js         # 清空缓存
│   ├── ip-check.js            # 访问 IP 检测
│   └── self-test.js           # API 自检
├── scripts/
│   ├── build-dataset.mjs      # 生成 artifacts/latest 标准产物
│   └── self-test.mjs          # 本地自检脚本
├── artifacts/latest/          # 自动生成的数据产物
├── config.json                # 当前真实源配置（根路径访问）
├── default-config.json        # 默认真实源配置
├── public/
│   ├── config.json
│   └── default-config.json
├── local-server.js            # Zo/本地预览服务
├── package.json
└── wrangler.toml
```

## 本地运行

```bash
npm install
npm run start
```

默认监听 `8788`。

## 数据产物生成

```bash
npm run build:dataset
```

输出目录：`artifacts/latest/`。

生成文件：

```text
all.txt
ipv4.txt
ipv6.txt
domain.txt
proxyip.txt
cidr.txt
full.json
health.json
report.md
```

页面仪表盘也提供“重新生成数据产物”按钮；这是本地 Zo/Node 能力。Cloudflare Pages 线上环境不应依赖写文件和子进程，线上建议用 GitHub Actions 生成后发布静态产物。

## 本地自检

```bash
npm run check
npm test
```

`npm test` 会临时启动本地服务并验证：

- `/api/config`
- `/api/source-health`
- `/api/export-all?format=json&mode=ip-port`
- `/api/export-all?format=json&mode=ip-port&ID=移动&refresh=1`
- `/api/export-all?format=json&mode=ip-port&category=CM优选&refresh=1`
- `/api/edge_ips?regions=US,JP&limit=2`
- `/api/self-test`
- `/api/artifacts`
- `/api/artifact?name=all.txt`
- `/api/cache-status`
- `/api/build-dataset`

## 配置说明

当前真实源配置在：

- `config.json`
- `public/config.json`

默认备份在：

- `default-config.json`
- `public/default-config.json`

配置项格式：

```json
{
  "groupName": "CM优选",
  "nodes": [
    {
      "ID": "移动",
      "url": "https://cf.090227.xyz/cmcc?ips=25",
      "extract": false
    }
  ]
}
```

`extract: true` 表示前端/API 会尝试把 Base64 订阅内容解码。

## Cloudflare Pages 部署重点

- 数据产物已改为静态访问：`/artifacts/latest/manifest.json` 和 `/artifacts/latest/*`。
- `/api/build-dataset` 已禁用，线上请使用 GitHub Actions 生成产物。
- `/api/config` POST、`/api/cache-clear`、`/api/source-raw` 需要 `ADMIN_TOKEN`。
- 如需线上保存配置，请绑定 KV：`BESTIP_KV`。
- 已提供 `.github/workflows/build-dataset.yml` 每 6 小时更新产物。

## Cloudflare Pages 部署准备

Pages 构建设置：

- Build command：留空
- Build output directory：`.`

Functions 会自动映射为 `/api/*`。

### KV 持久化配置

如果希望线上“配置中心”可保存，需要创建 KV，并绑定为 `BESTIP_KV`：

```toml
[[kv_namespaces]]
binding = "BESTIP_KV"
id = "你的 KV namespace id"
```

未绑定 KV 时，线上仍可读取静态 `config.json`，但 POST 保存会失败；本地 Zo 预览会写回文件。

## 当前 Zo 本地服务

- URL：`https://cf-bestip-panel-truepuma.zo.computer`
- Service label：`cf-bestip-panel`
- Entry：`node local-server.js`
- Port：`8788`

## 注意

- 本项目已接入原站公开 `/api/config` 中的真实源，但不包含任何私有源码或凭证。
- 真实源可能随时间失效，使用仪表盘健康检测及时发现。
- `/api/source-health` 与 `/api/export-all` 默认使用 30 分钟缓存；强制刷新可带 `refresh=1`。
- `/api/build-dataset` 使用 Node 子进程，只适合本地 Zo 服务；Cloudflare Pages 线上部署前应禁用或改成 GitHub Actions。
- 线上部署、GitHub push、域名绑定前需要再次确认。

### Headers、环境变量与 Actions

- `_headers` 提供基础安全响应头和静态产物缓存策略。
- `.env.example` 给出本地/Cloudflare 所需环境变量示例。
- `.github/workflows/build-dataset.yml` 会执行 `npm run check`、`npm run unit`、`npm run build:dataset`、`npm test`，并上传/提交数据产物。

### 上线前一键检查

执行：

```bash
npm run predeploy
```

该命令会依次运行：

1. `npm run check`：语法检查；
2. `npm run unit`：API/安全核心单元测试；
3. `npm test`：本地 Cloudflare 兼容 smoke test；
4. `scripts/predeploy-check.mjs`：部署前文件、产物、安全、Actions、Headers 检查。

### API 单元测试

执行：

```bash
npm run unit
```

当前覆盖：鉴权、配置 URL 安全、配置结构校验、重复 ID、响应体大小限制、地址分类、构建输出产物生成、源拉取/解码/规范化。

### 地址分类模块

构建脚本的地址校验与分类逻辑已模块化到：

```text
scripts/lib/address.mjs
```

可单独执行：

```bash
npm run address-unit
```

当前覆盖：IPv4、IPv6、CIDR、域名、端口、注释标签清理、分类输出。


### 构建输出模块

数据产物生成相关纯函数已模块化到：

```text
scripts/lib/build-output.mjs
```

可单独执行：

```bash
npm run build-output-unit
```

当前覆盖：产物文件名、分类文本输出、ProxyIP 输出、health/full/manifest/report 结构、artifact contents 生成。


### 源拉取模块

数据源拉取、响应体大小限制、Base64 解码、有效行过滤与标签规范化逻辑已模块化到：

```text
scripts/lib/source-fetch.mjs
```

可单独执行：

```bash
npm run source-fetch-unit
```

当前覆盖：有效行过滤、Base64 解码、标签规范化、响应体大小限制、local 源、HTTP 错误、网络错误。


### 统一测试报告

执行：

```bash
npm run report
```

该脚本会汇总 package 脚本、单元测试文件、模块化文件、静态产物、manifest、health、GitHub Actions 与 headers 状态，并输出 Markdown 风格摘要和 JSON 报告。`npm run predeploy` 已包含该步骤。


### 交付文档

正式交付时建议按职责阅读：

```text
docs/DEPLOY.md       # Cloudflare Pages 部署、环境变量、KV、上线验收与回滚
docs/OPERATIONS.md  # 日常运维、数据源、缓存、产物和故障处理
docs/TESTING.md     # 测试体系、执行顺序、失败处理和通过标准
```

上线前最低标准：

```bash
npm run predeploy
```


### 交付清单与版本说明

```text
docs/ARTIFACTS.md      # 交付包关键文件、目录职责、静态产物与推荐交付顺序
docs/RELEASE_NOTES.md  # v1-v12 版本演进、当前能力和后续建议方向
```

当前交付包命名：

```text
cf-bestip-panel-cloudflare-optimized-v12.zip
```


### 前端 UI Smoke Test

执行：

```bash
npm run ui-smoke
```

该脚本会启动本地服务并检查首页、CSS、前端 JS、关键页面区域、导航按钮、配置接口和静态 manifest，`npm run predeploy` 已包含该步骤。


### 前端轻量模块化

当前 `assets/app.js` 仍保持单入口，但已抽离公共模块：

```text
assets/js/constants.js   # 地区常量、本地测速池、页面标题元信息
assets/js/dom.js         # DOM 获取、HTML 转义、toast
assets/js/api-client.js  # JSON API 请求、管理员 Token Header
assets/js/download.js    # 文件名时间戳、安全文件名、Blob 下载
```

### 最终交付摘要

正式交付和项目接手建议优先阅读：

```text
docs/FINAL_HANDOFF.md
```

该文档集中说明项目能力、Cloudflare Pages 部署方式、环境变量、质量检查、上线验收、维护方式、已知限制和后续建议。


### 配置导入 dry-run 校验

管理台导入 JSON 配置前会先执行 dry-run 校验，检查数组结构、分类名称、nodes、重复 ID、URL 协议、本地/内网地址和 `extract` 类型，并在确认后才写入配置中心待保存。


### 配置导入预览 UI

导入 JSON 配置后会先在配置中心显示页面内预览，包含统计、错误、警告和“确认应用导入 / 取消导入”按钮。确认应用后仍需点击“保存配置”才会写入线上配置。


### 保存配置前变更摘要

点击“保存配置”前，前端会对比当前线上配置和编辑区配置，显示新增/删除分类、新增/删除线路、URL 变更、提取模式变更和未变化线路数量。用户确认后才会提交到 `/api/config`。


### 保存配置页面内预览 UI

点击“保存配置”后会先在配置中心显示页面内保存预览，包含差异统计、详情、“确认保存到线上配置”和“取消保存”。如果预览后继续修改配置，需要重新生成摘要，避免使用过期摘要保存。


### 保存预览快照导出

保存配置预览中提供“导出保存前快照”“导出待保存快照”“导出变更摘要”三个按钮，便于管理员在提交线上配置前留档和回滚。


### 保存预览自动本地留档

生成保存预览时，系统会自动把保存前快照、待保存快照、变更摘要和时间戳写入浏览器 `localStorage`，最多保留 20 条，并提供“导出本地快照档案”按钮。


### 本地快照档案管理 UI

配置中心提供“本地快照档案”面板，可查看 localStorage 中的保存预览档案，并支持导出单条、恢复保存前配置、恢复待保存配置、删除单条和清空全部。恢复操作只写入编辑区并重新生成保存预览，仍需确认保存才会提交线上配置。


### 本地快照搜索和筛选

本地快照档案面板支持按时间或变更摘要搜索，并可筛选包含删除线路、URL 变更、新增分类、删除分类的快照，便于快速定位历史变更。


### 快照恢复差异预览

从本地快照恢复保存前配置或待保存配置时，会先展示“当前编辑区 vs 目标快照”的差异预览。确认后才恢复到编辑区，并继续进入保存预览流程；也可取消恢复或导出目标快照。

### 本地 TCP 测速说明

在线测速已从浏览器裸 IP 图片探测改为本地 Node TCP 连通测速。浏览器无法可靠测试 Cloudflare 裸 IP，因为 HTTPS 证书、SNI/Host 和跨域限制会导致误判；本地开发服务提供 `/api/tcp-speedtest` 用于 TCP connect 延迟检测。Cloudflare Pages 线上环境不支持 Node TCP socket，建议导出候选 IP 后配合 CloudflareSpeedTest / cfst 等原生工具测速。

### 原生测速工具闭环

测速页支持导出候选 IP、导出 CloudflareSpeedTest/cfst 命令模板，并可导入原生测速 CSV 结果回填页面。线上 Cloudflare Pages 环境无法执行 TCP socket 时，可使用该流程完成最终测速闭环。


### 测速结果质量控制

测速页支持延迟阈值、保留前 N、按地区筛选、统计最快/最慢/平均延迟，以及按 `ip:port#地区_ms`、`ip:port`、CSV 三种格式导出筛选后的结果。


### v28 UI：Cloudflare SaaS + 企业后台混合风

界面已从深色玻璃风调整为浅色正式后台：Cloudflare 橙色品牌主色、白色侧栏、清晰 KPI 卡片、企业表格、橙色主操作按钮、浅色筛选控件。业务 HTML/JS 不变，主要改动集中在 `assets/app.css`，并保留 `assets/app.css.v27.backup`。


### v29 测速历史与稳定性

测速页支持保存当前筛选后的测速结果到 localStorage，最多保留 30 条历史。历史项支持恢复、单条导出，并可与上一条历史对比变好/变差/持平/新增数量，用于判断 IP 长期稳定性。


### 提交前最终补强

已移除 UI 中的外部 Google Fonts 依赖，改用系统字体栈，避免 Cloudflare Pages 部署后因外部字体加载影响首屏或离线可用性。
