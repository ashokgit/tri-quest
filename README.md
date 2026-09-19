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

## Prep pages

| Page | Route | What it's for |
|---|---|---|
| Review | `#/review/<session>` | Host cheat sheet of the current draw, with answers (printable) |
| Slide check | `#/slides/<session>` | Every question in the pools at its fullest state, measured for overflow |
| Verification sheet | `#/verify` | Printable sign-off sheet of all questions flagged `verify` |
| Sound check | `#/sounds` | Audition every sound and set the hall volume |

On event day, follow [RUNBOOK.md](RUNBOOK.md).

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

## Round order: by category or by difficulty

The same drawn questions can be shown two ways. Pick one on the home page (**Order** toggle), or set `"order"` in the session file:

- **By category** (`"category"`): the session's rounds as written (Science, NIET, Audio-Visual, …).
- **By difficulty** (`"difficulty"`): a Millionaire-style ladder. All easy questions come first, split into a few levels, then medium, then hard, ending on the **Final Challenge**. Subjects are mixed inside each level, which runs true/false → multiple choice → open answer. Level names default to *Warm-up … Final Challenge*; override them with `"levelTitles"`.

Each question keeps its own timer (e.g. 30s for Audio-Visual) in either order.

## Question types

| `type` | Fields | Notes |
|---|---|---|
| `mcq` | `options[]`, `answerIndex` | 2–4 options (game-show 2×2 layout) |
| `truefalse` | `answer: boolean` | |
| `open` | `answer: string` | no options, answer shown on reveal |

Every question can also have `showcase` (big text on the stage, e.g. an emoji puzzle), `media` (`image` with `reveal: blur \| zoom \| peek`, where `peek` shows only the top `peek`% (default 30) until the answer, `youtube` with an `id`, `start`/`end`, `muted` (silent for the question, replayed with sound on the reveal) and an optional `peek`/`peekFrom` strip (needs internet on the day), `audio`, or `video` with an optional `start`/`end`), an `explanation`, and `verify: true` for facts that still need checking.

## Sound effects

All sounds are original and generated live in the browser (Web Audio: synthesised brass, timpani, bells, cymbals and a hall reverb), so they work offline without any audio files. The first key press or click turns sound on, because browsers block audio until then. `M` mutes.

**Sound check:** open `#/sounds` (the "🔊 Sound check" link on the home page) to audition every cue on the hall speakers and set the master volume. The volume is saved for the show.

To replace any sound with your own recording, put the file in `public/media/sfx/` and map the cue to it in `public/media/sfx/sfx.json`. `sfx.example.json` is a starting point. Cues you leave out keep their built-in sound. `npm run validate` checks the listed files exist.

| Cue | When it plays |
|---|---|
| `lobby` | **Loops** on the welcome screen: an opening fanfare, then faint music the host can talk over. Starts on the Present click; press **I** to replay the fanfare. A file override just loops |
| `theme` | Leaving the welcome screen (opening theme) |
| `roundIntro` | Each later round's title card |
| `questionIn` | Each new question lands (its options follow on their own 1.5 s later) |
| `optionIn` | Each answer bar slides in (A/C panned left, B/D right) |
| `bed` | **Loops** while the clock runs, building up as time runs out; stops on lock-in, reveal or time-up. Off for audio/video questions |
| `tick` | Each of the last 5 seconds, rising in pitch |
| `timeUp` | Clock hits zero ("Hands up!") |
| `lock` | Host locks in an answer with A–D ("final answer") |
| `suspense` | **Loops** from lock-in until the reveal |
| `correct` | Reveal when the answer is right (or nothing was locked) |
| `wrong` | Reveal when the locked answer was wrong |
| `reveal` | Answer shown for an open question |
| `finale` | Closing slide (with confetti) |

Sounds play only when moving forward, so stepping back to re-read a question stays quiet.
