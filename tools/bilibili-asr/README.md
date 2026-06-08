# B站视频 ASR + 中文翻译

将 B站视频（合集/分P/单视频）自动：下载 → 语音识别 → 翻译中文 → Markdown。

是 echo-learning 素材摄入管线的核心工具。

## 快速开始

```bash
pip install faster-whisper yt-dlp openai
# ffmpeg 通常已装

HF_ENDPOINT=https://hf-mirror.com python3 pipeline.py \
  "https://www.bilibili.com/video/BV14rd3BJExq/" \
  -o ./output
```

## 流水线

```
B站 URL → yt-dlp 下载(m4a) → ffmpeg 转 WAV → Whisper ASR → LLM 翻译 → .md
```

每一步都支持断点续传。

## 选项

| 参数 | 说明 |
|------|------|
| `-o DIR` | 输出目录 (default: ./bilibili_output) |
| `--cookies FILE` | B站 cookies 文件 (付费内容需要) |
| `--hf-mirror URL` | HF 镜像 (国内必用, default: hf-mirror.com) |
| `--skip-translate` | 只做 ASR，跳过翻译 |
| `--download-only` | 只下载音频 |
| `--api-key KEY` | 翻译 API key (也支持 ~/.hermes/.env) |
| `--api-base URL` | 翻译 API 地址 (default: api.deepseek.com) |

## 输出

```
output/
├── audio/          # 下载的 m4a
├── wav/            # 16kHz 单声道 WAV
├── transcript/     # Whisper 英文文本
└── 01_标题.md      # 最终文件(英文+中文)
```

## 性能

| 步骤 | 37分钟/集 |
|------|----------|
| 下载 | 10-30s |
| 转码 | 2-5s |
| ASR (large-v3-turbo) | ~10min |
| 翻译 (DeepSeek) | ~8s |

67集全量：~11小时（主要是 ASR）。

## 限制

- HuggingFace 国内/WSL 必须用 `HF_ENDPOINT=https://hf-mirror.com`
- 翻译默认用 DeepSeek，需要 API key
- CPU 转码，无 GPU 加速；large-v3-turbo + int8 ~4GB RAM
