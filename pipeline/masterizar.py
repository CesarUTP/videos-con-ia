"""Masterización final del audio del MP4 (sin recodificar el video).

    python pipeline/masterizar.py out/<slug>.mp4

Normalización EBU R128 en DOS pasadas a -14 LUFS integrados y -1.5 dBTP de
pico real (estándar de Instagram/TikTok/YouTube: evita que la plataforma
baje el volumen o que distorsione al recomprimir).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audio import FFMPEG  # noqa: E402

TARGET_I = -14.0
TARGET_TP = -1.5
TARGET_LRA = 11.0


def medir(path: Path) -> dict:
    cmd = [
        FFMPEG, "-hide_banner", "-nostats", "-i", str(path),
        "-af", f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json",
        "-f", "null", "-",
    ]
    err = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore").stderr
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", err, re.S)
    if not m:
        raise RuntimeError("No pude medir la sonoridad:\n" + err[-800:])
    return json.loads(m.group(0))


def main() -> None:
    src = Path(sys.argv[1])
    m = medir(src)
    tmp = src.with_suffix(".master.mp4")
    af = (
        f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}"
        f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
        f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000"
    )
    cmd = [
        FFMPEG, "-hide_banner", "-v", "error", "-y", "-i", str(src),
        "-c:v", "copy", "-af", af, "-c:a", "aac", "-b:a", "320k", "-ar", "48000",
        "-movflags", "+faststart", str(tmp),
    ]
    subprocess.run(cmd, check=True)
    tmp.replace(src)
    after = medir(src)
    print(f"✔ audio masterizado: {float(after['input_i']):.1f} LUFS · pico {float(after['input_tp']):.1f} dBTP")


if __name__ == "__main__":
    main()
