"""Biblioteca de efectos de sonido SINTETIZADOS (propios, sin licencias).

    python pipeline/sfx.py            # genera/actualiza public/sfx/*.wav
    python pipeline/sfx.py --lista    # muestra los sonidos disponibles

Regla del canal: si algo SUENA en la historia (helicóptero, mazo, golpe,
música), se ESCUCHA; no se escribe la onomatopeya en pantalla.
Todos son deterministas (semilla fija) y estéreo a 48 kHz.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48_000
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "sfx"
RNG = lambda s: np.random.default_rng(s)  # noqa: E731


# ------------------------------------------------------------ utilidades
def t_(dur: float) -> np.ndarray:
    return np.arange(int(SR * dur)) / SR


def lp(x: np.ndarray, fc: float | np.ndarray) -> np.ndarray:
    """Pasa bajos de un polo (fc puede variar en el tiempo)."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def hp(x: np.ndarray, fc: float) -> np.ndarray:
    return x - lp(x, fc)


def bp(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return lp(hp(x, lo), hi)


def env_ad(n: int, a: float, d: float) -> np.ndarray:
    t = np.arange(n) / SR
    return np.where(t < a, t / max(a, 1e-6), np.exp(-(t - a) / max(d, 1e-6)))


def modes(dur: float, freqs: list[float], decays: list[float], amps: list[float], seed: int = 0) -> np.ndarray:
    """Suma de modos resonantes (madera, metal, campana)."""
    t = t_(dur)
    rng = RNG(seed)
    y = np.zeros_like(t)
    for f, d, a in zip(freqs, decays, amps):
        y += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / d)
    return y


def stereo(x: np.ndarray, width: float = 0.0, pan: float = 0.0) -> np.ndarray:
    d = int(SR * 0.0004 * width * 10)
    l = x * (1 - max(0, pan))
    r = x * (1 + min(0, pan))
    if d > 0:
        r = np.concatenate([np.zeros(d), r[:-d]])
    return np.stack([l, r], axis=1)


def norm(x: np.ndarray, peak: float = 0.89) -> np.ndarray:
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def fade(x: np.ndarray, fin: float = 0.005, fout: float = 0.05) -> np.ndarray:
    n = len(x)
    e = np.ones(n)
    a = int(SR * fin)
    b = int(SR * fout)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if b:
        e[-b:] = np.linspace(1, 0, b)
    return x * (e[:, None] if x.ndim == 2 else e)


def soft_clip(x: np.ndarray, drive: float = 2.0) -> np.ndarray:
    return np.tanh(x * drive) / np.tanh(drive)


# ------------------------------------------------------------ efectos
def whoosh(dur: float = 0.55) -> np.ndarray:
    t = np.linspace(0, 1, int(SR * dur))
    noise = RNG(7).standard_normal(len(t))
    fc = 300 + 5200 * np.sin(np.pi * t) ** 1.5
    y = lp(lp(noise, fc), fc)
    env = np.where(t < 0.45, (t / 0.45) ** 2, np.exp(-(t - 0.45) * 9))
    y *= env
    pan = np.linspace(-0.6, 0.6, len(t))
    st = np.stack([y * (1 - np.clip(pan, 0, 1)), y * (1 + np.clip(pan, -1, 0))], axis=1)
    return norm(st, 0.7)


def pop() -> np.ndarray:
    t = t_(0.12)
    f = 900 * np.exp(-t * 30) + 220
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38)
    return stereo(norm(y, 0.6))


def tick() -> np.ndarray:
    t = t_(0.05)
    y = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 140)
    return stereo(norm(y, 0.5))


def ding() -> np.ndarray:
    y = modes(1.6, [1318, 2637, 3951, 5270], [0.9, 0.5, 0.3, 0.2], [1, 0.45, 0.25, 0.12], 3)
    y *= env_ad(len(y), 0.002, 10)
    return stereo(norm(y, 0.55), 0.4)


def golpe_goma() -> np.ndarray:
    """Martillo de reflejos de goma sobre el tendón: golpe sordo corto."""
    t = t_(0.35)
    f = 180 * np.exp(-t * 18) + 70
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    click = bp(RNG(11).standard_normal(len(t)), 800, 3500) * np.exp(-t * 180) * 0.4
    return stereo(norm(body + click, 0.85))


