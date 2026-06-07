# Cloudflare Pages 部署说明

## 部署目标

本项目推荐部署到 Cloudflare Pages，使用静态前端、Pages Functions API 和静态数据产物。

## 前置条件

- 已安装 Node.js 22 或兼容版本。
- 已将项目推送到 GitHub 仓库。
- 已准备 `ADMIN_TOKEN`。
- 如需线上保存配置，已准备 Cloudflare KV 命名空间。

## 本地检查

部署前执行：

```bash
npm install
npm run build:dataset
npm run predeploy
```

`npm run predeploy` 必须通过后再部署。

## Cloudflare Pages 配置

推荐配置：

```text
Framework preset: None
Build command: 可留空，或使用 npm run build:dataset
Build output directory: /
Root directory: /
```

环境变量：

```text
ADMIN_TOKEN=一段足够长的随机密钥
```

可选 KV 绑定：

```text
BESTIP_KV
```

## 运行时限制

Cloudflare Pages 线上环境不支持：

- Node TCP Socket；
- Node 子进程；
- 运行时写入仓库文件；
- 依赖本地文件系统持久化。

因此：

- `/api/build-dataset` 线上应保持禁用；
- 数据产物建议由 GitHub Actions 构建并提交；
- 线上测速应使用候选 IP 导出 + CloudflareSpeedTest/cfst + CSV 导入流程。

## 部署后验收

部署完成后检查：

```text
/
/api/config
/api/artifacts
/artifacts/latest/manifest.json
/artifacts/latest/all.txt
```

管理接口鉴权检查：

- 无 Token 请求应返回 `401`；
- 错误 Token 请求应返回 `401`；
- 正确 Token 才允许保存配置或清理缓存。

## 回滚

如部署异常：

1. 在 Cloudflare Pages 回滚到上一成功部署；
2. 检查最近一次 GitHub Actions 构建日志；
3. 重新执行 `npm run build:dataset` 和 `npm run predeploy`；
4. 确认产物目录和 `_headers` 未被误删。
