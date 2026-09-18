# Tri-Quest media checklist

Media for the Audio-Visual round. Save each file with **exactly** this name and path. When they're all in place, `npm run check:event` passes.

Good free sources: **Wikimedia Commons** (check each file's licence), **Unsplash** / **Pexels** (photos and video), **Pixabay** / **Freesound** (sounds). Use your own photos where you can, for example of Patan Durbar Square.

## Images: `public/media/images/`

| File | What to find | Reveal | Tips |
|---|---|---|---|
| `av-boudhanath.jpg` | Boudhanath Stupa, the classic front view with the eyes | blur → clear | Landscape, well lit |
| `av-patan-durbar.jpg` | Patan Durbar Square | starts zoomed in 4× at the centre | Keep the telltale temples **off-centre**, so the zoomed-in start doesn't give it away |
| `av-einstein.jpg` | Portrait of Albert Einstein | none | A public-domain 1921 portrait is on Wikimedia |
| `av-eiffel-tower.jpg` | Eiffel Tower | starts zoomed in 4× | Use a **daytime** photo (photos of the night lighting are copyrighted). A close-up of the iron lattice at the centre is ideal |
| `av-marie-curie.jpg` | Portrait of Marie Curie | blur → clear | Public-domain portraits are on Wikimedia |
| `av-resistor.jpg` | A single resistor with visible colour bands | starts zoomed in 4× | A plain background works best |
| `av-flag-bhutan.png` | Flag of Bhutan | blur → clear | The SVG/PNG on Wikimedia is public domain |
| `av-red-blood-cells.jpg` | Red blood cells under a light microscope | none | Look for the classic disc shape with a pale centre |

## Audio: `public/media/audio/`

Keep clips to **5–15 seconds**. Trim any silence at the start, because `P` starts playback instantly.

| File | What to find |
|---|---|
| `av-heartbeat.mp3` | A heartbeat heard through a stethoscope (lub-dub) |
| `av-dolphin.mp3` | Dolphin clicks and whistles |
| `av-sarangi.mp3` | Nepali sarangi solo, no singing (so the lyrics don't give it away) |
| `av-dial-up.mp3` | A dial-up modem connecting, from the handshake screech onwards |

## Video: `public/media/video/`

| File | What to find |
|---|---|
| `av-newtons-cradle.mp4` | Newton's cradle clacking, 5–10 s, no text overlay, MP4 (H.264) |

## Notes
- **Sizes:** images around 1920 px wide are plenty. Keep videos under about 20 MB so they load instantly.
- **Clip windows:** to play only part of an audio or video file, add `"start"` and `"end"` (in seconds) to the question's `media` in `questions.json`.
- **Before the event:** run `npm run check:event`. It fails if any file is missing. Then do a full run-through: a missing file shows a big orange "Missing media" box on screen.
