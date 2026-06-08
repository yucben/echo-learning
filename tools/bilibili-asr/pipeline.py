#!/usr/bin/env python3
"""
B站视频 → 英文语音识别 + 中文翻译 全自动流水线
==============================================

一条命令跑通: 下载 → 提取音频 → ASR → 翻译 → 输出 Markdown

用法:
    python3 bilibili_pipeline.py <bilibili_url>
    python3 bilibili_pipeline.py <bilibili_url> -o ./my_output
    python3 bilibili_pipeline.py <bilibili_url> --cookies /tmp/bilibili_cookies.txt
    python3 bilibili_pipeline.py <bilibili_url> --skip-translate   # 只做ASR不翻译
    python3 bilibili_pipeline.py <bilibili_url> --download-only     # 只下载

依赖:
    pip install faster-whisper yt-dlp openai
    apt install ffmpeg

API密钥 (翻译用):
    自动从 ~/.hermes/.env 读取 DEEPSEEK_API_KEY
    或设置环境变量 OPENAI_API_KEY / DEEPSEEK_API_KEY
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional

# ── Constants ──────────────────────────────────────────────────

DEFAULT_WHISPER_MODEL = "large-v3-turbo"
DEFAULT_LANGUAGE = "en"
DEFAULT_COMPUTE_TYPE = "int8"  # CPU用int8省内存

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
REFERER = "https://www.bilibili.com/"

# ── Helpers ────────────────────────────────────────────────────

def load_api_key_from_hermes_env() -> Optional[str]:
    """Try to load DEEPSEEK_API_KEY from ~/.hermes/.env."""
    env_path = Path.home() / ".hermes" / ".env"
    if not env_path.exists():
        return None
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line.startswith("DEEPSEEK_API_KEY="):
            val = line.split("=", 1)[1].strip().strip('"').strip("'")
            return val if val else None
    return None


def safe_filename(s: str) -> str:
    """Sanitize string for use as filename."""
    s = re.sub(r'[\\/*?:"<>|]', "_", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:120]


def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    """Run a subprocess; print stderr on failure."""
    result = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    if result.returncode != 0:
        short = " ".join(cmd[:3])
        print(f"  ✗ {short}... → exit {result.returncode}")
        if result.stderr:
            print(f"    {result.stderr[:300]}")
    return result


def banner(step: str):
    print(f"\n{'─' * 55}")
    print(f"  {step}")
    print(f"{'─' * 55}")


# ── Phase 1: Parse & Download ──────────────────────────────────

def get_playlist_info(url: str, cookies: Optional[str] = None) -> list[dict]:
    """Extract playlist metadata via yt-dlp --dump-json."""
    banner("Step 1/5: Parsing B站 URL …")
    cmd = [
        "yt-dlp", "--flat-playlist", "--dump-json",
        "--user-agent", USER_AGENT,
        "--referer", REFERER,
    ]
    if cookies:
        cmd.extend(["--cookies", cookies])
    cmd.append(url)

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        # single video fallback
        cmd.insert(1, "--no-playlist")
        result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERROR: Cannot parse URL.\n{result.stderr[:500]}")
        sys.exit(1)

    entries = []
    for line in result.stdout.strip().splitlines():
        if not line.strip():
            continue
        e = json.loads(line)
        entries.append(e)

    print(f"  Found {len(entries)} video(s):")
    for i, e in enumerate(entries, 1):
        title = e.get("title", "?")
        dur = e.get("duration", 0)
        if dur:
            print(f"    [{i:02d}] {title}  ({dur // 60}:{dur % 60:02d})")
        else:
            print(f"    [{i:02d}] {title}")

    return entries


def download_audio(url: str, output_dir: Path, cookies: Optional[str] = None) -> list[Path]:
    """Download best-audio stream for all videos in playlist (resumes)."""
    banner("Step 2/5: Downloading audio (m4a) …")
    audio_dir = output_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    template = str(audio_dir / "%(playlist_index)02d_%(title)s.%(ext)s")

    cmd = [
        "yt-dlp",
        "-f", "bestaudio[ext=m4a]/bestaudio[ext=aac]/bestaudio",
        "--extract-audio",
        "--audio-format", "m4a",
        "--audio-quality", "0",
        "-o", template,
        "--user-agent", USER_AGENT,
        "--referer", REFERER,
        "--no-overwrites",
        "--continue",
        "--retries", "5",
        "--fragment-retries", "5",
    ]
    if cookies:
        cmd.extend(["--cookies", cookies])
    cmd.append(url)

    result = subprocess.run(cmd, capture_output=False)  # stream output
    if result.returncode != 0:
        print("ERROR: Download failed.")
        sys.exit(1)

    m4a_files = sorted(audio_dir.glob("*.m4a"))
    if not m4a_files:
        # yt-dlp might produce other extensions
        m4a_files = sorted(audio_dir.glob("*.*"))
        m4a_files = [f for f in m4a_files if f.suffix in (".m4a", ".aac", ".mp4", ".webm", ".opus")]

    print(f"  Downloaded {len(m4a_files)} audio file(s)")
    for f in m4a_files:
        size_mb = f.stat().st_size / 1024 / 1024
        print(f"    {f.name}  ({size_mb:.1f} MB)")

    return m4a_files


# ── Phase 2: Convert to WAV ────────────────────────────────────

def convert_to_wav(m4a_path: Path, wav_dir: Path) -> Optional[Path]:
    """Convert m4a → 16 kHz mono PCM WAV.  Skips if already exists."""
    wav_dir.mkdir(parents=True, exist_ok=True)
    wav_path = wav_dir / (m4a_path.stem + ".wav")

    if wav_path.exists():
        size_mb = wav_path.stat().st_size / 1024 / 1024
        print(f"  [skip] {wav_path.name}  ({size_mb:.1f} MB exists)")
        return wav_path

    cmd = [
        "ffmpeg", "-y",
        "-i", str(m4a_path),
        "-acodec", "pcm_s16le",
        "-ac", "1",
        "-ar", "16000",
        "-loglevel", "error",
        str(wav_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ✗ ffmpeg failed on {m4a_path.name}: {result.stderr[:200]}")
        return None

    size_mb = wav_path.stat().st_size / 1024 / 1024
    print(f"  [ ok] {wav_path.name}  ({size_mb:.1f} MB)")
    return wav_path


# ── Phase 3: ASR (Whisper) ─────────────────────────────────────

# Cache the model so it only loads once
_whisper_model = None
_whisper_model_name = None


def get_whisper_model(model_name: str, compute_type: str, hf_mirror: str = None):
    """Lazy-load WhisperModel; reloads only if model name changes."""
    global _whisper_model, _whisper_model_name
    if _whisper_model is not None and _whisper_model_name == model_name:
        return _whisper_model

    # Set HF mirror for model download (needed in China)
    if hf_mirror and not os.environ.get("HF_ENDPOINT"):
        os.environ["HF_ENDPOINT"] = hf_mirror
        print(f"  (using HF mirror: {hf_mirror})")

    from faster_whisper import WhisperModel

    print(f"  Loading Whisper model '{model_name}' …")
    _whisper_model = WhisperModel(
        model_name,
        device="cpu",
        compute_type=compute_type,
    )
    _whisper_model_name = model_name
    return _whisper_model


def transcribe(wav_path: Path, transcript_dir: Path, model_name: str,
               language: str, compute_type: str, hf_mirror: str = None) -> Optional[Path]:
    """Transcribe WAV → TXT with Whisper.  Skips if output exists."""
    transcript_dir.mkdir(parents=True, exist_ok=True)
    txt_path = transcript_dir / (wav_path.stem + ".txt")

    if txt_path.exists():
        text = txt_path.read_text(encoding="utf-8")
        print(f"  [skip] {txt_path.name}  ({len(text)} chars exists)")
        return txt_path

    model = get_whisper_model(model_name, compute_type, hf_mirror)

    print(f"  Transcribing {wav_path.name} …")
    t0 = time.time()
    segments, info = model.transcribe(
        str(wav_path),
        beam_size=5,
        language=language,
        vad_filter=True,
    )

    lines = []
    for seg in segments:
        lines.append(seg.text.strip())

    elapsed = time.time() - t0
    text = " ".join(lines)
    txt_path.write_text(text, encoding="utf-8")

    print(f"  [ ok] {txt_path.name}  ({len(text)} chars, {elapsed:.0f}s, "
          f"lang={info.language} p={info.language_probability:.2f})")
    return txt_path


# ── Phase 4: Translation ───────────────────────────────────────

def split_text(text: str, max_chars: int = 3000) -> list[str]:
    """Split text into chunks at paragraph boundaries."""
    paragraphs = text.split("\n")
    chunks = []
    buf = []
    buf_len = 0
    for para in paragraphs:
        if buf_len + len(para) > max_chars and buf:
            chunks.append("\n".join(buf))
            buf = []
            buf_len = 0
        buf.append(para)
        buf_len += len(para)
    if buf:
        chunks.append("\n".join(buf))
    return chunks


def translate_text(text: str, api_key: str, base_url: str,
                   model: str, chunk_size: int = 3000) -> str:
    """Translate English → Chinese via LLM API, with chunking + retry."""
    from openai import OpenAI

    client = OpenAI(api_key=api_key, base_url=base_url)
    chunks = split_text(text, chunk_size)

    if len(chunks) == 1:
        chunks_to_do = chunks
    else:
        print(f"    (split into {len(chunks)} chunks)")
        chunks_to_do = chunks

    translations = []
    for i, chunk in enumerate(chunks_to_do):
        if len(chunks_to_do) > 1:
            print(f"    chunk {i + 1}/{len(chunks_to_do)} …")

        for attempt in range(3):
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a professional English→Chinese translator. "
                                "Translate the text below into natural, fluent Chinese. "
                                "Preserve paragraph breaks, tone, and meaning. "
                                "Output ONLY the Chinese translation — no notes, no explanations."
                            ),
                        },
                        {"role": "user", "content": chunk},
                    ],
                    temperature=0.3,
                    max_tokens=4096,
                )
                translations.append(resp.choices[0].message.content.strip())
                break
            except Exception as exc:
                print(f"    retry {attempt + 1}/3: {exc}")
                if attempt < 2:
                    time.sleep(2 ** attempt)
                else:
                    translations.append(f"[translation failed: {exc}]")

    return "\n\n".join(translations)


# ── Main ───────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="B站视频 → 英文ASR + 中文翻译 全自动流水线",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s "https://www.bilibili.com/video/BV1xx411c7mD"
  %(prog)s "https://www.bilibili.com/video/BV1xx411c7mD?p=1" -o ./output
  %(prog)s "https://www.bilibili.com/video/BV1xx411c7mD" --skip-translate
  %(prog)s "https://www.bilibili.com/video/BV1xx411c7mD" --cookies /tmp/cookies.txt
        """,
    )
    parser.add_argument("url", help="B站视频 URL（单视频 / 分P / 合集 / b23.tv 短链）")
    parser.add_argument("-o", "--output-dir", default="./bilibili_output",
                        help="输出目录 (default: ./bilibili_output)")
    parser.add_argument("--cookies", help="B站 cookies.txt 路径（付费内容需要）")

    # Whisper options
    parser.add_argument("--whisper-model", default=DEFAULT_WHISPER_MODEL,
                        help=f"faster-whisper 模型名 (default: {DEFAULT_WHISPER_MODEL})")
    parser.add_argument("--whisper-compute", default=DEFAULT_COMPUTE_TYPE,
                        choices=["int8", "int8_float16", "float16", "float32"],
                        help="compute type (default: int8, CPU最省内存)")
    parser.add_argument("--hf-mirror", default="https://hf-mirror.com",
                        help="HuggingFace 镜像 (国内必用, default: hf-mirror.com)")
    parser.add_argument("--language", default=DEFAULT_LANGUAGE,
                        help="音频语言 (default: en)")

    # Translation options
    parser.add_argument("--api-key",
                        default=(os.environ.get("OPENAI_API_KEY")
                                 or os.environ.get("DEEPSEEK_API_KEY")
                                 or load_api_key_from_hermes_env()),
                        help="翻译 LLM API key (自动从 ~/.hermes/.env 读取)")
    parser.add_argument("--api-base",
                        default=os.environ.get("OPENAI_BASE_URL", "https://api.deepseek.com"),
                        help="翻译 API base URL")
    parser.add_argument("--api-model", default="deepseek-chat",
                        help="翻译模型名 (default: deepseek-chat)")
    parser.add_argument("--skip-translate", action="store_true",
                        help="只做 ASR，不翻译")
    parser.add_argument("--download-only", action="store_true",
                        help="只下载音频，不处理")

    args = parser.parse_args()

    # Resolve short links
    if "b23.tv" in args.url:
        result = subprocess.run(
            ["curl", "-sIL", "-o", "/dev/null", "-w", "%{url_effective}", args.url],
            capture_output=True, text=True,
        )
        resolved = result.stdout.strip()
        if resolved and "bilibili.com" in resolved:
            print(f"  Resolved b23.tv → {resolved}")
            args.url = resolved

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {output_dir}")

    # ── 1. Parse ──
    entries = get_playlist_info(args.url, args.cookies)

    # ── 2. Download ──
    m4a_files = download_audio(args.url, output_dir, args.cookies)

    if args.download_only:
        print("\n✓ Done (--download-only). Audio in:", output_dir / "audio")
        return

    if not m4a_files:
        print("ERROR: No audio files found.")
        sys.exit(1)

    # ── 3. Convert WAV ──
    banner("Step 3/5: Converting to 16kHz mono WAV …")
    wav_dir = output_dir / "wav"
    wav_files = []
    for m4a in m4a_files:
        w = convert_to_wav(m4a, wav_dir)
        if w:
            wav_files.append((m4a.stem, w))

    # ── 4. ASR ──
    banner("Step 4/5: Speech-to-text (Whisper) …")
    transcript_dir = output_dir / "transcript"
    txt_files = []
    for stem, wav in wav_files:
        t = transcribe(wav, transcript_dir, args.whisper_model,
                       args.language, args.whisper_compute, args.hf_mirror)
        if t:
            txt_files.append((stem, t))

    # ── 5. Translate ──
    if args.skip_translate:
        banner("Step 5/5: SKIPPED (--skip-translate)")
    else:
        banner("Step 5/5: Translating English → Chinese …")

        if not args.api_key:
            print("ERROR: No API key. Set DEEPSEEK_API_KEY in ~/.hermes/.env")
            print("  or export OPENAI_API_KEY=...")
            print("  or use --skip-translate.")
            sys.exit(1)

        for stem, txt_path in txt_files:
            out_md = output_dir / f"{stem}.md"
            if out_md.exists():
                print(f"  [skip] {out_md.name} (already exists)")
                continue

            english_text = txt_path.read_text(encoding="utf-8")
            # Extract title from stem: "01_Some Video Title" → "Some Video Title"
            title = re.sub(r"^\d+_", "", stem)

            print(f"  Translating: {title}  ({len(english_text)} chars) …")
            chinese_text = translate_text(
                english_text, args.api_key, args.api_base, args.api_model
            )

            md = (
                f"# {title}\n\n"
                f"## English Original\n\n{english_text}\n\n"
                f"## 中文翻译\n\n{chinese_text}\n"
            )
            out_md.write_text(md, encoding="utf-8")
            print(f"  [ ok] {out_md.name}")

    # ── Summary ──
    print(f"\n{'═' * 55}")
    print(f"  ✓ Pipeline complete!")
    print(f"  Output: {output_dir}")
    md_files = sorted(output_dir.glob("*.md"))
    if md_files:
        print(f"  Generated {len(md_files)} markdown file(s):")
        for f in md_files:
            size_kb = f.stat().st_size / 1024
            print(f"    {f.name}  ({size_kb:.0f} KB)")
    else:
        print(f"  Intermediate files:")
        for d in ["audio", "wav", "transcript"]:
            p = output_dir / d
            if p.exists():
                count = len(list(p.iterdir()))
                print(f"    {d}/  ({count} files)")

    print(f"{'═' * 55}")


if __name__ == "__main__":
    main()
