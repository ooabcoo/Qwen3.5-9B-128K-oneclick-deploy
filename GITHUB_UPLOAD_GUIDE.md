# GitHub 上传指南

本指南详细说明哪些文件应该上传到 GitHub，哪些不应该。

---

## ✅ 应该上传到 GitHub 的文件

### 核心部署脚本
```
qwen-deploy.ps1          # Qwen3.5-9B 一键部署脚本
one-click-start.bat      # 一键启动脚本
stop-all.bat             # 停止所有服务
stop-proxy.bat           # 停止代理
stop-text.bat            # 停止文本模式
deploy.bat               # 部署脚本
PowerShell-UTF8Config.ps1  # PowerShell UTF8 配置
```

### 核心代理文件
```
traffic-proxy.js         # 核心代理文件
```

### 启动脚本
```
start-qwen.bat           # Qwen 启动
start-qwen-text.bat      # 文本模式启动
```

### 文档
```
README.md                    # 主 README（中文）
README-GITHUB.md             # README 英文版
traffic-proxy.md             # 代理说明（中文）
README-START.md              # 启动说明
README-TEXT-MODE.md          # 文本模式说明
```

### Git 配置
```
.gitignore                   # Git 忽略配置
```

### 许可证
```
LICENSE                     # 开源许可证
```

---

## ❌ 不应该上传到 GitHub 的文件

### 模型权重文件（最重要！）
```
*.gguf                      # 模型权重文件（数 GB）
*.bin                       # 模型二进制文件
*.safetensors               # 安全张量文件
```

### 运行时文件
```
llama.cpp/llama-server.exe  # 运行时可执行文件
*.pid                       # 进程 ID 文件
llama.cpp/logs/            # 日志目录
```

### 配置文件（敏感）
```
api-key.txt                 # API 密钥文件
```

### 临时和缓存文件
```
cache/                      # 下载缓存
*.zip                      # 临时压缩包
traffic-stats/             # 统计目录
__pycache__/               # Python 缓存
*.pyc                      # Python 编译文件
```

### 演示资源
```
0*-birth.png               # 演示图片
0*-title.png
0*-gate.png
0*-speed.png
0*-terminal.png
0*-switch.png
0*-fields.png
0*-uses.png
0*-rest.png
0*-confession.png
0*-outro.png
cd0714ac3b21de21dd532bc1fbc8eac7.png
ee68cc3fe1a221260281a5fb88fcdd38.png
a4b040495588aee5af3069ada34878e7.png
*.mp4                      # 演示视频
```

### 测试文件
```
test-*.js
test-*.jpg
test-*.png
```

### 其他模型部署
```
deploy-glm41v.ps1          # GLM-4.1V 部署脚本（可选）
GLM-4.1V-*.md              # GLM 相关文档
GLM-4.1V-*.py              # GLM 相关代码
```

---

## 📦 当前 Git 状态

### 已修改文件（建议提交）
```
M  .gitignore
M  README.md
M  one-click-start.bat
M  qwen-deploy.ps1
M  stop-all.bat
M  stop-proxy.bat
M  traffic-proxy.js
M  traffic-proxy.md
```

### 未跟踪文件（部分可提交）
```
? .github/                  # GitHub 配置目录（可选）
? .total-tokens-since-start.json  # 统计文件（建议删除）
? .workbuddy/memory/        # 本地工作记忆（建议删除）
? DEPLOY-GITHUB-EN.md       # 部署指南英文版（可选）
? DEPLOY-GITHUB.md          # 部署指南中文版（可选）
? GITHUB_UPLOAD_READY.md    # 上传准备说明（可选）
? PowerShell-UTF8Config.ps1 # UTF8 配置（可选）
? QUICK-START.md            # 快速开始指南（可选）
? README-GLM-4.1V-EN.md     # GLM 英文版（可选）
? README-docs.md            # 文档 README（可选）
? deploy.bat                # 部署批处理（可选）
? nul                       # 空文件（建议删除）
? traffic-proxy-en.md       # 代理说明英文版（可选）
? traffic-proxy-zh.md       # 代理说明中文版（可选）
? "\345\207\206\345\244\207\344\270\212\344\274\240 GitHub \346\270\205\345\215\225.md"  # 中文部署说明（可选）
? "\351\203\250\347\275\262\346\226\207\344\273\266\350\257\264\346\230\216.md"  # 部署文件说明（可选）
```

### 已删除文件（保持删除）
```
D "~$\345\205\245deepseek harness\345\217\202\346\225\260.docx"  # 临时文档（已删除）
```

---

## 🚀 推荐上传策略

### 最小化上传（仅核心功能）
```bash
git add \
  qwen-deploy.ps1 \
  one-click-start.bat \
  stop-all.bat \
  stop-proxy.bat \
  stop-text.bat \
  traffic-proxy.js \
  start-qwen.bat \
  start-qwen-text.bat \
  deploy.bat \
  PowerShell-UTF8Config.ps1 \
  README.md \
  traffic-proxy.md \
  README-START.md \
  README-TEXT-MODE.md \
  .gitignore \
  LICENSE
```

### 完整上传（包含辅助文档）
```bash
git add \
  # 核心脚本
  qwen-deploy.ps1 \
  one-click-start.bat \
  stop-all.bat \
  stop-proxy.bat \
  stop-text.bat \
  traffic-proxy.js \
  start-qwen.bat \
  start-qwen-text.bat \
  deploy.bat \
  PowerShell-UTF8Config.ps1 \
  
  # 文档
  README.md \
  README-GITHUB.md \
  traffic-proxy.md \
  README-START.md \
  README-TEXT-MODE.md \
  DEPLOY-GITHUB.md \
  DEPLOY-GITHUB-EN.md \
  QUICK-START.md \
  README-docs.md \
  traffic-proxy-en.md \
  traffic-proxy-zh.md \
  "\345\207\206\345\244\207\344\270\212\344\274\240 GitHub \346\270\205\345\215\225.md" \
  "\351\203\250\347\275\262\346\226\207\344\273\266\350\257\264\346\230\216.md" \
  
  # Git 配置
  .gitignore \
  LICENSE
```

### 不上传的文件（保持未跟踪）
```
.github/                  # 建议删除
.total-tokens-since-start.json  # 运行时统计
.workbuddy/memory/        # 本地工作记忆
GITHUB_UPLOAD_READY.md    # 上传准备说明（本地参考）
PowerShell-UTF8Config.ps1 # 本地配置
```

---

## ⚠️ 重要提醒

1. **绝不上传模型文件**（`.gguf`、`.bin`、`.safetensors`）
2. **绝不上传 API 密钥** 等敏感信息
3. **运行时文件** 会自动生成，不需要上传
4. **演示资源** 可选择性上传，不上传不影响功能
5. **其他模型部署脚本** 可选择性上传

---

## 🔍 如何验证

上传前运行以下命令检查：

```bash
# 检查是否包含模型文件
git grep -l "\.gguf$" .
git grep -l "\.bin$" .
git grep -l "\.safetensors$" .

# 检查是否包含敏感信息
git grep -l "api-key" .
git grep -l "API_KEY" .
```

---

**更新日期**: 2026-11-20  
**版本**: 1.0
