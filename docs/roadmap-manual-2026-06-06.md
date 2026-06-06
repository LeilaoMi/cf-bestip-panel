# 优选 IP 管理台后续推进手册

> 项目：`cf-bestip-panel`  
> 日期：2026-06-06  
> 状态：本地完整可运行；已融合 73 条公开源；暂不线上部署。

---

## 0. 当前项目已具备什么

当前项目已经从“复刻页面”升级成了一个本地可运行的 **优选 IP 管理台**：

- 73 条公开源接入
- 11 个分类
- 源健康检测
- 单源重测
- 分类筛选
- 一键导出全部源
- 多格式导出
- 配置中心
- 默认真实源恢复
- 本地自检脚本
- Cloudflare Pages Functions 结构
- Zo 本地服务预览

当前预览：`https://cf-bestip-panel-truepuma.zo.computer`

---

## 1. 数据产物层：把页面工具升级成数据服务

### 目标

让项目不只是“点按钮看结果”，而是自动稳定产出标准文件。

### 可生成文件

```text
docs/all.txt          # 全量去重结果
docs/ipv4.txt         # IPv4 only
docs/ipv6.txt         # IPv6 only
docs/domain.txt       # 优选域名
docs/proxyip.txt      # ProxyIP
/docs/cidr.txt        # CIDR/IP库
/docs/full.json       # 全结构化结果
/docs/health.json     # 源健康状态
/docs/report.md       # 人类可读报告
```

### 细化能力

- 去重：同一个 `host:port` 只保留一次
- 保留来源：记录来自哪个分类、哪个源
- 标准化备注：统一成 `#分类_线路_地区_延迟`
- IPv4/IPv6 自动识别
- 域名/IP/ProxyIP/CIDR 自动分类
- 清洗非法行
- 丢弃空行、注释、HTML 错误页
- 统计每个源贡献行数

### 推荐优先级

**最高。** 这是项目从“页面”变成“服务”的关键。

---

## 2. 缓存层：减少上游压力，提高速度

### 当前问题

现在每次健康检测或导出都会实时请求 73 条源。

### 可推进内容

- `/api/source-health?cache=1`
- `/api/export-all?cache=1`
- `/api/cache/status`
- `/api/cache/clear`
- 缓存有效期：10 / 30 / 60 分钟可配置
- 缓存内容：健康检测结果、导出结果、每源原始内容

### 本地实现

本地可先写入：

```text
.cache/source-health.json
.cache/export-all-tagged.txt
.cache/export-all-ip-port.txt
.cache/raw/<source-id>.txt
```

### Cloudflare 实现

线上用 KV：

```text
BESTIP_KV:
  cache:source-health
  cache:export:tagged
  cache:export:ip-port
  cache:raw:<source-id>
```

### 风险

缓存过久会导致源更新不及时。建议默认 30 分钟。

---

## 3. 自动化层：定时拉取并生成静态产物

### 目标

不用打开页面，也能定时产出最新文件。

### 本地脚本

```text
scripts/build-dataset.mjs
scripts/check-sources.mjs
scripts/generate-report.mjs
```

### 输出路径

```text
artifacts/latest/all.txt
artifacts/latest/ipv4.txt
artifacts/latest/domain.txt
artifacts/latest/full.json
artifacts/history/2026-06-06-0400/
```

### 后续迁移

- GitHub Actions 定时运行
- Cloudflare Pages 定时部署
- Cloudflare Workers Cron + KV/R2
- Zo Automation 定时执行

### 推荐 cron

```text
每 30 分钟：更新数据
每天 04:00：生成日报
每周：清理历史缓存
```

---

## 4. 前端产品化层

### 已有风格

当前是：深色玻璃态 + 左侧导航管理台。

### 可继续做

#### 4.1 仪表盘增强

- 最近 10 次检测趋势
- 成功率曲线
- 总行数变化
- 慢源排行
- 贡献最多源排行
- 今日新增/消失 IP 数

#### 4.2 线路提取增强

- 搜索源
- 收藏源
- 最近使用源
- 按分类折叠
- 源详情抽屉
- 单源导出
- 单分类导出

#### 4.3 全球优选增强

- 国家搜索
- 热门国家置顶
- 一键选择亚洲/欧美/三网常用
- 输出格式选择
- 按端口过滤

#### 4.4 在线测速增强

- 结果按延迟排序
- 只保留 Top N
- 测速历史
- 不同端口并行测试
- 延迟区间颜色
- 导出测速报告

#### 4.5 配置中心增强

- 拖拽排序
- 批量导入 URL
- URL 自动校验
- 保存前预检
- 配置版本历史
- 配置差异对比
- 恢复上一个版本

---

## 5. 后端 API 层

### 已有 API

```text
/api/config
/api/ips
/api/edge_ips
/api/source-health
/api/source-check
/api/export-all
/api/ip-check
/api/self-test
```

### 可新增 API

```text
/api/dataset/build          # 生成 all/ipv4/domain 等产物
/api/dataset/latest         # 查看最新构建摘要
/api/dataset/file/:name     # 获取产物文件
/api/cache/status           # 缓存状态
/api/cache/clear            # 清缓存
/api/config/backup          # 配置备份
/api/config/restore         # 配置恢复
/api/source/raw             # 查看某源原始返回
/api/source/parse           # 查看解析后的结构
/api/stats/history          # 历史统计
/api/version                # 项目版本信息
```

---

## 6. 数据质量与规则引擎

### 可做规则

