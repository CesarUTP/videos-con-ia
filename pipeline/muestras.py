"""Genera la MISMA frase con varias voces/motores para compararlas de oído.

    python pipeline/muestras.py                 # todos los motores disponibles
    python pipeline/muestras.py edge            # solo Edge
    python pipeline/muestras.py qwen kokoro     # solo locales

Salida: out/muestras/<motor>__<voz>.wav (masterizadas igual que en los videos).
"""
from __future__ import annotations

import sys
import time
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from audio import SR, decode, master_voice, trim_silence  # noqa: E402
from engines import ENGINES  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "muestras"
FRASE = (
    "Entra un millonario a un bar… y, en promedio, todos ahí se vuelven ricos. "
    "¿Cómo? Con un solo número mal elegido: el promedio salta a ciento diez mil pesos."
)

CANDIDATAS = {
    "edge": [
        {"voz": "es-MX-JorgeNeural", "velocidad": "+6%"},
        {"voz": "es-MX-DaliaNeural", "velocidad": "+6%"},
        {"voz": "es-US-AlonsoNeural", "velocidad": "+6%"},
        {"voz": "es-US-PalomaNeural", "velocidad": "+6%"},
        {"voz": "es-ES-AlvaroNeural", "velocidad": "+6%"},
        {"voz": "es-ES-XimenaNeural", "velocidad": "+6%"},
        {"voz": "es-CO-GonzaloNeural", "velocidad": "+6%"},
        {"voz": "es-AR-TomasNeural", "velocidad": "+6%"},
        # Voces "Multilingual": más expresivas; pueden sonar con leve acento extranjero.
        {"voz": "en-US-AndrewMultilingualNeural", "velocidad": "+6%"},
        {"voz": "en-US-BrianMultilingualNeural", "velocidad": "+6%"},
        {"voz": "en-US-AvaMultilingualNeural", "velocidad": "+6%"},
        {"voz": "it-IT-GiuseppeMultilingualNeural", "velocidad": "+6%"},
    ],
    "qwen": [
        {"voz": "Ryan", "estilo": "Narrador de divulgación, enérgico y cercano, ritmo ágil, acento latinoamericano neutro."},
        {"voz": "Aiden", "estilo": "Narrador de divulgación, enérgico y cercano, ritmo ágil."},
        {"voz": "Serena", "estilo": "Narradora de divulgación, cálida y segura, ritmo ágil."},
    ],
    "kokoro": [
        {"voz": "em_alex"},
        {"voz": "em_santa"},
        {"voz": "ef_dora"},
    ],
}


def main() -> None:
    motores = sys.argv[1:] or list(CANDIDATAS)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "frase.txt").write_text(FRASE, encoding="utf-8")
    for motor in motores:
        for opt in CANDIDATAS.get(motor, []):
            name = f"{motor}__{opt['voz']}"
            t0 = time.time()
            try:
                raw, _ = ENGINES[motor](FRASE, opt, OUT / f"_tts_{name}")
                x, _ = trim_silence(decode(raw), SR)
                dur = master_voice(x, OUT / f"{name}.wav")
                raw.unlink(missing_ok=True)
                print(f"  ✓ {name}.wav  {dur:.1f}s  ({time.time() - t0:.1f}s)")
            except Exception as e:
                print(f"  ✖ {name}: {e}")
                traceback.print_exc(limit=1)


if __name__ == "__main__":
    main()
