# Quizzeria

A reusable quiz platform for NIET events and classes. The first session is **Tri-Quest**, the quiz for NIET Orientation 2026.

For now it's frontend only: questions and sessions are static JSON files in `public/data`. Supabase will replace them later, and only `src/data/source.ts` will need to change.

## Commands

```bash
npm install
npm run dev        # local dev server at http://localhost:5173
npm run validate   # check question/session JSON, ids and media files
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

## Question types

| `type` | Fields | Notes |
|---|---|---|
| `mcq` | `options[]`, `answerIndex` | 2–6 options |
| `truefalse` | `answer: boolean` | |
| `open` | `answer: string` | no options, answer shown on reveal |

Every question can also have `media` (`image` with `reveal: blur \| zoom`, `audio`, or `video` with an optional `start`/`end`), an `explanation`, and `verify: true` for facts that still need checking.
