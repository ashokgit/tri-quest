# Quizzeria

A reusable quiz platform for NIET events and classes. The first session is **Tri-Quest**, the quiz for NIET Orientation 2026.

For now it's frontend only: questions and sessions are static JSON files in `public/data`. Supabase will replace them later, and only `src/data/source.ts` will need to change.

## Commands

```bash
npm install
npm run dev        # local dev server at http://localhost:5173
npm run validate   # check question/session JSON and ids (missing media = warning)
npm run check:event  # same, but missing media files are errors: run before the event
npm run build      # validate + typecheck + production build into dist/
npm run preview    # serve dist/ locally (use this on event day, fully offline)
```

## Layout

```
public/
  data/questions.json          question bank (categories + questions)
  data/sessions/index.json     list of sessions shown on the home page
  data/sessions/<id>.json      a session: rounds → question ids, timers
  media/{images,audio,video,brand}/
src/
  app/                         routing, home page, shared screens
  data/schema.ts               Zod schemas = the data contract
  data/source.ts               data access layer (JSON today, Supabase later)
  features/presenter/          presenter mode (projector screen)
  styles/index.css             Tailwind + NIET brand tokens
scripts/validate-data.ts       pre-build data checks
```

## Random draws (show 60 of 100)

A round can show a random subset of its pool:

```json
{ "id": "r1-science", "title": "Science Warm-up", "pick": 12, "questionIds": ["…20 ids…"] }
```

- **Balanced:** the draw keeps the pool's easy/medium/hard mix and orders each round easy → hard.
- **Stable:** the draw comes from the session's `seed` (the "draw number"), so the same seed always shows the same questions, on every device, after every reload.
- **Reshuffle:** the home page's **Reshuffle** button draws a new set in *this browser* and restarts the show. To make it the draw everywhere, copy its number into `"seed"` in the session file.
- **Review:** `#/review/<session>` is a printable host cheat sheet of the current draw, with answers, media and "verify" flags.

## Question types

| `type` | Fields | Notes |
|---|---|---|
| `mcq` | `options[]`, `answerIndex` | 2–4 options (game-show 2×2 layout) |
| `truefalse` | `answer: boolean` | |
| `open` | `answer: string` | no options, answer shown on reveal |

Every question can also have `showcase` (big text on the stage, e.g. an emoji puzzle), `media` (`image` with `reveal: blur \| zoom`, `audio`, or `video` with an optional `start`/`end`), an `explanation`, and `verify: true` for facts that still need checking.

## Sound effects

Sounds are generated in the browser (Web Audio), so they work offline without any audio files. The first key press or click turns sound on, because browsers block audio until then. `M` mutes.

To replace any sound with your own recording, put the files in `public/media/sfx/` and create `public/media/sfx/sfx.json` mapping each cue to a file. `sfx.example.json` is a starting point. You don't have to list every cue; anything left out keeps its built-in sound. `npm run validate` checks that every listed file exists.

| Cue | When it plays |
|---|---|
| `roundIntro` | Round title card appears |
| `optionIn` | Each answer bar slides in |
| `bed` | **Loops** while the clock runs (question tension music); fades out on lock-in, reveal or time-up |
| `tick` | Each of the last 5 seconds |
| `timeUp` | Clock hits zero ("Hands up!") |
| `lock` | Host locks in an answer with A–D ("final answer") |
| `correct` | Reveal when the answer is right (or nothing was locked) |
| `wrong` | Reveal when the locked answer was wrong |
| `reveal` | Answer shown for an open question |
| `finale` | Closing slide (with confetti) |

Sounds play only when moving forward, so stepping back to re-read a question stays quiet.
