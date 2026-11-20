# GLM-4.1V-9B-Thinking Deployment Guide

## Quick Start

### Method 1: Automated Script (Recommended)

```powershell
# Run the deployment script
.\一键部署 GLM-4.1V.ps1
```

### Method 2: Manual Deployment

```powershell
# 1. Install PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 2. Install other dependencies
pip install transformers accelerate huggingface-hub

# 3. Download model
huggingface-cli download THUDM/GLM-4.1V-9B-Thinking --local-dir E:/glm-4-1v-9b-thinking

# 4. Run test
.\glm_env\Scripts\python GLM-4.1V-9B-Thinking-示例代码.py
```

## Hardware Requirements

| GPU Model | VRAM | Recommended Quantization |
|-----------|------|-------------------------|
| RTX 3060 | 12GB | Q4_K_M |
| RTX 3090/4090 | 24GB | BF16 |
| RTX 4070 Ti | 16GB | Q4_K_M |

## Quick Test

```python
import torch
from transformers import AutoProcessor, Glm4vForConditionalGeneration

# Load model
device = "cuda" if torch.cuda.is_available() else "cpu"
model_path = "E:/glm-4-1v-9b-thinking"

processor = AutoProcessor.from_pretrained(model_path, trust_remote_code=True)
model = Glm4vForConditionalGeneration.from_pretrained(
    model_path,
    torch_dtype=torch.bfloat16,
    device_map=device,
    low_cpu_mem_usage=True
)

# Test
messages = [{"role": "user", "content": [{"type": "text", "text": "Hello"}]}]
text = processor.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, return_dict=True, return_tensors="pt").to(model.device)

with torch.no_grad():
    output = model.generate(**text, max_new_tokens=512)
    response = processor.decode(output[0][text["input_ids"].shape[1]:], skip_special_tokens=True)

print(response)
```

## Troubleshooting

### Problem: CUDA not available
```powershell
# Check CUDA
nvidia-smi

# Reinstall PyTorch
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Problem: Out of Memory
```python
# Use 8-bit quantization
model = Glm4vForConditionalGeneration.from_pretrained(
    model_path,
    load_in_8bit=True,
    device_map="auto"
)
```

## Files

- `一键部署 GLM-4.1V.ps1` - Deployment script
- `GLM-4.1V-9B-Thinking-示例代码.py` - Example code
- `GLM-4.1V-9B-Thinking-部署指南.md` - Chinese deployment guide
- `GLM-4.1V-9B-Thinking-快速部署命令.md` - Quick commands

## References

- Official GitHub: https://github.com/THUDM/GLM-4.1V-Thinking
- Hugging Face: https://huggingface.co/THUDM/GLM-4.1V-9B-Thinking
- Technical Paper: https://arxiv.org/abs/2507.01006
