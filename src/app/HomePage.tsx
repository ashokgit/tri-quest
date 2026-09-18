import { Link } from 'react-router'
import { getSession, getSessionIndex } from '@/data/source'
import type { RoundOrder } from '@/features/presenter/deck'
import { usePresenterStore, useSessionOrder } from '@/features/presenter/store'
import { useAsync } from '@/lib/useAsync'
import { StatusScreen } from './StatusScreen'

export function HomePage() {
  const state = useAsync(getSessionIndex, 'index')

  if (state.status === 'loading') return <StatusScreen title="Loading…" />
  if (state.status === 'error') return <StatusScreen title="Couldn't load sessions" tone="error">{state.error.message}</StatusScreen>

  return (
    <main className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-8 p-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold tracking-[0.3em] text-white/50 uppercase">Quizzeria</p>
          <h1 className="font-display text-5xl font-extrabold">Quiz sessions</h1>
        </div>
        <Link to="/sounds" className="rounded-xl px-4 py-2 font-display font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-stage-700">
          🔊 Sound check
        </Link>
      </header>
      <ul className="space-y-3">
        {state.data.sessions.map((s) => (
          <SessionCard key={s.id} id={s.id} title={s.title} event={s.event} />
        ))}
      </ul>
    </main>
  )
}

const ORDERS: { value: RoundOrder; label: string; hint: string }[] = [
  { value: 'category', label: 'By category', hint: 'Science, NIET, Audio-Visual… one subject per round' },
  { value: 'difficulty', label: 'By difficulty', hint: 'A rising ladder: easiest first, mixed subjects, up to the Final Challenge' },
]

function SessionCard({ id, title, event }: { id: string; title: string; event?: string }) {
  const session = useAsync(() => getSession(id), id)
  const reshuffle = usePresenterStore((s) => s.reshuffle)
  const setOrder = usePresenterStore((s) => s.setOrder)
  const order = useSessionOrder(session.status === 'ready' ? session.data : { id, order: 'category' })

  const onReshuffle = () => {
    if (window.confirm(`Draw a new random set of questions for "${title}"?\n\nThis also restarts it from the welcome screen.`)) reshuffle(id)
  }
  const onOrder = (next: RoundOrder) => {
    if (next === order) return
    if (window.confirm(`Switch "${title}" to ${next === 'difficulty' ? 'a difficulty ladder' : 'category rounds'}?\n\nSame questions, new order. The show restarts from the welcome screen.`)) setOrder(id, next)
  }

  return (
    <li className="space-y-4 rounded-2xl bg-stage-800 px-6 py-5 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-4">
        <span>
          <span className="block font-display text-2xl font-bold">{title}</span>
          {event && <span className="text-white/60">{event}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2 font-display font-semibold">
          <button type="button" onClick={onReshuffle} className="rounded-xl px-4 py-2 text-white/60 ring-1 ring-white/15 transition hover:bg-stage-700 hover:text-white">
            Reshuffle
          </button>
          <Link to={`/review/${id}`} className="rounded-xl px-4 py-2 text-white/80 ring-1 ring-white/15 transition hover:bg-stage-700">
            Review
          </Link>
          <Link to={`/present/${id}`} className="rounded-xl bg-niet-red px-5 py-2 text-white transition hover:brightness-110">
            Present →
          </Link>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display text-sm font-semibold tracking-wider text-white/50 uppercase">Order</span>
        <div className="inline-flex rounded-xl bg-stage-950/60 p-1 ring-1 ring-white/10">
          {ORDERS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onOrder(o.value)}
              className={`rounded-lg px-4 py-1.5 font-display text-sm font-semibold transition ${
                order === o.value ? 'bg-gold text-stage-950' : 'text-white/70 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-white/50">{ORDERS.find((o) => o.value === order)?.hint}</span>
      </div>
    </li>
  )
}
