# Videos con IA — explicadores visuales en código

Reels verticales (1080×1920, 30 fps) hechos con **Remotion** (React), voz sintética en español, subtítulos palabra por palabra, efectos de sonido y música original. Referencias de estilo en `Ejemplos/` (@resultaaquee; los MP4 no se distribuyen).

**Para crear un video, usa la skill `crear-video`** (`skills/crear-video/SKILL.md`): entrevista, investigación, guion + storyboard con aprobación, producción, QA y entrega.

## Regla número 1: LA IMAGEN EXPLICA, EL TEXTO NO

- **Cada frase de la narración tiene una imagen que la demuestra.** Si la voz dice "el huso muscular detecta el estirón", se VE el huso encenderse dentro del músculo. Prohibido resolver una escena con un titular o una tarjeta de texto.
- **Único texto en pantalla:** subtítulos, etiquetas cortas con línea guía y pastillas de dato. Nada de títulos, kickers ni listas.
- **Cámara continua sobre un "mundo" ilustrado:** una ilustración grande que la cámara recorre (plano general → detalle → corte transversal → vuelta). Entre escenas del mismo mundo usa `corte` (la cámara sigue); para entrar a otro nivel de detalle `zoom` y para salir `zoom-out`; `fundido` para cambiar de lugar o época.
- **Datos dentro de la escena:** pastillas (`Badge`), medidores, contadores o lecturas pegados al objeto, nunca números gigantes sueltos.
- **Cambio visual cada ~1,5–3 s** (zoom, algo se enciende, una etiqueta aparece, una señal viaja). Nunca >0,5 s quieto: la cámara "respira" y los personajes parpadean.
- **El cierre conecta con el inicio** (bucle → replays) y muestra la fuente.

## Registros visuales: ELEGIR SEGÚN EL TEMA (`"estilo"` en guion.json)

| | `tecnico` | `cuerpo` | `historia` |
|---|---|---|---|
| **Temas** | física, tecnología, cómo funcionan objetos | medicina, biología, cuerpo humano, animales, comida | relatos, historia, experimentos famosos, personajes |
| **Referencia** | móvil / pantalla táctil | tripas | celda rosa |
| **Fondo** | casi negro + retícula + polvo | oscuro **teñido** (ciruela) + burbujas suaves | escenarios completos y claros (cuartos, calles, mapas) |
| **Objetos** | semi-realistas con volumen y brillos | **colores reales** en ilustración plana con sombra suave | todo a color real; caricatura |
| **Energía** | dorado brillante | amarillo cálido brillante | rojo/rosa para emoción |
| **Recursos** | etiquetas técnicas, lecturas de instrumento | **ventanas de corte**, metáforas cotidianas, pastillas de dato | **personajes** con expresiones/poses, utilería, cambios de lugar |
| **Etiquetas** | técnica (MAYÚSCULAS + línea) | pastilla clara | pastilla clara |
| **Subtítulos** | arriba, caja azul en la clave | arriba, caja azul en la clave | grandes, blancos con contorno negro, 1–2 palabras, a la altura del torso |

Reglas de color (`src/kit/colores.ts`):
- **Cada cosa con su color real** (`REAL.cuerpo.musculo`, `REAL.piel.media`, `REAL.materiales.madera`…). Si falta un color, agrégalo a `REAL`.
- **Sombreado del mismo matiz:** `sombreado(base)` → `luz`, `brillo`, `sombra`, `contorno`. Contornos del propio color, nunca negro puro (excepto personajes de `historia`).
- El fondo oscuro de `cuerpo` es para que resalten los colores reales: no conviertas objetos a monocromo.
- Mezclar registros solo si el tema lo pide (p. ej. una metáfora tipo historia dentro de un video de cuerpo).

## Flujo de un video

1. **Investigar** y fijar datos con fuente citable (Britannica, StatPearls/NCBI, instituciones). Anotar en `guion.json > fuentes`.
2. `npm run nuevo -- <slug> --estilo=cuerpo|historia|tecnico` → crea `videos/<slug>/guion.json`, `notas.md` y `src/visuals/<slug>/` (escenas base + `index.ts`). El registro de visuales es **automático** (`scripts/registrar.mjs`; no editar `src/visuals/index.ts`).
3. **Storyboard primero** (en `notas.md`): por frase, qué se VE y qué palabra lo dispara. Diseñar el mundo y sus planos de cámara con nombre.
4. **Guion:** escenas `"tipo": "visual"`, `"props": {"visual": "<slug>/<escena>"}`. Marca `**palabras clave**`. Escribe los números como se dicen si una animación depende de ellos ("veinticuatro mil").
5. **Ilustrar** en `src/visuals/<slug>/scenes.tsx` con el kit; sincronizar con `useCues([...])`.
6. `npm run voz -- <slug>` → `npm run stills -- <slug>` → revisar `out/<slug>/hoja.png` y los avisos `⚠ [cue]` → `npm run qa -- <slug>` hasta que diga **✔ sin solapes** → `npm run render -- <slug>`.
7. `npm run check` antes de dar por terminado.

