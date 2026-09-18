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

export function buildDeck({ session, bank, questionsById }: LoadedSession): Slide[] {
  const categories = new Map(bank.categories.map((c) => [c.id, c]))
  const slides: Slide[] = [{ kind: 'welcome' }]

  session.rounds.forEach((round, roundIndex) => {
    const roundCategory = round.category ? categories.get(round.category) : undefined
    slides.push({ kind: 'round', round, roundIndex, category: roundCategory })
    round.questionIds.forEach((qid, indexInRound) => {
      const question = questionsById.get(qid)!
      slides.push({
        kind: 'question',
        question,
        round,
        roundIndex,
        indexInRound,
        category: categories.get(question.category),
        timerSeconds: round.timerSeconds ?? session.defaults.timerSeconds,
      })
    })
  })

  slides.push({ kind: 'finale' })
  return slides
}

function hasImageClues(q: Question) {
  return q.media?.kind === 'image' && q.media.reveal !== 'none'
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
  if (kind === 'prompt') return 1
  if (kind === 'clue') return 1 - stages.slice(0, stage + 1).filter((s) => s === 'clue').length / (IMAGE_CLUE_STEPS + 1)
  return 0
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
