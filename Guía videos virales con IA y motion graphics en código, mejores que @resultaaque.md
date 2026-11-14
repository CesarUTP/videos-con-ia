# Guía: videos virales con IA y motion graphics en código, mejores que @resultaaquee

Nov 13, 2026 · @Cesar Gonzalez

## Resumen

Estos videos no son "video generado por IA": Claude escribe el código de cada animación, una voz sintética narra y un comando renderiza el MP4. La cuenta @resultaaquee no publica su flujo exacto; lo que sigue es el método estándar que describen las fuentes y que encaja con lo observado en sus reels (fotogramas de texto animado, íconos y contadores, voz en off, y una "carpeta" de instrucciones que se revende en los comentarios).

- **Qué lo hace posible:** el framework [Remotion](https://www.remotion.dev/docs/ai/skills) (video con React) más skills que enseñan a Claude las buenas prácticas del framework.
- **Qué lo limita:** sirve para gráficos, tipografía, formas, contadores y UI; no para personajes ni rostros expresivos ([mejba.me](https://www.mejba.me/blog/claude-code-remotion-youtube-motion-graphics)).
- **Dónde puedes ganarles:** no en la herramienta, que es la misma para todos, sino en guion, ritmo, diseño, precisión de datos y fuentes citables.
- **Costo mínimo estimado:** una suscripción de pago a Claude, ElevenLabs desde 6 USD/mes si quieres licencia comercial de voz, y Remotion gratis para equipos pequeños (ver sección de herramientas).

## El pipeline paso a paso

El flujo tiene siete etapas y Claude Code las orquesta casi todas; tú decides el tema, el guion final y la calidad.

1. **Instalación (una sola vez).** Necesitas Node.js LTS, Git y un plan de pago de Claude, porque [Claude Code no está en el plan gratuito](https://www.mejba.me/blog/claude-code-remotion-youtube-motion-graphics). En el proyecto, los [skills oficiales de Remotion](https://www.remotion.dev/docs/ai/skills) se instalan con `npx remotion skills add` (o `npx skills add remotion-dev/skills` si Remotion aún no está; `npx create-video@latest --skills` los instala al crear el proyecto).
2. **Guion por escenas.** Pide a Claude un guion corto dividido en escenas con una frase de narración y una descripción visual cada una. Según [MindStudio](https://www.mindstudio.ai/blog/generate-ai-videos-claude-code-hyperframes-elevenlabs-workflow), Claude estructura la narración en segmentos cronometrados y llama a las APIs de voz y animación.
3. **Voz en off.** Con una clave de API de [ElevenLabs](https://www.mindstudio.ai/blog/ai-video-generation-claude-code-hyperframes-elevenlabs) Claude genera un MP3 por escena; el modelo Multilingual v2 [cobra 1 crédito por carácter](https://www.casrai.org/guides/elevenlabs-pricing). La voz se elige por su `voice_id`, y por eso los comentarios del reel preguntan "cuál es esa voz".
4. **Animación en código.** `/remotion-markup` escribe cada escena como una composición React. [Según mejba.me](https://www.mejba.me/blog/claude-code-remotion-youtube-motion-graphics), usa `Sequence` para escalonar elementos, `interpolate` para los cambios y `spring` para la física del movimiento.
5. **Subtítulos palabra por palabra.** El paquete [`@remotion/captions`](https://remotion.dev/docs/captions/create-tiktok-style-captions) incluye `createTikTokStyleCaptions()`, que agrupa los textos en "páginas"; con valores bajos de `combineTokensWithinMilliseconds` (200 a 500 ms) sale el efecto palabra por palabra. Ojo: [necesitas Whisper o similar](https://crepal.ai/blog/?p=5091) para tener tiempos por palabra, porque los SRT de YouTube solo traen tiempos por línea.
6. **Vista previa e iteración.** `/remotion-studio` abre una línea de tiempo en el navegador. Detectas ritmo apresurado, texto que choca o tipografía ilegible en vertical y pides el cambio en una frase. Un solo autor [calcula](https://www.mejba.me/blog/claude-code-remotion-youtube-motion-graphics) que alrededor de 1 de cada 5 prompts necesita una corrección real.
7. **Render.** `/remotion-render` genera el MP4. El render es cuadro por cuadro, así que el tiempo crece con la duración del video.

**Recomendación propia (no viene de las fuentes):** mide la duración real de cada MP3 y fija la longitud de cada escena a ese valor; así la animación queda sincronizada con la voz sin ajustar a mano. Guarda una sola plantilla de proyecto y reutilízala en cada video para que todos compartan estilo.

## Herramientas, costos y licencias

Un solo creador puede empezar con Remotion gratis y pagar solo Claude y, si quieres la voz más natural, ElevenLabs desde 6 USD al mes. Precios de las fuentes consultadas en noviembre de 2026; confirma en cada sitio antes de pagar.

| Herramienta | Para qué sirve | Costo | Licencia o advertencia |
| --- | --- | --- | --- |
| [Claude Code](https://www.mejba.me/blog/claude-code-remotion-youtube-motion-graphics) | Escribe guion y código de animación, orquesta el flujo | Requiere plan de pago de Claude | No está en el plan gratuito |
| [Remotion](https://www.remotion.dev/docs/license/pricing.md) | Video con React: composiciones, Studio, render | Gratis para personas y empresas de hasta 3 personas; si no, Creators 25 USD/mes por asiento o Automators 0,01 USD por render (mínimo 100 USD/mes) | Uso comercial permitido en la licencia gratuita, sujeto a sus términos |
| [ElevenLabs](https://dupple.com/pricing/elevenlabs) | Voz en off sintética de alta calidad | Free 10.000 créditos/mes; Starter 6 USD/mes con 30.000 créditos | El plan gratuito no incluye licencia comercial; Starter sí |
| [Kokoro y Piper](https://www.promptquorum.com/es/power-local-llm/local-tts-voice-cloning-piper-coqui-xtts) | Voz local y gratuita | 0 USD | Kokoro es Apache 2.0 y Piper MIT, libres para uso comercial; menos naturales y con pocas voces en español que ElevenLabs |
| [Whisper](https://pasqualepillitteri.it/es/news/28186/voz-ia-local-texto-a-voz-transcripcion) | Transcribe tu audio para tener tiempos por palabra (subtítulos) | 0 USD, corre en local | Licencia MIT |

Dos matices sobre la voz: en el modelo Multilingual v2 [1 carácter cuesta 1 crédito](https://www.casrai.org/guides/elevenlabs-pricing), así que 30.000 créditos alcanzan para unos 30 minutos de audio. Y si clonas una voz ajena o usas una voz de la comunidad, revisa sus términos antes de monetizar.

## Cómo superar esos videos

La herramienta es la misma para todos; ganas con un guion que retiene, una dirección de arte propia, datos verificables y revisión fotograma a fotograma. Las técnicas de abajo salen de las fuentes citadas; la selección y el orden son míos.

### 1. Guion que retiene

- **Gancho en 1 a 2 segundos** que abra una pregunta o una tensión; la [estructura de bucle](https://wildandfreetools.com/blog/viral-reel-script-structure/) es abrirla en el gancho, mantenerla durante el cuerpo y cerrarla al final.
- **Payoff al final y cierre que reenganche:** si el último cuadro conecta con el primero, [los replays suman tiempo de visualización](https://instasaver.io/en/blog/reels-that-get-watched). Evita despedidas largas que den permiso para irse.
- **Un cambio de ritmo cada 3 a 5 segundos** en contenido rápido o [cada 7 a 10 en contenido educativo](https://socialk.it/es/blog/instagram-reels-retention-strategy), y en pantalla una línea de texto cada 2 o 3 segundos.
- **Storyboard de una función por escena.** Ejemplo para 15 s, según [aiidelist](https://aiidelist.com/blog/opus-5-5-motion-design.md): gancho (0–2 s), promesa (2–5), transformación (5–9), prueba (9–13) y cierre (13–15).

### 2. Que no se vea "plano" ni genérico

[Según autoae](https://autoae.online/blog/claude-remotion-videos-look-flat), los borradores se parecen por tres causas: las mismas herramientas visuales (fondo oscuro, titular brillante, blob de gradiente, botones en píldora), el mismo muelle de entrada en todo, y fuentes o assets de reserva. Sus correcciones:

- Especifica en el prompt **qué se mueve, en qué orden y con qué curva**, y una curva de easing distinta por tipo de elemento.
- Carga **fuentes reales** con `@remotion/google-fonts` o `loadFont`, y revisa un fotograma para confirmar que no hay fallback.
- Usa **assets reales** (capturas, fotos, grabaciones de pantalla) con `<Img>` y `<OffthreadVideo>`, no solo texto.
- Trabaja con **capas** (primer plano, medio y fondo) a velocidades distintas.
- Antes del render completo, usa `npx remotion still` para sacar 3 o 4 fotogramas clave y busca texto superpuesto o tramos sin movimiento.

Sobre el estilo propio: un artículo de UX Planet sostiene que el "AI slop" [suele ser un problema de contexto](https://uxplanet.org/i-tried-to-make-claude-code-stop-producing-ai-slop-fa594f6b5981) y que un sistema de diseño real es la mejor defensa. Mi aplicación: define una vez tu paleta (fondo, texto y un acento), tu fuente, tu estilo de íconos y tus curvas de movimiento, guárdalas en el archivo `CLAUDE.md` del proyecto y reutilízalas en cada video.

### 3. Restricciones de timing y tipografía para el prompt

Estas reglas salen de los [prompts recomendados de aiidelist](https://aiidelist.com/blog/opus-5-5-motion-design.md); úsalas como punto de partida y ajústalas:

- Titular legible al menos 1,2 s antes de la siguiente transición importante.
- Pausa de 300 a 600 ms antes de cada revelación importante.
- No más de 0,5 s sin movimiento significativo.
- Solo 2 o 3 familias de transición, repetidas con coherencia; cada transición nace de un objeto ya visible en la escena anterior.
- Una sans-serif principal, números tabulares para cifras y un máximo de palabras por frase visible.
- Paleta de fondo, tipo y un solo acento; rebote elástico solo si lo pides.
- Animación basada en tiempo y sin aleatoriedad sin semilla, para que el render sea reproducible.

### 4. Datos verificables (tu mayor ventaja)

En el reel del teléfono, varios comentarios discuten la exactitud del contenido; ahí hay un hueco. Haz lo contrario:

- **Usa solo hechos que puedas citar** y pon la fuente como última línea en pantalla o en el pie del Reel. [Aiidelist recomienda](https://aiidelist.com/blog/opus-5-5-motion-design.md) pasar a Claude solo activos y afirmaciones verificadas, y prohibirle inventar métricas.
- **Separa roles:** primero pide la dirección creativa y luego una revisión que asuma que la primera versión no es la final, y una verificación de cada cifra contra su fuente.
- Para tus clases, esto además te da material reutilizable y defendible académicamente.

## Distribución en Instagram

Instagram premia primero cuánto se ve tu Reel, luego cuántas veces se envía por mensaje y después los likes; por eso el diseño del video importa más que el horario o los hashtags.

- **Señales de ranking.** En enero de 2025 Adam Mosseri [confirmó tres señales](https://hanami-social-website.pages.dev/en/blog/instagram-reels-algorithm-2026/): tiempo de visualización, likes por alcance y envíos por alcance. Instagram no ha publicado pesos numéricos. Las cifras que circulan, como que un envío vale entre 3 y 5 likes para llegar a no seguidores, vienen de [blogs de marketing](https://www.socialpilot.co/blog/instagram-reels-algorithm), no de Instagram, así que trátalas como orientativas.
- **Duración.** Para llegar a gente nueva, [las fuentes recomiendan quedarse bajo 3 minutos](https://www.socialpilot.co/blog/instagram-reels-algorithm). Formato vertical 9:16 (por ejemplo 1080×1920) y subtítulos siempre, porque muchos ven sin sonido.
- **Qué medir.** Mira en cada Reel la retención por segundo para saber [exactamente dónde pierdes a la gente](https://instasaver.io/en/blog/reels-that-get-watched) y corrige ese tramo en el siguiente video. Para eso conviene tener un solo tema por video y la misma plantilla, así comparas peras con peras.
- **Etiquetado de IA.** Meta [añade la etiqueta "AI info"](https://techspot.com/news/113695-instagram-cracks-down-ai-accounts-pretending-human.html) cuando detecta señales técnicas de generación con IA o cuando quien publica lo declara. La política de "Perfil generado con IA", reportada a comienzos de septiembre de 2026, apunta a cuentas cuyo protagonista es una persona sintética y reduce su alcance si no se identifican; según Instagram, quienes usan IA como herramienta en su proceso creativo no están incluidos. Tu formato (animación y voz sintética, sin persona falsa) queda fuera de esa regla según lo publicado, pero no pude abrir el anuncio oficial. **Recomendación:** declara en la descripción que la voz y las animaciones se hicieron con IA; cuesta una línea y evita sospechas.
- **Voz y música.** Usa una voz con licencia comercial (ElevenLabs desde Starter, o motores locales con licencia permisiva) y no clones la voz de nadie sin su permiso. No investigué las reglas de licencias musicales de Instagram, así que usa su biblioteca de audio o música con licencia clara y verifícalo antes de monetizar.
- **Originalidad.** No copies temas ni guiones de @resultaaquee: un comentario en uno de sus reels ya pregunta quién copió a quién. Varias guías de marketing [afirman que Instagram favorece el contenido original](https://dataslayer.ai/blog/instagram-algorithm-2025-complete-guide-for-marketers) (fuente secundaria); tu ventaja es un tema, una voz y un diseño reconocibles.

## Plan de arranque de 7 días y prompts de ejemplo

En una semana puedes publicar tu primer video con voz, subtítulos y datos citados. El plan y los prompts son una propuesta mía, armada con las técnicas de las secciones anteriores; ajústalos a tu ritmo.

| Día | Objetivo | Entregable |
| --- | --- | --- |
| 1 | Instalar y probar | Node.js LTS, Git, Claude Code y los skills de Remotion; un video de prueba de 5 s renderizado |
| 2 | Dirección de arte | Paleta (fondo, texto, un acento), fuente, estilo de íconos y curvas de movimiento guardados en `CLAUDE.md` |
| 3 | Guion | Guion de 15 a 30 s con gancho, bucle y payoff, más la lista de datos con su fuente |
| 4 | Voz y subtítulos | Un MP3 por escena (ElevenLabs Starter o Kokoro/Piper) y subtítulos palabra por palabra con Whisper |
| 5 | Animación y QA | Escenas en Remotion Studio; 3 o 4 fotogramas con `npx remotion still` revisados; ajustes de timing |
| 6 | Render y publicación | MP4 final 1080×1920, datos verificados contra su fuente, descripción con la fuente y la nota de IA |
| 7 | Medir y repetir | Retención por segundo revisada; plantilla ajustada; segundo video |

**Prompt 1: dirección de arte (día 2).** Adaptado de las [estructuras de aiidelist](https://aiidelist.com/blog/opus-5-5-motion-design.md).

```text
Actúa como director de motion senior. Crea en CLAUDE.md la guía visual de mi canal de curiosidades científicas en vertical 1080x1920, 30 fps.
Paleta: un fondo, un color de texto y un solo acento.
Tipografía: una sans-serif principal cargada con @remotion/google-fonts, números tabulares.
Iconos: trazo constante, un solo estilo.
Movimiento: define una curva de easing distinta para texto, iconos y datos. Sin rebote elástico por defecto. Máximo 3 familias de transición.
Timing: titular legible al menos 1,2 s antes de la siguiente transición; pausa de 300 a 600 ms antes de cada revelación; nada más de 0,5 s sin movimiento.
```

**Prompt 2: un video (día 5).**

```text
Con la guía de CLAUDE.md y los skills de Remotion, crea un video de 20 s sobre: "por qué el promedio engaña (media vs mediana)".
Usa SOLO estas cifras y fuentes, no inventes datos: [pega aquí tus datos con su fuente].
Estructura: 0-2 s gancho con una pregunta; 2-6 s promesa; 6-14 s demostración con gráfico animado; 14-18 s payoff; 18-20 s cierre que reconecte con el gancho.
Narración en archivos separados por escena; fija la duración de cada escena a la del audio.
Subtítulos palabra por palabra. Muestra la fuente en el último cuadro.
Antes del render final, renderiza fotogramas clave con remotion still, revisa recortes y superposiciones, corrígelos y recién entonces renderiza el MP4.
```

## Fuentes

Consultadas en noviembre de 2026. Las primeras las abrí completas; las del segundo grupo las leí solo como resultado de búsqueda, así que verifica en el sitio original antes de decidir o pagar.

**Páginas abiertas completas**

- Instagram: [perfil @resultaaquee](https://www.instagram.com/resultaaquee/), [reel del método](https://www.instagram.com/reel/DemKjcaI6na/) y [reel del teléfono](https://www.instagram.com/reel/DehA1hgonRL/) (descripción y comentarios; no pude ver ni oír el video completo).
- [Remotion: skills para agentes de IA](https://www.remotion.dev/docs/ai/skills)
- [Remotion: licencia y precios](https://www.remotion.dev/docs/license/pricing.md)
- [Claude Code + Remotion: Motion Graphics for YouTube (mejba.me)](https://www.mejba.me/blog/claude-code-remotion-youtube-motion-graphics)
- [Why Claude Remotion Videos Look Flat (autoae)](https://autoae.online/blog/claude-remotion-videos-look-flat)
- [Opus 5.5 Motion Design: prompts y flujo (aiidelist)](https://aiidelist.com/blog/opus-5-5-motion-design.md)
- [Instagram cracks down on AI accounts pretending to be human (TechSpot)](https://techspot.com/news/113695-instagram-cracks-down-ai-accounts-pretending-human.html)

**Leídas solo como fragmento de búsqueda**

- Flujo de voz y animación: [MindStudio (HyperFrames y ElevenLabs)](https://www.mindstudio.ai/blog/generate-ai-videos-claude-code-hyperframes-elevenlabs-workflow), [MindStudio (script de voz)](https://www.mindstudio.ai/blog/ai-video-generation-claude-code-hyperframes-elevenlabs), [growwstacks (tutorial)](https://growwstacks.com/blog/claude-code-video-creation-tutorial/), [growwstacks (voz)](https://growwstacks.com/blog/turn-claude-code-into-faceless-video-engine)
- Subtítulos: [Remotion: createTikTokStyleCaptions](https://remotion.dev/docs/captions/create-tiktok-style-captions), [CrePal](https://crepal.ai/blog/?p=5091)
- Precios y licencias de voz: [Dupple (ElevenLabs, octubre de 2026)](https://dupple.com/pricing/elevenlabs), [Casrai](https://www.casrai.org/guides/elevenlabs-pricing), [PromptQuorum (licencias de TTS local)](https://www.promptquorum.com/es/power-local-llm/local-tts-voice-cloning-piper-coqui-xtts), [Pasquale Pillitteri (Whisper y Kokoro)](https://pasqualepillitteri.it/es/news/28186/voz-ia-local-texto-a-voz-transcripcion)
- Retención y algoritmo: [Hanami (señales de Mosseri)](https://hanami-social-website.pages.dev/en/blog/instagram-reels-algorithm-2026/), [SocialPilot](https://www.socialpilot.co/blog/instagram-reels-algorithm), [Dataslayer](https://dataslayer.ai/blog/instagram-algorithm-2025-complete-guide-for-marketers), [SocialKit](https://socialk.it/es/blog/instagram-reels-retention-strategy), [Wild and Free Tools](https://wildandfreetools.com/blog/viral-reel-script-structure/), [Instasaver](https://instasaver.io/en/blog/reels-that-get-watched)
- Estilo y "AI slop": [UX Planet](https://uxplanet.org/i-tried-to-make-claude-code-stop-producing-ai-slop-fa594f6b5981)