- 排除指定 ASN
- 排除指定国家
- 排除指定端口
- 只保留 TLS 端口
- 只保留 IPv4
- 只保留 IPv6
- 只保留域名
- 去掉私有网段
- 去掉保留地址
- 去掉 Cloudflare 官方 CIDR 之外的可疑 IP

### 规则文件

```text
rules/filter.json
rules/ports.json
rules/allowlist.json
rules/blocklist.json
```

### 典型规则示例

```json
{
  "ports": [443, 8443, 2053, 2083, 2087, 2096],
  "excludePrivateIp": true,
  "preferIPv4": true,
  "maxPerSource": 1000
}
```

---

## 7. 安全与合规边界

### 必须坚持

- 只接入公开源
- 不内置私有订阅 token
- 不保存用户隐私数据
- 不输出敏感日志
- 不绕过登录/鉴权
- 不做攻击性扫描
- 不滥用上游接口

### 风险点

- Cloudflare 对代理类项目可能敏感
- 大量请求上游可能被限流
- 一些源可能含失效或风险 IP
- 用户误以为结果一定有效

### 降风险设计

- 缓存
- 限流
- 明确免责声明
- 默认私有部署
- API 加可选鉴权
- 不主动对公网大规模扫描

---

## 8. 部署层

### 本地

当前已完成。

### Zo Service

当前运行：

```text
service: cf-bestip-panel
entrypoint: node local-server.js
port: 8788
```

### Cloudflare Pages

可部署，但先不执行。

准备项：

- GitHub 仓库
- Pages 项目
- KV namespace：`BESTIP_KV`
- 环境变量
- 自定义域名（优先子域名）

### GitHub Actions

可做：

```text
.github/workflows/test.yml
.github/workflows/build-dataset.yml
.github/workflows/deploy-pages.yml
```

---

## 9. 测试体系

### 已有

```bash
npm run check
npm test
```

### 可继续增强

- API 单元测试
- 配置 schema 校验
- 导出格式快照测试
- 健康检测 mock 测试
- Playwright UI 测试
- 移动端截图测试

### 推荐新增

```text
scripts/validate-config.mjs
scripts/test-export-formats.mjs
scripts/test-ui-smoke.mjs
```

---

## 10. 监控与报告

### 可做日报

```text
今日源状态：73/73 可用
新增 IP：xxx
消失 IP：xxx
慢源：0
失败源：0
Top 10 贡献源：...
```

### 可做历史

```text
history/health-YYYY-MM-DD.json
history/dataset-YYYY-MM-DD.json
history/report-YYYY-MM-DD.md
```

### 前端趋势图

无需重库，可用原生 SVG 或轻量 canvas。

---

## 11. 文档体系

建议补齐：

```text
docs/architecture.md       # 架构说明
docs/api.md                # API 文档
docs/deployment.md         # 部署指南
docs/configuration.md      # 配置说明
docs/data-sources.md       # 数据源清单
docs/security.md           # 安全边界
docs/troubleshooting.md    # 排错手册
docs/changelog.md          # 更新记录
```

---

## 12. 版本化与发布

### 版本阶段

```text
v0.1 本地复刻
v0.2 真实源融合
v0.3 管理台 UI
v0.4 数据产物生成
v0.5 缓存与自动化
v0.6 Cloudflare Pages 可部署
v1.0 稳定版
```

### CHANGELOG 示例

```md
## v0.4.0
- 新增数据产物生成器
- 新增 all/ipv4/domain/proxyip 输出
- 新增缓存层
```

---

## 13. 可以做成的最终形态

### 形态 A：私人管理台

只给自己用，私有部署，最安全。

### 形态 B：公开优选 API

输出：

```text
/all.txt
/ipv4.txt
/domain.txt
/proxyip.txt
/full.json
```

### 形态 C：GitHub Pages 数据仓库

GitHub Actions 定时构建，静态公开。

### 形态 D：Cloudflare Pages + KV 动态站

配置可在线保存，数据可缓存。

### 形态 E：Zo 本地长期服务

运行在 Zo，配合自动化定时更新。

---

## 14. 推荐阶段路线图

### 第一阶段：数据产物生成器

目标：生成标准输出文件。

验收：

```text
npm run build:dataset
artifacts/latest/all.txt 存在
artifacts/latest/full.json 合法
```

### 第二阶段：缓存层

目标：减少上游请求。

验收：

```text
第一次请求较慢
第二次请求明显加快
/cache/status 返回缓存命中
```

### 第三阶段：自动化

目标：定时更新。

验收：

```text
自动生成 artifacts/latest
生成 report.md
失败有日志
```

### 第四阶段：部署准备

目标：可安全部署但先不部署。

验收：

```text
README 完整
wrangler.toml 完整
GitHub workflow 草案完整
npm test 通过
```

### 第五阶段：线上部署

目标：确认后部署。

验收：

```text
真实 URL 可访问
/api/self-test ok
README 同步线上地址
```

---

## 15. 下一步最推荐执行

优先级最高：

```text
实现 scripts/build-dataset.mjs
生成 artifacts/latest/all.txt / ipv4.txt / ipv6.txt / domain.txt / proxyip.txt / full.json
```

原因：这是把项目变成“稳定数据服务”的关键一步。

---

## 16. 暂不建议做的事

- 现在就公开部署
- 现在就绑定域名
- 现在就做复杂账号系统
- 现在就加入大量私有源
- 现在就做大规模主动扫描

这些会增加 Cloudflare 风险或维护复杂度。

---

## 17. 一句话总结

当前项目已经完成“管理台”雏形；下一步应重点推进 **数据产物生成、缓存、自动化、部署准备**，最终变成一个可长期运行的 BestIP 数据服务。