def mazo() -> np.ndarray:
    """Mazo de juez: dos golpes de madera."""
    one = modes(0.5, [520, 980, 1650, 2400], [0.08, 0.05, 0.03, 0.02], [1, 0.7, 0.4, 0.25], 5)
    one += bp(RNG(5).standard_normal(len(one)), 1500, 6000) * np.exp(-t_(0.5) * 120) * 0.6
    low = np.sin(2 * np.pi * 110 * t_(0.5)) * np.exp(-t_(0.5) * 25) * 0.6
    one = (one + low) * env_ad(len(one), 0.001, 0.12)
    gap = np.zeros(int(SR * 0.22))
    y = np.concatenate([one * 0.8, gap, one, np.zeros(int(SR * 0.2))])
    return stereo(norm(y, 0.9), 0.3)


def sello() -> np.ndarray:
    """Sello de goma golpeando papel sobre mesa."""
    t = t_(0.45)
    thud = np.sin(2 * np.pi * (90 + 120 * np.exp(-t * 40)) * t) * np.exp(-t * 16)
    slap = bp(RNG(9).standard_normal(len(t)), 600, 5000) * np.exp(-t * 60) * 0.7
    table = modes(0.45, [240, 470, 900], [0.09, 0.06, 0.03], [0.5, 0.3, 0.2], 9)
    return stereo(norm(thud + slap + table, 0.9))


def rejas() -> np.ndarray:
    """Reja metálica que cae y golpea: metal inarmónico con cola larga."""
    y = modes(2.4, [180, 397, 655, 980, 1370, 1912, 2540], [1.2, 0.9, 0.7, 0.5, 0.35, 0.25, 0.2], [1, 0.8, 0.7, 0.5, 0.4, 0.3, 0.2], 13)
    hit = bp(RNG(13).standard_normal(len(y)), 1000, 8000) * np.exp(-t_(2.4) * 50) * 0.8
    slide = np.zeros(int(SR * 0.35))
    tt = t_(0.35)
    slide = bp(RNG(14).standard_normal(len(tt)), 2000, 7000) * (tt / 0.35) ** 2 * 0.25
    out = np.concatenate([slide, y + hit])
    return stereo(norm(out, 0.85), 0.6)


def billetes() -> np.ndarray:
    """Conteo de billetes: ráfagas rápidas de papel."""
    dur = 1.6
    y = np.zeros(int(SR * dur))
    rng = RNG(17)
    for i in range(18):
        s = int(SR * (0.05 + i * 0.08 + rng.uniform(-0.01, 0.01)))
        n = int(SR * 0.05)
        burst = bp(rng.standard_normal(n), 1800, 9000) * np.exp(-np.arange(n) / SR * 70)
        y[s : s + n] += burst * rng.uniform(0.6, 1)
    return stereo(norm(y, 0.6), 0.5)


def helicoptero(dur: float = 6.0) -> np.ndarray:
    """Rotor de helicóptero en bucle: golpe de pala ~7 Hz + turbina + rumor."""
    t = t_(dur)
    rng = RNG(21)
    blade_rate = 7.0
    phase = (t * blade_rate) % 1.0
    slap_env = np.exp(-phase * 14)
    slap = lp(rng.standard_normal(len(t)), 900) * slap_env * 1.6
    thump = np.sin(2 * np.pi * 55 * t) * slap_env * 1.2
    turbine = np.sin(2 * np.pi * 2350 * t + 0.4 * np.sin(2 * np.pi * 0.3 * t)) * 0.05
    rumble = lp(rng.standard_normal(len(t)), 220) * 0.9
    y = slap + thump + turbine + rumble
    # bucle sin costura: forzar extremos iguales con cruce
    cf = int(SR * 0.25)
    y[-cf:] = y[-cf:] * np.linspace(1, 0, cf) + y[:cf] * np.linspace(0, 1, cf)
    return stereo(norm(soft_clip(y, 1.4), 0.8), 0.8)


def avion() -> np.ndarray:
    """Avión que pasa (efecto Doppler aproximado)."""
    dur = 4.0
    t = t_(dur)
    x = np.linspace(-1, 1, len(t))
    amp = 1 / (1 + (x * 3) ** 2)
    fc = 600 + 1800 * (1 - (x + 1) / 2)
    y = lp(RNG(23).standard_normal(len(t)), fc) * amp
    whine = np.sin(2 * np.pi * np.cumsum(900 - 250 * x) / SR) * amp * 0.08
    pan = x * 0.8
    st = np.stack([(y + whine) * (1 - np.clip(pan, 0, 1)), (y + whine) * (1 + np.clip(pan, -1, 0))], axis=1)
    return norm(st, 0.8)


