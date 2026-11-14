"""Genera la voz, los tiempos por palabra y el manifest de un video.

    python pipeline/voz.py <slug>                 # usa videos/<slug>/guion.json
    python pipeline/voz.py <slug> --motor qwen    # cambia de motor
    python pipeline/voz.py <slug> --forzar        # regenera todo (ignora caché)
    python pipeline/voz.py --voces                # lista voces Edge en español

Salida en public/videos/<slug>/: un .wav masterizado por escena + manifest.json
que Remotion lee para fijar la duración de cada escena a la de su audio.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from align import align, script_flags, script_words, transcribe_words, words_to_captions  # noqa: E402
from audio import SR, decode, master_voice, trim_silence  # noqa: E402
from engines import ENGINES, list_edge_voices  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
TRANSITION_FRAMES = 14
MASTER_VERSION = 2  # súbelo si cambias la masterización (invalida la caché)
VALID_TRANSITIONS = {"panel", "deslizar", "fundido", "zoom", "zoom-out", "corte"}
VALID_TYPES = {"gancho", "numero", "barras", "columnas", "comparacion", "lista", "frase", "cierre", "ruta", "visual"}
PUNCT = re.compile(r"^[\"'“”«»(\[.,;:…—–-]+|[\"'“”«»)\].,;:…—–-]+$")


def clean_caption_word(w: str) -> str:
    return PUNCT.sub("", w) or w


def load_env() -> None:
    env = ROOT / ".env"
    if env.exists():
        import os

        for line in env.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"'))


def validate(guion: dict) -> None:
    errs = []
    if not guion.get("escenas"):
        errs.append("guion.json no tiene 'escenas'")
    ids = set()
    for i, s in enumerate(guion.get("escenas", [])):
        where = f"escena {i + 1} ({s.get('id', '?')})"
        if s.get("tipo") not in VALID_TYPES:
            errs.append(f"{where}: tipo '{s.get('tipo')}' no válido. Usa: {sorted(VALID_TYPES)}")
        if not s.get("narracion", "").strip():
            errs.append(f"{where}: falta 'narracion'")
        if s.get("transicion", "panel") not in VALID_TRANSITIONS:
            errs.append(f"{where}: transición no válida. Usa: {sorted(VALID_TRANSITIONS)}")
        if s.get("id") in ids:
            errs.append(f"{where}: id repetido")
        ids.add(s.get("id"))
    if guion.get("estilo", "tecnico") not in {"tecnico", "cuerpo", "historia"}:
        errs.append("estilo debe ser: tecnico | cuerpo | historia")
    if errs:
        raise SystemExit("Errores en el guion:\n  - " + "\n  - ".join(errs))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", nargs="?")
    ap.add_argument("--motor", choices=sorted(ENGINES))
    ap.add_argument("--voz")
    ap.add_argument("--forzar", action="store_true")
    ap.add_argument("--voces", action="store_true", help="lista voces Edge en español")
    args = ap.parse_args()

    if args.voces:
        for v in sorted(list_edge_voices(), key=lambda v: v["ShortName"]):
            print(f"{v['ShortName']:<34} {v['Gender']:<7} {', '.join(v.get('VoiceTag', {}).get('VoicePersonalities', []))}")
        return
    if not args.slug:
        ap.error("indica el slug del video (carpeta en videos/)")

    load_env()
    src = ROOT / "videos" / args.slug / "guion.json"
    if not src.exists():
        raise SystemExit(f"No existe {src}")
    guion = json.loads(src.read_text(encoding="utf-8"))
    validate(guion)

    vopt = dict(guion.get("voz", {}))
    if args.motor:
        vopt["motor"] = args.motor
        if not args.voz:
            vopt.pop("voz", None)
    if args.voz:
        vopt["voz"] = args.voz
    motor = vopt.get("motor", "edge")
    synth = ENGINES[motor]

    out_dir = ROOT / "public" / "videos" / args.slug
    out_dir.mkdir(parents=True, exist_ok=True)
    cache_path = out_dir / "cache.json"
    cache = {} if args.forzar or not cache_path.exists() else json.loads(cache_path.read_text(encoding="utf-8"))

    sfx_dir = ROOT / "public" / "sfx"
    if not (sfx_dir / "whoosh.wav").exists():
        import sfx

        sfx.main()

    escenas = guion["escenas"]
    manifest_scenes = []
    print(f"▶ {args.slug} · motor={motor} voz={vopt.get('voz', '(predeterminada)')}")
    for i, s in enumerate(escenas):
        sid = s["id"]
        texto = s["narracion"].replace("**", "").strip()
        tts_text = s.get("pronunciacion", texto)
        key = hashlib.sha1(json.dumps([tts_text, texto, vopt, MASTER_VERSION], sort_keys=True).encode()).hexdigest()
        wav = out_dir / f"{sid}.wav"
        t0 = time.time()
        if cache.get(sid, {}).get("key") == key and wav.exists():
            dur = cache[sid]["dur"]
            caps = cache[sid]["palabras"]
            print(f"  = {sid}: en caché ({dur:.2f}s)")
        else:
            raw_dest = out_dir / f"_tts_{sid}"  # nombre distinto al .wav final
            raw, words = synth(tts_text, vopt, raw_dest)
            x = decode(raw)
            x, cut = trim_silence(x, SR)
            dur = master_voice(x, wav)
            raw.unlink(missing_ok=True)
            spoken = script_words(texto)
            if words and tts_text == texto:
                heard = [{**w, "start": max(0.0, w["start"] - cut), "end": max(0.0, w["end"] - cut)} for w in words]
                origin = motor
            else:
                heard = transcribe_words(wav, texto)
                origin = "whisper"
            aligned = align(spoken, heard, dur)
            for w in aligned:
                w["text"] = clean_caption_word(w["text"])
            caps = words_to_captions(aligned)
            cache[sid] = {"key": key, "dur": dur, "palabras": caps}
            print(f"  ✓ {sid}: {dur:.2f}s · {len(caps)} palabras (tiempos: {origin}) · {time.time() - t0:.1f}s")

        # Marcas visuales del subtítulo (no afectan al audio ni a la caché).
        flags = script_flags(s["narracion"])
        caps = [dict(c) for c in caps]
        if len(flags) == len(caps):
            for c, f in zip(caps, flags):
                c["destacar"] = f["destacar"]
                c["corte"] = f["corte"]
        else:
            print(f"  ⚠ {sid}: no pude alinear las **palabras clave** ({len(flags)} vs {len(caps)} palabras); se muestran sin caja")

        prev_tr = escenas[i - 1].get("transicion", "panel") if i > 0 else "corte"
        lead = 3 if i == 0 else (TRANSITION_FRAMES if prev_tr != "corte" else 0) + 3
        audio_frames = math.ceil(dur * FPS)
        tail = 10 + round(float(s.get("pausa", 0)) * FPS)
        if i == len(escenas) - 1:
            tail += 45  # el último cuadro (fuente) se lee al menos 1,5 s
        duration = lead + audio_frames + tail
        if s.get("minSegundos"):
            duration = max(duration, round(float(s["minSegundos"]) * FPS))
        manifest_scenes.append(
            {
                "id": sid,
                "tipo": s["tipo"],
                "props": s.get("props", {}),
                "narracion": texto,
                "audio": f"videos/{args.slug}/{sid}.wav",
                "audioStartFrame": lead,
                "audioFrames": audio_frames,
                "durationInFrames": duration,
                "palabras": caps,
                "transicion": s.get("transicion", "panel"),
                "musicaFondo": s.get("musicaFondo", True),
            }
        )

    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")
    manifest = {
        "slug": args.slug,
        "titulo": guion.get("titulo", args.slug),
        "fps": FPS,
        "estilo": guion.get("estilo", "tecnico"),
        "motorVoz": motor,
        "voz": vopt.get("voz", ""),
        "transitionFrames": TRANSITION_FRAMES,
        "musica": guion.get("musica"),
        "sfx": guion.get("sfx", True),
        "escenas": manifest_scenes,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    total = sum(m["durationInFrames"] for m in manifest_scenes) - TRANSITION_FRAMES * sum(
        1 for m in manifest_scenes[:-1] if m["transicion"] != "corte"
    )
    print(f"✔ manifest listo · duración total ≈ {total / FPS:.1f}s → public/videos/{args.slug}/manifest.json")


if __name__ == "__main__":
    main()
