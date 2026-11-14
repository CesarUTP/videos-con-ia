"""Motores de voz intercambiables. Todos devuelven:

    synth(texto, opciones, destino_sin_extension) -> (ruta_audio, palabras | None)

`palabras` = [{"text","start","end"}] en segundos si el motor las da
(Edge y ElevenLabs las dan); si es None se obtienen con Whisper.

Motores:
  edge        Voces neuronales de Microsoft Edge (gratis, en línea). Mejor calidad gratuita.
  qwen        Qwen3-TTS local en GPU (Apache 2.0). Sin internet, estilo controlable.
  kokoro      Kokoro-82M local (Apache 2.0). Ligero, calidad media en español.
  elevenlabs  De pago. Requiere ELEVENLABS_API_KEY. Listo para cuando se contrate.
"""
from __future__ import annotations

import asyncio
import base64
import json
import os
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

# ----------------------------------------------------------------- Edge TTS
EDGE_DEFAULT = "es-MX-JorgeNeural"


def synth_edge(text: str, opt: dict, dest: Path):
    import edge_tts

    voice = opt.get("voz") or EDGE_DEFAULT
    rate = opt.get("velocidad", "+0%")
    pitch = opt.get("tono", "+0Hz")

    async def run():
        com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
        audio = bytearray()
        words = []
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                audio.extend(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                s = chunk["offset"] / 1e7
                words.append({"text": chunk["text"], "start": s, "end": s + chunk["duration"] / 1e7})
        return bytes(audio), words

    audio, words = b"", []
    for intento in range(4):  # el servicio a veces falla de forma transitoria
        try:
            audio, words = asyncio.run(run())
            if audio:
                break
        except Exception as e:
            if intento == 3:
                raise
            print(f"    reintento Edge ({e.__class__.__name__})")
        import time

        time.sleep(1.5 * (intento + 1))
    if not audio:
        raise RuntimeError("Edge TTS no devolvió audio (¿sin internet o voz inválida?)")
    out = dest.with_suffix(".mp3")
    out.write_bytes(audio)
    return out, words or None


async def _edge_list():
    import edge_tts

    return await edge_tts.list_voices()


def list_edge_voices(prefix: str = "es-") -> list[dict]:
    return [v for v in asyncio.run(_edge_list()) if v["Locale"].startswith(prefix)]


# ----------------------------------------------------------------- Qwen3-TTS
_QWEN = None
QWEN_MODEL = os.environ.get("QWEN_TTS_MODEL", "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice")


def _qwen():
    global _QWEN
    if _QWEN is None:
        import torch
        from qwen_tts import Qwen3TTSModel

        _QWEN = Qwen3TTSModel.from_pretrained(QWEN_MODEL, device_map="cuda:0", dtype=torch.bfloat16)
    return _QWEN


def synth_qwen(text: str, opt: dict, dest: Path):
    model = _qwen()
    kwargs = dict(text=text, language="Spanish", speaker=opt.get("voz") or "Ryan")
    if opt.get("estilo"):
        kwargs["instruct"] = opt["estilo"]
    wavs, sr = model.generate_custom_voice(**kwargs)
    out = dest.with_suffix(".wav")
    sf.write(out, np.asarray(wavs[0], dtype=np.float32), sr)
    return out, None


# ----------------------------------------------------------------- Kokoro
_KOKORO = None


def synth_kokoro(text: str, opt: dict, dest: Path):
    global _KOKORO
    from kokoro import KPipeline

    if _KOKORO is None:
        _KOKORO = KPipeline(lang_code="e", repo_id="hexgrad/Kokoro-82M")
    voice = opt.get("voz") or "em_alex"
    speed = float(opt.get("velocidad_num", 1.0))
    parts = [np.asarray(a, dtype=np.float32) for _, _, a in _KOKORO(text, voice=voice, speed=speed)]
    out = dest.with_suffix(".wav")
    sf.write(out, np.concatenate(parts), 24_000)
    return out, None


# ----------------------------------------------------------------- ElevenLabs
def synth_elevenlabs(text: str, opt: dict, dest: Path):
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        raise RuntimeError("Falta ELEVENLABS_API_KEY (ponla en .env). Mientras tanto usa motor 'edge'.")
    voice_id = opt.get("voz")
    if not voice_id:
        raise RuntimeError("Indica el voice_id de ElevenLabs en guion.json -> voz.voz")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_192"
    body = {
        "text": text,
        "model_id": opt.get("modelo", "eleven_multilingual_v2"),
        "voice_settings": {
            "stability": opt.get("stability", 0.45),
            "similarity_boost": opt.get("similarity", 0.8),
            "style": opt.get("style", 0.3),
            "use_speaker_boost": True,
        },
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read())
    out = dest.with_suffix(".mp3")
    out.write_bytes(base64.b64decode(data["audio_base64"]))
    al = data.get("alignment") or {}
    chars = al.get("characters") or []
    starts = al.get("character_start_times_seconds") or []
    ends = al.get("character_end_times_seconds") or []
    words, cur, s0, e0 = [], "", None, None
    for c, s, e in zip(chars, starts, ends):
        if c.isspace():
            if cur:
                words.append({"text": cur, "start": s0, "end": e0})
            cur, s0 = "", None
            continue
        if s0 is None:
            s0 = s
        cur += c
        e0 = e
    if cur:
        words.append({"text": cur, "start": s0, "end": e0})
    return out, words or None


ENGINES = {
    "edge": synth_edge,
    "qwen": synth_qwen,
    "kokoro": synth_kokoro,
    "elevenlabs": synth_elevenlabs,
}
