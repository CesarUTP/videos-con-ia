"""Hoja de contactos: junta los fotogramas de QA en una sola imagen.

    python pipeline/hoja.py out/<slug>/stills out/<slug>/hoja.png [ancho_miniatura]
"""
from __future__ import annotations

import glob
import sys

from PIL import Image, ImageDraw


def main() -> None:
    carpeta, salida = sys.argv[1], sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 360
    archivos = sorted(glob.glob(f"{carpeta}/*.png"))
    if not archivos:
        raise SystemExit("No hay fotogramas en " + carpeta)
    h = int(w * 16 / 9)
    cols = min(5, len(archivos))
    filas = (len(archivos) + cols - 1) // cols
    hoja = Image.new("RGB", (cols * (w + 8) - 8, filas * (h + 30) - 8), "#111")
    d = ImageDraw.Draw(hoja)
    for i, f in enumerate(archivos):
        im = Image.open(f).convert("RGB").resize((w, h))
        x, y = (i % cols) * (w + 8), (i // cols) * (h + 30)
        hoja.paste(im, (x, y + 22))
        d.text((x + 4, y + 4), f.replace("\\", "/").split("/")[-1][:-4], fill="#FFD54A")
    hoja.save(salida)
    print(f"  ✓ hoja de contactos: {salida}")


if __name__ == "__main__":
    main()
