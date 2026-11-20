# GitHub 上传准备完成

## 📦 已添加至 Git 的文件

### 核心部署脚本（12 个）
- `qwen-deploy.ps1` (+12 行：工具调用支持增强)
- `traffic-proxy.js` (+1 处：移除对 arguments 的文本压缩)
- `start-qwen.bat`, `start-qwen-text.bat`
- `stop-all.bat`, `stop-proxy.bat`, `stop-text.bat`
- `deploy.bat`, `deploy-glm41v.ps1`
- `PowerShell-UTF8Config.ps1`
- `one-click-start.bat`, `one-click-start.md`

### 文档（5 个）
- `README.md` (v2.0.1 更新说明)
- `traffic-proxy.md` (代理说明)
- `README-GITHUB.md` (英文版)
- `README-START.md`, `README-TEXT-MODE.md`

### 配置文件（5 个）
- `.gitignore`, `.gitattributes`
- `LICENSE`
- `PowerShell-UTF8Config.ps1`

### 新建文件（2 个）
- `.github/RELEASE_NOTES.md` (v2.0/v2.0.1 详细日志)
- `部署文件说明.md` (完整部署文件使用说明)

## 📊 文件统计

- **核心脚本**：12 个（~500KB）
- **文档**：5 个（~50KB）
- **配置文件**：5 个（~10KB）
- **新建文件**：2 个（~7KB）
- **总计**：约 567KB

## 🚀 下一步操作

### 1. 提交
```bash
git commit -m "v2.0.1: 压缩工具调用参数紧急修复

- 修复 compressRequestBody 对 tool_calls.arguments 的误处理
- 结构化 JSON 绝不做文本截断，过大的交给'丢整轮历史'兜底
- 加固 dropOldHistory 配对纪律
- 验证：73K token 请求经压缩后，45 个 tool_calls 的 arguments 45/45 原样保留且合法 JSON"

--amend
```

### 2. 推送到 GitHub
```bash
git remote add origin https://github.com/<用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

### 3. 创建 Release
- Tag: `v2.0.1`
- Title: "v2.0.1 - Context Compression Tool Call Arguments Fix"
- Description: 从 `.github/RELEASE_NOTES.md` 复制 v2.0.1 部分

## 📝 重要说明

### v2.0.1 修复内容

**问题**：Dashboard 出现 `[500] Failed to parse tool call arguments as JSON: parse_error.101`

**根因**：压缩代码曾对 `tool_calls[].function.arguments`（字符串化 JSON）调用 `compressText`，导致 JSON 参数被截断成非法文本，模型模仿输出坏参数。

**修复**：
1. 移除对 `arguments` 的文本压缩（结构化 JSON 绝不做文本截断）
2. 过大的 `arguments` 交给"丢整轮历史"兜底
3. 加固 `dropOldHistory` 配对纪律（切点落在 tool 消息时向前扩展到其 assistant）

**验证**：73,110 → 16,861 token；45 个 tool_calls 的 arguments 45/45 原样保留、全部合法 JSON；tool 消息配对完整；当前提问保留。

## ⚠️ 注意

- 运行时生成的文件已排除（`llama.cpp/server.pid`, `.workbuddy/memory/`, `*.log`, `*.bak.*`, `*.gguf`）
- 提交前已确认不再包含备份文件和临时文件
- 所有改动已通过 `node --check` 语法检查

---

**准备时间**：2026-11-20 10:59  
**版本**：v2.0.1  
**维护者**：Qwen Community
