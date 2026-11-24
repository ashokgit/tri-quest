import { Link } from 'react-router'
import type { Question } from '@/data/schema'
import type { LoadedSession } from '@/data/source'
import { correctOptionIndex, optionLabels } from '@/features/presenter/deck'
import { optionLetter } from '@/features/presenter/components/palette'
import { buildGroupDeck, TIEBREAK_TAG } from './engine'
import { useGroupSeed, useGroupStore } from './store'

/** Host cheat sheet for a groups session: every question by round, the draw ticked, answers marked. Printable. */
export function GroupReview({ loaded }: { loaded: LoadedSession }) {
  const { session, bank, questionsById } = loaded
  const seed = useGroupSeed(session)
  const reshuffle = useGroupStore((s) => s.reshuffle)
  const categories = new Map(bank.categories.map((c) => [c.id, c]))
  const deck = buildGroupDeck(loaded, seed)
  const drawn = new Map<string, number>()
  const standby = new Set<string>()
  deck.forEach((s) => {
    if (s.kind !== 'question') return
    drawn.set(s.question.id, s.opener)
    if (s.tiebreak) standby.add(s.question.id)
  })
  const rounds = session.rounds.map((round) => ({ round, questions: round.questionIds.map((id) => questionsById.get(id)!) }))
  const all = rounds.flatMap((r) => r.questions)
  const units = [...new Set(all.map((q) => q.category))].filter((c) => c.startsWith('py-'))
  const inDraw = [...drawn.keys()].filter((id) => !standby.has(id))

  return (
    <div className="h-full overflow-y-auto select-text print:h-auto print:overflow-visible print:bg-white print:text-black">
      <main className="mx-auto max-w-4xl space-y-10 p-8 print:p-0">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.3em] text-white/50 uppercase print:text-black/60">
              Host cheat sheet
            </p>
            <h1 className="font-display text-4xl font-extrabold">
              {session.title} <span className="text-white/40 print:text-black/40">· {session.event}</span>
            </h1>
            <p className="mt-2 text-white/60 print:text-black/60">
              {all.length} questions in the pools · {inDraw.length} in this draw (#{seed}) + {standby.size} tie-breakers on
              stand-by · groups {session.groups.join(', ')}
            </p>
            <p className="mt-1 text-sm text-white/45 print:text-black/50">
              Coverage in the draw:{' '}
              {units
                .map(
                  (c) =>
                    `${categories.get(c)?.name ?? c}: ${inDraw.filter((id) => questionsById.get(id)?.category === c).length}`,
                )
                .join(' · ')}
            </p>
          </div>
          <div className="flex gap-2 font-display font-semibold print:hidden">
            <Link to="/" className="rounded-xl px-4 py-2 ring-1 ring-white/15 hover:bg-stage-700">
              ← Sessions
            </Link>
            <button
              type="button"
              onClick={() => reshuffle(session.id)}
              className="rounded-xl px-4 py-2 ring-1 ring-white/15 hover:bg-stage-700"
            >
              Reshuffle
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-niet-red px-4 py-2 hover:brightness-110"
            >
              Print
            </button>
          </div>
        </header>

        {rounds.map(({ round, questions }, r) => {
          const rules = round.play!
          return (
            <section key={round.id} className="break-inside-avoid-page">
              <h2 className="mb-1 border-b border-white/15 pb-2 font-display text-2xl font-bold print:border-black/20">
                Round {r + 1}: {round.title}
                <span className="ml-2 text-base font-semibold text-white/50 print:text-black/50">
                  {questions.filter((q) => drawn.has(q.id) && !standby.has(q.id)).length} of {questions.length} in the draw ·{' '}
                  {round.timerSeconds ?? session.defaults.timerSeconds}s · {rules.points} pts
                  {rules.passPoints ? ` / ${rules.passPoints} on a pass` : ''}
                  {rules.penalty ? ` / −${rules.penalty} if wrong` : ''}
                </span>
              </h2>
              <ol className="mt-3 space-y-3">
                {questions.map((q, i) => (
                  <Entry key={q.id} q={q} n={i + 1} opener={drawn.get(q.id)} standby={standby.has(q.id)} names={session.groups} />
                ))}
              </ol>
            </section>
          )
        })}
      </main>
    </div>
  )
}

function Entry({ q, n, opener, standby, names }: { q: Question; n: number; opener?: number; standby: boolean; names: string[] }) {
  const options = optionLabels(q)
  const right = correctOptionIndex(q)
  const held = q.tags.includes(TIEBREAK_TAG)
  return (
    <li
      className={`break-inside-avoid rounded-xl px-4 py-3 ring-1 print:ring-black/20 ${opener !== undefined ? 'bg-stage-800 ring-gold/50' : 'bg-stage-800/50 ring-white/10 print:bg-white'}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-display font-bold text-white/40 print:text-black/50">{n}.</span>
        <span className="font-display text-lg font-bold">{q.prompt}</span>
        {opener !== undefined && (
          <span className="rounded bg-gold/20 px-2 text-xs font-extrabold tracking-wider text-gold uppercase print:text-black">
            {standby ? 'tie-breaker if level' : `in draw · Group ${names[opener]} first`}
          </span>
        )}
        {held && opener === undefined && (
          <span className="rounded px-2 text-xs font-bold text-white/45 ring-1 ring-white/15 print:text-black/60">
            tie-breaker pool
          </span>
        )}
        <span className="ml-auto text-xs text-white/40 print:text-black/50">
          {q.tags.filter((t) => /^unit/.test(t)).join(' ')} · {q.difficulty}
        </span>
      </div>
      {q.showcase && <pre className="mt-2 rounded-lg bg-stage-950/70 p-3 font-mono text-sm print:bg-black/5">{q.showcase}</pre>}
      {options && (
        <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {options.map((o, i) => (
            <li
              key={i}
              className={
                i === right ? 'font-bold text-correct print:text-black print:underline' : 'text-white/70 print:text-black/80'
              }
            >
              {optionLetter(i)}) {o}
              {i === right && ' ✔'}
            </li>
          ))}
        </ul>
      )}
      {q.explanation && <p className="mt-2 text-sm text-white/60 print:text-black/70">💡 {q.explanation}</p>}
      {q.hint && <p className="mt-1 text-sm text-lock/90 print:text-black/70">Hint: {q.hint}</p>}
    </li>
  )
}
