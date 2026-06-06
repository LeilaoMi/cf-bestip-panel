# cf-bestip-panel AGENTS.md

## 项目定位

`cf-bestip-panel` 是一个 BestIP/Cloudflare 优选 IP 管理台，本地运行在 Zo user service，后续可迁移到 Cloudflare Pages。

## 架构

- 前端：无构建原生 HTML/CSS/JS。
  - `index.html` 只保留结构入口。
  - `assets/app.css` 存放样式。
  - `assets/app.js` 存放交互逻辑。
- 后端：Cloudflare Pages Functions 风格，位于 `functions/api/`。
- 本地预览：`local-server.js` 模拟 Pages Functions，并支持本地写配置文件。
- 配置：根路径 `config.json` 和 `default-config.json`，同时保留 `public/` 副本。

## 维护规则

1. 不要再把大量 JS/CSS 写回 `index.html`；保持拆分结构。
2. 修改 API 后更新 `package.json` 的 `npm run check`。
3. 修改真实源配置后同步：
   - `config.json`
   - `public/config.json`
   - 如是默认配置，也同步 `default-config.json` 与 `public/default-config.json`
4. 所有改动后至少运行：
   - `npm run check`
   - `npm test`
5. 部署 Cloudflare Pages 前必须确认 KV 绑定需求：`BESTIP_KV`。
6. 不要写入任何 token、cookie、私有订阅密钥。

## 常用命令

```bash
npm run check
npm test
npm run start
```

## 当前服务

Zo user service：`cf-bestip-panel`，入口 `node local-server.js`，端口 `8788`。
