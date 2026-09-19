import { Link, useParams } from 'react-router'
import { StatusScreen } from '@/app/StatusScreen'
import { loadSession, type LoadedSession } from '@/data/source'
import { correctOptionIndex, drawSession, optionLabels } from '@/features/presenter/deck'
import { optionLetter } from '@/features/presenter/components/palette'
import { usePresenterStore, useSessionCount, useSessionOrder, useSessionSeed } from '@/features/presenter/store'
import { useAsync } from '@/lib/useAsync'
import { mediaLocation, type Question } from '@/data/schema'

/** Host cheat sheet: the questions in the current draw, in show order, with answers. Printable. */
export function ReviewPage() {
  const { sessionId = '' } = useParams()
  const state = useAsync(() => loadSession(sessionId), sessionId)

  if (state.status === 'loading') return <StatusScreen title="Loading session…" />
  if (state.status === 'error') return <StatusScreen title="Couldn't load session" tone="error">{state.error.message}</StatusScreen>
  return <Review loaded={state.data} />
}

function Review({ loaded }: { loaded: LoadedSession }) {
  const { session } = loaded
  const seed = useSessionSeed(session)
  const pinned = seed === session.seed
  const resetDraw = usePresenterStore((s) => s.resetDraw)
  const order = useSessionOrder(session)
  const count = useSessionCount(session)
  const rounds = drawSession(loaded, seed, order, count)
  const total = rounds.reduce((n, r) => n + r.questions.length, 0)
  const toVerify = rounds.flatMap((r) => r.questions).filter((q) => q.verify).length
  const withMedia = rounds.flatMap((r) => r.questions).filter((q) => q.media).length

  return (
    <div className="h-full overflow-y-auto select-text print:h-auto print:overflow-visible print:bg-white print:text-black">
      <main className="mx-auto max-w-4xl space-y-10 p-8 print:p-0">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.3em] text-white/50 uppercase print:text-black/60">Host cheat sheet</p>
            <h1 className="font-display text-4xl font-extrabold">
              {session.title} <span className="text-white/40 print:text-black/40">· {session.event}</span>
            </h1>
            <p className="mt-2 text-white/60 print:text-black/60">
              {total} questions in {rounds.length} {order === 'difficulty' ? 'levels (by difficulty)' : 'rounds (by category)'} · draw #{seed} · {withMedia} with media · {toVerify} flagged to verify
            </p>
            <p className="mt-1 text-sm text-white/45 print:hidden">
              {pinned ? (
                'This is the draw pinned in the session file, so every device shows the same questions.'
              ) : (
                <>
                  Reshuffled in this browser only. To use it on every device, set <code className="text-gold">"seed": {seed}</code> in the
                  session file, or{' '}
                  <button type="button" className="underline hover:text-white" onClick={() => resetDraw(session.id)}>
                    go back to the pinned draw #{session.seed}
                  </button>
                  .
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2 font-display font-semibold print:hidden">
            <Link to="/" className="rounded-xl px-4 py-2 ring-1 ring-white/15 hover:bg-stage-700">
              ← Sessions
            </Link>
            <button type="button" onClick={() => window.print()} className="rounded-xl bg-niet-red px-4 py-2 hover:brightness-110">
              Print
            </button>
          </div>
        </header>

        {rounds.map(({ round, category, questions, timers }, r) => (
          <section key={round.id} className="break-inside-avoid-page">
            <h2 className="mb-3 border-b border-white/15 pb-2 font-display text-2xl font-bold print:border-black/20">
              {order === 'difficulty' ? 'Level' : 'Round'} {r + 1}: {category?.icon} {round.title}
              <span className="ml-2 text-base font-semibold text-white/50 print:text-black/50">
                {round.subtitle ?? `${questions.length} questions`} · {timerRange(timers)}
              </span>
            </h2>
            <ol className="space-y-3">
              {questions.map((q, i) => (
                <ReviewItem key={q.id} q={q} n={i + 1} />
              ))}
            </ol>
          </section>
        ))}
      </main>
    </div>
  )
}

function ReviewItem({ q, n }: { q: Question; n: number }) {
  const options = optionLabels(q)
  const correct = correctOptionIndex(q)
  return (
    <li className="break-inside-avoid rounded-xl bg-stage-800/70 p-4 ring-1 ring-white/10 print:bg-transparent print:p-2 print:ring-black/15">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display font-bold text-gold print:text-black">{n}.</span>
        <span className="flex-1 font-semibold">
          {q.prompt} {q.showcase && <span className="ml-1">{q.showcase}</span>}
        </span>
        <span className="text-xs tracking-wider text-white/40 uppercase print:text-black/50">
          {q.difficulty} · {q.type}
          {q.media && ` · ${q.media.kind}`}
        </span>
        {q.verify && <span className="rounded bg-lock/20 px-2 text-xs font-bold text-lock print:text-black">VERIFY</span>}
      </div>
      {options ? (
        <p className="mt-2 text-sm text-white/70 print:text-black/70">
          {options.map((o, i) => (
            <span key={i} className={`mr-4 ${i === correct ? 'font-bold text-correct print:text-black print:underline' : ''}`}>
              {optionLetter(i)}: {o}
            </span>
          ))}
        </p>
      ) : (
        <p className="mt-2 text-sm font-bold text-correct print:text-black print:underline">Answer: {q.type === 'open' ? q.answer : ''}</p>
      )}
      {q.media && <p className="mt-1 font-mono text-xs text-white/40 print:text-black/50">{mediaLocation(q.media)}</p>}
    </li>
  )
}

/** "20s each" or "20–30s" when a level mixes timers. */
function timerRange(timers: number[]) {
  const lo = Math.min(...timers)
  const hi = Math.max(...timers)
  return lo === hi ? `${lo}s each` : `${lo}–${hi}s`
}
