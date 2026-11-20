# Qwen3.5-9B 128K 本地部署 - GitHub 部署指南

> 本文档面向从 GitHub 拉取仓库的用户，详细说明从零开始部署和使用的完整流程。

---

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [配置说明](#配置说明)
- [使用指南](#使用指南)
- [故障排查](#故障排查)
- [FAQ](#faq)

---

## 系统要求

### 硬件要求

| 组件 | 最低要求 | 推荐配置 |
|------|---------|---------|
| **GPU** | NVIDIA GTX 1060 (6GB) | NVIDIA RTX 3060 或更高 (12GB+) |
| **显存** | 6 GB | 12 GB+ |
| **CPU** | Intel i5 / AMD Ryzen 5 | Intel i7 / AMD Ryzen 7 |
| **内存** | 16 GB | 32 GB+ |
| **磁盘** | 10 GB 可用空间 | 50 GB+ SSD |

### 软件要求

- **操作系统**: Windows 10/11 (64 位)
- **Node.js**: v18+ (用于 token 统计代理)
- **PowerShell**: Windows PowerShell 5.1+
- **CUDA**: 驱动自动安装（通过脚本）

---

## 快速开始

### 步骤 1：克隆仓库

```bash
git clone https://github.com/ooabcoo/Qwen3.5-9B-128K-oneclick-deepseek-main.git
cd Qwen3.5-9B-128K-oneclick-deepseek-main
```

### 步骤 2：首次启动（自动下载环境 + 模型）

**方式 A：双击启动（推荐新手）**

```bash
# 完整版（带视觉识别）
start-qwen.bat

# 或轻量版（纯文本，启动更快）
start-qwen-text.bat
```

**方式 B：命令行启动**

```powershell
# 后台启动（首次约需 10-15 分钟下载）
.\qwen-deploy.ps1 -Background

# 前台启动（查看详细进度）
.\qwen-deploy.ps1
```

### 步骤 3：等待下载完成

首次启动会自动：
1. 下载 llama.cpp 运行时（~550MB）
2. 下载模型文件（~5.6GB）
3. 自动配置 CUDA 环境
4. 启动服务

**进度提示**：窗口会显示下载进度，耐心等待。

### 步骤 4：验证服务

启动完成后，浏览器会自动打开 dashboard：
- **Dashboard**: http://127.0.0.1:8081/?
- **API**: http://127.0.0.1:8080/v1

如果未自动打开，手动访问上述地址。

### 步骤 5：测试 API

```powershell
# 使用 PowerShell 测试
powershell -ExecutionPolicy Bypass -File qwen-deploy.ps1 -ApiTest
```

预期输出：
```
[OK] API test passed: 200 OK
```

---

## 详细部署步骤

### 前置检查

#### 1. 检查环境

```powershell
# 检查 Node.js
node --version

# 检查 PowerShell
powershell --version

# 检查 CUDA
nvidia-smi
```

#### 2. 检查磁盘空间

```powershell
# 确保至少有 10GB 可用空间
Get-Volume | Where-Object { $_.DriveLetter -eq 'C:' } | Select-Object FileSystemLabel,Size,Used,Free
```

#### 3. 选择部署目录

**重要**：不要将部署目录放在只读位置（如 C 盘根目录、Program Files）。

推荐目录：
- `E:\Qwen\Qwen3.5-9B-128K-oneclick-deepseek-main\`
- `D:\models\Qwen\`

### 首次部署流程

#### 方式 1：使用一键启动脚本（推荐）

```bash
# 进入项目目录
cd Qwen3.5-9B-128K-oneclick-deepseek-main

# 运行启动脚本
start-qwen.bat
```

脚本会自动：
1. 检查环境（Node.js、PowerShell、核心文件）
2. 下载 llama.cpp 运行时（如果不存在）
3. 下载模型文件（如果不存在）
4. 配置 CUDA 环境
5. 启动模型服务（端口 8080）
6. 启动 token 统计代理（端口 8081）
7. 自动打开 dashboard 浏览器

#### 方式 2：使用 PowerShell 脚本

```powershell
# 后台启动（推荐，不会阻塞命令行）
.\qwen-deploy.ps1 -Background

# 前台启动（查看详细日志）
.\qwen-deploy.ps1

# 带参数启动
.\qwen-deploy.ps1 -Background -Ctx 98304 -Tools read_file,grep_search
```

### 部署参数说明

#### 核心参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `-Background` | 否 | 后台启动，不阻塞命令行 |
| `-NoBrowser` | 否 | 不自动打开浏览器 |
| `-ApiTest` | 否 | 启动后自动测试 API |
| `-Status` | - | 查看服务状态 |
| `-Stop` | - | 停止服务 |

#### 模型参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `-Model` | `unsloth/Qwen3.5-9B-GGUF:UD-Q4_K_XL` | 模型仓库地址 |
| `-ModelPath` | `` | 本地模型路径（使用则不下载） |
| `-Ctx` | `131072` | 上下文窗口大小（128K） |
| `-Cuda` | `cuda-13.4` | CUDA 版本（cuda-12.4 或 cuda-13.4） |

#### 工具参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `-Tools` | `read_file,file_glob_search,grep_search,get_info` | 启用的工具列表 |
| `-Listen` | `127.0.0.1` | 监听地址（本地或 0.0.0.0） |

#### 视觉参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `-MMProj` | 自动检测 | 视觉投影文件路径 |

### 启动模式对比

| 模式 | 启动时间 | 显存占用 | 适用场景 |
|------|---------|---------|---------|
| **完整模式** (`start-qwen.bat`) | ~6 分钟 | ~6.5GB | 需要视觉识别 |
| **文本模式** (`start-qwen-text.bat`) | ~4.5 分钟 | ~5.6GB | 纯文本任务 |

---

## 配置说明

### 修改上下文窗口大小

#### 方法 1：修改部署脚本

编辑 `qwen-deploy.ps1` 第 70 行：

```powershell
[int]$Ctx = 98304  # 改为 96K 或 65536
```

#### 方法 2：启动时指定参数

```powershell
.\qwen-deploy.ps1 -Ctx 98304
```

#### 同步修改代理配置

修改模型上下文窗口后，**必须**同步修改代理环境变量：

```bat
# 在启动代理前设置
set MODEL_CTX=98304
set OUTPUT_RESERVE=8192
set CTX_BUDGET=90112
set COMPRESS_TRIGGER=63078
one-click-start.bat
```

### 修改 API 密钥

编辑 `api-key.txt`：

```
sk-178212e1b4a88d12xhajde052356647hp
```

**安全警告**：不要将自定义密钥上传到 GitHub！

### 修改监听地址（局域网访问）

默认只监听本机（127.0.0.1），如需局域网访问：

```powershell
.\qwen-deploy.ps1 -Listen 0.0.0.0
```

**防火墙设置**：
1. 允许 8080 和 8081 端口通过防火墙
2. 仅限本地网络访问

### 启用/禁用工具

#### 启用所有工具（仅可信环境）

```powershell
.\qwen-deploy.ps1 -Tools all
```

#### 禁用所有工具

```powershell
.\qwen-deploy.ps1 -Tools ''
```

#### 自定义工具列表

```powershell
.\qwen-deploy.ps1 -Tools read_file,grep_search
```

**可用工具**：
- `read_file` - 读取文件
- `file_glob_search` - 文件 glob 搜索
- `grep_search` - 内容搜索
- `get_info` - 获取文件信息
- `write_file` - 写入文件（危险！）
- `edit_file` - 编辑文件（危险！）
- `exec_shell_command` - 执行 shell 命令（危险！）

---

## 使用指南

### 通过 Dashboard 使用

1. 访问 http://127.0.0.1:8081/
2. 在输入框中输入提示
3. 点击发送
4. 查看 token 统计信息

### 通过 API 使用

#### 基本请求

```bash
curl http://127.0.0.1:8080/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer sk-your-key" ^
  -d '{
    "model": "qwen3.5-9b",
    "messages": [
      {"role": "user", "content": "你好"}
    ],
    "max_tokens": 100
  }'
```

#### 使用工具

```bash
curl http://127.0.0.1:8080/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer sk-your-key" ^
  -d '{
    "model": "qwen3.5-9b",
    "messages": [
      {"role": "user", "content": "搜索当前目录下的.md 文件"}
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "grep_search",
          "parameters": {
            "type": "object",
            "properties": {
              "pattern": {"type": "string"},
              "path": {"type": "string"}
            },
            "required": ["pattern", "path"]
          }
        }
      }
    ]
  }'
