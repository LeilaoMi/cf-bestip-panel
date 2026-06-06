# 运维说明

本文档面向日常维护，说明数据源、缓存、配置、产物和故障处理方式。

## 1. 日常检查

建议定期执行：

```bash
npm run report
npm run predeploy
```

重点关注：

- `health.summary.sources` 是否仍为预期源数量；
- `health.summary.ok` 是否明显下降；
- `health.summary.failed` 是否异常升高；
- `artifacts/latest/manifest.json` 是否正常；
- `public/artifacts/latest/*` 是否已同步；
- GitHub Actions 是否定期成功。

## 2. 数据源维护

数据源配置位于：

```text
config.json
public/config.json
default-config.json
public/default-config.json
```

配置格式：

```json
{
  "groupName": "CM优选",
  "nodes": [
    {
      "ID": "移动",
      "url": "https://example.com/list.txt",
      "extract": false
    }
  ]
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `groupName` | 分类名 |
| `ID` | 源 ID，同分类下必须唯一 |
| `url` | 源地址，仅允许 `http`、`https`、`local:` |
| `extract` | 是否尝试 Base64 解码 |

配置保存前会校验：

- JSON 结构；
- 重复 ID；
- URL scheme；
- localhost / 127.0.0.1 / 内网地址；
- 非法地址。

## 3. 数据产物维护

本地生成：

```bash
npm run build:dataset
```

生成目录：

```text
artifacts/latest/
public/artifacts/latest/
```

标准产物：

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

说明：

- `artifacts/latest` 用于仓库和本地检查；
- `public/artifacts/latest` 用于 Cloudflare Pages 静态访问；
- 两者应保持同步。

## 4. 缓存维护

API 默认使用 30 分钟内存缓存，主要影响：

- `/api/source-health`
- `/api/export-all`
- 部分源读取结果

查看缓存：

```text
/api/cache-status
```

清空缓存：

```bash
curl -X POST https://你的域名/api/cache-clear \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

本地调试时也可以使用页面按钮清空缓存。

## 5. 管理接口

以下接口需要 `ADMIN_TOKEN`：

```text
POST /api/config
POST /api/cache-clear
GET  /api/source-raw
```

调用方式：

```bash
-H "Authorization: Bearer <ADMIN_TOKEN>"
```

未带 Token 应返回：

```text
401 Unauthorized
```

## 6. 常见故障

### 6.1 源数量正常但导出行数下降

可能原因：

- 上游源返回内容减少；
- 上游源格式变化；
- 去重后剩余变少；
- 公开源临时限流。

处理：

1. 查看 `artifacts/latest/health.json`；
2. 查看 `artifacts/latest/report.md`；
3. 在页面仪表盘重测单源；
4. 必要时替换失效源。

### 6.2 `sourceOk` 明显下降

处理：

```bash
npm run build:dataset
npm run report
```

然后查看失败源：

```text
artifacts/latest/report.md
```

### 6.3 页面无法读取产物

检查：

```text
/artifacts/latest/manifest.json
/artifacts/latest/all.txt
/api/artifacts
/api/artifact?name=all.txt
```

如静态路径可访问但 API 不可访问，重点检查 Pages Functions。

### 6.4 配置无法保存

检查：

- 是否设置 `ADMIN_TOKEN`；
- 请求是否带 `Authorization: Bearer <ADMIN_TOKEN>`；
- 是否绑定 `BESTIP_KV`；
- 配置中是否存在内网地址或重复 ID。

### 6.5 GitHub Actions 不更新产物

检查：

- workflow 是否有写权限；
- 是否运行 `npm run build:dataset`；
- 是否提交 `artifacts/latest/*` 和 `public/artifacts/latest/*`；
- 仓库是否禁止 Actions push。

## 7. 推荐维护节奏

| 频率 | 操作 |
| --- | --- |
| 每天 | 查看 Actions 是否成功 |
| 每周 | 查看 `health.json` 和 `report.md` |
| 每月 | 清理失效源，补充新源 |
| 上线前 | 执行 `npm run predeploy` |
| 异常时 | 执行 `npm run report` 并检查失败项 |

## 8. 不建议操作

- 不建议在线上调用本地文件写入式构建；
- 不建议把真实 Token 写入代码；
- 不建议加入内网或 localhost 源；
- 不建议绕过 `npm run predeploy` 直接上线；
- 不建议只更新 `artifacts/latest` 而忘记同步 `public/artifacts/latest`。

## 配置导入 dry-run 校验

导入配置文件时，前端会先执行 dry-run 校验：

- 检查 JSON 是否为数组；
- 检查 `groupName` 和 `nodes[]`；
- 检查线路 `ID`、`url`；
- 检查重复 ID；
- 拒绝 `file://`、`ftp://` 等非法协议；
- 拒绝 localhost、127.0.0.1、10.*、192.168.*、172.16-31.*、169.254.* 等本地或内网地址；
- 将 `extract` 规范化为布尔值。

校验通过后会显示分类、线路、远程源、本地源和提取模式数量，确认后才导入到配置中心。


## 配置导入预览 UI

配置导入现在分为三步：

