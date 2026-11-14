"""Música de fondo instrumental ORIGINAL con ACE-Step 1.5 (local, GPU, licencia MIT).

Se ejecuta con el Python del entorno de ACE-Step (tools/ACE-Step-1.5/.venv):
    npm run musica -- <nombre> --para <slug> [--estilo historia|cuerpo|tecnico] [--prompt "..."] [--seed 7]

Salida: public/musica/<nombre>.wav (48 kHz, masterizada a -20 LUFS para ir bajo la voz).
En guion.json:  "musica": { "src": "musica/<nombre>.wav", "volumen": 0.5 }
La música se atenúa sola mientras habla la voz (ducking en src/Reel.tsx).
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ACE = ROOT / "tools" / "ACE-Step-1.5"
OUT = ROOT / "public" / "musica"

PLANTILLAS = {
    "historia": "playful quirky documentary underscore, pizzicato strings, marimba, light hand percussion, "
    "curious and mischievous mood, warm, instrumental, no vocals",
    "cuerpo": "light curious science explainer underscore, soft plucked synths, warm bass, gentle percussion, "
    "sense of wonder, clean mix, instrumental, no vocals",
    "tecnico": "minimal cinematic electronic underscore, pulsing synth arpeggio, deep sub bass, subtle risers, "
    "futuristic and focused, instrumental, no vocals",
}
BPM = {"historia": 100, "cuerpo": 96, "tecnico": 110}


def duracion_video(slug: str) -> float:
    """Duración total del video según su manifest (hay que correr `npm run voz` antes)."""
    import json

    m = json.loads((ROOT / "public" / "videos" / slug / "manifest.json").read_text(encoding="utf-8"))
    T = m["transitionFrames"]
    esc = m["escenas"]
    frames = sum(e["durationInFrames"] for e in esc) - T * sum(1 for e in esc[:-1] if e["transicion"] != "corte")
    return frames / m["fps"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("nombre")
    ap.add_argument("--estilo", default="historia", choices=sorted(PLANTILLAS))
    ap.add_argument("--prompt")
    ap.add_argument("--segundos", type=float, help="duración; por defecto la del video (--para) o 60 s")
    ap.add_argument("--para", help="slug del video: la música dura lo mismo que el video + 3 s (sin bucles)")
    ap.add_argument("--bpm", type=int)
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()
    if args.segundos is None:
        args.segundos = duracion_video(args.para) + 3 if args.para else 60.0
    args.segundos = float(min(600, max(10, args.segundos)))

    sys.path.insert(0, str(ACE))
    from acestep.handler import AceStepHandler  # noqa: E402
    from acestep.inference import GenerationConfig, GenerationParams, generate_music  # noqa: E402
    from acestep.llm_inference import LLMHandler  # noqa: E402

    OUT.mkdir(parents=True, exist_ok=True)
    tmp = OUT / "_tmp"
    tmp.mkdir(exist_ok=True)

    dit = AceStepHandler()
    dit.initialize_service(project_root=str(ACE), config_path="acestep-v15-turbo", device="cuda", offload_to_cpu=True)
    llm = LLMHandler()  # sin inicializar: thinking=False (no usamos el modelo de lenguaje)

    params = GenerationParams(
        caption=args.prompt or PLANTILLAS[args.estilo],
        lyrics="[Instrumental]",
        instrumental=True,
        bpm=args.bpm or BPM[args.estilo],
        duration=args.segundos,
        thinking=False,
        use_cot_metas=False,
        use_cot_caption=False,
        use_cot_language=False,
        seed=args.seed,
    )
    config = GenerationConfig(batch_size=1, use_random_seed=False, seeds=[args.seed], audio_format="wav")
    result = generate_music(dit, llm, params, config, save_dir=str(tmp))
    if not result.success:
        raise SystemExit(f"ACE-Step falló: {result.error}")
    src = Path(result.audios[0]["path"])

    # masterizar a -20 LUFS / -2 dBTP, 48 kHz estéreo
    import imageio_ffmpeg  # disponible en el venv principal; si no, usar el de ACE

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    dst = OUT / f"{args.nombre}.wav"
    subprocess.run(
        [ffmpeg, "-v", "error", "-y", "-i", str(src), "-af", "loudnorm=I=-20:TP=-2:LRA=11", "-ar", "48000", "-ac", "2", str(dst)],
        check=True,
    )
    src.unlink(missing_ok=True)
    print(f"✔ {dst.relative_to(ROOT)} · {args.segundos:.0f}s · estilo {args.estilo}")


if __name__ == "__main__":
    main()
