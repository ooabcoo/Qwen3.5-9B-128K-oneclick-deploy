# Token 使用代理

## 概述

- 将所有请求转发到 `http://127.0.0.1:8080/`
- 从 API 响应的 `usage` 字段读取真实 token 数量（不根据字节数估算）
- 同时处理非流式（JSON）和流式（SSE `data:` chunk）响应
- 自动注入 `stream_options.include_usage=true` 到流式聊天请求，使 usage 被上报
- 每天创建新的日志文件；重启后数据保留
- **顶部卡片分为左右两部分**：`今天统计` / `Today's Usage` 显示聚合指标
- 双语 dashboard，`http://127.0.0.1:8081/` - **默认中文**，可切换为英文
- **上游上下文压缩**：客户端如 WorkBuddy 注入大量系统上下文（代理在转发前压缩）
- **Token 生成速度**：每行请求显示 `tok/s`，dashboard 顶部显示平均输出速度

## 上游上下文压缩

聊天客户端（WorkBuddy / CodeBuddy）注入包含身份和技能上下文的 `<system-reminder>` 块。当 token 使用量超过阈值时，代理在转发前压缩请求体：

1. **行级去重** - 相同的非空行只保留一次
2. **标题索引模式** - markdown 标题、XML 标签和短行（≤120 字符）被索引但不展开
3. **用户提问保护** - `<user_query>` 和 `</user_query>` 之间的所有内容保持原样，实际提问永远不会被截断
4. **多模态保护** - 数组内容中的图片/音频部分原样通过
5. **工具调用保护** - `tool_calls[].function.arguments` JSON 字符串从不文本截断（保留可解析的参数）
6. **无用户消息兜底** - 如果请求没有用户消息（工具续接），会追加一条最小消息

**实际效果**：原本会被拒绝为"400 超限"的 137,544 token 请求现在被压缩到约 20,000 token 并成功转发。373K → ~102K 实际 prompt token（已通过上游 `usage.prompt_tokens` 验证）。

### 压缩触发条件（v2.0）

- **真 tokenizer 计数**：使用上游 `/tokenize` 端点进行精确 token 计数
- **输出预留**：输入预算 = `CTX_BUDGET - OUTPUT_RESERVE`（默认：131072 - 8192 = 122880）
- **70% 水位线**：当真实 token 数 ≥ 输入预算的 70% 时触发压缩（默认：~91,750 tokens）
- **压缩后复核**：压缩后重新计数；如果仍超限，丢弃最早的历史轮次直到符合要求
- **懒预判**：小请求（char 估算< 预算的 20%）跳过 tokenizer 往返，零额外延迟

### 压缩保护保证

1. **用户提问永远保留** - 当前提问永远不会被截断
2. **工具调用参数永不损坏** - JSON 字符串原样通过；过大的工具轮次按单元丢弃
3. **配对维持** - `tool` 消息与其前序的 `assistant(tool_calls)` 消息保持配对
4. **无用户消息兜底** - 如果所有压缩轮次后仍无用户消息，追加`{role:"user",content:"请继续处理上述任务。"}`（修复 Qwen Jinja"无用户提问"500 错误）

### 配置（环境变量）

| 变量 | 默认值 | 含义 |
|----------|---------|---------|
| `COMPRESS_CONTEXT` | `1` | 设为`0` 完全禁用压缩 |
| `CTX_BUDGET` | `120000` | 触发压缩的真实 token 阈值（来自`MODEL_CTX - OUTPUT_RESERVE`） |
| `OUTPUT_RESERVE` | `8192` | 上下文窗口中预留的输出 token |
| `COMPRESS_TRIGGER` | `70%` of budget | 触发压缩的真实 token 数量 |
| `CHARS_PER_TOKEN` | `3.2` | 仅用于懒预判估算（tokenizer 失败时回退） |