```

#### 视觉识别

```bash
curl http://127.0.0.1:8080/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer sk-your-key" ^
  -d '{
    "model": "qwen3.5-9b",
    "messages": [
      {"role": "user", "content": "<image>分析这张图片</image>"}
    ],
    "max_tokens": 200
  }'
```

### Token 统计

访问 http://127.0.0.1:8081/ 查看：

- **今日统计**：今天的总 token 数
- **请求列表**：每次请求的详细信息
- **压缩记录**：被压缩的请求及前后 token 数
- **Token 速度**：实时输出速度

### 查看日志

- **服务日志**：`llama.cpp/logs/`
- **代理统计**：`traffic-stats/YYYY-MM-DD/traffic.json`
- **运行日志**：`llama.cpp/logs/run-YYYYMMDD-HHMMSS.log`

---

## 故障排查

### 问题 1：下载卡住或失败

**症状**：窗口一直显示"正在下载..."，超过 15 分钟无进展

**解决方案**：

1. 检查网络连接
2. 检查防火墙是否阻止下载
3. 手动下载模型：
   ```powershell
   # 取消后台启动
   taskkill /F /IM node.exe /FI "WINDOWTITLE eq traffic-proxy*"
   taskkill /F /IM llama-server.exe
   
   # 手动下载
   Invoke-WebRequest -Uri "https://huggingface.co/unsloth/Qwen3.5-9B-GGUF/resolve/main/Qwen3.5-9B-UD-Q4_K_XL.gguf" -OutFile ".\llama.cpp\models\Qwen3.5-9B-UD-Q4_K_XL.gguf"
   ```

4. 清理缓存后重试

### 问题 2：服务启动后立即退出

**症状**：启动后窗口一闪而过

**解决方案**：

1. 查看日志 `llama.cpp/logs/server-*.log`
2. 检查磁盘空间是否充足
3. 检查是否有权限问题（以管理员身份运行）

### 问题 3：API 返回 401 错误

**症状**：`Authorization: Bearer xxx` 报错

**解决方案**：

1. 检查 `api-key.txt` 文件是否存在
2. 确认 API 密钥是否正确
3. 在 curl 请求中使用正确的密钥

### 问题 4：Dashboard 不更新

**症状**：统计数字不变化

**解决方案**：

1. 检查代理是否运行：`netstat -ano | findstr :8081`
2. 强制刷新浏览器（Ctrl+F5）
3. 检查浏览器控制台是否有错误

### 问题 5：视觉识别不工作

**症状**：上传图片后模型无法识别

**解决方案**：

1. 检查模型目录是否有 `mmproj-*.gguf` 文件
2. 显式指定视觉投影文件：
   ```powershell
   .\qwen-deploy.ps1 -MMProj .\llama.cpp\models\mmproj-F16.gguf
   ```
3. 检查启动日志是否有 mmproj 加载信息

### 问题 6：上下文压缩未触发

**症状**：长对话未被压缩，导致 400 错误

**解决方案**：

1. 检查代理是否运行：`netstat -ano | findstr :8081`
2. 查看 dashboard 上是否有「已压缩」徽章
3. 检查 `traffic-stats/` 目录下的压缩记录
4. 查看代理日志：`node traffic-proxy.js 2>&1 | findstr [compress]`

### 问题 7：500 错误

**症状**：请求返回 500 错误

**解决方案**：

1. 查看 dashboard 错误信息
2. 检查代理日志 `traffic-stats/` 目录
3. 重启代理服务：
   ```bash
   stop-proxy.bat
   # 然后重新启动
   node traffic-proxy.js
   ```

---

## FAQ

### Q1: 首次启动需要多久？

**A**: 首次启动需要：
- 下载环境：~5 分钟（550MB）
- 下载模型：~10 分钟（5.6GB，取决于网络）
- 总计：约 15 分钟

后续启动只需启动服务，约 1 分钟。

### Q2: 可以只下载模型，不下载运行时吗？

**A**: 可以，但需要手动下载运行时：

```powershell
# 下载运行时
Invoke-WebRequest -Uri "https://github.com/ggml-org/llama.cpp/releases/download/b11669/llama-server-windows-cuda-13.4.zip" -OutFile ".\llama.cpp\llama-server-windows-cuda-13.4.zip"

