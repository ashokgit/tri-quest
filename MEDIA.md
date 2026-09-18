# Tri-Quest media checklist

✅ **All 13 files are in place** (sourced from Wikimedia Commons; authors and licences are in [CREDITS.md](CREDITS.md)). `npm run check:event` passes.
⚠️ **Listen to `av-sarangi.mp3` before the event**: the source video is a Gandharva musician who may also sing, and it was clipped without listening.

To replace any file, keep **exactly** this name and path, update CREDITS.md, and re-run `npm run check:event`.

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
- **Zoom puzzles:** for `"reveal": "zoom"` images, `"zoom"` sets how far in the opening close-up is (default 4) and `"focus": [x, y]` the point it zooms into, in percent of the frame. Check the result on the slide check page with **Opening state**.
- **Before the event:** run `npm run check:event`. It fails if any file is missing. Then do a full run-through: a missing file shows a big orange "Missing media" box on screen.