压缩请求以两种方式标记：
- dashboard 中的 `已压缩上行` / `Prompt compressed` 徽章（带压缩前后的 token 数）
- `traffic.json` 中`compressed=true`，含`before`（压缩前真实数）和`after`（压缩后真实数）

## 端点

| URL | 用途 |
|-----|------|
| `http://127.0.0.1:8081/` | Token dashboard，**默认中文**（每 10 秒自动刷新） |
| `http://127.0.0.1:8081/?lang=en` | 同一 dashboard，**英文** |
| `http://127.0.0.1:8081/?lang=zh-CN` | 强制中文 |
| `http://127.0.0.1:8081/traffic.json` | JSON 格式原始统计 |
| `http://127.0.0.1:8081/v1/...` | 转发到 LLM API（计入统计） |
| `http://127.0.0.1:8081/__stats` | dashboard 统计（需认证） |
| `http://127.0.0.1:8081/__shutdown?key=qwen-proxy-stop` | 优雅关闭端点 |

仅转发的 API 请求被计入统计。访问 dashboard 本身不增加流量。

## dashboard 语言

- **默认中文**，无论浏览器的 `Accept-Language` 头
- 点击页面右上角的按钮切换：悬停时显示 `English`
- 切换通过设置 `lang` 查询参数并刷新实现。因为页面是服务端渲染的，`?lang=` 参数只被 dashboard 本地路由（`/`、`/stats`、`/index.html`）读取
- 所有标签都已翻译，包括卡片标题、表格表头、空状态消息和状态徽章

## Token 生成速度（v2.0）

dashboard 现在显示 token 生成速度：

- **每行请求**：显示 `tok/s`，鼠标悬停显示精确的毫秒时长
- **顶部卡片**：显示"平均输出速度" / `Avg Output Speed` - 所有请求的加权平均（长请求权重更大）
- **注意**：此速度略低于 llama-server 的 `predicted_per_second`，因为它包含预填充时间（处理你的输入 token）

## 启动

```bash
node traffic-proxy.js
```

或使用自定义端口：

```bash
set PROXY_PORT=9000
node traffic-proxy.js
```

## 日志文件

```
./traffic-stats/YYYY-MM-DD/traffic.json          # 每日统计（午夜滚动）
./.total-tokens-since-start.json                 # 旧版生命周期计数器（写入但不显示在 dashboard）
```

dashboard 顶部卡片汇总今天和昨天的每日文件（`shiftDate()` 计算前一天的文件路径）。

## 统计字段

`traffic.json` 包含：

- `totalTokens`、`promptTokens`、`completionTokens`、`cachedTokens`: token 总数
- `requests`: 请求数
- `startTime`、`lastUpdate`: 时间戳（JSON 中为 UTC；页面渲染为上海时间）
- `details`: 每请求记录数组（最新在前），每条包含：
  - `time`、`method`、`path`、`status`
  - `hasUsage`: 响应是否包含 `usage` 字段
  - `promptTokens`、`completionTokens`、`totalTokens`、`cachedTokens`
  - `promptContent`: 上游 prompt 文本（最后一条用户消息），显示为"上行（提示词）"
  - `responseContent`: 下游回复文本，显示为"下行（回复内容）"
  - `stream`: 响应是否流式
  - `durationMs`: 请求耗时（毫秒）
  - `compressed`: 请求是否被压缩（`true`/`false`）
  - `before`/`after`: 压缩前后的 token 数量（如果被压缩）
  - `exact`: 是否使用真 tokenizer 计数（tokenizer 失败时回退到字符估算）
  - `userPatched`: 是否追加了用户消息（修复"无用户提问"500 错误）

内容为可读格式解析，而非存储原始 JSON：最后一条 `user` 消息被提取并显示为摘要。

**注意：** llama.cpp 仅在请求中设置 `stream_options.include_usage=true` 时才对流式响应报告 `usage`。非流式请求始终报告 usage。

## 批量写入与优雅关闭

为避免同步磁盘 IO 阻塞请求转发，写入采用批量方式：

