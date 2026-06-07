# cf-bestip-panel

`cf-bestip-panel` 是一个面向 Cloudflare Pages 的优选 IP 管理台。项目用于集中管理优选 IP 数据源、构建静态数据产物、检测源健康状态，并提供候选 IP 导出、原生测速结果导入、质量筛选和历史稳定性对比能力。

## 功能概览

- 数据源管理：支持分组、线路、真实源 URL、提取规则和配置导入导出。
- 源健康检测：支持批量检测、单源复测、缓存状态查看和失败源排查。
- 静态产物构建：生成 `all.txt`、`ipv4.txt`、`ipv6.txt`、`domain.txt`、`proxyip.txt`、`cidr.txt`、`full.json`、`health.json`、`report.md`、`manifest.json`。
- Cloudflare Pages 适配：前端静态资源 + Pages Functions API + GitHub Actions 定时构建。
- 管理安全：配置保存、缓存清理、源原文查看等接口使用 `ADMIN_TOKEN` 鉴权。
- 测速闭环：候选 IP 导出、CloudflareSpeedTest/cfst 命令模板、CSV 导入、质量筛选、结果导出。
- 测速历史：支持保存、恢复、导出、清空历史，并与上一轮结果对比稳定性。
- 测试体系：语法检查、单元测试、接口自检、UI Smoke、统一报告和部署前检查。

## 目录结构

```text
cf-bestip-panel/
├── index.html                  # 前端页面
├── assets/                     # 样式、前端逻辑和公共模块
├── functions/api/              # Cloudflare Pages Functions API
├── scripts/                    # 数据构建、测试和部署前检查脚本
├── artifacts/latest/           # 本地构建产物
├── public/artifacts/latest/    # 前端可访问的静态产物
├── docs/                       # 部署、运维、测试和产物说明
├── .github/workflows/          # GitHub Actions 自动构建流程
├── config.json                 # 当前配置
├── default-config.json         # 默认配置
├── local-server.js             # 本地预览服务
├── package.json                # npm 脚本与依赖
├── wrangler.toml               # Cloudflare 配置参考
└── _headers                    # Cloudflare Pages 响应头配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 构建数据产物

```bash
npm run build:dataset
```

构建后会同步生成：

```text
artifacts/latest/
public/artifacts/latest/
```

### 3. 运行本地预览

```bash
npm start
```

默认地址：

```text
http://127.0.0.1:8788
```

### 4. 执行完整检查

```bash
npm run predeploy
```

该命令会依次执行：

```text
语法检查 → 单元测试 → 接口自检 → UI Smoke → 测试报告 → 部署前检查
```

## Cloudflare Pages 部署

推荐流程：

1. 将仓库连接到 Cloudflare Pages。
2. 构建命令可留空，或按需执行 `npm run build:dataset`。
3. 输出目录使用项目根目录。
4. 配置环境变量：

```text
ADMIN_TOKEN=一段足够长的随机密钥
```

5. 如需线上保存配置，绑定 KV 命名空间：

```text
BESTIP_KV
```

说明：

- Cloudflare Pages 线上环境不支持 Node TCP Socket、子进程和运行时文件写入。
- `/api/build-dataset` 在线上应保持禁用。
- 数据产物建议由 GitHub Actions 定时构建并提交。

更多部署细节见：

```text
docs/DEPLOY.md
docs/cloudflare-deploy-checklist.md
```

## 数据产物

标准产物文件：

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
manifest.json
```

产物用途：

- `all.txt`：完整去重结果。
- `ipv4.txt` / `ipv6.txt`：按 IP 类型拆分。
- `domain.txt`：域名结果。
- `proxyip.txt`：带端口代理结果。
- `cidr.txt`：CIDR 网段结果。
- `full.json`：结构化完整结果。
- `health.json`：源健康检测结果。
- `report.md`：构建报告。
- `manifest.json`：产物索引和元信息。

详细说明见：

```text
docs/ARTIFACTS.md
```

## 测速说明

浏览器无法可靠直接测试 Cloudflare 裸 IP 的真实 TCP/TLS 延迟，主要受 HTTPS 证书、SNI、Host、跨域和浏览器网络限制影响。

项目提供两条测速路径：

### 本地 TCP 测速

本地运行 `node local-server.js` 时，页面会优先调用：

```text
POST /api/tcp-speedtest
```

该接口通过 Node TCP connect 探测候选 IP 端口延迟。

### 线上测速闭环

Cloudflare Pages 线上环境不支持 TCP Socket，因此推荐流程为：

```text
导出候选 IP → 使用 CloudflareSpeedTest/cfst 测速 → 导入 CSV → 页面筛选 → 保存历史 → 导出结果
```

测速页支持：

- 导出候选 IP；
- 导出 CloudflareSpeedTest/cfst 命令模板；
- 导入测速 CSV；
- 按最大延迟、保留数量、地区筛选；
- 导出 `ip:port#地区_延迟`、`ip:port` 或 CSV；
- 保存测速历史并对比稳定性。

## 配置管理

配置中心支持：

- 导出 JSON；
- 导入 JSON；
- 导入前 dry-run 校验；
- 页面内导入预览；
- 保存前差异摘要；
- 保存前配置快照导出；
- 本地快照归档；
- 快照搜索、筛选、恢复和恢复差异预览。

配置校验会阻止常见内网、本地和非法 URL，降低误导入风险。

## API 安全

以下接口需要 `ADMIN_TOKEN`：

```text
POST /api/config
/api/cache-clear
/api/source-raw
```

线上环境中，无 Token 或 Token 错误应返回 `401`。

以下接口线上应禁用：

```text
/api/build-dataset
```

## 测试命令

```bash
npm run check
npm run unit
npm test
npm run ui-smoke
npm run report
node scripts/predeploy-check.mjs
npm run predeploy
```

说明：

- `check`：Node 语法检查。
- `unit`：核心工具函数单元测试。
- `test`：接口和核心流程自检。
- `ui-smoke`：前端结构和关键功能挂载检查。
- `report`：生成统一测试报告。
- `predeploy`：提交和部署前的完整检查。

## GitHub Actions

`.github/workflows/build-dataset.yml` 会在以下场景运行：

- 手动触发；
- 定时任务；
- 推送到 `main` 分支。

流程包括：

```text
安装依赖 → 语法检查 → 单元测试 → 构建数据产物 → 校验产物 → Smoke Test → 上传并提交产物
```

## 文档

```text
docs/DEPLOY.md                  # Cloudflare Pages 部署说明
docs/OPERATIONS.md              # 日常运维说明
docs/TESTING.md                 # 测试体系说明
docs/ARTIFACTS.md               # 数据产物说明
docs/RELEASE_NOTES.md           # 版本和能力变更记录
docs/FINAL_HANDOFF.md           # 项目交接摘要
docs/cloudflare-deploy-checklist.md  # 部署检查清单
```

## 注意事项

- 不要提交 `.env`、`.dev.vars`、Token、Cookie 或私有订阅地址。
- 修改配置保存、测速、产物构建、API 鉴权时，必须同步运行 `npm run predeploy`。
- Cloudflare Pages 线上不应依赖运行时写文件和 Node 子进程。
- 真实源可能随时间失效，应定期运行健康检测和数据构建。
