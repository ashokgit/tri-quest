import confetti from 'canvas-confetti'
import { sfx } from '@/features/audio/sfx'
import { correctOptionIndex, optionLabels } from '@/features/presenter/deck'
import { usePresenterStore } from '@/features/presenter/store'
import { groupColor } from './colors'
import {
  derivePlay,
  lifelinesUsed,
  nextIndex,
  prevIndex,
  scoresOf,
  type GroupSlide,
  type PlayView,
  type QuestionSlide,
} from './engine'
import { useGroupStore } from './store'

/**
 * Everything the host can do, as plain functions over the stores. Keys, buttons and timers all call
 * these, so the rules live in one place. `Ctx` is what they need to know about the running contest.
 */
export interface Ctx {
  sessionId: string
  deck: GroupSlide[]
  /** Names of the groups, in order. */
  names: string[]
}

/** Identifies one group's go at one question, so a pass restarts the clock. */
export const turnKey = (slide: number, hop: number) => slide * 10 + hop

/** How long the call-outs stay up, in ms. */
const FLASH_MS = 1700

const snapshot = ({ sessionId, deck, names }: Ctx) => {
  const game = useGroupStore.getState().games[sessionId] ?? { pos: 0, opts: false, plays: {} }
  const slide = deck[Math.min(game.pos, deck.length - 1)]
  const question = slide.kind === 'question' ? slide : null
  const view = question ? derivePlay(question, names.length, game.plays[game.pos] ?? []) : null
  return { game, slide, question, view, scores: scoresOf(deck, game.plays, names.length) }
}

const flashActive = () => (useGroupStore.getState().flash?.until ?? 0) > Date.now()

let flashId = 0
function flash(kind: 'wrong' | 'timeup' | 'pass' | 'block' | 'right', title: string, sub?: string, k?: number) {
  const f = { id: ++flashId, kind, title, sub, k, until: Date.now() + FLASH_MS }
  useGroupStore.getState().setFlash(f)
  // Clear it (and so release the clock) when it is over, unless another call-out took its place.
  window.setTimeout(() => {
    if (useGroupStore.getState().flash?.id === f.id) useGroupStore.getState().setFlash(null)
  }, FLASH_MS)
}
export const flashBlock = (title: string, sub?: string) => flash('block', title, sub)

function celebrate(points: number, color: string) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const count = Math.min(220, 40 + points * 9)
  const colors = [color, '#f5c542', '#ffffff', '#22c55e']
  confetti({ particleCount: count, spread: 80, startVelocity: 48, origin: { x: 0.2, y: 0.55 }, colors, angle: 60 })
  confetti({ particleCount: count, spread: 80, startVelocity: 48, origin: { x: 0.8, y: 0.55 }, colors, angle: 120 })
}

const passNote = (ctx: Ctx, q: QuestionSlide, view: PlayView) =>
  `Passed to Group ${ctx.names[view.holder]} · ${view.value} point${view.value === 1 ? '' : 's'}${q.rules.hopSeconds ? ` · ${Math.max(10, q.seconds - q.rules.hopSeconds * view.hop)} seconds` : ''}`

/** The group's answer is final: score it, then hand the question on or close it. */
export function pick(ctx: Ctx, k: number) {
  const { question, view, game } = snapshot(ctx)
  if (!question || view?.status !== 'open' || flashActive()) return
  const wasHolder = view.holder
  usePresenterStore.getState().clearLock()
  useGroupStore.getState().act(ctx.sessionId, game.pos, { t: 'pick', k })
  const after = snapshot(ctx).view!
  if (after.status === 'won') {
    sfx.play('correct')
    celebrate(after.value, groupColor(wasHolder))
  } else {
    sfx.play('wrong')
    const lost = question.rules.penalty ? ` · Group ${ctx.names[wasHolder]} −${question.rules.penalty}` : ''
    flash('wrong', '✗ Wrong', after.status === 'open' ? passNote(ctx, question, after) + lost : `Nobody scores${lost}`, k)
  }
}

/** Time ran out on the group holding the question. `natural`: the clock hit zero (its own buzzer has sounded). */
export function timeout(ctx: Ctx, natural = false) {
  const { question, view, game } = snapshot(ctx)
  if (!question || view?.status !== 'open') return
  usePresenterStore.getState().clearLock()
  useGroupStore.getState().act(ctx.sessionId, game.pos, { t: 'timeout' })
  const after = snapshot(ctx).view!
  if (!natural) sfx.play('timeUp')
  flash('timeup', '⏱ Time up', after.status === 'open' ? passNote(ctx, question, after) : 'Nobody scores')
}

/** Show the answer without anyone scoring. */
export function showAnswer(ctx: Ctx) {
  const { question, view, game } = snapshot(ctx)
  if (!question || view?.status !== 'open') return
  usePresenterStore.getState().clearLock()
  useGroupStore.getState().act(ctx.sessionId, game.pos, { t: 'show' })
  sfx.play('reveal')
}

