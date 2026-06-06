# Cloudflare Pages 部署说明

本文档面向正式交付和上线部署，说明如何把当前项目部署到 Cloudflare Pages。

## 1. 部署前确认

在项目根目录执行：

```bash
npm run predeploy
```

必须确认最终结果为：

```json
{
  "ok": true,
  "failed": 0
}
```

同时建议查看统一报告：

```bash
npm run report
```

确认：

- package 脚本完整；
- 单元测试文件完整；
- 构建模块完整；
- `artifacts/latest` 和 `public/artifacts/latest` 产物完整；
- manifest 可解析；
- GitHub Actions 包含必要步骤；
- `_headers` 缓存与安全头正确。

## 2. Cloudflare Pages 设置

推荐设置：

| 项目 | 值 |
| --- | --- |
| Framework preset | None / 直接静态项目 |
| Build command | 留空，或 `npm run check` |
| Build output directory | `.` |
| Root directory | 项目根目录 |

说明：

- 项目根目录已有 `index.html`；
- Pages Functions 位于 `functions/api/`，Cloudflare 会自动映射为 `/api/*`；
- 静态数据产物位于 `public/artifacts/latest/`，访问路径为 `/artifacts/latest/*`。

## 3. 环境变量

必须设置：

```text
ADMIN_TOKEN=你的管理密钥
```

用途：

- `/api/config` POST 保存配置；
- `/api/cache-clear` 清空缓存；
- `/api/source-raw` 读取原始源；
- 其它管理类操作。

注意：

- 不要把 `ADMIN_TOKEN` 写入前端代码；
- 不要提交真实 Token 到 Git；
- `.env.example` 只保留示例值。

## 4. KV 绑定，可选但推荐

如果希望线上配置中心可以保存配置，需要创建 Cloudflare KV namespace，并绑定为：

```text
BESTIP_KV
```

`wrangler.toml` 示例：

```toml
[[kv_namespaces]]
binding = "BESTIP_KV"
id = "你的 KV namespace id"
```

未绑定 KV 时：

- `/api/config` GET 仍可读取静态配置；
- POST 保存配置会失败或不可持久化；
- 不影响静态产物访问。

## 5. 静态产物发布

当前推荐流程：

1. GitHub Actions 定时或手动执行 `Build BestIP Dataset`；
2. Actions 执行：
   - `npm run check`
   - `npm run unit`
   - `npm run build:dataset`
   - `npm test`
3. Actions 提交更新后的：
   - `artifacts/latest/*`
   - `public/artifacts/latest/*`
4. Cloudflare Pages 检测到提交后自动部署。

线上不要依赖 `/api/build-dataset` 动态生成文件。该 API 已保持禁用。

## 6. 上线后验收

上线后访问并确认：

```text
/
/api/config
/api/artifacts
/api/artifact?name=all.txt
/artifacts/latest/manifest.json
/artifacts/latest/all.txt
```

管理接口鉴权确认：

```bash
curl -i -X POST https://你的域名/api/cache-clear
```

预期：

```text
401 Unauthorized
```

带 Token：

```bash
curl -i -X POST https://你的域名/api/cache-clear \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

预期：

```text
200 OK
```

## 7. 回滚

如新版本异常：

1. 在 Cloudflare Pages 中回滚到上一成功部署；
2. 或在 Git 中回退最近提交；
3. 如只是数据产物异常，可恢复上一版 `artifacts/latest` 与 `public/artifacts/latest`。

## 8. 关键风险点

- 上游公开源可能失效；
- 静态产物需要 Actions 定期更新；
- 管理接口必须设置 `ADMIN_TOKEN`；
- KV 未绑定时线上配置不可持久化；
- Cloudflare Pages 环境不适合运行本地写文件构建流程。
