# 交付包清单

本文档说明当前交付包中的关键文件、目录职责、上线相关产物和检查方式。

## 1. 交付包位置

当前项目目录：

```text
/storage/emulated/0/Download/Operit/projects/cf-bestip-panel
```

压缩包命名约定：

```text
cf-bestip-panel-cloudflare-optimized-v{版本号}.zip
```

## 2. 核心入口文件

| 文件 | 说明 |
| --- | --- |
| `index.html` | 前端页面入口 |
| `assets/app.js` | 前端交互逻辑 |
| `assets/app.css` | 前端样式 |
| `local-server.js` | 本地/Zo 预览服务 |
| `package.json` | npm 脚本与依赖 |
| `wrangler.toml` | Cloudflare/Workers 配置参考 |
| `_headers` | Cloudflare Pages 静态响应头与缓存策略 |

## 3. API Functions

目录：

```text
functions/api/
```

关键文件：

| 文件 | 说明 |
| --- | --- |
| `_config.js` | 配置读取、保存、校验、鉴权相关逻辑 |
| `_http.js` | HTTP 响应、鉴权、响应体大小限制等公共逻辑 |
| `_cache.js` | 内存缓存逻辑 |
| `_health.js` | 数据源健康检测公共逻辑 |
| `config.js` | `/api/config` |
| `source-health.js` | `/api/source-health` |
| `source-check.js` | `/api/source-check` |
| `export-all.js` | `/api/export-all` |
| `artifacts.js` | `/api/artifacts` |
| `artifact.js` | `/api/artifact` |
| `cache-status.js` | `/api/cache-status` |
| `cache-clear.js` | `/api/cache-clear` |
| `source-raw.js` | `/api/source-raw` |
| `source-parse.js` | `/api/source-parse` |
| `build-dataset.js` | `/api/build-dataset`，线上保持禁用 |
| `edge_ips.js` | `/api/edge_ips` |
| `ip-check.js` | `/api/ip-check` |
| `self-test.js` | `/api/self-test` |

## 4. 构建脚本与模块

目录：

```text
scripts/
```

关键文件：

| 文件 | 说明 |
| --- | --- |
| `build-dataset.mjs` | 构建数据产物 orchestration 脚本 |
| `self-test.mjs` | 本地 smoke test |
| `unit-test.mjs` | API / 安全核心单元测试 |
| `address-unit-test.mjs` | 地址分类单元测试 |
| `build-output-unit-test.mjs` | 构建输出单元测试 |
| `source-fetch-unit-test.mjs` | 源拉取单元测试 |
| `test-report.mjs` | 统一测试报告 |
| `predeploy-check.mjs` | 部署前结构、安全、产物检查 |

模块化目录：

```text
scripts/lib/
```

| 文件 | 说明 |
| --- | --- |
| `address.mjs` | 地址清理、校验、分类 |
| `build-output.mjs` | 数据产物内容、health、manifest、report 生成 |
| `source-fetch.mjs` | 源拉取、响应体限制、Base64 解码、标签规范化 |

## 5. 配置文件

| 文件 | 说明 |
| --- | --- |
| `config.json` | 当前真实源配置，根路径可读 |
| `public/config.json` | 静态配置副本 |
| `default-config.json` | 默认真实源配置备份 |
| `public/default-config.json` | 默认配置静态副本 |
| `.env.example` | 环境变量示例，不包含真实密钥 |

## 6. 静态数据产物

产物目录：

```text
artifacts/latest/
public/artifacts/latest/
```

标准文件：

| 文件 | 说明 |
| --- | --- |
| `all.txt` | 全量去重地址 |
| `ipv4.txt` | IPv4 与 IPv4:端口 |
| `ipv6.txt` | IPv6 |
| `domain.txt` | 域名 |
| `proxyip.txt` | ProxyIP 相关记录 |
| `cidr.txt` | CIDR 网段 |
| `full.json` | 完整 records 与 summary |
| `health.json` | 构建健康状态与源状态 |
| `report.md` | 人类可读构建报告 |
| `manifest.json` | 产物清单 |

说明：

- `artifacts/latest` 用于仓库和检查；
- `public/artifacts/latest` 用于 Cloudflare Pages 静态访问；
- 两者应保持同步。

## 7. 文档目录

目录：

```text
docs/
```

| 文件 | 说明 |
| --- | --- |
| `cloudflare-deploy-checklist.md` | 部署前人工检查清单 |
| `DEPLOY.md` | Cloudflare Pages 部署说明 |
| `OPERATIONS.md` | 日常运维说明 |
| `TESTING.md` | 测试体系说明 |
| `ARTIFACTS.md` | 当前交付包清单 |
| `RELEASE_NOTES.md` | 版本说明 |

## 8. GitHub Actions

目录：

```text
.github/workflows/
```

关键文件：

```text
build-dataset.yml
```

职责：

- 定时或手动构建数据产物；
- 执行 `npm run check`；
- 执行 `npm run unit`；
- 执行 `npm run build:dataset`；
- 执行 `npm test`；
- 上传产物；
- 提交 `artifacts/latest/*` 与 `public/artifacts/latest/*`。

## 9. 必须通过的检查

交付前执行：

```bash
npm run predeploy
```

最低通过标准：

```text
check 通过
unit 通过
smoke test 通过
report 通过
predeploy-check failed = 0
```

## 10. 不应包含的内容

交付包不应包含：

- 真实 `ADMIN_TOKEN`；
- 私有 API Key；
- 未授权源码；
- 临时调试密钥；
- 与项目无关的大文件；
- 明文用户敏感信息。

## 11. 推荐交付顺序

1. 解压交付包；
2. 阅读 `docs/DEPLOY.md`；
3. 阅读 `docs/TESTING.md`；
4. 执行 `npm install`；
5. 执行 `npm run predeploy`；
6. 配置 Cloudflare Pages；
7. 设置 `ADMIN_TOKEN`；
8. 可选绑定 `BESTIP_KV`；
9. 部署；
10. 按 `docs/OPERATIONS.md` 做上线后维护。

## 12. 前端 UI Smoke Test

新增脚本：

```text
scripts/ui-smoke-test.mjs
```

执行命令：

```bash
npm run ui-smoke
```

用于检查交付包中的前端页面结构、CSS/JS 静态资源、关键 DOM 区域、配置接口与静态 manifest。


## 13. 前端轻量模块

```text
assets/js/constants.js
assets/js/dom.js
assets/js/api-client.js
assets/js/download.js
```

这些模块由 `assets/app.js` 作为单入口导入，用于降低公共工具逻辑耦合。


## 14. 最终交付摘要

正式交接文档：

```text
docs/FINAL_HANDOFF.md
```

该文件用于第三方接手或正式上线前快速确认项目能力、部署方式、测试状态、上线验收和后续维护方式。
