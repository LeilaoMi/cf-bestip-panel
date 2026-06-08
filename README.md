# 边缘地址筛选面板

`cf-bestip-panel` 是一个适用于 Cloudflare Pages 的纯静态地址筛选面板。它用于整理地址源、提取地址、区域筛选、浏览器本地检测、结果排序、复制与导出。

当前仓库版本是 **公开精简版**：线上页面只展示用户需要的核心功能；项目说明、部署说明、验收清单、维护说明等内容只保留在仓库文档中，不会作为页面模块显示。

## 项目定位

本项目是地址整理与质量评估工具，不是代理服务，也不提供服务端转发能力。

核心边界：

- 纯静态页面；
- 不依赖 Cloudflare Pages 云函数；
- 不提供 `/api/*` 运行接口；
- 不做服务端代理转发；
- 不生成协议订阅；
- 检测逻辑在浏览器本地完成，结果受当前网络环境影响。

## 线上页面保留内容

公开页面适合保留：

- 仪表盘；
- 线路提取；
- 区域地址；
- 延迟检测；
- 配置中心；
- 地址导入、清洗、去重、复制、下载；
- 浏览器本地检测；
- 本地配置备份与恢复。

公开页面不应默认出现：

- 项目说明文档模块；
- 验收清单模块；
- 压测工具；
- 项目交付说明；
- 内部版本迭代记录；
- 缓存调试面板；
- 数据产物调试区；
- 与当前项目无关的运维说明。

这些内容只应保留在仓库的 `README.md` 或 `docs/` 目录中。

## 目录结构

```text
cf-bestip-panel/
├── index.html                 # 线上入口页面
├── assets/
│   ├── app.css                # 页面样式
│   └── app.js                 # 前端逻辑
├── config.json                # 当前默认配置
├── default-config.json        # 默认配置模板
├── manifest.webmanifest       # PWA 清单
├── sw.js                      # 离线缓存脚本
├── _headers                   # Cloudflare Pages 响应头
├── docs/                      # 仓库说明文档，不作为页面模块展示
├── README.md                  # 项目说明
├── STATIC_MODE.txt            # 静态模式说明
└── CLEAN_V4_V3UI_NOTES.txt    # 版本说明
```

## 部署到 Cloudflare Pages

推荐使用 Pages 直接连接 GitHub 仓库部署。

Cloudflare Pages 配置：

```text
框架预设：None
构建命令：留空
输出目录：/
环境变量：不需要
云函数：不需要
KV：不需要
```

部署后访问：

```text
https://你的域名/?v=v4r15r2
```

如果浏览器仍显示旧页面，请清理浏览器缓存或注销旧离线缓存脚本。

## 高级模式

公开页面默认隐藏维护工具。维护者需要查看高级工具时，可以使用：

```text
?admin=1
```

高级模式用于维护，不建议作为普通公开入口。

## 本地预览

```bash
python3 -m http.server 8788
```

然后访问：

```text
http://127.0.0.1:8788
```

## 基础校验

```bash
node --check assets/app.js
node --check sw.js
```

也可以检查是否存在不该上线的接口引用：

```bash
grep -R "/api/" index.html assets sw.js config.json default-config.json
```

正常情况下不应存在运行中的 `/api/*` 依赖。

## 文档

```text
docs/DEPLOY.md
docs/OPERATIONS.md
docs/RELEASE_NOTES.md
docs/ACCEPTANCE.md
```
