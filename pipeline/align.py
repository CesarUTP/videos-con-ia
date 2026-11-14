"""Tiempos por palabra para subtítulos.

Whisper (faster-whisper, GPU si hay) transcribe el audio con marcas por
palabra; luego se ALINEAN con el texto del guion para que los subtítulos
usen la ortografía exacta del guion (Whisper a veces escribe "100 mil"
donde dijiste "cien mil"). Las palabras sin pareja se interpolan.
"""
from __future__ import annotations

import difflib
import os
import re
import sys
import unicodedata
from pathlib import Path

_MODEL = None


def _add_cuda_dlls() -> None:
    """En Windows, ctranslate2 necesita las DLL de CUDA/cuDNN que trae torch."""
    if sys.platform != "win32":
        return
    try:
        import torch  # noqa: F401

        lib = Path(torch.__file__).parent / "lib"
        if lib.exists():
            os.add_dll_directory(str(lib))
            os.environ["PATH"] = str(lib) + os.pathsep + os.environ.get("PATH", "")
    except Exception:
        pass
    for pkg in ("nvidia/cublas/bin", "nvidia/cudnn/bin"):
        for sp in sys.path:
            p = Path(sp) / pkg
            if p.exists():
                os.add_dll_directory(str(p))
                os.environ["PATH"] = str(p) + os.pathsep + os.environ.get("PATH", "")


def get_model():
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    _add_cuda_dlls()
    from faster_whisper import WhisperModel

    name = os.environ.get("WHISPER_MODEL", "large-v3-turbo")
    try:
        _MODEL = WhisperModel(name, device="cuda", compute_type="float16")
        print(f"  · Whisper {name} en GPU")
    except Exception as e:  # sin GPU / sin CUDA
        print(f"  · Whisper en CPU ({e.__class__.__name__}); será más lento")
        _MODEL = WhisperModel(name, device="cpu", compute_type="int8")
    return _MODEL


def norm(w: str) -> str:
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9ñ]", "", w)


def script_words(text: str) -> list[str]:
    text = text.replace("**", "")
    return [w for w in text.split() if norm(w) or w.strip()]


def script_flags(text: str) -> list[dict]:
    """Por palabra: destacar (estaba entre **…**) y corte (cierra frase/cláusula)."""
    flags, inside = [], False
    for raw in text.split():
        starts = raw.startswith("**") or raw.lstrip("¿¡\"«(").startswith("**")
        if starts:
            inside = True
        strong = inside
        if "**" in raw and raw.count("**") >= (2 if starts else 1):
            inside = False
        elif "**" in raw and not starts:
            inside = False
        clean = raw.replace("**", "")
        if not (norm(clean) or clean.strip()):
            continue
        flags.append({"destacar": strong, "corte": bool(re.search(r"[.,;:?!…]$", clean))})
    return flags


def transcribe_words(audio: Path, prompt: str) -> list[dict]:
    from audio import decode  # ffmpeg propio: evita depender de PyAV

    model = get_model()
    segments, _ = model.transcribe(
        decode(audio, 16_000),
        language="es",
        word_timestamps=True,
        initial_prompt=prompt,
        vad_filter=False,
        beam_size=5,
        condition_on_previous_text=False,
    )
    out = []
    for seg in segments:
        for w in seg.words or []:
            out.append({"text": w.word.strip(), "start": float(w.start), "end": float(w.end)})
    return out


def align(script: list[str], heard: list[dict], total: float) -> list[dict]:
    """Asigna tiempos de `heard` a cada palabra de `script`."""
    a = [norm(w) for w in script]
    b = [norm(h["text"]) for h in heard]
    times: list[tuple[float, float] | None] = [None] * len(script)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                h = heard[j1 + k]
                times[i1 + k] = (h["start"], h["end"])
        elif tag == "replace" and j2 > j1:
            # reparte el tramo oído entre las palabras del guion
            s, e = heard[j1]["start"], heard[j2 - 1]["end"]
            n = i2 - i1
            for k in range(n):
                times[i1 + k] = (s + (e - s) * k / n, s + (e - s) * (k + 1) / n)
    # interpola huecos
    for i in range(len(times)):
        if times[i] is None:
            prev_end = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
            nxt = next((j for j in range(i + 1, len(times)) if times[j]), None)
            next_start = times[nxt][0] if nxt is not None else total
            gap_words = (nxt if nxt is not None else len(times)) - i
            step = max(0.05, (next_start - prev_end) / max(1, gap_words))
            times[i] = (prev_end, prev_end + step)
    return [{"text": w, "start": t[0], "end": t[1]} for w, t in zip(script, times)]


def words_to_captions(words: list[dict]) -> list[dict]:
    """Formato Caption de @remotion/captions (espacio delante de cada palabra)."""
    caps = []
    for i, w in enumerate(words):
        start_ms = int(round(w["start"] * 1000))
        end_ms = int(round(max(w["end"], w["start"] + 0.06) * 1000))
        caps.append(
            {
                "text": (" " if i else "") + w["text"],
                "startMs": start_ms,
                "endMs": end_ms,
                "timestampMs": (start_ms + end_ms) // 2,
                "confidence": None,
            }
        )
    return caps
