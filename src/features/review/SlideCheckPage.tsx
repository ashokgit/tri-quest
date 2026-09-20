import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { StatusScreen } from '@/app/StatusScreen'
import type { Question, Session } from '@/data/schema'
import { loadSession, type LoadedSession } from '@/data/source'
import { sfx } from '@/features/audio/sfx'
import { buildDeck, stagesFor, type Slide } from '@/features/presenter/deck'
import { QuestionSlide } from '@/features/presenter/slides/QuestionSlide'
import { STAGE_HEIGHT, STAGE_WIDTH } from '@/features/presenter/Stage'
import { usePresenterStore, useSessionCount, useSessionOrder, useSessionPicks, useSessionSeed } from '@/features/presenter/store'
import { enterFullscreen } from '@/lib/fullscreen'
import { useAsync } from '@/lib/useAsync'

const THUMB_SCALE = 0.25

type Issue = { level: 'error' | 'warn'; text: string }

/**
 * Rehearsal aid: every question in the session's pools, rendered at its fullest
 * state (answer revealed, explanation shown) and measured for layout problems.
 */
export function SlideCheckPage() {
  const { sessionId = '' } = useParams()
  const state = useAsync(() => loadSession(sessionId), sessionId)

  if (state.status === 'loading') return <StatusScreen title="Loading session…" />
  if (state.status === 'error') return <StatusScreen title="Couldn't load session" tone="error">{state.error.message}</StatusScreen>
  return <SlideCheck loaded={state.data} />
}

function SlideCheck({ loaded }: { loaded: LoadedSession }) {
  const { session, bank, questionsById } = loaded
  const categories = new Map(bank.categories.map((c) => [c.id, c]))
  const [issues, setIssues] = useState<Record<string, Issue[]>>({})
  /** Which moment of each question to show: its opening (image most obscured) or its final reveal. */
  const [moment, setMoment] = useState<'final' | 'opening'>('final')

  const slides = session.rounds.flatMap((round, roundIndex) =>
    round.questionIds.map((qid, indexInRound): Extract<Slide, { kind: 'question' }> => {
      const question = questionsById.get(qid)!
      return {
        kind: 'question',
        question,
        round,
        roundIndex,
        indexInRound,
        category: categories.get(question.category),
        timerSeconds: round.timerSeconds ?? session.defaults.timerSeconds,
      }
    }),
  )

  // Where each question sits in the show as currently drawn, so a slide can be presented directly.
  const seed = useSessionSeed(session)
  const order = useSessionOrder(session)
  const count = useSessionCount(session)
  const picks = useSessionPicks(session)
  const deckIndex = useMemo(() => {
    const index = new Map<string, number>()
    buildDeck(loaded, seed, order, count, picks).forEach((s, i) => s.kind === 'question' && index.set(s.question.id, i))
    return index
  }, [loaded, seed, order, count, picks])
  const setPosition = usePresenterStore((s) => s.setPosition)
  const navigate = useNavigate()
  const presentFrom = useCallback(
    (slide: number) => {
      enterFullscreen()
      sfx.unlock()
      setPosition(session.id, { slide, stage: 0 })
      void navigate(`/present/${session.id}`)
    },
    [navigate, setPosition, session.id],
  )

  const report = useCallback((id: string, found: Issue[]) => setIssues((prev) => (prev[id] ? prev : { ...prev, [id]: found })), [])
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
                ? 'Each slide shows its final state: answer revealed, explanation shown (layout is measured here).'
                : 'Each slide shows its opening state: what students see first (blurred / zoomed-in pictures).'}
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-stage-950/60 p-1 font-display text-sm font-semibold ring-1 ring-white/10">
            {(['final', 'opening'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoment(m)}
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

        <div className="grid grid-cols-[repeat(auto-fill,minmax(480px,1fr))] gap-6">
          {slides.map((slide) => (
            <Thumb
              key={slide.question.id}
              slide={slide}
              session={session}
              moment={moment}
              issues={issues[slide.question.id]}
              onMeasured={report}
              deckIndex={deckIndex.get(slide.question.id)}
              onPresent={presentFrom}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

function Thumb({
  slide,
  session,
  moment,
  issues,
  onMeasured,
  deckIndex,
  onPresent,
}: {
  slide: Extract<Slide, { kind: 'question' }>
  session: Session
  moment: 'final' | 'opening'
  issues?: Issue[]
  onMeasured: (id: string, issues: Issue[]) => void
  /** Slide number in the current draw, or undefined when this draw doesn't include the question. */
  deckIndex?: number
  onPresent: (slide: number) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const q = slide.question
  const lastStage = stagesFor(slide).length - 1

  useLayoutEffect(() => {
    // Give fonts a moment so measurements use the real typeface.
    const id = window.setTimeout(() => root.current && onMeasured(q.id, measure(root.current, q)), 600)
    return () => window.clearTimeout(id)
  }, [q, onMeasured])

  const tone = !issues ? 'ring-white/10' : issues.some((i) => i.level === 'error') ? 'ring-niet-red' : issues.length ? 'ring-lock' : 'ring-correct/60'

  return (
    <figure data-question-id={q.id} data-issues={issues ? JSON.stringify(issues) : undefined} className={`space-y-2 rounded-xl p-2 ring-2 ${tone}`}>
      <div className="overflow-hidden rounded-lg bg-stage-950" style={{ width: STAGE_WIDTH * THUMB_SCALE, height: STAGE_HEIGHT * THUMB_SCALE }}>
        <div ref={root} className="relative origin-top-left" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${THUMB_SCALE})` }}>
          <QuestionSlide slide={slide} slideIndex={-1} stage={moment === 'final' ? lastStage : 0} session={session} />
        </div>
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-2 text-xs">
        {deckIndex !== undefined ? (
          <button
            type="button"
            onClick={() => onPresent(deckIndex)}
            title="Open the show at this question"
            className="rounded-md bg-niet-red px-2 py-0.5 font-display font-semibold text-white hover:brightness-110"
          >
            ▶ Go to
          </button>
        ) : (
          <span className="rounded-md px-2 py-0.5 text-white/35 ring-1 ring-white/10" title="Reshuffle or change the order to draw it">
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

function measure(root: HTMLElement, q: Question): Issue[] {
  const found: Issue[] = []
  const answers = root.querySelector<HTMLElement>('[data-answers]')
  const upper = root.querySelector<HTMLElement>('[data-upper-stage]')
  const prompt = root.querySelector<HTMLElement>('[data-prompt]')

  if (answers && offsetWithin(answers, root) + answers.offsetHeight > STAGE_HEIGHT - 8) found.push({ level: 'error', text: 'answers run off the bottom of the screen' })
  root.querySelectorAll<HTMLElement>('[data-option-text]').forEach((span) => {
    if (span.offsetHeight > 104) found.push({ level: 'error', text: `answer "${span.textContent?.slice(0, 24)}…" overflows its bar` })
  })
  if (prompt) {
    const lines = Math.round(prompt.offsetHeight / (54 * 1.18))
    if (lines > 3) found.push({ level: 'warn', text: `question is ${lines} lines long` })
  }
  if (upper) {
    const room = upper.offsetHeight
    if (q.media && room < 380) found.push({ level: 'warn', text: `media area only ${room}px tall` })
    else if (q.explanation && room < 300) found.push({ level: 'warn', text: `explanation crowds the stage (${room}px)` })
  }
  return found
}