# 解压到 llama.cpp 目录
Expand-Archive .\llama.cpp\llama-server-windows-cuda-13.4.zip -DestinationPath .\llama.cpp
```

### Q3: 如何在不同 GPU 之间切换？

**A**: 修改 `qwen-deploy.ps1` 第 76 行：

```powershell
[string]$Cuda = 'cuda-12.4'  # 或 'cuda-13.4'
```

### Q4: 模型文件存在，为什么还要下载？

**A**: 这是正常行为。脚本会检查模型文件是否存在：

```powershell
if (Test-Path $ModelFile) {
    # 模型存在，跳过下载
} else {
    # 模型不存在，开始下载
}
```

如果仍提示下载，检查模型文件路径是否正确。

### Q5: 如何查看当前使用的模型？

**A**: 访问 dashboard 首页，或运行：

```powershell
.\qwen-deploy.ps1 -Status
```

### Q6: 可以自定义模型吗？

**A**: 可以，修改 `qwen-deploy.ps1` 第 65 行：

```powershell
[string]$Model = 'your-model-huggingface:tag'
```

或使用本地模型：

```powershell
.\qwen-deploy.ps1 -ModelPath "E:\models\my-model.gguf"
```

### Q7: 如何备份和迁移？

**A**: 

**备份**：
```powershell
# 复制整个项目目录
Copy-Item -Path "E:\Qwen" -Destination "E:\Qwen-Backup" -Recurse
```

**迁移**：
```powershell
# 在新机器上解压备份
Copy-Item -Path "E:\Qwen-Backup" -Destination "E:\Qwen" -Recurse

