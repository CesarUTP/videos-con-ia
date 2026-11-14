# Videos con IA 🎬

Crea **Reels / TikTok / Shorts explicativos en español** con motion graphics hechos en código: ilustración animada con cámara continua, voz sintética, subtítulos palabra por palabra, efectos de sonido sincronizados, música original y masterización lista para publicar.

Funciona con **[Claude Code](https://claude.com/claude-code)**: le pides un video y la skill **`crear-video`** te entrevista, investiga fuentes, te propone guion y storyboard para que los apruebes, ilustra las escenas, revisa la composición automáticamente y te entrega el MP4, la portada y la descripción.

> Ejemplo de pedido: *«Hazme un video de 45 segundos sobre por qué nos suenan las tripas»*.

## Instalación

Requisitos: **Node.js ≥ 20**, **Python 3.12**, **Git** y **Claude Code** (plan de pago de Claude). Recomendado: GPU NVIDIA (para generar música a medida; sin GPU se usan fondos genéricos incluidos).

```bash
npx degit __REPO__ mi-canal
```
```bash
cd mi-canal
```
```bash
npm run setup
```

`setup` instala las dependencias de Node y Python, la biblioteca de efectos, las skills de Remotion y (si hay GPU) el generador de música ACE-Step. Usa `npm run setup -- --sin-musica` para omitir la música a medida.

¿Solo quieres la skill en otro proyecto? `npx skills add __REPO__` — la skill detecta si falta el motor y lo instala.

## Uso

1. Abre la carpeta con Claude Code.
2. Pide tu video. La skill pregunta tema, duración, fuentes, voz y música; elige el estilo visual según el tema (**cuerpo** para medicina/biología, **historia** para relatos y personajes, **técnico** para tecnología/física).
3. Aprueba el guion y el storyboard.
4. Recibe `out/<video>.mp4`, `out/<video>/portada.png` y `out/<video>/descripcion.txt`.

También puedes trabajar a mano:

```bash
npm run nuevo -- mi-video --estilo=cuerpo     # andamiaje
npm run voz -- mi-video                       # voz + subtítulos
npm run musica -- mi-video --para mi-video    # música a medida (GPU)
npm run stills -- mi-video                    # fotogramas de revisión
npm run qa -- mi-video                        # QA automático de solapes
npm run render -- mi-video                    # MP4 masterizado + portada + descripción
npm run video -- mi-video                     # todo lo anterior (se detiene si el QA falla)
npm run dev                                   # Remotion Studio
```

Reglas de estilo, kit de componentes y flujo completo: [`CLAUDE.md`](CLAUDE.md). Guía que dio origen al proyecto: `Guía videos virales con IA…md`.

## Qué incluye

- **Kit visual** (`src/kit/`): cámara continua, personajes caricatura con expresiones, cuartos 2.5D, ventanas de corte anatómicas, señales que viajan, etiquetas, pastillas de dato, paleta de colores reales.
- **3 registros visuales** según el tema: técnico, cuerpo e historia.
- **Voz**: Edge TTS (gratis) por defecto; Qwen3-TTS y Kokoro locales; ElevenLabs integrado (de pago).
- **Sonido**: efectos sintetizados propios, música original con ACE-Step con atenuación automática bajo la voz, masterización a -14 LUFS.
- **QA automático**: validación de guiones y revisor de solapes cuadro a cuadro (nada tapa caras, pastillas ni arte clave; nada se sale de pantalla).

## Licencias y avisos

- Código de este repositorio: [MIT](LICENSE).
- [Remotion](https://www.remotion.dev/docs/license): gratis para personas y empresas de hasta 3 personas; si no, requiere licencia.
- Voces de **Edge TTS**: servicio de Microsoft sin licencia comercial explícita. Para monetizar usa ElevenLabs (plan Starter o superior) o un motor local (Qwen3-TTS / Kokoro, Apache 2.0).
- Música generada con [ACE-Step 1.5](https://github.com/ace-step/ACE-Step) (código MIT). Efectos: síntesis propia.
- Declara en tus publicaciones que la voz y las animaciones se hicieron con IA, y cita tus fuentes.
