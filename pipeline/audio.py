"""Utilidades de audio: decodificar, recortar silencios, masterizar voz.

Usa el ffmpeg que trae imageio-ffmpeg (no hace falta instalar ffmpeg aparte).
"""
from __future__ import annotations

import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48_000  # frecuencia final (calidad de entrega de video)


def decode(path: Path, sr: int = SR) -> np.ndarray:
    """Cualquier formato -> float32 mono a `sr` Hz."""
    cmd = [FFMPEG, "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def trim_silence(x: np.ndarray, sr: int = SR, thresh_db: float = -42.0, pad_ms: int = 40) -> tuple[np.ndarray, float]:
    """Quita silencio al inicio y al final. Devuelve (audio, segundos_recortados_al_inicio)."""
    if len(x) == 0:
        return x, 0.0
    win = int(sr * 0.01)
    n = len(x) // win
    if n == 0:
        return x, 0.0
    frames = x[: n * win].reshape(n, win)
    rms = np.sqrt(np.mean(frames**2, axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-12)
    loud = np.where(db > thresh_db)[0]
    if len(loud) == 0:
        return x, 0.0
    pad = int(sr * pad_ms / 1000)
    start = max(0, loud[0] * win - pad)
    end = min(len(x), (loud[-1] + 1) * win + pad * 3)
    return x[start:end], start / sr


def master_voice(x: np.ndarray, out: Path, sr: int = SR, lufs: float = -18.0) -> float:
    """Filtro paso alto + compresión suave + de-esser ligero + normalización EBU R128.

    -18 LUFS para la voz: deja margen para música/SFX y el render final
    queda cerca de los -14 LUFS que usan Instagram/TikTok.
    Devuelve la duración en segundos.
    """
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".raw.wav")
    sf.write(tmp, x, sr, subtype="FLOAT")
    af = ",".join(
        [
            "highpass=f=70",
            "equalizer=f=6500:t=q:w=2:g=-2",  # suaviza sibilancia
            "equalizer=f=180:t=q:w=1:g=1.5",  # cuerpo
            "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2",
            f"loudnorm=I={lufs}:TP=-1.5:LRA=9",
            "alimiter=limit=0.89",
        ]
    )
    cmd = [FFMPEG, "-v", "error", "-y", "-i", str(tmp), "-af", af, "-ar", str(sr), "-ac", "1", "-c:a", "pcm_s16le", str(out)]
    subprocess.run(cmd, check=True)
    tmp.unlink(missing_ok=True)
    info = sf.info(out)
    return info.frames / info.samplerate
