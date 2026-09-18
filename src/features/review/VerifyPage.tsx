import { Link } from 'react-router'
import { StatusScreen } from '@/app/StatusScreen'
import type { Question, QuestionBank } from '@/data/schema'
import { getQuestionBank } from '@/data/source'
import { correctOptionIndex, optionLabels } from '@/features/presenter/deck'
import { optionLetter } from '@/features/presenter/components/palette'
import { useAsync } from '@/lib/useAsync'

/** Printable sign-off sheet: every question in the bank flagged "verify", with the answer to check. */
export function VerifyPage() {
  const state = useAsync(getQuestionBank, 'bank')
  if (state.status === 'loading') return <StatusScreen title="Loading questions…" />
  if (state.status === 'error') return <StatusScreen title="Couldn't load questions" tone="error">{state.error.message}</StatusScreen>
  return <VerifySheet bank={state.data} />
}

function VerifySheet({ bank }: { bank: QuestionBank }) {
  const flagged = bank.questions.filter((q) => q.verify)
  const groups = bank.categories.map((c) => ({ category: c, questions: flagged.filter((q) => q.category === c.id) })).filter((g) => g.questions.length)
  let n = 0

  return (
    <div className="h-full overflow-y-auto bg-white text-stage-950 select-text print:h-auto print:overflow-visible">
      <main className="mx-auto max-w-3xl space-y-8 p-10 print:p-0">
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-sm font-semibold tracking-[0.3em] text-stage-950/50 uppercase">Tri-Quest · NIET Orientation 2026</p>
              <h1 className="font-display text-3xl font-extrabold">Question verification sheet</h1>
            </div>
            <div className="flex gap-2 font-display text-sm font-semibold print:hidden">
              <Link to="/" className="rounded-lg px-3 py-2 ring-1 ring-stage-950/20 hover:bg-stage-950/5">
                ← Sessions
              </Link>
              <button type="button" onClick={() => window.print()} className="rounded-lg bg-niet-red px-3 py-2 text-white hover:brightness-110">
                Print
              </button>
            </div>
          </div>
          <p className="text-sm text-stage-950/70">
            Please check each answer below. <strong>Tick ✓</strong> if the answer is correct, or write the correction on the line. These{' '}
            {flagged.length} questions contain facts about NIET or recent news, so please confirm them before the event on 20 September.
          </p>
          <p className="text-sm text-stage-950/70">Checked by: ______________________ &nbsp; Date: ____________</p>
        </header>

        {groups.map(({ category, questions }) => (
          <section key={category.id} className="space-y-3">
            <h2 className="border-b-2 border-stage-950/15 pb-1 font-display text-xl font-bold">
              {category.icon} {category.name} <span className="text-base font-semibold text-stage-950/50">({questions.length})</span>
            </h2>
            <ol className="space-y-4">
              {questions.map((q) => (
                <VerifyItem key={q.id} q={q} n={++n} />
              ))}
            </ol>
          </section>
        ))}
      </main>
    </div>
  )
}

function VerifyItem({ q, n }: { q: Question; n: number }) {
  const options = optionLabels(q)
  const correct = correctOptionIndex(q)
  const answer = q.type === 'open' ? q.answer : options?.[correct]

  return (
    <li className="flex break-inside-avoid gap-4">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded border-2 border-stage-950/40" aria-hidden />
      <div className="flex-1 space-y-1">
        <p className="font-semibold">
          {n}. {q.prompt}
        </p>
        {options && q.type === 'mcq' && (
          <p className="text-sm text-stage-950/60">
            {options.map((o, i) => `${optionLetter(i)}: ${o}`).join('   ·   ')}
          </p>
        )}
        <p className="text-sm">
          <span className="font-semibold">Answer:</span> <span className="font-bold text-green-700">{answer}</span>
          {q.explanation && <span className="text-stage-950/60"> · {q.explanation}</span>}
        </p>
        <p className="pt-1 text-sm text-stage-950/40">Correction: ______________________________________________</p>
      </div>
    </li>
  )
}