**Validación automática** (`scripts/validar.mjs`, corre en `check`, `stills`, `qa`, `render` y `video`): visual inexistente, tipo/estilo/transición inválidos, ids repetidos, música faltante o más corta que el video, guion sin fuentes, portada sin titular. Los errores detienen el flujo. Videos de prueba: `"interno": true` en el guion. (`npm run video` hace voz → stills → **qa** → render y **se detiene si el QA encuentra problemas**; `--forzar` solo con motivo.)

```
npm run nuevo -- <slug> --estilo=cuerpo   # andamiaje del video
npm run voz -- <slug>                     # voz + tiempos por palabra + manifest (con caché)
npm run stills -- <slug>                  # fotogramas clave + out/<slug>/hoja.png + avisos de cues
npm run qa -- <slug>                      # revisor automático de solapes en TODOS los cuadros
npm run render -- <slug>                  # MP4 + masterización -14 LUFS + portada
npm run video -- <slug>                   # voz → stills → render
npm run musica -- <slug> --para <slug> --estilo historia [--prompt "..."]   # dura lo mismo que el video
npm run sfx                               # (re)genera la biblioteca de efectos
npm run check                             # registro + validación de guiones + tipos + lint
npm run dev                               # Remotion Studio
```

- La duración de cada escena = duración real de su audio. `useCues(["tendón", "cuádriceps"])` devuelve el frame (relativo a la escena) en que la voz dice cada palabra, en orden. Si una palabra no está, `stills` avisa con `⚠ [cue]`.
- Nunca editar `public/videos/<slug>/manifest.json` a mano.

## Kit (`src/kit/`)

| Pieza | Para qué |
|---|---|
| `Camera` / `cameraAt` | Mueve un mundo grande con claves `{at, shot:{x,y,zoom}}`; zoom logarítmico y respiración. Planos con nombre reutilizables: el plano final de una escena = inicial de la siguiente. |
| `Pulse` + `GlowDefs` | Señal que viaja por una ruta SVG con estela y brillo. |
| `Label` | Etiqueta con línea guía (técnica o pastilla según registro); `scale={zoom}`, `until`. |
| `Badge` | Pastilla de dato con ícono y "pop" sonoro. **No le pases x/y**: va sola a su franja fija (historia y≈300; cuerpo/técnico y≈560, bajo los subtítulos). Varias a la vez: `fila={0,1,2}`. Nunca dos pastillas en la misma fila al mismo tiempo (usa `until`). |
| `Ventana` | Ventana de corte con borde del material cortado y sombra interior; `apertura` animable. |
| `Personaje` | Caricatura: expresiones (`neutral/feliz/enojado/sorprendido/triste/presumido`), poses (`abajo/arriba/senala/jarras/sostiene`), gorra con `estrellas`, `casco`, `sombrero`, `bigote`, `lentes`, `corbata`, peinados, `furia`, `rubor`; parpadea solo. |
| `Habitacion` | Cuarto 2.5D (ladrillo, barrotes, lámpara); se extiende bajo el cuadro. |
| `Sfx` | Efecto sincronizado (`at`, `dur`, `loop`, `volume`, `fade*`, `rate`, `duck`). |
| `Readout` | Lectura numérica de instrumento (registro técnico). |
| `Onomatopeya` / `Vibracion` | Solo como gesto cómico visual (nunca en lugar de un sonido). |
| `colores.ts` | `REAL` + `sombreado()` / `tono()`. |

Ejemplos de referencia: `src/visuals/demo/` (historia mínima) y los videos ya hechos en `src/visuals/<slug>/` (reutiliza sus mundos, personajes y utilería).

## QA automático de composición (obligatorio)

`src/qa/RevisorSolapes.tsx` mide en cada cuadro la caja real de los elementos marcados con `data-qa` y `npm run qa` lista los problemas por escena y segundo (ignora transiciones y roces de 1–2 cuadros):

- **pastilla** no puede tapar: cara, importante, objeto, etiqueta, pastilla, subtítulo.
- **etiqueta** no puede tapar: cara, etiqueta, subtítulo; ni salirse de pantalla.
- **subtítulo** no puede tapar caras. **objeto** (utilería que se mueve) no puede tapar caras. **efecto** (texto decorativo) no puede tapar caras ni arte importante.

Marcas: el kit ya marca `cara` (Personaje), `pastilla` (Badge), `etiqueta` (Label), `subtitulo` (Captions), `efecto` (Onomatopeya) e `importante` (Ventana). **Al ilustrar, marca tú** el arte clave con `data-qa="importante" data-qa-nombre="…"` (banderas, documentos, letreros, la gráfica principal) y la utilería móvil con `data-qa="objeto"` (sobres, carpetas, herramientas). Sin marca, el revisor no puede protegerlo.

Reglas de composición que evitan los avisos:
- Personajes secundarios lejos del centro inferior (franja del subtítulo): a los lados o más abajo.
- Lo que un personaje sostiene va a la altura de la mano/pecho, nunca cruzando la cara.
- No dupliques un mismo elemento (p. ej. estrellas en la gorra Y flotando encima).
- Cerca de los bordes, etiquetas con `align: "end"` y retíralas (`until`) antes de que la cámara las saque de cuadro.

