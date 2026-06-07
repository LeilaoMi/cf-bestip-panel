# AGENTS.md

## 项目定位

`cf-bestip-panel` 是一个面向 Cloudflare Pages 的优选 IP 管理台，用于管理数据源、生成静态数据产物、检测源健康状态，并辅助完成 Cloudflare 优选 IP 测速与结果筛选。

## 架构概览

- 前端入口：`index.html`、`assets/app.css`、`assets/app.js`。
- 前端公共模块：`assets/js/`。
- Cloudflare Pages Functions：`functions/api/`。
- 本地预览服务：`local-server.js`。
- 数据构建脚本：`scripts/build-dataset.mjs`。
- 静态产物目录：`artifacts/latest/` 与 `public/artifacts/latest/`。
- 自动构建流程：`.github/workflows/build-dataset.yml`。

## 运行命令

```bash
npm install
npm run build:dataset
npm run predeploy
npm start
```

## 开发要求

- 提交前必须执行 `npm run predeploy`。
- 不要提交 `.env`、`.dev.vars`、Token、Cookie、私有订阅地址或任何敏感凭证。
- Cloudflare Pages 线上环境不支持 Node TCP Socket、子进程和运行时文件写入；相关能力只能用于本地预览或 GitHub Actions。
- 修改测速、配置、构建产物或 API 时，需要同步更新测试脚本和文档。
