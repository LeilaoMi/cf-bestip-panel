# 测试说明

## 完整检查

提交和部署前执行：

```bash
npm run predeploy
```

该命令包含：

```text
语法检查
单元测试
接口自检
UI Smoke
测试报告
部署前检查
```

## 单项命令

```bash
npm run check
npm run unit
npm test
npm run ui-smoke
npm run report
node scripts/predeploy-check.mjs
```

## 测试覆盖

### 语法检查

覆盖本地服务、Cloudflare Functions、前端 JS 和脚本文件。

### 单元测试

覆盖：

- 地址清理和分类；
- IPv4、IPv6、CIDR、域名和端口解析；
- 构建输出结构；
- 源拉取、解码和规范化；
- 配置导入校验；
- 配置差异摘要。

### 接口自检

覆盖：

- 配置读取；
- IP 查询；
- 源健康检测；
- 数据导出；
- artifact 读取；
- 管理接口鉴权；
- 线上禁用动态构建。

### UI Smoke

覆盖：

- 页面关键区域存在；
- 导航和核心 DOM 挂载；
- 配置导入预览；
- 保存预览；
- 快照归档管理；
- 测速导出、导入和质量筛选；
- 测速历史模块；
- 前端关键函数存在。

### 部署前检查

覆盖：

- 必要文件存在；
- npm 脚本完整；
- Cloudflare Pages 约束；
- 安全头配置；
- 静态产物完整；
- 文档存在；
- 测速流程接入。

## 失败处理

如果测试失败：

1. 先查看失败项名称；
2. 定位对应脚本或 API；
3. 修复后单独运行相关测试；
4. 最后重新执行 `npm run predeploy`。