## Lecciones de QA (errores que ya ocurrieron; no repetir)

- **Encuadre:** las caras no van detrás del subtítulo. En historia, sube el encuadre (`y + 130` en las claves de cámara) y **extiende fondos y pisos bajo el cuadro** (cielo, mapas y `Habitacion` ya miden 2600+ px) para no dejar franjas vacías.
- **Etiquetas y pastillas:** no se salen por los bordes ni chocan entre sí ni con arte importante (lo detecta `npm run qa`). La franja de pastillas debe quedar libre de arte clave: baja banderas, ventanas y letreros si caen ahí.
- **Brazos u objetos** no deben tapar la ventana de corte o el detalle que se explica en el acercamiento.
- **Ventanas de corte** pequeñas y en su sitio (la de la cabeza no puede tapar la cara).
- **Transición panel:** la escena saliente debe ocultarse cuando el panel la cubre.
- Revisar la **hoja de contactos** completa y extraer cuadros del MP4 en momentos clave (golpe, señal, zoom, fundido).

## Sistema de diseño

- Tokens en `src/theme.ts`; registros en `src/estilos.tsx` (`useEstilo()` da fondo, energía, selección, etiquetas, subtítulos).
- Tipografía: Inter (subtítulos, etiquetas) + JetBrains Mono (lecturas, fuentes).
- Transiciones: `corte`, `zoom`, `zoom-out`, `fundido` (14 frames; `whoosh` automático). `panel`/`deslizar` solo para tipos de texto heredados.
- Determinista: prohibido `Math.random()`; usar `random()` de Remotion con semilla.

## Sonido

**Si algo SUENA en la historia, se ESCUCHA; no se escribe.** Prohibido "TUCU TUCU", "¡PUM!", "¡TOC!" en pantalla.

Capas (de abajo arriba). **Nada de ruido de fondo constante** (decisión del usuario):
1. **Música de fondo** (`guion.json > musica`): instrumental original de ACE-Step; se atenúa sola bajo la voz. `"musicaFondo": false` en una escena la silencia (p. ej. cuando suena música dentro de la historia).
2. **Efectos puntuales con significado**, sincronizados (`at` = frame de la acción): `golpe_goma`, `mazo`, `sello`, `rejas`, `puerta`, `billetes`, `avion`, `helicoptero`, `explosion_lejana`, `ding`, `pop`, `tick`, `whoosh`, `riser`, `latido`, `rock`. Los fuertes y largos (rock, helicóptero) con `duck` para que bajen bajo la voz.
3. **Voz.**

- Prohibido usar por defecto `ambiente_*` o `multitud` (suenan a siseo). Solo si la narración lo exige, ≤ 0.12.
- Efectos nuevos: síntesis en `pipeline/sfx.py` + `npm run sfx` (sin licencias de terceros).
- Música: **después de `npm run voz`**, `npm run musica -- <slug> --para <slug> --estilo historia|cuerpo|tecnico [--prompt "instrumentos y ánimo, en inglés"] [--bpm 96]` → `public/musica/<slug>.wav` con la **duración exacta del video** (una música más corta se repetiría con un corte; el validador lo avisa). En el guion: `"musica": {"src": "musica/<slug>.wav", "volumen": 0.55}`.
- Tras `render`: masterización a -14 LUFS / -1.5 dBTP y portada `out/<slug>/portada.png` con `"portada": {"frame": N, "titulo": "Titular corto y exacto"}`.

## Voz

| Motor | Uso |
|---|---|
| `edge` (**predeterminado**, `es-MX-JorgeNeural`) | Gratis, en línea, tiempos por palabra exactos. Revisar términos de Microsoft antes de monetizar. |
| `qwen` | Qwen3-TTS local en GPU (Apache 2.0); subtítulos vía Whisper. |
| `kokoro` | Local, ligero, calidad media. |
| `elevenlabs` | De pago, aún no contratado: `ELEVENLABS_API_KEY` en `.env` + `voz` = voice_id. |

`npm run voz -- <slug> --motor qwen --voz Ryan` cambia de motor sin tocar el guion; `npm run muestras` compara voces.

## Datos verificables

- Solo afirmaciones con fuente; la fuente aparece en el último cuadro. Si no hay fuente sólida para una cifra, no se dice.
- Cifras disputadas (p. ej. víctimas) se omiten o se presentan como rango con fuente.
- Contenido médico: "Información, no diagnóstico".
- Titulares de portada exactos, sin exagerar causas.

## Tipos de escena

- **`visual`** (principal): `props.visual` = `"<tema>/<escena>"`; el resto de props pasa al componente.
- Heredados de texto (`gancho`, `numero`, `barras`, `columnas`, `comparacion`, `lista`, `frase`, `cierre`, `ruta`): solo apoyo puntual.
- Campos comunes: `id`, `tipo`, `narracion`, `transicion`, `pausa`, `minSegundos`, `pronunciacion`, `musicaFondo`.

## Publicación

Descripción del Reel: fuentes + "Voz y animaciones hechas con IA". La referencia es de estilo, no de contenido: no copiar temas ni guiones de otras cuentas.
