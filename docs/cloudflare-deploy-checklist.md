# Cloudflare Pages 部署前检查清单

## 代码兼容性

- [ ] `npm run check` 通过。
- [ ] `npm test` 通过。
- [ ] `npm run unit` 通过。
- [ ] `npm run report` 通过。
- [ ] 地址分类单元测试通过。
- [ ] 构建输出单元测试通过。
- [ ] 源拉取单元测试通过。
- [ ] `functions/api/build-dataset.js` 线上保持禁用。
- [ ] 数据产物存在于 `public/artifacts/latest/`。
- [ ] `public/artifacts/latest/manifest.json` 可访问。

## Cloudflare Pages 设置

- [ ] Build command: `npm run check`。
- [ ] Build output directory: `.`。
- [ ] Root directory 指向项目根目录。

## 环境变量

- [ ] 已设置 `ADMIN_TOKEN`。
- [ ] `ADMIN_TOKEN` 未写入前端代码、README、提交历史。

## KV

如需线上保存配置：

- [ ] 已创建 KV namespace。
- [ ] Pages Functions 绑定名为 `BESTIP_KV`。
- [ ] `/api/config` GET 可读取默认配置。
- [ ] 带 `Authorization: Bearer <ADMIN_TOKEN>` 的 POST 可保存配置。

## 安全

- [ ] `/api/config` POST 无 Token 返回 401。
- [ ] `/api/cache-clear` POST 无 Token 返回 401。
- [ ] `/api/source-raw` 无 Token 返回 401。
- [ ] 配置中心不能保存 localhost、127.0.0.1、内网地址。
- [ ] 上游源响应体大小已限制。

## 数据产物

- [ ] GitHub Actions `Build BestIP Dataset` 可手动运行。
- [ ] Actions 可写入 `public/artifacts/latest/*`。
- [ ] Cloudflare Pages 可自动部署 Actions 提交后的产物。

## Headers 与缓存

- [ ] `_headers` 已提交到项目根目录。
- [ ] `/api/*` 与 `manifest.json` 为 `no-store`。
- [ ] `/artifacts/latest/*.txt` 缓存时间符合预期。
- [ ] 安全响应头已生效：`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`。

## GitHub Actions

- [ ] Workflow 已执行 `npm run check`。
- [ ] Workflow 已执行 `npm run unit`。
- [ ] Workflow 已执行 `npm run build:dataset`。
- [ ] Workflow 已执行 `npm test`。
- [ ] Workflow 上传了 `bestip-artifacts`。
- [ ] Workflow 自动提交了 `artifacts/latest/*` 和 `public/artifacts/latest/*`。