/** Lock in the option a group chose (amber, clock paused). In rapid fire there is no lock: it counts at once. */
export function lock(ctx: Ctx, k: number) {
  const { question, view, game } = snapshot(ctx)
  if (!question || view?.status !== 'open' || !game.opts || flashActive()) return
  if (k >= (optionLabels(question.question)?.length ?? 0) || view.hidden.includes(k) || view.tried.some((t) => t.k === k)) return
  if (question.rules.mode === 'rapid') return pick(ctx, k)
  const presenter = usePresenterStore.getState()
  const key = turnKey(game.pos, view.hop)
  const wasLocked = presenter.locked?.key === key && presenter.locked.index === k
  presenter.lockAnswer(key, k)
  if (wasLocked) {
    // Unlocking hands the clock back.
    if (usePresenterStore.getState().timer.key === key) usePresenterStore.getState().toggleTimer()
  } else sfx.play('lock')
}

/** The host confirms the locked option. */
export function confirm(ctx: Ctx) {
  const { game, view } = snapshot(ctx)
  const locked = usePresenterStore.getState().locked
  if (view?.status !== 'open' || !locked || locked.key !== turnKey(game.pos, view.hop)) return
  pick(ctx, locked.index)
}

function applyLifeline(ctx: Ctx, kind: 'fifty' | 'hint') {
  const { question, view, game } = snapshot(ctx)
  if (!question || view?.status !== 'open' || !game.opts || flashActive() || !question.rules.lifelines) return
  const used = lifelinesUsed(ctx.deck, game.plays, question.roundIndex, view.holder)
  if (used[kind] || (kind === 'hint' && !question.question.hint) || (kind === 'hint' && view.hintOn)) return
  if (kind === 'hint') {
    useGroupStore.getState().act(ctx.sessionId, game.pos, { t: 'hint', g: view.holder })
    return sfx.play('optionIn')
  }
  const right = correctOptionIndex(question.question)
  const wrong = (optionLabels(question.question) ?? [])
    .map((_, i) => i)
    .filter((i) => i !== right && !view.hidden.includes(i) && !view.tried.some((t) => t.k === i))
  const cut = Math.min(2, wrong.length - 1)
  if (cut < 1) return
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[wrong[i], wrong[j]] = [wrong[j], wrong[i]]
  }
  useGroupStore
    .getState()
    .act(ctx.sessionId, game.pos, { t: 'fifty', g: view.holder, hide: [...view.hidden, ...wrong.slice(0, cut)] })
  sfx.play('optionIn')
}
export const fifty = (ctx: Ctx) => applyLifeline(ctx, 'fifty')
export const hint = (ctx: Ctx) => applyLifeline(ctx, 'hint')

/** Take back the last thing done on this question. */
export function undo(ctx: Ctx) {
  const { game } = snapshot(ctx)
  if (!game.plays[game.pos]?.length) return
  const presenter = usePresenterStore.getState()
  presenter.clearLock()
  presenter.resetTimer()
  useGroupStore.getState().undo(ctx.sessionId, game.pos)
}

/** Move to a slide. A question that has already been played comes back with its options showing. */
export function go(ctx: Ctx, index: number) {
  const target = Math.min(Math.max(index, 0), ctx.deck.length - 1)
  const slide = ctx.deck[target]
  const played = useGroupStore.getState().games[ctx.sessionId]?.plays[target]
  const presenter = usePresenterStore.getState()
  presenter.clearLock()
  presenter.resetTimer()
  useGroupStore.getState().goto(ctx.sessionId, target, slide.kind === 'question' && Boolean(played?.length))
}

export function next(ctx: Ctx) {
  const { game, scores } = snapshot(ctx)
  go(ctx, nextIndex(ctx.deck, game.pos, scores))
}

export function back(ctx: Ctx) {
  const { game } = snapshot(ctx)
  go(ctx, prevIndex(ctx.deck, game.pos, game.plays))
}

/** The host's "go on": options after the prompt, the locked answer, or the next slide. */
export function forward(ctx: Ctx) {
  const { game, question, view } = snapshot(ctx)
  if (!question) return next(ctx)
  if (view!.status !== 'open') return next(ctx)
  if (!game.opts) return useGroupStore.getState().showOptions(ctx.sessionId)
  confirm(ctx)
}

/** Pause or resume whatever is ticking: the clock on an open question, the auto-advance after an answer. */
export function pauseToggle(ctx: Ctx) {
  const { view } = snapshot(ctx)
  if (view && view.status !== 'open') return useGroupStore.getState().toggleHold()
  const presenter = usePresenterStore.getState()
  if (presenter.timer.key === null) return
  presenter.toggleTimer()
}