# 启动
cd E:\Qwen
start-qwen.bat
```

### Q8: 可以修改模型精度吗？

**A**: 可以，修改 `qwen-deploy.ps1` 第 65 行：

```powershell
# Q4_K_XL - 推荐（平衡速度与精度）
[string]$Model = 'unsloth/Qwen3.5-9B-GGUF:UD-Q4_K_XL'

# Q8_0 - 最高精度，显存占用高
[string]$Model = 'unsloth/Qwen3.5-9B-GGUF:Q8_0'

# Q2_K - 速度最快，精度较低
[string]$Model = 'unsloth/Qwen3.5-9B-GGUF:Q2_K'
```

### Q9: 如何禁用 token 统计？

**A**: 停止代理服务：

```bash
stop-proxy.bat
```

### Q10: 可以修改 Dashboard 语言吗？

**A**: 可以，访问时添加参数：

- 英文：http://127.0.0.1:8081/?lang=en
- 中文：http://127.0.0.1:8081/?lang=zh-CN

---

## 性能优化

### 1. 减少启动时间

使用文本模式（纯文本）：

```bash
start-qwen-text.bat
```

### 2. 降低显存占用

- 使用更小的模型精度（Q2_K、Q3_K）
- 减少上下文窗口大小（`-Ctx 98304`）

### 3. 提高推理速度

- 使用 CUDA 13.4（如果支持）
- 启用量化（Q4_K_XL 推荐）

### 4. 减少下载时间

- 使用高速网络
- 考虑使用国内镜像源

---

## 安全建议

1. **API 密钥**：不要将自定义密钥上传到 GitHub
2. **工具权限**：仅启用需要的工具，不要启用 `write_file`、`exec_shell_command`
3. **网络访问**：只允许本地访问（127.0.0.1），不要开放到公网
4. **权限控制**：以普通用户身份运行，不要以管理员身份

---

## 更新日志

- **2026-11-20 (v2.0)**: 
  - 上下文压缩机制重大升级
  - 真 tokenizer 精确计数
  - 解决中文 + 代码混合请求估算误差
  - 输出预留与压后复核机制
  - Token 生成速度显示
  
- **2026-11-19 (v1.0)**: 
  - 初始版本发布
  - 基础部署流程
  - 上下文压缩功能
  - Dashboard 监控

- **2025-08-17 (v1.0)**: 
  - 初始版本发布
  - 一键部署功能
  - Token 统计 dashboard

---

## 技术支持

- 查看 `README.md` 获取详细文档
- 查看 `.github/RELEASE_NOTES.md` 获取更新历史
- 查看 `traffic-stats/` 目录获取请求统计
- 查看 `llama.cpp/logs/` 获取服务日志

---

**版本**: v2.0  
**最后更新**: 2026-11-20  
**维护者**: Qwen Community
