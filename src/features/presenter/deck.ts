import { drawRound, seededRandom } from '@/data/draw'
import type { LoadedSession } from '@/data/source'
import type { Category, Question, Round } from '@/data/schema'

/**
 * A session is flattened into a linear deck of slides. Each slide has one or
 * more stages the host steps through with the keyboard — e.g. a question goes
 * prompt → (image clues) → options → answer.
 */
export type Slide =
  | { kind: 'welcome' }
  | { kind: 'round'; round: Round; roundIndex: number; category?: Category }
  | {
      kind: 'question'
      question: Question
      round: Round
      roundIndex: number
      indexInRound: number
      category?: Category
      timerSeconds: number
    }
  | { kind: 'finale' }

export type Stage = 'main' | 'prompt' | 'clue' | 'options' | 'answer'

export interface Position {
  slide: number
  stage: number
}

/** Number of extra "clue" steps for a progressively revealed image. */
export const IMAGE_CLUE_STEPS = 2

/** How rounds are arranged: the session's category rounds, or a difficulty ladder built from the same draw. */
export type RoundOrder = 'category' | 'difficulty'

/** A round with its question pool resolved to the questions actually shown. */
export interface DrawnRound {
  round: Round
  category?: Category
  questions: Question[]
  /** Countdown per question (from the question's own category round). */
  timers: number[]
}

/**
 * Resolves each round's draw. Rounds with `pick`/`shuffle` get a seeded random,
 * difficulty-balanced selection; the same seed always gives the same questions.
 * In "difficulty" order the same questions are regrouped into a rising ladder.
 */
export function drawSession(loaded: LoadedSession, seed: number, order: RoundOrder = 'category'): DrawnRound[] {
  const { session, bank, questionsById } = loaded
  const categories = new Map(bank.categories.map((c) => [c.id, c]))
  const rng = seededRandom(seed)
  const byCategory: DrawnRound[] = session.rounds.map((round) => {
    const pool = round.questionIds.map((qid) => questionsById.get(qid)!)
    const questions = drawRound(pool, round, rng)
    const timer = round.timerSeconds ?? session.defaults.timerSeconds
    return {
      // Consumers read round.questionIds for counts, so it reflects the draw.
      round: { ...round, questionIds: questions.map((q) => q.id) },
      category: round.category ? categories.get(round.category) : undefined,
      questions,
      timers: questions.map(() => timer),
    }
  })
  return order === 'difficulty' ? difficultyLadder(byCategory, session.levelTitles) : byCategory
}

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const
const DIFFICULTY_ICON = { easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' } as const
/** Easiest formats first within a level: a coin-flip, then four options, then no options at all. */
const TYPE_EASE = { truefalse: 0, mcq: 1, open: 2 } as const
const DEFAULT_LEVEL_TITLES = ['Warm-up', 'Easy Does It', 'Getting Going', 'Picking Up', 'Halfway Hero', 'Heating Up', 'Brain Burner', 'Final Challenge']
/** Target questions per ladder level. */
const LEVEL_SIZE = 8

/**
 * Regroups drawn questions into levels of rising difficulty: all the easy ones
 * first (split into a few levels), then medium, then hard. Categories are dealt
 * round-robin so every level is a mix.
 */
function difficultyLadder(rounds: DrawnRound[], titles = DEFAULT_LEVEL_TITLES): DrawnRound[] {
  const entries = rounds.flatMap((r) => r.questions.map((q, i) => ({ q, timer: r.timers[i], cat: r.round.id })))
  const levels: { difficulty: keyof typeof DIFFICULTY_LABEL; items: typeof entries }[] = []

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    // Deal round-robin across categories so each level mixes subjects.
    const byCat = new Map<string, typeof entries>()
    for (const e of entries.filter((e) => e.q.difficulty === difficulty)) byCat.set(e.cat, [...(byCat.get(e.cat) ?? []), e])
    const queues = [...byCat.values()]
    const dealt: typeof entries = []
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) dealt.push(q.shift()!)
    if (!dealt.length) continue

    // Split evenly into levels of about LEVEL_SIZE. Hard questions always get at least
    // two levels, so the show ends on a short, punchy Final Challenge.
    const minLevels = difficulty === 'hard' && dealt.length >= 6 ? 2 : 1
    const count = Math.max(minLevels, Math.round(dealt.length / LEVEL_SIZE))
    for (let i = 0; i < count; i++) {
      const items = dealt.slice(Math.floor((i * dealt.length) / count), Math.floor(((i + 1) * dealt.length) / count))
      levels.push({ difficulty, items: items.sort((a, b) => TYPE_EASE[a.q.type] - TYPE_EASE[b.q.type]) })
    }
  }

  return levels.map(({ difficulty, items }, i) => {
    // The top rung always gets the last title ("Final Challenge"), however many levels there are.
    const last = i === levels.length - 1 && titles.length > 1
    const title = (last ? titles.at(-1) : i < titles.length - 1 ? titles[i] : undefined) ?? `Level ${i + 1}`
    return {
      round: {
        id: `level-${i + 1}`,
        title,
        subtitle: `${items.length} questions · ${DIFFICULTY_LABEL[difficulty]}`,
        questionIds: items.map((e) => e.q.id),
        shuffle: false,
        keep: [],
      },
      category: { id: `level-${difficulty}`, name: DIFFICULTY_LABEL[difficulty], icon: DIFFICULTY_ICON[difficulty] },
      questions: items.map((e) => e.q),
      timers: items.map((e) => e.timer),
    }
  })
}

