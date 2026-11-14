---
name: crear-video
description: Crea Reels/TikTok/Shorts explicativos en español con motion graphics en código (Remotion), voz sintética, subtítulos palabra por palabra, efectos de sonido, música original y QA automático. Úsala cuando el usuario pida un video, reel, short o TikTok explicativo sobre cualquier tema ("hazme un video de…", "quiero un reel sobre…", "crea un video explicando…"). Entrevista al usuario, investiga fuentes, propone guion y storyboard para aprobación, ilustra, renderiza y entrega MP4 + portada + descripción.
---

# Crear video explicativo

Motor: el proyecto **videos-con-ia** (Remotion + pipeline Python). Las reglas de estilo, el kit y los comandos están en el `CLAUDE.md` del proyecto: **léelo completo antes de producir** y síguelo al pie de la letra.

## 0. Comprobar el motor

- Si en la carpeta actual existe `scripts/video.mjs` y `CLAUDE.md`, el motor está instalado: sigue al paso 1.
- Si no existe, pregunta dónde instalarlo y ejecuta (reemplaza la carpeta):
  ```
  npx degit CesarUTP/videos-con-ia <carpeta>
  cd <carpeta> && npm run setup
  ```
  `setup` instala Node/Python, efectos y (si hay GPU NVIDIA) el generador de música. Después pide al usuario abrir Claude Code **dentro de esa carpeta** y repetir su pedido (así se cargan `CLAUDE.md` y esta skill). Requisitos: Node ≥ 20, Python 3.12, Git; GPU NVIDIA opcional (solo para música a medida).

## 1. Entrevista (usa AskUserQuestion; máximo 2 rondas)

Pregunta solo lo que no esté ya claro en el pedido:
1. **Tema y ángulo**: qué pregunta responde el video (el gancho). Si el usuario solo da un tema, propone 2–3 ángulos con gancho.
2. **Duración**: 30 s · 45 s (recomendado) · 60 s · 90 s.
3. **Fuentes**: ¿tiene fuentes o datos propios, o investigo yo? (Siempre se citan.)
4. **Voz**: masculina `es-MX-JorgeNeural` (predeterminada) · femenina `es-MX-DaliaNeural` · otra (`npm run voces`).
5. **Música**: generada a medida (requiere GPU) · fondo genérico del registro · sin música.

Elige tú el **registro visual** según el tema (tabla en CLAUDE.md: `cuerpo` = medicina/biología, `historia` = relatos/personajes, `tecnico` = tecnología/física) y díselo al usuario en una línea.

## 2. Investigación y verificación

- Busca fuentes citables (enciclopedias, StatPearls/NCBI, instituciones, papers). Lee la página, no solo el resultado de búsqueda.
- Anota cada afirmación con su fuente. **Si una cifra no tiene fuente sólida, no se dice.** Cifras disputadas: se omiten o se dan como rango con fuente.
- Contenido médico: incluye "Información, no diagnóstico". Personas reales: tono factual, nada difamatorio.

## 3. Guion + storyboard → APROBACIÓN DEL USUARIO

Presenta en el chat, antes de escribir código:
- **Guion por escenas** (6–9 escenas, una idea por escena): narración exacta, con `**palabras clave**`.
- **Storyboard**: por escena, qué se VE (la imagen explica, no el texto), qué palabra dispara cada acción, qué suena (efectos reales, nunca onomatopeyas escritas), y la transición.
- Titular de portada (exacto, sin exagerar) y fuentes.

Espera la aprobación o los cambios del usuario. No sigas sin un "sí".

## 4. Producción

```
npm run nuevo -- <slug> --estilo=<registro>    # andamiaje: guion + escenas base
```
1. Escribe `videos/<slug>/guion.json` (estilo, voz, fuentes, escenas `"tipo": "visual"`, `"portada": {"titulo": …}`) y el storyboard en `notas.md`.
2. `npm run voz -- <slug>`
3. Música: con GPU `npm run musica -- <slug> --para <slug> --estilo <registro> --prompt "<instrumentos y ánimo, en inglés>"` → `"musica": {"src": "musica/<slug>.wav", "volumen": 0.55}`. Sin GPU: `"musica": {"src": "musica/fondo-<registro>.mp3", "volumen": 0.5}` (150 s; para videos más largos se necesita la música a medida).
4. Ilustra en `src/visuals/<slug>/scenes.tsx` con el kit (`Camera`, `Personaje`, `Habitacion`, `Ventana`, `Pulse`, `Label`, `Badge`, `Sfx`, `REAL` + `sombreado()`): colores reales, cámara continua, `useCues` para sincronizar, `<Sfx>` para todo lo que suena. Marca el arte clave con `data-qa="importante"` y la utilería móvil con `data-qa="objeto"`. Pastillas sin x/y.
5. `npm run stills -- <slug>` → **mira `out/<slug>/hoja.png` completa** (lee la imagen) y corrige: cosas cortadas, caras tapadas, planos vacíos, avisos `⚠ [cue]`.
6. `npm run qa -- <slug>` → repite corrección hasta **✔ sin solapes**.
7. `npm run render -- <slug>` (masteriza a -14 LUFS y genera portada + descripción).
8. `npm run check`.

## 5. Entrega

Da al usuario: `out/<slug>.mp4`, `out/<slug>/portada.png` y `out/<slug>/descripcion.txt` (fuentes + "Voz y animaciones hechas con IA"). Resume en 3–5 líneas qué muestra el video y ofrece ajustes (ritmo, voz, escena concreta).

## Reglas que no se negocian

- La imagen explica; el texto en pantalla es solo subtítulos, etiquetas y pastillas.
- Lo que suena se escucha, no se escribe. Nada de ruido de fondo constante.
- Datos con fuente, visible en el último cuadro. Nada inventado.
- QA automático en verde antes de entregar.
- No copies temas ni guiones de otras cuentas; las referencias son de estilo.