1. 选择 JSON 文件；
2. 页面内显示 dry-run 预览，包括统计、错误和警告；
3. 点击“确认应用导入”后进入配置中心，再点击“保存配置”写入线上配置。

如预览显示错误，配置不会进入配置中心。


## 保存配置前变更摘要

保存配置前会自动对比当前已加载配置和编辑区配置，统计：

- 新增分类；
- 删除分类；
- 新增线路；
- 删除线路；
- URL 变更；
- 提取模式变更；
- 未变化线路。

如没有变化，会提示无需保存；如存在变化，需要确认摘要后才会提交保存。


## 保存配置页面内预览 UI

保存配置现在分为两步：

1. 点击“保存配置”生成页面内变更预览；
2. 确认统计和详情后点击“确认保存到线上配置”。

如果生成预览后继续编辑配置，系统会清空或拒绝旧预览，要求重新生成摘要，避免 stale summary。


## 保存预览快照导出

在保存配置页面内预览中，可以导出：

- 保存前快照：当前线上配置 `bestip-config-before-save-*.json`；
- 待保存快照：即将提交的编辑区配置 `bestip-config-to-save-*.json`；
- 变更摘要：本次差异文本 `bestip-config-change-summary-*.txt`。

若生成预览后继续编辑配置，导出待保存快照和变更摘要会要求重新生成摘要，避免导出过期内容。


## 保存预览自动本地留档

点击“保存配置”生成预览时，会自动写入 localStorage：

- `timestamp`：生成时间；
- `before`：保存前线上配置；
- `toSave`：待保存配置；
- `summary`：变更摘要文本。

键名为 `bestip-config-save-archives`，最多保留 20 条。可通过保存预览中的“导出本地快照档案”下载为 `bestip-config-local-archives-*.json`。


## 本地快照档案管理 UI

点击配置中心的“本地快照档案”可打开管理面板。支持：

- 查看本地快照档案列表；
- 导出全部档案；
- 导出单条档案；
- 从 `before` 恢复保存前配置；
- 从 `toSave` 恢复待保存配置；
- 删除单条档案；
- 清空全部档案。

恢复配置只会写入编辑区，并调用保存预览流程生成新的变更摘要；仍需点击“确认保存到线上配置”才会生效。


## 本地快照搜索和筛选

本地快照档案面板提供搜索框和筛选项：

- 搜索时间戳或变更摘要；
- 全部快照；
- 包含删除线路；
- 包含 URL 变更；
- 包含新增分类；
- 包含删除分类。

筛选不会修改 localStorage，仅影响当前列表展示；清空搜索会恢复到全部快照。


## 快照恢复差异预览

点击“恢复保存前配置”或“恢复待保存配置”后，系统不会立即写入编辑区，而是先生成差异预览：

- 当前编辑区作为旧配置；
- 目标快照作为新配置；
- 展示新增/删除分类、新增/删除线路、URL 变更、提取模式变更等摘要。

可执行：

- 确认恢复到编辑区；
- 导出目标快照；
- 取消恢复。

确认恢复后仍会进入保存预览流程，最终仍需点击“确认保存到线上配置”才会提交。

## 本地 TCP 测速

测速页优先调用本地开发服务的 `/api/tcp-speedtest`。该接口使用 Node `net.createConnection` 执行 TCP connect 延迟检测，比浏览器裸 IP HTTPS 图片探测更可靠。

注意：

- 浏览器不能可靠测 Cloudflare 裸 IP；
- Cloudflare Pages Functions 不提供 Node TCP socket；
- 线上 Pages 环境应把测速页作为候选 IP 导出入口，最终用 CloudflareSpeedTest / cfst / 自建后端测速。

## 原生测速工具闭环

推荐流程：

1. 在测速页选择 IP 库源和端口；
2. 点击“导出候选 IP”；
3. 点击“导出 cfst 命令”获取 CloudflareSpeedTest 命令模板；
4. 在本机运行原生测速工具生成 CSV；
5. 回到页面点击“导入测速 CSV”；
6. 使用“导出结果至线路页”把优选结果追加到线路结果区。

该流程用于补齐 Cloudflare Pages 线上环境无法 TCP 测速的限制。


## 测速结果质量控制

测速完成或导入 CSV 后，可使用：

- 地区筛选；
- 延迟上限；
- 保留前 N；
- 导出格式选择；
- 下载筛选结果；
- 导出结果至线路页。

统计区会显示全部结果数量、最快、最慢、平均延迟和当前筛选数量。


## v28 UI 运维说明

当前 UI 风格为 Cloudflare SaaS + 企业后台混合风。主样式文件为 `assets/app.css`，上一版深色样式备份在 `assets/app.css.v27.backup`。如需回滚 UI，可将备份文件复制回 `assets/app.css`。


## v29 测速历史与稳定性

操作流程：

1. 完成本地 TCP 测速或导入 cfst CSV；
2. 设置地区、延迟阈值、保留前 N；
3. 点击“保存历史”；
4. 点击“测速历史”查看历史；
5. 可恢复历史、导出单条历史；
6. 可清空全部历史。

历史保存在浏览器 localStorage，key 为 `cf_bestip_speedtest_history_v1`，最多保留 30 条。