export function buildDeck(loaded: LoadedSession, seed: number, order: RoundOrder = 'category'): Slide[] {
  const categories = new Map(loaded.bank.categories.map((c) => [c.id, c]))
  const slides: Slide[] = [{ kind: 'welcome' }]

  drawSession(loaded, seed, order).forEach(({ round, category, questions, timers }, roundIndex) => {
    slides.push({ kind: 'round', round, roundIndex, category })
    questions.forEach((question, indexInRound) => {
      slides.push({
        kind: 'question',
        question,
        round,
        roundIndex,
        indexInRound,
        category: categories.get(question.category),
        timerSeconds: timers[indexInRound],
      })
    })
  })

  slides.push({ kind: 'finale' })
  return slides
}

/** Blur and zoom images clear in steps; a `peek` image stays cropped until the answer. */
function hasImageClues(q: Question) {
  return q.media?.kind === 'image' && (q.media.reveal === 'blur' || q.media.reveal === 'zoom')
}

export function stagesFor(slide: Slide): Stage[] {
  if (slide.kind !== 'question') return ['main']
  const q = slide.question
  const stages: Stage[] = ['prompt']
  if (hasImageClues(q)) for (let i = 0; i < IMAGE_CLUE_STEPS; i++) stages.push('clue')
  if (q.type !== 'open') stages.push('options')
  stages.push('answer')
  return stages
}

/** Audio, video and YouTube questions: the clock waits for the host to play the clip (P). */
export function hasClip(q: Question) {
  return q.media?.kind === 'audio' || q.media?.kind === 'video' || q.media?.kind === 'youtube'
}

/** Stage index at which the countdown starts: when options appear, or straight away for open questions. */
export function timerStageIndex(slide: Slide): number {
  const stages = stagesFor(slide)
  const i = stages.indexOf('options')
  return i === -1 ? 0 : i
}

/**
 * How obscured a clue image is at a given stage: 1 = fully hidden-ish, 0 = clear.
 * Clears one notch per clue step and is fully clear once options or the answer show.
 */
export function imageObscurity(slide: Slide, stage: number): number {
  const stages = stagesFor(slide)
  const kind = stages[stage]
  if (slide.kind === 'question' && slide.question.media?.kind === 'image' && slide.question.media.reveal === 'peek') return kind === 'answer' ? 0 : 1
  if (kind === 'prompt') return 1
  if (kind === 'clue') return 1 - stages.slice(0, stage + 1).filter((s) => s === 'clue').length / (IMAGE_CLUE_STEPS + 1)
  return 0
}

/** Answer labels shown as tiles (null for open questions). */
export function optionLabels(q: Question): string[] | null {
  if (q.type === 'mcq') return q.options
  if (q.type === 'truefalse') return ['True', 'False']
  return null
}

/** Index of the correct tile, or -1 for open questions. */
export function correctOptionIndex(q: Question): number {
  if (q.type === 'mcq') return q.answerIndex
  if (q.type === 'truefalse') return q.answer ? 0 : 1
  return -1
}

export function clampPosition(deck: Slide[], pos: Position): Position {
  const slide = Math.min(Math.max(pos.slide, 0), deck.length - 1)
  const stage = Math.min(Math.max(pos.stage, 0), stagesFor(deck[slide]).length - 1)
  return { slide, stage }
}

/** Next step: advance the stage, or move to the first stage of the next slide. */
export function stepForward(deck: Slide[], pos: Position): Position {
  if (pos.stage < stagesFor(deck[pos.slide]).length - 1) return { slide: pos.slide, stage: pos.stage + 1 }
  return clampPosition(deck, { slide: pos.slide + 1, stage: 0 })
}

/** Previous step: go back a stage, or to the last stage of the previous slide. */
export function stepBack(deck: Slide[], pos: Position): Position {
  if (pos.stage > 0) return { slide: pos.slide, stage: pos.stage - 1 }
  if (pos.slide === 0) return pos
  return { slide: pos.slide - 1, stage: stagesFor(deck[pos.slide - 1]).length - 1 }
}

/** Jump straight to the answer of the current question (no-op elsewhere). */
export function revealAnswer(deck: Slide[], pos: Position): Position {
  const stages = stagesFor(deck[pos.slide])
  const answer = stages.indexOf('answer')
  return answer === -1 ? pos : { slide: pos.slide, stage: answer }
}

/** Skip to the next slide (e.g. drop a question that isn't landing). */
export function nextSlide(deck: Slide[], pos: Position): Position {
  return clampPosition(deck, { slide: pos.slide + 1, stage: 0 })
}

export function roundIntroIndex(deck: Slide[], roundIndex: number): number {
  return deck.findIndex((s) => s.kind === 'round' && s.roundIndex === roundIndex)
}
