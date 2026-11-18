# Qwen3.5-9B 纯文本模式使用说明

> 适用于只需要文本对话的场景，节省内存和加载时间

---

## 🎯 与完整版的区别

| 特性 | 完整版 (`start-qwen.bat`) | 纯文本版 (`start-qwen-text.bat`) |
|------|-------------------------|-------------------------------|
| 视觉识别 | ✅ 支持图片输入 | ❌ 不支持 |
| 视觉投影 | mmproj-F16.gguf (~876 MB) | 不加载 |
| 模型大小 | ~6.5 GB | ~5.6 GB |
| 加载时间 | 约 6 分钟 | 约 4.5 分钟 |
| 显存占用 | 约 10.3 GB | 约 9.4 GB |
| Token 统计 | ✅ 支持 | ✅ 支持 |

---

## 📦 包含的功能

- ✅ **文本对话**：完整的 OpenAI 兼容 API
- ✅ **Token 统计**：8081 端口统计页面
- ✅ **持久化**：每天统计记录，重启不清零
- ✅ **一键启动**：双击即可使用

---

## 🚀 快速开始

### 启动

```text
双击：start-qwen-text.bat
```

首次启动会自动：
1. 检查环境（Node.js、PowerShell、必要文件）
2. 检查 8080 端口（模型服务）
3. 检查 8081 端口（Token 统计）
4. 启动缺失的服务
5. 自动打开统计页面

### 访问

- **Token 统计**：http://127.0.0.1:8081/
- **模型 API**：http://127.0.0.1:8080/v1

### 停止

```text
双击：stop-text.bat
```

或

```text
双击：stop-all.bat  （会停止所有服务）
```

---

## 📊 Token 统计功能

统计页面提供：
- 总 Token 数（输入 + 输出）
- 缓存 Token 数
- 每次请求的详细信息
- 请求时间、上行提示词、下行内容

### 统计格式

每日统计保存在 `traffic-stats/YYYY-MM-DD/traffic.json`

示例：
```json
{
  "totalTokens": 3321,
  "promptTokens": 1069,
  "completionTokens": 2252,
  "cachedTokens": 0,
  "requests": 1,
  "startTime": "2026-11-18T12:17:34.716Z",
  "lastUpdate": "2026-11-18T12:20:19.874Z",
  "details": [...]
}
```

---

## 🔌 API 使用

### 连接参数

```text
Base URL : http://127.0.0.1:8080/v1
API Key  : sk-178212e1b4a88d12xhajde052356647hp
模型名   : qwen3.5-9b
```

### Python 示例

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="sk-178212e1b4a88d12xhajde052356647hp"
)

r = client.chat.completions.create(
    model="qwen3.5-9b",
    messages=[
        {"role": "system", "content": "你是一个有用的助手。"},
        {"role": "user", "content": "你好，请介绍一下自己。"}
    ],
    max_tokens=512
)

print(r.choices[0].message.content)
```

---

## ⚙️ 高级选项

### 环境变量

| 变量 | 说明 |
|------|------|
| `PROXY_PORT` | Token 统计代理端口，默认 8081 |

### 启动参数

#### start-qwen-text.bat

无特殊参数，双击即可运行。

#### qwen-deploy.ps1

如需单独启动模型服务：

```powershell
.\qwen-deploy.ps1 -Background -MMProj "" -NoBrowser
```

参数说明：
- `-MMProj ""`：禁用视觉投影
- `-NoBrowser`：不自动打开浏览器
- `-Background`：后台运行

---

## 🛠️ 故障排查

### 问题 1：找不到 Node.js

**症状**：启动时提示"Node.js is not installed"

**解决**：
1. 访问 https://nodejs.org 下载并安装
2. 重启命令行窗口
3. 重新运行 `start-qwen-text.bat`

### 问题 2：8080 端口被占用

**症状**：提示"8080 端口已被占用"

**解决**：
1. 运行 `stop-all.bat` 停止所有服务
2. 或查找占用端口的进程：
   ```cmd
   netstat -a | findstr ":8080"
   ```
3. 终止进程后重新启动

### 问题 3：模型服务未启动

**症状**：访问 API 返回 503 错误

**解决**：
1. 检查日志：
   ```cmd
   type llama.cpp\logs\run-*.log
   ```
2. 手动启动模型：
   ```cmd
   .\qwen-deploy.ps1 -Background -MMProj ""
   ```
3. 检查是否成功监听：
   ```cmd
   netstat -a | findstr ":8080"
   ```

### 问题 4：Token 统计未更新

**症状**：统计页面显示"0 tokens"

**解决**：
1. 确认 API 请求是通过 8081 代理发起的
2. 直接访问 http://127.0.0.1:8080/v1 会绕过统计
3. 使用统计页面的 API 地址或修改代码中的转发规则

---

## 💡 使用建议

### 何时使用纯文本模式

- ✅ 只需要文本对话
- ✅ 需要节省内存（8GB 显卡）
- ✅ 想要更快的启动速度
- ✅ 不需要图片识别功能

### 何时使用完整版

- ✅ 需要图片识别
- ✅ 需要 OCR 功能
- ✅ 有 12GB+ 显卡
- ✅ 需要完整的多模态能力

---

## 📋 文件结构

```
Qwen3.5-9B-128K-oneclick-deepseek-main/
├── start-qwen-text.bat          # 纯文本启动器
├── stop-text.bat                # 纯文本停止器
├── stop-all.bat                 # 停止所有服务
├── qwen-deploy.ps1              # 部署脚本
├── traffic-proxy.js             # Token 统计代理
├── README-TEXT-MODE.md          # 本文档
├── llama.cpp/
│   ├── logs/                    # 日志目录
│   └── models/                  # 模型缓存
└── traffic-stats/               # Token 统计记录
    └── YYYY-MM-DD/
        └── traffic.json
```

---

## 🔄 版本说明

| 版本 | 视觉支持 | 大小 | 适用场景 |
|------|---------|------|---------|
| v1.0 (完整版) | ✅ | ~6.5 GB | 多模态应用 |
| v1.0 (文本版) | ❌ | ~5.6 GB | 纯文本应用 |

---

## 📞 支持

- 查看完整文档：[README.md](README.md)
- 问题反馈：查看日志文件 `llama.cpp\logs\run-*.log`
