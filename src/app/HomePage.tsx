import { Link } from 'react-router'
import { getSessionIndex } from '@/data/source'
import { useAsync } from '@/lib/useAsync'
import { StatusScreen } from './StatusScreen'

export function HomePage() {
  const state = useAsync(getSessionIndex, 'index')

  if (state.status === 'loading') return <StatusScreen title="Loading…" />
  if (state.status === 'error') return <StatusScreen title="Couldn't load sessions" tone="error">{state.error.message}</StatusScreen>

  return (
    <main className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-8 p-8">
      <header>
        <p className="font-display text-sm font-semibold tracking-[0.3em] text-white/50 uppercase">Quizzeria</p>
        <h1 className="font-display text-5xl font-extrabold">Quiz sessions</h1>
      </header>
      <ul className="space-y-3">
        {state.data.sessions.map((s) => (
          <li key={s.id}>
            <Link
              to={`/present/${s.id}`}
              className="flex items-center justify-between rounded-2xl bg-stage-800 px-6 py-5 ring-1 ring-white/10 transition hover:bg-stage-700 hover:ring-niet-blue-bright"
            >
              <span>
                <span className="block font-display text-2xl font-bold">{s.title}</span>
                {s.event && <span className="text-white/60">{s.event}</span>}
              </span>
              <span className="font-display font-semibold text-niet-red">Present →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
