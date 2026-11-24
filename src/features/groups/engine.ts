import { drawRound, seededRandom } from '@/data/draw'
import type { Category, GroupRules, Question, Round } from '@/data/schema'
import type { LoadedSession } from '@/data/source'
import { correctOptionIndex } from '@/features/presenter/deck'

/**
 * The groups format: teams take turns, keep score and play rounds with different rules.
 *
 * Everything on screen is derived from two things: the deck (built from the session and a seed)
 * and, for each question, the list of actions the host took on it. That makes undo trivial
 * (drop the last action) and a reload lossless.
 */

/** Questions with this tag are held back and only played if the groups are level at the end. */
export const TIEBREAK_TAG = 'tiebreak'

export type QuestionSlide = {
  kind: 'question'
  question: Question
  round: Round
  rules: GroupRules
  roundIndex: number
  category?: Category
  /** Position within the round (tie-breakers count on after the main questions). */
  indexInRound: number
  /** The group that is asked first (an index into the session's groups). */
  opener: number
  tiebreak: boolean
  /** Clock for the first group; each pass takes `rules.hopSeconds` off. */
  seconds: number
  /** Rapid fire: first question of a group's block. */
  blockStart: boolean
  /** "Question n of m", counted for the opening group in rapid fire. */
  n: number
  of: number
}

export type GroupSlide =
  | { kind: 'welcome' }
  | { kind: 'round'; round: Round; rules: GroupRules; roundIndex: number; category?: Category; count: number }
  | QuestionSlide
  | { kind: 'standings'; afterRound: number }
  | { kind: 'finale' }

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const RANK = { easy: 0, medium: 1, hard: 2 } as const

/**
 * Turn-by-turn rounds: the questions rise in difficulty, but are dealt in sets of one per group
 * (shuffled inside each set), so every group gets a question of the same level on each lap.
 */
function rampInSets<Q extends { difficulty: keyof typeof RANK }>(drawn: Q[], size: number, rng: () => number): Q[] {
  const sorted = [...drawn].sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty])
  const out: Q[] = []
  for (let i = 0; i < sorted.length; i += size) out.push(...shuffle(sorted.slice(i, i + size), rng))
  return out
}

/** Rapid-fire rounds: every block gets the same mix of difficulty, shuffled inside the block. */
function dealBlocks<Q extends { difficulty: keyof typeof RANK }>(drawn: Q[], block: number, rng: () => number): Q[] {
  const sorted = [...drawn].sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty])
  const blocks: Q[][] = Array.from({ length: Math.ceil(sorted.length / block) }, () => [])
  sorted.forEach((q, i) => blocks[i % blocks.length].push(q))
  return blocks.flatMap((b) => shuffle(b, rng))
}

export function buildGroupDeck(loaded: LoadedSession, seed: number): GroupSlide[] {
  const { session, bank, questionsById } = loaded
  const groups = session.groups.length
  const categories = new Map(bank.categories.map((c) => [c.id, c]))
  const rng = seededRandom(seed)
  const slides: GroupSlide[] = [{ kind: 'welcome' }]

  session.rounds.forEach((round, roundIndex) => {
    const rules = round.play!
    const pool = round.questionIds.map((id) => questionsById.get(id)!)
    const held = pool.filter((q) => q.tags.includes(TIEBREAK_TAG))
    const main = pool.filter((q) => !q.tags.includes(TIEBREAK_TAG))
    const drawn = drawRound(main, { pick: round.pick, keep: round.keep }, rng)
    const ordered = rules.mode === 'rapid' ? dealBlocks(drawn, rules.block, rng) : rampInSets(drawn, groups, rng)
    const ties = shuffle(held, rng).slice(0, rules.tiebreakers)
    const seconds = round.timerSeconds ?? session.defaults.timerSeconds
    const category = round.category ? categories.get(round.category) : undefined

    const openerOf = (i: number) =>
      rules.mode === 'rapid' && i < ordered.length ? Math.floor(i / rules.block) % groups : i % groups
    const all = [...ordered, ...ties]
    slides.push({
      kind: 'round',
      round: { ...round, questionIds: ordered.map((q) => q.id) },
      rules,
      roundIndex,
      category,
      count: ordered.length,
    })
    all.forEach((question, i) => {
      const tiebreak = i >= ordered.length
      const opener = openerOf(i)
      const sameOpener = (j: number) => j < ordered.length && openerOf(j) === opener
      const mine = rules.mode === 'rapid' && !tiebreak
      slides.push({
        kind: 'question',
        question,
        round,
        rules,
        roundIndex,
        category: categories.get(question.category),
        indexInRound: i,
        opener,
        tiebreak,
        seconds,
        blockStart: mine && i % rules.block === 0,
        n: tiebreak ? i - ordered.length + 1 : mine ? ordered.slice(0, i + 1).filter((_, j) => sameOpener(j)).length : i + 1,
        of: tiebreak ? ties.length : mine ? ordered.filter((_, j) => sameOpener(j)).length : ordered.length,
      })
    })
    if (roundIndex < session.rounds.length - 1) slides.push({ kind: 'standings', afterRound: roundIndex })
  })

  slides.push({ kind: 'finale' })
  return slides
}

/** What the host did on one question. Option indexes refer to the question's own option order. */
export type Action =
  | { t: 'pick'; k: number }
  | { t: 'timeout' }
  | { t: 'show' }
  | { t: 'fifty'; g: number; hide: number[] }
  | { t: 'hint'; g: number }

