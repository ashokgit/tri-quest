import { Link, useParams } from 'react-router'
import { StatusScreen } from '@/app/StatusScreen'
import { loadSession, type LoadedSession } from '@/data/source'
import { correctOptionIndex, drawSession, optionLabels } from '@/features/presenter/deck'
import { optionLetter } from '@/features/presenter/components/palette'
import { usePresenterStore, useSessionCount, useSessionOrder, useSessionPicks, useSessionSeed } from '@/features/presenter/store'
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
  const picks = useSessionPicks(session)
  const setPicks = usePresenterStore((s) => s.setPicks)
  const categories = new Map(bank.categories.map((c) => [c.id, c]))
  const rounds = session.rounds.map((round) => ({ round, questions: round.questionIds.map((id) => questionsById.get(id)!) }))
  const all = rounds.flatMap((r) => r.questions)
  const toVerify = all.filter((q) => q.verify).length
  const withMedia = all.filter((q) => q.media).length

  // The show is capped at the question count set on the home page (or the session file's own picks).
  const written = session.rounds.reduce((n, r) => n + (r.pick ?? r.questionIds.length), 0)
  const limit = Math.min(count ?? written, all.length)
  // Every question in the session's pools is listed; the ones in the show are ticked. The host's
  // hand-picked set wins over the seeded draw, which is what the ticks start from.
  const drawn = drawSession(loaded, seed, order, count).flatMap((r) => r.questions.map((q) => q.id))
  const selected = new Set(picks ?? drawn)
  const full = selected.size >= limit
  const short = limit - selected.size

  const toggle = (id: string) => {
    const next = new Set(selected)
    // Dropping one is always fine; adding one is only allowed while the show is under its limit.
    if (!next.delete(id)) {
      if (next.size >= limit) return
      next.add(id)
    }
    setPicks(session.id, [...next])
  }

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
              All {all.length} questions in {rounds.length} rounds · {selected.size} in the show
              {picks ? ' (hand-picked)' : ` (draw #${seed})`} · {withMedia} with media · {toVerify} flagged to verify
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

        <div
          className={`sticky top-0 z-10 -mx-2 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 backdrop-blur print:hidden ${
            full ? 'bg-stage-800/90 ring-1 ring-white/10' : 'bg-lock/15 ring-1 ring-lock/50'
          }`}
          role="status"
        >
          <p className="text-sm text-white/85">
            <span className="font-display font-bold tabular-nums">
              {selected.size} / {limit}
            </span>{' '}
            {full ? (
              <>questions picked — the show is full. Untick one to make room for another.</>
            ) : (
              <>
                picked — <span className="font-semibold text-lock">{short} more to go</span> before the show is the {limit} questions it's set
                to. Change that number on the sessions page.
              </>
            )}
          </p>
          {picks && (
            <button
              type="button"
              onClick={() => setPicks(session.id, null)}
              className="rounded-lg px-3 py-1.5 font-display text-sm font-semibold ring-1 ring-white/20 hover:bg-stage-700"
            >
              Back to draw #{seed}
            </button>
          )}
        </div>

        {rounds.map(({ round, questions }, r) => {
          const category = categories.get(round.category ?? '')
          return (
            <section key={round.id} className="break-inside-avoid-page">
              <h2 className="mb-3 border-b border-white/15 pb-2 font-display text-2xl font-bold print:border-black/20">
                Round {r + 1}: {category?.icon} {round.title}
                <span className="ml-2 text-base font-semibold text-white/50 print:text-black/50">
                  {questions.filter((q) => selected.has(q.id)).length} of {questions.length} ·{' '}
                  {round.timerSeconds ?? session.defaults.timerSeconds}s each
                </span>
              </h2>
              <ol className="space-y-3">
                {questions.map((q, i) => (
                  <ReviewItem
                    key={q.id}
                    q={q}
                    n={i + 1}
                    picked={selected.has(q.id)}
                    full={full}
                    onToggle={() => toggle(q.id)}
                  />
                ))}
              </ol>
            </section>
          )
        })}
      </main>
    </div>
  )
}

function ReviewItem({ q, n, picked, full, onToggle }: { q: Question; n: number; picked: boolean; full: boolean; onToggle: () => void }) {
  const options = optionLabels(q)
  const correct = correctOptionIndex(q)
  // With the show full, the questions already in it can still be dropped; the rest can't be added.
  const locked = full && !picked
  return (
    <li
      className={`break-inside-avoid rounded-xl p-4 ring-1 print:bg-transparent print:p-2 print:ring-black/15 ${
        picked ? 'bg-stage-800/70 ring-gold/40' : 'bg-stage-800/30 ring-white/10'
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <button
          type="button"
          role="checkbox"
          aria-checked={picked}
          aria-label={`${picked ? 'Drop' : 'Add'} question ${n}: ${q.prompt}`}
          disabled={locked}
          onClick={onToggle}
          title={locked ? 'The show is full — untick another question first' : picked ? 'In the show' : 'Not in the show'}
          className={`self-center rounded-md px-2 font-display text-sm font-bold transition print:hidden ${
            picked ? 'bg-gold/20 text-gold hover:bg-gold/30' : 'text-white/40 ring-1 ring-white/15 hover:text-white disabled:opacity-30 disabled:hover:text-white/40'
          }`}
        >
          {picked ? '✓' : '+'}
        </button>
        <span className={`font-display font-bold print:text-black ${picked ? 'text-gold' : 'text-white/40'}`}>{n}.</span>
        <span className={`flex-1 font-semibold ${picked ? '' : 'text-white/60 print:text-black'}`}>
          {q.prompt} {q.showcase && <span className="ml-1">{q.showcase}</span>}
        </span>
        <span className="text-xs tracking-wider text-white/40 uppercase print:text-black/50">
          {q.difficulty} · {q.type}
          {q.media && ` · ${q.media.kind}`}
        </span>
        {picked && <span className="hidden rounded bg-gold/20 px-2 text-xs font-bold text-gold print:inline print:text-black">IN SHOW</span>}
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