def explosion_lejana() -> np.ndarray:
    t = t_(3.0)
    y = lp(RNG(29).standard_normal(len(t)), 300 * np.exp(-t * 0.8) + 60) * np.exp(-t * 1.6)
    y += np.sin(2 * np.pi * 40 * t) * np.exp(-t * 3) * 0.6
    return stereo(norm(y, 0.8), 1.0)


def riser(dur: float = 1.6) -> np.ndarray:
    """Subida de tensión antes de una revelación."""
    t = t_(dur)
    p = t / dur
    noise = lp(RNG(31).standard_normal(len(t)), 300 + 7000 * p**2) * p**2
    tone = np.sin(2 * np.pi * np.cumsum(200 + 800 * p**2) / SR) * p**3 * 0.3
    return stereo(norm(noise + tone, 0.6), 0.6)


def latido() -> np.ndarray:
    t = t_(0.9)
    one = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 18)
    two = np.roll(one, int(SR * 0.22)) * 0.7
    return stereo(norm(one + two, 0.8))


def puerta() -> np.ndarray:
    """Puerta de madera que se abre con rechinido."""
    t = t_(1.2)
    f = 600 + 250 * np.sin(2 * np.pi * 1.4 * t)
    creak = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 37 * t)) * 0.25
    creak = bp(creak + RNG(37).standard_normal(len(t)) * 0.05, 300, 3000) * env_ad(len(t), 0.1, 0.6)
    return stereo(norm(creak, 0.5), 0.4)


def multitud() -> np.ndarray:
    """Murmullo de gente (bucle)."""
    dur = 6.0
    t = t_(dur)
    rng = RNG(41)
    y = np.zeros(len(t))
    for i in range(22):
        f0 = rng.uniform(110, 260)
        syl = (np.sin(2 * np.pi * rng.uniform(3, 6) * t + rng.uniform(0, 6)) > 0.3).astype(float)
        syl = lp(syl, 20)
        voice = np.sin(2 * np.pi * f0 * t) + 0.5 * np.sin(2 * np.pi * 2 * f0 * t)
        y += bp(voice, 200, 1800) * syl * rng.uniform(0.3, 1)
    y += lp(rng.standard_normal(len(t)), 900) * 0.6
    cf = int(SR * 0.3)
    y[-cf:] = y[-cf:] * np.linspace(1, 0, cf) + y[:cf] * np.linspace(0, 1, cf)
    return stereo(norm(y, 0.5), 1.0)


def ambiente_ciudad_noche() -> np.ndarray:
    dur = 8.0
    t = t_(dur)
    rng = RNG(43)
    y = lp(rng.standard_normal(len(t)), 250) * 0.9
    # grillos
    for i in range(6):
        on = (np.sin(2 * np.pi * rng.uniform(0.4, 0.8) * t + i) > 0.6).astype(float)
        y += np.sin(2 * np.pi * rng.uniform(4200, 5200) * t) * lp(on, 30) * (0.5 + 0.5 * np.sin(2 * np.pi * 28 * t)) * 0.04
    cf = int(SR * 0.4)
    y[-cf:] = y[-cf:] * np.linspace(1, 0, cf) + y[:cf] * np.linspace(0, 1, cf)
    return stereo(norm(y, 0.45), 1.0)


def ambiente_cuarto() -> np.ndarray:
    dur = 8.0
    t = t_(dur)
    y = lp(RNG(47).standard_normal(len(t)), 180) * 0.8 + np.sin(2 * np.pi * 60 * t) * 0.03
    cf = int(SR * 0.4)
    y[-cf:] = y[-cf:] * np.linspace(1, 0, cf) + y[:cf] * np.linspace(0, 1, cf)
    return stereo(norm(y, 0.3), 1.0)