export interface PlayView {
  /** How many times the question has been passed on. */
  hop: number
  /** The group now answering (an index into the session's groups). */
  holder: number
  status: 'open' | 'won' | 'missed' | 'shown'
  winner: number | null
  /** What a correct answer is worth right now (or was worth when it was won). */
  value: number
  /** Options a group already tried and got wrong, with who tried them. */
  tried: { k: number; g: number }[]
  /** Groups that missed (by wrong answer or running out of time), in order. */
  missed: { g: number; k: number | null }[]
  /** Options a 50:50 has taken away. */
  hidden: number[]
  hintOn: boolean
  /** Score changes this question caused. */
  deltas: { g: number; delta: number }[]
}

/** A turn-by-turn question can be passed until every group has had it. */
export const canPass = (rules: GroupRules, hop: number, groups: number) => rules.mode === 'turns' && hop < groups - 1

/** Seconds on the clock for the group holding the question after `hop` passes. */
export const clockFor = (slide: QuestionSlide, hop: number) => Math.max(10, slide.seconds - slide.rules.hopSeconds * hop)

export function derivePlay(slide: QuestionSlide, groups: number, actions: Action[]): PlayView {
  const { rules, opener, question } = slide
  const right = correctOptionIndex(question)
  const v: PlayView = {
    hop: 0,
    holder: opener % groups,
    status: 'open',
    winner: null,
    value: rules.points,
    tried: [],
    missed: [],
    hidden: [],
    hintOn: false,
    deltas: [],
  }
  const pass = () => {
    v.hop++
    v.holder = (opener + v.hop) % groups
    v.value = rules.passPoints
  }
  for (const a of actions) {
    if (v.status !== 'open') break
    if (a.t === 'fifty') v.hidden = a.hide
    else if (a.t === 'hint') v.hintOn = true
    else if (a.t === 'show') v.status = 'shown'
    else if (a.t === 'timeout') {
      v.missed.push({ g: v.holder, k: null })
      if (canPass(rules, v.hop, groups)) pass()
      else v.status = 'missed'
    } else if (a.k === right) {
      v.status = 'won'
      v.winner = v.holder
      v.deltas.push({ g: v.holder, delta: v.value })
    } else {
      if (rules.penalty) v.deltas.push({ g: v.holder, delta: -rules.penalty })
      v.tried.push({ k: a.k, g: v.holder })
      v.missed.push({ g: v.holder, k: a.k })
      if (canPass(rules, v.hop, groups)) pass()
      else v.status = 'missed'
    }
  }
  return v
}

export type Plays = Record<number, Action[]>

export function scoresOf(deck: GroupSlide[], plays: Plays, groups: number): number[] {
  const scores = Array<number>(groups).fill(0)
  deck.forEach((slide, i) => {
    if (slide.kind !== 'question' || !plays[i]?.length) return
    for (const { g, delta } of derivePlay(slide, groups, plays[i]).deltas) scores[g] += delta
  })
  return scores
}

/** Points each group earned in one round (for the standings between rounds). */
export function roundScores(deck: GroupSlide[], plays: Plays, groups: number, roundIndex: number): number[] {
  const only = deck.map((s) => (s.kind === 'question' && s.roundIndex === roundIndex ? s : { kind: 'welcome' as const }))
  return scoresOf(only, plays, groups)
}

export const topScore = (scores: number[]) => Math.max(...scores)
export const tiedForFirst = (scores: number[]) => scores.filter((s) => s === topScore(scores)).length > 1

/** Ranks with ties sharing a place: [3, 3, 1] scores → places [1, 1, 3]. */
export function placesOf(scores: number[]): number[] {
  return scores.map((s) => 1 + scores.filter((o) => o > s).length)
}

/** Which one-time lifelines a group has used in a round. */
export function lifelinesUsed(deck: GroupSlide[], plays: Plays, roundIndex: number, g: number) {
  const used = { fifty: false, hint: false }
  deck.forEach((s, i) => {
    if (s.kind !== 'question' || s.roundIndex !== roundIndex) return
    for (const a of plays[i] ?? []) {
      if (a.t === 'fifty' && a.g === g) used.fifty = true
      if (a.t === 'hint' && a.g === g) used.hint = true
    }
  })
  return used
}

const isHeldBack = (s: GroupSlide | undefined, plays: Plays, i: number) =>
  s?.kind === 'question' && s.tiebreak && !plays[i]?.length

/**
 * The slide after `from`. Tie-breakers are only played while the groups are level for first
 * place, so they are skipped once someone is ahead.
 */
export function nextIndex(deck: GroupSlide[], from: number, scores: number[]): number {
  let j = Math.min(from + 1, deck.length - 1)
  while (j < deck.length - 1) {
    const s = deck[j]
    if (!(s.kind === 'question' && s.tiebreak && !tiedForFirst(scores))) break
    j++
  }
  return j
}

/** The slide before `from`, skipping tie-breakers that were never asked. */
export function prevIndex(deck: GroupSlide[], from: number, plays: Plays): number {
  let j = Math.max(from - 1, 0)
  while (j > 0 && isHeldBack(deck[j], plays, j)) j--
  return j
}

export function roundIntroIndex(deck: GroupSlide[], roundIndex: number): number {
  return deck.findIndex((s) => s.kind === 'round' && s.roundIndex === roundIndex)
}
