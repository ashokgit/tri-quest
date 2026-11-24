import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { LoadedSession } from '@/data/source'
import { sfx } from '@/features/audio/sfx'
import { correctOptionIndex } from '@/features/presenter/deck'
import { STAGE_HEIGHT, STAGE_WIDTH } from '@/features/presenter/Stage'
import { enterFullscreen } from '@/lib/fullscreen'
import { buildGroupDeck, derivePlay, TIEBREAK_TAG, type Action, type QuestionSlide } from './engine'
import { GroupQuestionSlide } from './slides/QuestionSlide'
import { useGroupSeed, useGroupStore } from './store'

const THUMB_SCALE = 0.25

type Issue = { level: 'error' | 'warn'; text: string }

/**
 * Rehearsal aid for the groups format: every question in every pool, laid out at its fullest
 * (answer and explanation showing) or at its opening with the hint up, and measured for overflow.
 * Code snippets are the risk: a long line or too many lines shrinks the type or runs out of room.
 */
export function GroupSlideCheck({ loaded }: { loaded: LoadedSession }) {
  const { session, bank, questionsById } = loaded
  const names = session.groups
  const categories = new Map(bank.categories.map((c) => [c.id, c]))
  const [issues, setIssues] = useState<Record<string, Issue[]>>({})
  const [moment, setMoment] = useState<'final' | 'opening'>('final')

  const slides = useMemo(
    () =>
      session.rounds.flatMap((round, roundIndex) =>
        round.questionIds.map((qid, indexInRound): QuestionSlide => {
          const question = questionsById.get(qid)!
          return {
            kind: 'question',
            question,
            round,
            rules: round.play!,
            roundIndex,
            category: categories.get(question.category),
            indexInRound,
            opener: indexInRound % names.length,
            tiebreak: question.tags.includes(TIEBREAK_TAG),
            seconds: round.timerSeconds ?? session.defaults.timerSeconds,
            blockStart: false,
            n: indexInRound + 1,
            of: round.questionIds.length,
          }
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the categories map is derived from `bank`
    [session, questionsById, names.length],
  )

  // Where each question sits in the current draw, so the contest can be started right there.
  const seed = useGroupSeed(session)
  const deckIndex = useMemo(() => {
    const index = new Map<string, number>()
    buildGroupDeck(loaded, seed).forEach((s, i) => s.kind === 'question' && index.set(s.question.id, i))
    return index
  }, [loaded, seed])
  const goto = useGroupStore((s) => s.goto)
  const navigate = useNavigate()
  const presentFrom = useCallback(
    (slide: number) => {
      enterFullscreen()
      sfx.unlock()
      goto(session.id, slide)
      void navigate(`/present/${session.id}`)
    },
    [goto, navigate, session.id],
  )

  const report = useCallback(
    (id: string, found: Issue[]) => setIssues((prev) => (prev[id] ? prev : { ...prev, [id]: found })),
    [],
  )
  const checked = Object.keys(issues).length
  const errors = Object.values(issues).filter((list) => list.some((i) => i.level === 'error')).length
  const warnings = Object.values(issues).filter((list) => list.length && list.every((i) => i.level === 'warn')).length

  return (
    <div className="h-full overflow-y-auto select-text">
      <main className="mx-auto max-w-[1600px] space-y-6 p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.3em] text-white/50 uppercase">Slide check</p>
            <h1 className="font-display text-4xl font-extrabold">
              {session.title} <span className="text-white/40">· all {slides.length} questions</span>
            </h1>
            <p id="slide-check-summary" className="mt-2 text-white/70">
              Checked {checked}/{slides.length} · <span className="text-niet-red">{errors} with errors</span> ·{' '}
              <span className="text-lock">{warnings} with warnings</span>
            </p>
            <p className="mt-1 text-sm text-white/45">
              {moment === 'final'
                ? 'Each slide shows its final state: answered, with the explanation up (layout is measured here).'
                : 'Each slide shows its opening state with the hint up: the tallest the strip under the code gets before an answer.'}
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-stage-950/60 p-1 font-display text-sm font-semibold ring-1 ring-white/10">
            {(['final', 'opening'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setIssues({})
                  setMoment(m)
                }}
                className={`rounded-lg px-4 py-1.5 capitalize ${moment === m ? 'bg-gold text-stage-950' : 'text-white/70 hover:text-white'}`}
              >
                {m} state
              </button>
            ))}
          </div>
          <Link to="/" className="rounded-xl px-4 py-2 font-display font-semibold ring-1 ring-white/15 hover:bg-stage-700">
            ← Sessions
          </Link>
        </header>

        {session.rounds.map((round, roundIndex) => (
          <section key={round.id} className="space-y-3">
            <h2 className="border-b border-white/15 pb-2 font-display text-2xl font-bold">
              Round {roundIndex + 1}: {round.title}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(480px,1fr))] gap-6">
              {slides
                .filter((s) => s.roundIndex === roundIndex)
                .map((slide) => (
                  <Thumb
                    key={slide.question.id}
                    slide={slide}
                    loaded={loaded}
                    moment={moment}
                    issues={issues[slide.question.id]}
                    onMeasured={report}
                    deckIndex={deckIndex.get(slide.question.id)}
                    onPresent={presentFrom}
                  />
                ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

function Thumb({
  slide,
  loaded,
  moment,
  issues,
  onMeasured,
  deckIndex,
  onPresent,
}: {
  slide: QuestionSlide
  loaded: LoadedSession
  moment: 'final' | 'opening'
  issues?: Issue[]
  onMeasured: (id: string, issues: Issue[]) => void
  deckIndex?: number
  onPresent: (slide: number) => void
}) {
  const { session } = loaded
  const root = useRef<HTMLDivElement>(null)
  const q = slide.question
  const lifelines = useMemo(() => session.groups.map(() => ({ fifty: false, hint: false })), [session.groups])
  const actions: Action[] = useMemo(
    () => (moment === 'final' ? [{ t: 'pick', k: correctOptionIndex(q) }] : q.hint ? [{ t: 'hint', g: 0 }] : []),
    [moment, q],
  )
  const view = useMemo(() => derivePlay(slide, session.groups.length, actions), [slide, session.groups.length, actions])

  useLayoutEffect(() => {
    // Give fonts a moment so measurements use the real typeface.
    const id = window.setTimeout(
      () => root.current && onMeasured(q.id, measure(root.current, q.explanation, view.hintOn && Boolean(q.hint))),
      700,
    )
    return () => window.clearTimeout(id)
  }, [q, onMeasured, view.hintOn])

  const tone = !issues
    ? 'ring-white/10'
    : issues.some((i) => i.level === 'error')
      ? 'ring-niet-red'
      : issues.length
        ? 'ring-lock'
        : 'ring-correct/60'

  return (
    <figure
      data-question-id={q.id}
      data-issues={issues ? JSON.stringify(issues) : undefined}
      className={`space-y-2 rounded-xl p-2 ring-2 ${tone}`}
    >
      <div
        className="overflow-hidden rounded-lg bg-stage-950"
        style={{ width: STAGE_WIDTH * THUMB_SCALE, height: STAGE_HEIGHT * THUMB_SCALE }}
      >
        <div
          ref={root}
          className="relative origin-top-left"
          style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${THUMB_SCALE})` }}
        >
          <GroupQuestionSlide
            slide={slide}
            pos={-1}
            view={view}
            opts
            names={session.groups}
            scores={session.groups.map(() => 0)}
            lifelines={lifelines}
            session={session}
            autoIn={null}
          />
        </div>
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-2 text-xs">
        {deckIndex !== undefined ? (
          <button
            type="button"
            onClick={() => onPresent(deckIndex)}
            title="Open the contest at this question"
            className="rounded-md bg-niet-red px-2 py-0.5 font-display font-semibold text-white hover:brightness-110"
          >
            ▶ Go to
          </button>
        ) : (
          <span className="rounded-md px-2 py-0.5 text-white/35 ring-1 ring-white/10" title="Reshuffle to draw it">
            not in this draw
          </span>
        )}
        <span className="font-mono text-white/50">{q.id}</span>
        {issues?.map((i, k) => (
          <span key={k} className={`font-semibold ${i.level === 'error' ? 'text-niet-red' : 'text-lock'}`}>
            {i.level === 'error' ? '✖' : '⚠'} {i.text}
          </span>
        ))}
        {issues && !issues.length && <span className="text-correct">✔ fits</span>}
      </figcaption>
    </figure>
  )
}

/** Offset of `el` from `root`, ignoring CSS transforms (which animations use). */
function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let top = 0
  let node: HTMLElement | null = el
  while (node && node !== root) {
    top += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return top
}

function measure(root: HTMLElement, explanation: string | undefined, hintShown: boolean): Issue[] {
  const found: Issue[] = []
  const answers = root.querySelector<HTMLElement>('[data-answers]')
  const prompt = root.querySelector<HTMLElement>('[data-prompt]')
  const codeArea = root.querySelector<HTMLElement>('[data-code-area]')
  const code = root.querySelector<HTMLElement>('[data-code]')
  const info = root.querySelector<HTMLElement>('[data-info]')

  if (answers && offsetWithin(answers, root) + answers.offsetHeight > STAGE_HEIGHT - 8)
    found.push({ level: 'error', text: 'answers run off the bottom of the screen' })
  root.querySelectorAll<HTMLElement>('[data-option-text]').forEach((span) => {
    if (span.offsetHeight > 92)
      found.push({ level: 'error', text: `answer "${span.textContent?.slice(0, 24)}…" overflows its bar` })
  })
  if (prompt && prompt.offsetHeight > 2 * 46 * 1.15 + 4) found.push({ level: 'warn', text: 'question runs to three lines' })
  if (code && codeArea) {
    if (code.offsetHeight > codeArea.clientHeight + 2) found.push({ level: 'error', text: 'code is taller than its area' })
    if (code.scrollWidth > code.clientWidth + 2) found.push({ level: 'error', text: 'a line of code is wider than the box' })
    const size = parseFloat(getComputedStyle(code).fontSize)
    if (size < 34) found.push({ level: 'warn', text: `code is small (${Math.round(size)}px)` })
  }
  const text = info?.querySelector<HTMLElement>('p')
  if (info && text && (explanation || hintShown) && text.offsetHeight > info.clientHeight)
    found.push({ level: 'warn', text: 'explanation or hint is taller than its strip' })
  return found
}
