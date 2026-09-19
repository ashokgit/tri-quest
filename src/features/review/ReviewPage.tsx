import { Link, useParams } from 'react-router'
import { StatusScreen } from '@/app/StatusScreen'
import { loadSession, type LoadedSession } from '@/data/source'
import { correctOptionIndex, drawSession, optionLabels } from '@/features/presenter/deck'
import { optionLetter } from '@/features/presenter/components/palette'
import { useSessionCount, useSessionOrder, useSessionSeed } from '@/features/presenter/store'
import { useAsync } from '@/lib/useAsync'
import { mediaLocation, type Question } from '@/data/schema'

/** Host cheat sheet: every question in the session's pools, by round, with answers. Printable. */
export function ReviewPage() {
  const { sessionId = '' } = useParams()
  const state = useAsync(() => loadSession(sessionId), sessionId)

  if (state.status === 'loading') return <StatusScreen title="Loading session…" />
  if (state.status === 'error') return <StatusScreen title="Couldn't load session" tone="error">{state.error.message}</StatusScreen>
  return <Review loaded={state.data} />
}

function Review({ loaded }: { loaded: LoadedSession }) {
  const { session, bank, questionsById } = loaded
  const seed = useSessionSeed(session)
  const order = useSessionOrder(session)
  const count = useSessionCount(session)
  const categories = new Map(bank.categories.map((c) => [c.id, c]))
  // Every question in the session's pools, grouped by round; the current draw is only marked.
  const drawn = new Set(drawSession(loaded, seed, order, count).flatMap((r) => r.questions.map((q) => q.id)))
  const rounds = session.rounds.map((round) => ({ round, questions: round.questionIds.map((id) => questionsById.get(id)!) }))
  const all = rounds.flatMap((r) => r.questions)
  const toVerify = all.filter((q) => q.verify).length
  const withMedia = all.filter((q) => q.media).length

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
              All {all.length} questions in {rounds.length} rounds · {drawn.size} in the current draw (#{seed}) · {withMedia} with media · {toVerify} flagged to verify
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

        {rounds.map(({ round, questions }, r) => {
          const category = categories.get(round.category ?? '')
          return (
            <section key={round.id} className="break-inside-avoid-page">
              <h2 className="mb-3 border-b border-white/15 pb-2 font-display text-2xl font-bold print:border-black/20">
                Round {r + 1}: {category?.icon} {round.title}
                <span className="ml-2 text-base font-semibold text-white/50 print:text-black/50">
                  {questions.length} questions · {round.timerSeconds ?? session.defaults.timerSeconds}s each
                </span>
              </h2>
              <ol className="space-y-3">
                {questions.map((q, i) => (
                  <ReviewItem key={q.id} q={q} n={i + 1} drawn={drawn.has(q.id)} />
                ))}
              </ol>
            </section>
          )
        })}
      </main>
    </div>
  )
}

function ReviewItem({ q, n, drawn }: { q: Question; n: number; drawn: boolean }) {
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
        {drawn && <span className="rounded bg-gold/20 px-2 text-xs font-bold text-gold print:text-black">IN DRAW</span>}
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

