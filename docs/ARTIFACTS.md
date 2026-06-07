# 数据产物说明

本文档说明项目生成的数据产物、目录职责和校验方式。

## 产物目录

```text
artifacts/latest/
public/artifacts/latest/
```

- `artifacts/latest/`：本地构建产物目录，供脚本和报告使用。
- `public/artifacts/latest/`：前端和 Cloudflare Pages 可直接访问的静态产物目录。

两套目录应保持同步。

## 标准文件

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

## 文件说明

| 文件 | 说明 |
|---|---|
| `all.txt` | 完整去重结果 |
| `ipv4.txt` | IPv4 结果 |
| `ipv6.txt` | IPv6 结果 |
| `domain.txt` | 域名结果 |
| `proxyip.txt` | 带端口代理结果 |
| `cidr.txt` | CIDR 网段结果 |
| `full.json` | 结构化完整结果 |
| `health.json` | 数据源健康检测结果 |
| `report.md` | 构建报告 |
| `manifest.json` | 产物索引、时间戳和统计信息 |

## 构建命令

```bash
npm run build:dataset
```

## 校验命令

```bash
npm test
npm run report
node scripts/predeploy-check.mjs
```

## 部署要求

Cloudflare Pages 应能直接访问：

```text
/artifacts/latest/manifest.json
/artifacts/latest/all.txt
```

如果产物为空、缺失或 manifest 不完整，应重新执行构建。
