<!--
  Qwen3.5-9B · 128K · 一键部署
  GitHub README - 中英文双版本

  使用说明：
  - 中文版本：默认显示
  - 英文版本：滚动到页面底部
  -->
<div align="center">

# Qwen3.5-9B · 128K · 一键部署

> **双击启动脚本，6 分钟后，你的 12GB 显卡上跑着 128K 上下文的 Qwen3.5-9B。**

![Windows](https://img.shields.io/badge/Windows-10%2F11-0078D4?logo=windows&logoColor=white)
![llama.cpp](https://img.shields.io/badge/llama.cpp-b11669-b11669)
![VRAM](https://img.shields.io/badge/VRAM-9.4%20GB-8A2BE2)
![Context](https://img.shields.io/badge/Context-131%2C072-1f6feb)
![API](https://img.shields.io/badge/API-OpenAI%20compatible-10a37f)

**核心特性：**
- 🚀 **2,813 tok/s** 预填充速度 · **55-70 tok/s** 解码速度
- 🧠 **131,072 token** 超长上下文（4 并发槽位）
- 🎨 **支持视觉识别**：通过图片输入理解内容
- 📊 **Token 统计**：实时追踪每次请求的 token 用量
- 🔌 **OpenAI 兼容 API**：直接对接任何客户端

[📖 快速开始](#-快速开始) · [🔧 功能特性](#-功能特性) · [📊 性能数据](#-性能数据) · [🎨 视觉识别](#-视觉识别) · [📈 Token 统计](#-token 统计) · [API 用法](#api-用法) · [🇬🇧 English](#english)

</div>

---

## 🌟 项目简介

这是一个**一键部署**方案，让 Windows 用户能够在本地显卡上运行 Qwen3.5-9B 大语言模型。

### 为什么选择这个方案

- ✅ **无需复杂环境配置**：不需要 CUDA Toolkit、Python、编译环境
- ✅ **开箱即用**：双击脚本自动下载安装、配置、启动
- ✅ **可视化进度**：清晰的下载进度条，断点续传
- ✅ **标准 API 接口**：OpenAI 兼容，直接对接客户端
- ✅ **双模式可选**：完整版（带视觉识别）+ 轻量版（纯文本）

---

## 📦 项目结构

```
Qwen3.5-9B-128K-oneclick-deepseek-main/
├── start-qwen.bat              # 完整版启动脚本（带视觉识别）
├── start-qwen-text.bat         # 轻量版启动脚本（纯文本）
├── stop-all.bat                # 停止所有服务
├── stop-text.bat               # 停止轻量版服务
├── stop-qwen.bat               # 停止完整版服务
├── qwen-deploy.ps1             # 部署逻辑脚本
├── traffic-proxy.js            # Token 统计代理
├── traffic-proxy.md            # 统计功能说明
├── README-GITHUB.md            # 本文件
├── llama.cpp/                  # 推理引擎（~550 MB）
├── models/                     # 模型缓存
├── README.md                   # 中文详细文档
└── ...
```

### 核心文件说明

| 文件 | 作用 |
|------|------|
| `start-qwen.bat` | **完整版**：带视觉识别，首次自动下载引擎 (550MB) + 模型 (5.6GB) + 视觉投影 (876MB) |
| `start-qwen-text.bat` | **轻量版**：纯文本模式，不加载视觉投影，启动更快 (~4.5 分钟) |
| `qwen-deploy.ps1` | 所有部署逻辑：环境检查、下载、验证、解压、启动 |
| `traffic-proxy.js` | Token 统计代理，运行在 8081 端口 |
| `stop-all.bat` | 一键停止所有服务（模型 + 代理） |

---

## 🚀 快速开始

### 方式一：完整版（推荐，带视觉识别）

1. **双击启动**：`start-qwen.bat`
2. **等待完成**：首次运行约 6 分钟（取决于网络速度）
3. **访问服务**：浏览器自动打开 http://127.0.0.1:8080

```bash
# 命令行方式
start-qwen.bat
```

### 方式二：轻量版（纯文本，更快）

1. **双击启动**：`start-qwen-text.bat`
2. **等待完成**：首次运行约 4.5 分钟
3. **访问统计**：http://127.0.0.1:8081

```bash
# 命令行方式
start-qwen-text.bat
```

### 停止服务

- **停止完整版**：双击 `stop-qwen.bat`
- **停止轻量版**：双击 `stop-text.bat`
- **停止所有**：双击 `stop-all.bat`

---

## 🔧 功能特性

### 1. 智能环境检测

启动前自动检查：
- ✅ 64 位系统 / Windows 10+
- ✅ 显卡驱动和 CUDA 支持
- ✅ 磁盘空间充足
- ✅ VC++ 运行库（缺失自动安装）

### 2. 自动下载与验证

- 📥 多源下载（hf-mirror.com / GitHub）
- 🔒 断点续传，断网重连
- ✅ 文件完整性验证
- 📊 实时进度条显示

### 3. OpenAI 兼容 API

提供标准接口：
- `/v1/chat/completions` - 对话接口
- `/v1/completions` - 补全接口
- `/v1/models` - 模型列表
- `/health` - 健康检查
- `/props` - 属性信息
- `/metrics` - 性能指标

### 4. Token 统计功能

- 📈 实时追踪每次请求的 token 用量
- 💾 每日自动保存统计数据
- 🌐 支持中英文界面切换
- 📊 可视化仪表盘

访问 http://127.0.0.1:8081/ 查看详细统计。

---

## 🎨 视觉识别

完整版（`start-qwen.bat`）支持图片输入识别：

### 功能说明

- 🖼️ **图片理解**：模型能够识别和理解图片内容
- 📸 **实时 OCR**：支持文本识别和提取
- 🎯 **多模态对话**：结合文本和图片进行交互

### 技术细节

- **视觉投影文件**：`mmproj-F16.gguf` (~876 MB)
- **加载方式**：自动检测同目录的 mmproj 文件
- **错误处理**：若看到 `image input is not supported` 错误，检查 mmproj 文件是否存在

### 使用示例

```json
{
  "model": "qwen3.5-9b",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "path/to/image.png"
          }
        },
        {
          "type": "text",
          "text": "描述这张图片的内容"
        }
      ]
    }
  ],
  "stream": false
}
```

### 轻量版（纯文本）

使用 `start-qwen-text.bat` 启动时，**不会加载视觉投影**，节省显存和启动时间。

---

## 📊 性能数据

### 测试环境

- **显卡**：NVIDIA GeForce RTX 5070 Ti Laptop (12 GB)
- **CPU**：Intel i7
- **内存**：16 GB DDR5-5600
- **驱动**：591.91

### 核心指标

| 指标 | 数值 | 说明 |
|------|------|------|
| **预填充 (Prefill)** | **2,813 tok/s** | 首字延迟低 |
| **解码 (Decode)** | **55-70 tok/s** | 流畅对话 |
| **上下文** | **131,072 tokens** | 4 并发槽位 |
| **显存占用** | **~9.4 GB** | 12GB 显卡 |
| **空载显存** | ~10.3 GB | 含上下文缓冲 |

### 首字延迟 (TTFT)

| 输入长度 | 首字延迟 | 说明 |
|---------|---------|------|
| 4 tokens | **110 ms** | 基本为网络开销 |
| 1.1K tokens | **605 ms** | 预填充 2,631 tok/s |
| 3.8K tokens | **1,303 ms** | 2,978 tok/s |
| 15K tokens | ~2,000 ms | 缓存命中时更短 |
| 30K tokens | 6,944 ms | 2,214 tok/s |

> **经验法则**：每增加 1,000 个输入 token，首字延迟约增加 0.35 秒。

### 上下文长度建议

根据显卡显存选择合适的上下文长度：

| 显卡显存 | 推荐上下文 | 说明 |
|---------|-----------|------|
| 8 GB | 32K | 保守配置，稳定运行 |
| 12 GB | 128K | 舒适值，平衡性能 |
| 16 GB | 256K | 激进配置，需牺牲其他应用显存 |

---

## 📈 Token 统计

### 功能概述

`traffic-proxy.js` 提供实时的 Token 统计功能：

- **统计维度**：
  - 总 Token 数
  - 输入 Token (prompt)
  - 输出 Token (completion)
  - 缓存命中 Token
  - 请求次数
  - 每次请求的明细

- **数据存储**：
  - 每日自动保存：`traffic-stats/YYYY-MM-DD/traffic.json`
  - 重启不清零
  - 最多保留最近 2,000 条记录

- **界面特性**：
  - 默认中文界面
  - 支持切换到英文
  - 每 10 秒自动刷新
  - 鼠标悬停查看完整提示词和回复内容

### 访问地址

| 地址 | 说明 |
|------|------|
| `http://127.0.0.1:8081/` | Token 统计仪表盘（中文默认） |
| `http://127.0.0.1:8081/?lang=en` | 英文界面 |
| `http://127.0.0.1:8081/stats` | 统计页面 |
| `http://127.0.0.1:8081/traffic.json` | 原始 JSON 数据 |

### 语言切换

- **默认语言**：中文
- **切换方式**：点击右上角语言按钮
- **URL 参数**：
  - `?lang=en` - 英文界面
  - `?lang=zh-CN` - 中文界面

### 统计示例

```json
{
  "totalTokens": 10455441,
  "promptTokens": 4890234,
  "completionTokens": 5405928,
  "cachedTokens": 219279,
  "requests": 967,
  "details": [
    {
      "time": "2026-11-18T20:30:15.123Z",
      "promptTokens": 1069,
      "completionTokens": 2252,
      "totalTokens": 3321,
      "promptContent": "描述这张图片的内容",
      "responseContent": "这是一个 Qwen Vision Test Image..."
    }
  ]
}
```

---

## 🔌 API 用法

### 配置信息

```text
Base URL : http://127.0.0.1:8080/v1
API Key  : sk-xxx (见 api-key.txt)
模型名   : qwen3.5-9b
```

### Python 示例

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="sk-xxx"
)

response = client.chat.completions.create(
    model="qwen3.5-9b",
    messages=[
        {
            "role": "user",
            "content": "用三句话解释什么是 KV cache"
        }
    ],
    temperature=0.3,
    max_tokens=1024,
)

print(response.choices[0].message.content)
```

### 注意事项

1. **思考模式**：Qwen3.5 默认先生成推理内容（`reasoning_content`）
   - 直接输出正文：`"chat_template_kwargs": {"enable_thinking": false}`

2. **API 密钥**：
   - `/health` 接口无需密钥
   - 其他接口需要 `Authorization: Bearer <key>`

3. **流式响应**：
   - 默认流式返回
   - 获取 Token 统计需设置 `stream_options: { include_usage: true }`

---

## ⚠️ 已知限制

1. **显存需求**：131K 上下文需要约 10.3 GB 显存
2. **单实例限制**：同一时间只能运行一个实例
3. **模型量化**：使用 Q4_K_XL 量化，长文可能存在事实性幻觉
4. **显卡驱动**：需要 NVIDIA CUDA 12.4+ 支持

## 🆚 与 Bonsai 27B 对比

| 特性 | Qwen3.5-9B | Bonsai 27B |
|------|-----------|-----------|
| 模型大小 | 5.56 GiB | 8.87 GiB |
| 参数数量 | 8.95B | 27B |
| 上下文 | 131,072 | 73,728 |
| 预填充速度 | 2,813 tok/s | 564-724 tok/s |
| 解码速度 | 55-70 tok/s | 57-66 tok/s |
| 显存占用 | 9.4 GB | 10.5 GB |

**选择建议**：
- **要首字快**：选择 9B 版本
- **要长文档**：选择 27B 版本

---

## 🔧 高级配置

### 启动参数

```bash
start-qwen.bat [-Ctx 32768] [-ApiKey "custom-key"] [-MMProj "path/to/mmproj.gguf"]
```

| 参数 | 说明 |
|------|------|
| `-Ctx` | 自定义上下文长度（默认 131072） |
| `-ApiKey` | 自定义 API 密钥 |
| `-MMProj` | 指定视觉投影文件路径 |
| `-Background` | 后台模式启动（窗口可关闭） |

### 环境变量

| 变量 | 说明 |
|------|------|
| `PROXY_PORT` | 统计代理端口（默认 8081） |

---

## 🐛 故障排查

### 启动失败

1. **CUDA 检测失败**：
   ```bash
   # 检查显卡驱动
   nvidia-smi
   ```

2. **磁盘空间不足**：
   ```bash
   # 检查可用空间（需至少 10GB）
   wmic logicaldisk get size,freespace,caption
   ```

3. **端口被占用**：
   ```bash
   # 查看占用 8080/8081 的进程
   netstat -ano | findstr ":8080"
   ```

### 视觉识别失败

- 检查模型目录下是否存在 `mmproj*.gguf` 文件
- 使用 `start-qwen.bat -MMProj "路径"` 显式指定

### Token 统计不更新

- 确保通过代理访问 API：`http://127.0.0.1:8081/v1/...`
- 直接访问 8080 不会统计

---

## 📚 详细文档

- [README.md](README.md) - 中文详细文档
- [traffic-proxy.md](traffic-proxy.md) - Token 统计功能说明
- [使用说明.md](使用说明.md) - 完整使用指南

---

## 🙏 开源致谢

- **模型**：Qwen3.5-9B by Alibaba (Apache-2.0)
  - 量化版本：`unsloth/Qwen3.5-9B-GGUF:UD-Q4_K_XL`
- **推理引擎**：llama.cpp b11669 (CUDA 13.4 构建)
- **镜像源**：hf-mirror.com / GitHub
- **部署脚本**：本仓库

---

## 📝 更新日志

### 2026.11.18
- ✨ 新增 Token 统计功能（中英文界面）
- 🎨 新增视觉识别支持（完整版）
- 💡 新增轻量版启动脚本
- 🔧 优化部署流程和环境检测
- 🐛 修复端口占用检测问题

### 2026.10.19
- 🚀 首次发布 Qwen3.5-9B 一键部署方案

---

<div align="center">

如果这个项目帮到你，请考虑 ⭐ Star 支持！

<div style="display: flex; gap: 20px; justify-content: center; margin-top: 30px;">
  <a href="https://github.com/your-repo" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
</div>

</div>

---

## 🇬🇧 English

<div align="center">
<b>Double-click <code>start-qwen.bat</code>. In six minutes, Qwen3.5-9B with 128K context runs on your 12 GB GPU.</b>
</div>

## What This Project Is

A **one-click deployment** solution for running Qwen3.5-9B locally on Windows with GPU acceleration.

### Why Choose This Solution

- ✅ **No complex setup** - No CUDA Toolkit, Python, or compilation required
- ✅ **Ready to use** - Double-click and it works
- ✅ **Visual progress** - Clear download progress with resume support
- ✅ **Standard API** - OpenAI-compatible interface
- ✅ **Dual modes** - Full version (with vision) + Lightweight (text-only)

---

## 📁 Project Structure

```
Qwen3.5-9B-128K-oneclick-deepseek-main/
├── start-qwen.bat              # Full version (with vision)
├── start-qwen-text.bat         # Lightweight version (text-only)
├── stop-all.bat                # Stop all services
├── stop-text.bat               # Stop lightweight version
├── qwen-deploy.ps1             # Deployment logic
├── traffic-proxy.js            # Token statistics proxy
├── traffic-proxy.md            # Statistics documentation
├── README-GITHUB.md            # This file
├── llama.cpp/                  # Inference engine (~550 MB)
├── models/                     # Model cache
└── ...
```

---

## 🚀 Quick Start

### Method 1: Full Version (Recommended, with Vision)

1. **Double-click**: `start-qwen.bat`
2. **Wait**: First run takes ~6 minutes
3. **Access**: Browser opens http://127.0.0.1:8080

```bash
start-qwen.bat
```

### Method 2: Lightweight Version (Text-Only, Faster)

1. **Double-click**: `start-qwen-text.bat`
2. **Wait**: First run takes ~4.5 minutes
3. **Access Statistics**: http://127.0.0.1:8081

```bash
start-qwen-text.bat
```

### Stop Services

- **Full version**: `stop-qwen.bat`
- **Lightweight version**: `stop-text.bat`
- **All services**: `stop-all.bat`

---

## 🔧 Features

### 1. Smart Environment Detection

Pre-flight checks:
- ✅ 64-bit system / Windows 10+
- ✅ GPU drivers and CUDA support
- ✅ Sufficient disk space
- ✅ VC++ runtime (auto-install if missing)

### 2. Automatic Download & Verification

- 📥 Multi-source download (hf-mirror.com / GitHub)
- 🔒 Resume on interruption
- ✅ File integrity verification
- 📊 Real-time progress bar

### 3. OpenAI-Compatible API

Standard endpoints:
- `/v1/chat/completions` - Chat interface
- `/v1/completions` - Completion interface
- `/v1/models` - Model list
- `/health` - Health check
- `/props` - Properties
- `/metrics` - Performance metrics

### 4. Token Statistics

Real-time tracking:
- 📊 Total tokens
- 💡 Input tokens (prompt)
- 📝 Output tokens (completion)
- 💾 Cached tokens
- 📈 Request count
- 📋 Detailed per-request breakdown

Visit http://127.0.0.1:8081/ for detailed statistics.

---

## 🎨 Vision Recognition

The full version (`start-qwen.bat`) supports image input recognition:

### Features

- 🖼️ **Image understanding** - Model can recognize and interpret images
- 📸 **OCR** - Text recognition and extraction
- 🎯 **Multimodal chat** - Combine text and images

### Technical Details

- **Vision projector**: `mmproj-F16.gguf` (~876 MB)
- **Auto-detection**: Looks for mmproj in the same directory as the model
- **Error handling**: If you see `image input is not supported`, check for mmproj file

### Usage Example

```json
{
  "model": "qwen3.5-9b",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "path/to/image.png"
          }
        },
        {
          "type": "text",
          "text": "Describe this image"
        }
      ]
    }
  ],
  "stream": false
}
```

### Lightweight Version

Using `start-qwen-text.bat` **does not load the vision projector**, saving VRAM and startup time.

---

## 📊 Performance Metrics

### Test Environment

- **GPU**: NVIDIA GeForce RTX 5070 Ti Laptop (12 GB)
- **CPU**: Intel i7
- **RAM**: 16 GB DDR5-5600
- **Driver**: 591.91

### Core Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Prefill** | **2,813 tok/s** | Low first-token latency |
| **Decode** | **55-70 tok/s** | Smooth conversation |
| **Context** | **131,072 tokens** | 4 concurrent slots |
| **VRAM** | **~9.4 GB** | On 12GB GPU |
| **Empty load** | ~10.3 GB | Includes context buffer |

### Time to First Token (TTFT)

| Input Length | TTFT | Notes |
|-------------|------|-------|
| 4 tokens | **110 ms** | Network overhead |
| 1.1K tokens | **605 ms** | 2,631 tok/s |
| 3.8K tokens | **1,303 ms** | 2,978 tok/s |
| 15K tokens | ~2,000 ms | Faster with cache hit |
| 30K tokens | 6,944 ms | 2,214 tok/s |

> **Rule of thumb**: TTFT increases by ~0.35 seconds per 1,000 input tokens.

### Context Length Recommendations

Choose context length based on available VRAM:

| GPU VRAM | Recommended Context | Notes |
|----------|-------------------|-------|
| 8 GB | 32K | Conservative, stable |
| 12 GB | 128K | Comfortable, balanced |
| 16 GB | 256K | Aggressive, sacrifices other apps' VRAM |

---

## 📈 Token Statistics

### Overview

The `traffic-proxy.js` provides real-time token statistics:

- **Statistics**:
  - Total tokens
  - Input tokens (prompt)
  - Output tokens (completion)
  - Cached tokens
  - Request count
  - Per-request details

- **Data Storage**:
  - Daily auto-save: `traffic-stats/YYYY-MM-DD/traffic.json`
  - Survives restarts
  - Keeps last 2,000 entries

- **Interface Features**:
  - Default Chinese interface
  - Switch to English
  - Auto-refresh every 10 seconds
  - Hover to see full prompt/response

### Access URLs

| URL | Description |
|-----|-------------|
| `http://127.0.0.1:8081/` | Token dashboard (Chinese default) |
| `http://127.0.0.1:8081/?lang=en` | English interface |
| `http://127.0.0.1:8081/stats` | Statistics page |
| `http://127.0.0.1:8081/traffic.json` | Raw JSON data |

### Language Switching

- **Default language**: Chinese
- **Switch**: Click language button in top-right
- **URL parameters**:
  - `?lang=en` - English interface
  - `?lang=zh-CN` - Chinese interface

---

## 🔌 API Usage

### Configuration

```text
Base URL : http://127.0.0.1:8080/v1
API Key  : sk-xxx (see api-key.txt)
Model    : qwen3.5-9b
```

### Python Example

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="sk-xxx"
)

response = client.chat.completions.create(
    model="qwen3.5-9b",
    messages=[
        {
            "role": "user",
            "content": "Explain KV cache in three sentences"
        }
    ],
    temperature=0.3,
    max_tokens=1024,
)

print(response.choices[0].message.content)
```

### Notes

1. **Thinking mode**: Qwen3.5 generates reasoning content first (`reasoning_content`)
   - For direct output: `"chat_template_kwargs": {"enable_thinking": false}`

2. **API Key**:
   - `/health` requires no key
   - Other endpoints need `Authorization: Bearer <key>`

3. **Streaming**:
   - Default is streaming
   - For token stats, set `stream_options: { include_usage: true }`

---

## ⚠️ Known Limitations

1. **VRAM requirements**: 131K context needs ~10.3 GB VRAM
2. **Single instance**: Only one instance can run at a time
3. **Model quantization**: Q4_K_XL may hallucinate on factual questions
4. **GPU drivers**: Requires NVIDIA CUDA 12.4+

## 🆚 Comparison with Bonsai 27B

| Feature | Qwen3.5-9B | Bonsai 27B |
|---------|-----------|-----------|
| Model size | 5.56 GiB | 8.87 GiB |
| Parameters | 8.95B | 27B |
| Context | 131,072 | 73,728 |
| Prefill | 2,813 tok/s | 564-724 tok/s |
| Decode | 55-70 tok/s | 57-66 tok/s |
| VRAM | 9.4 GB | 10.5 GB |

**Recommendation**:
- **Fast first token**: Choose 9B
- **Long documents**: Choose 27B

---

## 🔧 Advanced Configuration

### Command Line Options

```bash
start-qwen.bat [-Ctx 32768] [-ApiKey "custom-key"] [-MMProj "path/to/mmproj.gguf"]
```

| Option | Description |
|--------|-------------|
| `-Ctx` | Custom context length (default 131072) |
| `-ApiKey` | Custom API key |
| `-MMProj` | Specify vision projector path |
| `-Background` | Background mode (window can close) |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PROXY_PORT` | Statistics proxy port (default 8081) |

---

## 🐛 Troubleshooting

### Startup Failures

1. **CUDA detection failed**:
   ```bash
   # Check GPU drivers
   nvidia-smi
   ```

2. **Insufficient disk space**:
   ```bash
   # Check available space (need at least 10GB)
   wmic logicaldisk get size,freespace,caption
   ```

3. **Port in use**:
   ```bash
   # Check for processes on 8080/8081
   netstat -ano | findstr ":8080"
   ```

### Vision Recognition Failure

- Check if `mmproj*.gguf` exists in model directory
- Use `start-qwen.bat -MMProj "path"` to specify explicitly

### Token Statistics Not Updating

- Ensure you access API through proxy: `http://127.0.0.1:8081/v1/...`
- Direct access to 8080 is not counted

---

## 📚 Documentation

- [README.md](README.md) - Chinese detailed documentation
- [traffic-proxy.md](traffic-proxy.md) - Token statistics features
- [使用说明.md](使用说明.md) - Complete usage guide

---

## 🙏 Acknowledgments

- **Model**: Qwen3.5-9B by Alibaba (Apache-2.0)
  - Quantized version: `unsloth/Qwen3.5-9B-GGUF:UD-Q4_K_XL`
- **Inference Engine**: llama.cpp b11669 (CUDA 13.4 build)
- **Mirror**: hf-mirror.com / GitHub
- **Deployment Script**: This repository

---

<div align="center">

If this project helped you, please consider ⭐ Starring to support!

<div style="display: flex; gap: 20px; justify-content: center; margin-top: 30px;">
  <a href="https://github.com/your-repo" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
</div>

</div>