- 每个请求只标记内存状态脏；后台定时器每 `SAVE_INTERVAL_MS`（默认 5000ms）刷新到磁盘
- dashboard 始终读取实时内存数据，因此即使磁盘写入前也会立即更新
- 退出时通过 `SIGINT`、`SIGTERM`、`uncaughtException` 和最后的 `exit` 钩子刷新待写数据
- `stop-proxy.bat` / `stop-all.bat` 调用本地 `GET /__shutdown?key=qwen-proxy-stop` 端点触发优雅关闭
- 关闭端点仅接受带正确密钥的回环请求（否则 403）

## 停止

按 `Ctrl+C`，或运行 `stop-proxy.bat` / `stop-all.bat`。两种情况下待写数据都会自动保存。

## 环境变量

- `PROXY_PORT`: 代理监听端口（默认 8081）
- `SAVE_INTERVAL_MS`: 批量磁盘写入间隔（毫秒，默认 5000）
- `SHUTDOWN_KEY`: `/__shutdown` 所需的密钥（默认 `qwen-proxy-stop`）
- `MODEL_CTX`: 上游上下文窗口大小（默认 131072）
- `OUTPUT_RESERVE`: 输出 token 预留（默认 8192）
- `CTX_BUDGET`: 输入预算 = `MODEL_CTX - OUTPUT_RESERVE`
- `COMPRESS_TRIGGER`: 触发压缩的真实 token 数量（默认:`CTX_BUDGET` 的 70%）

## 问题排查

### 500 "无用户提问"

此错误发生在请求没有用户消息时。代理现在会自动追加一条最小用户消息来修复此问题。

- 代理是否在运行？(`netstat -ano | findstr :8081`)
- dashboard 中是否有请求？
- 检查 `traffic.json` 中`userPatched=true` 条目（表示修复生效）

### 400 "使用量已超出频率限制"

这表示请求过大。代理应该已压缩它。如果仍出现：

- 检查 dashboard 中 `compressed=true`
- 验证 `COMPRESS_CONTEXT=1` 已设置
- 检查上游 API 密钥是否有速率限制

### 压缩未触发

如果大请求未被压缩：

- 检查 `COMPRESS_TRIGGER` 环境变量（应为 `CTX_BUDGET` 的~70%）
- 验证 `CTX_BUDGET` 匹配 `MODEL_CTX - OUTPUT_RESERVE`
- 检查 `traffic.json` 中 `compressed=false` 且 token 数高的条目

### dashboard 未更新

dashboard 从内存数据读取，因此应即时更新。如果未更新：

- 检查浏览器控制台错误
- 验证代理在 8081 端口运行
- 尝试硬刷新 (Ctrl+F5)

## 已知问题

1. **图片 token 估算**：图片原样通过无压缩；上游会统计它们。大图片请求仍可能接近限制。
2. **工具调用参数大小**：非常大的工具参数可能导致压缩丢弃整个工具轮次。这是设计如此以保留配对。
3. **Token 速度包含预填充**：显示的 `tok/s` 包含预填充时间，因此略低于纯解码速度。

## 更新日志

### v2.0 (2026-11-20)

- **真 tokenizer 计数**：用上游 `/tokenize` 替换 `chars/3.2` 估算，实现精确计数
- **输出预留**：输入预算 = `CTX_BUDGET - OUTPUT_RESERVE`
- **70% 水位线**：在预算的 70% 触发压缩，而非 100%
- **工具调用保护**：永不文本截断 `tool_calls[].function.arguments`
- **无用户消息兜底**：缺失时追加最小用户消息（修复 500 错误）
- **带配对的丢弃历史**：维持 `tool` ↔ `assistant(tool_calls)` 配对
- **Token 速度显示**：每行 `tok/s` 和 dashboard 平均值
- **Bug 修复**：三次 500 错误（#1:400 超限，#2: 参数解析，#3: 模板异常）

### v1.x

- 初始版本，含上下文压缩和 dashboard
