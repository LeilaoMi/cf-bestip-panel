# 项目交接摘要

## 项目简介

`cf-bestip-panel` 是一个面向 Cloudflare Pages 的优选 IP 管理台，支持数据源管理、健康检测、静态产物构建、配置安全保存、测速结果导入筛选和历史稳定性对比。

## 当前状态

项目已完成提交前收口，具备部署到 Cloudflare Pages 的基础条件。

## 核心能力

- Cloudflare Pages Functions API；
- GitHub Actions 自动构建数据产物；
- 静态 artifacts 发布；
- 管理接口 Token 鉴权；
- 配置导入校验和保存前差异预览；
- 本地快照归档和恢复预览；
- 本地 TCP 测速；
- CloudflareSpeedTest/cfst CSV 导入闭环；
- 测速质量筛选和历史稳定性对比；
- 完整测试和部署前检查。

## 运行命令

```bash
npm install
npm run build:dataset
npm run predeploy
npm start
```

## 部署要求

Cloudflare Pages 环境变量：

```text
ADMIN_TOKEN=一段足够长的随机密钥
```

可选 KV 绑定：

```text
BESTIP_KV
```

## 重要限制

Cloudflare Pages 线上不支持：

- TCP Socket 测速；
- Node 子进程；
- 运行时写入静态文件。

因此线上测速必须使用：

```text
导出候选 IP → CloudflareSpeedTest/cfst 测速 → 导入 CSV → 页面筛选导出
```

## 提交前检查

必须通过：

```bash
npm run predeploy
```

## 关键文档

```text
README.md
docs/DEPLOY.md
docs/OPERATIONS.md
docs/TESTING.md
docs/ARTIFACTS.md
docs/RELEASE_NOTES.md
docs/cloudflare-deploy-checklist.md
```

## 安全注意事项

- 不要提交真实 Token、Cookie、私有订阅地址或 `.env`。
- `ADMIN_TOKEN` 只在部署环境中配置。
- 上线后必须验证管理接口鉴权。
