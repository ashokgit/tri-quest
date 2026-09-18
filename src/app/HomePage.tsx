import { Link } from 'react-router'
import { getSessionIndex } from '@/data/source'
import { usePresenterStore } from '@/features/presenter/store'
import { useAsync } from '@/lib/useAsync'
import { StatusScreen } from './StatusScreen'

export function HomePage() {
  const state = useAsync(getSessionIndex, 'index')
  const reshuffle = usePresenterStore((s) => s.reshuffle)

  if (state.status === 'loading') return <StatusScreen title="Loading…" />
  if (state.status === 'error') return <StatusScreen title="Couldn't load sessions" tone="error">{state.error.message}</StatusScreen>

  const onReshuffle = (id: string, title: string) => {
    if (window.confirm(`Draw a new random set of questions for "${title}"?\n\nThis also restarts it from the welcome screen.`)) reshuffle(id)
  }

  return (
    <main className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-8 p-8">
      <header>
        <p className="font-display text-sm font-semibold tracking-[0.3em] text-white/50 uppercase">Quizzeria</p>
        <h1 className="font-display text-5xl font-extrabold">Quiz sessions</h1>
      </header>
      <ul className="space-y-3">
        {state.data.sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-4 rounded-2xl bg-stage-800 px-6 py-5 ring-1 ring-white/10">
            <span>
              <span className="block font-display text-2xl font-bold">{s.title}</span>
              {s.event && <span className="text-white/60">{s.event}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2 font-display font-semibold">
              <button
                type="button"
                onClick={() => onReshuffle(s.id, s.title)}
                className="rounded-xl px-4 py-2 text-white/60 ring-1 ring-white/15 transition hover:bg-stage-700 hover:text-white"
              >
                Reshuffle
              </button>
              <Link to={`/review/${s.id}`} className="rounded-xl px-4 py-2 text-white/80 ring-1 ring-white/15 transition hover:bg-stage-700">
                Review
              </Link>
              <Link to={`/present/${s.id}`} className="rounded-xl bg-niet-red px-5 py-2 text-white transition hover:brightness-110">
                Present →
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </main>
  )
}