def ambiente_exterior() -> np.ndarray:
    """Exterior de día: viento suave + pájaros."""
    dur = 8.0
    t = t_(dur)
    rng = RNG(53)
    y = lp(rng.standard_normal(len(t)), 400 + 200 * np.sin(2 * np.pi * 0.1 * t)) * 0.7
    for i in range(7):
        s = rng.uniform(0, dur - 0.6)
        n = int(SR * 0.35)
        tt = np.arange(n) / SR
        chirp = np.sin(2 * np.pi * np.cumsum(3000 + 1500 * np.sin(2 * np.pi * 12 * tt)) / SR) * np.exp(-tt * 9)
        a = int(SR * s)
        y[a : a + n] += chirp * 0.12
    cf = int(SR * 0.4)
    y[-cf:] = y[-cf:] * np.linspace(1, 0, cf) + y[:cf] * np.linspace(0, 1, cf)
    return stereo(norm(y, 0.45), 1.0)


def rock(dur_beats: int = 32, bpm: int = 150) -> np.ndarray:
    """Rock original en bucle (batería + guitarra distorsionada). 100% propio."""
    beat = 60 / bpm
    n = int(SR * beat * dur_beats)
    y = np.zeros(n)
    rng = RNG(61)

    def add(sig: np.ndarray, at: float, g: float = 1.0) -> None:
        a = int(SR * at)
        b = min(n, a + len(sig))
        y[a:b] += sig[: b - a] * g

    tk = t_(0.35)
    kick = np.sin(2 * np.pi * (50 + 120 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 9)
    ts = t_(0.25)
    snare = bp(rng.standard_normal(len(ts)), 400, 7000) * np.exp(-ts * 18) + np.sin(2 * np.pi * 190 * ts) * np.exp(-ts * 25) * 0.6
    th = t_(0.06)
    hat = hp(rng.standard_normal(len(th)), 6000) * np.exp(-th * 70)
    for b in range(dur_beats):
        at = b * beat
        if b % 2 == 0:
            add(kick, at, 1.0)
            add(kick, at + beat * 0.75, 0.6)
        else:
            add(snare, at, 0.8)
        add(hat, at, 0.35)
        add(hat, at + beat / 2, 0.25)
    # guitarra: power chords E5 - G5 - A5 - G5 (2 compases cada una)
    roots = [82.41, 98.0, 110.0, 98.0]
    gch = np.zeros(n)
    for i in range(dur_beats * 2):
        at = i * beat / 2
        root = roots[(i // 8) % 4]
        tt = t_(beat / 2)
        saw = sum(((tt * f) % 1.0) * 2 - 1 for f in (root, root * 1.5, root * 2))
        note = saw * np.exp(-tt * 3) * (0.9 if i % 2 == 0 else 0.6)
        a = int(SR * at)
        gch[a : a + len(note)] += note[: max(0, n - a)]
    gch = lp(soft_clip(gch * 0.6, 4.0), 3200)
    mix = soft_clip(y * 0.9 + gch * 0.55, 1.2)
    cf = int(SR * 0.05)
    mix[-cf:] *= np.linspace(1, 0, cf)
    left = mix
    right = np.concatenate([np.zeros(18), mix[:-18]])
    return norm(np.stack([left, right], axis=1), 0.85)


SONIDOS = {
    "whoosh": whoosh,
    "pop": pop,
    "tick": tick,
    "ding": ding,
    "golpe_goma": golpe_goma,
    "mazo": mazo,
    "sello": sello,
    "rejas": rejas,
    "billetes": billetes,
    "helicoptero": helicoptero,
    "avion": avion,
    "explosion_lejana": explosion_lejana,
    "riser": riser,
    "latido": latido,
    "puerta": puerta,
    "multitud": multitud,
    "ambiente_ciudad_noche": ambiente_ciudad_noche,
    "ambiente_cuarto": ambiente_cuarto,
    "ambiente_exterior": ambiente_exterior,
    "rock": rock,
}


def main() -> None:
    if "--lista" in sys.argv:
        print("\n".join(sorted(SONIDOS)))
        return
    OUT.mkdir(parents=True, exist_ok=True)
    solo = [a for a in sys.argv[1:] if not a.startswith("-")]
    for name, fn in SONIDOS.items():
        if solo and name not in solo:
            continue
        x = fn()
        if x.ndim == 1:
            x = stereo(x)
        sf.write(OUT / f"{name}.wav", fade(x.astype(np.float32), 0.002, 0.01), SR, subtype="PCM_16")
        print(f"✓ public/sfx/{name}.wav ({len(x) / SR:.1f}s)")


if __name__ == "__main__":
    main()
