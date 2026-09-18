import { useParams } from 'react-router'
import { StatusScreen } from '@/app/StatusScreen'
import { loadSession } from '@/data/source'
import { useAsync } from '@/lib/useAsync'

/**
 * Presenter entry point. For now it loads and summarises the session;
 * the staged reveal engine (welcome → round intro → question → options → answer) comes next.
 */
export function PresenterPage() {
  const { sessionId = '' } = useParams()
  const state = useAsync(() => loadSession(sessionId), sessionId)

  if (state.status === 'loading') return <StatusScreen title="Loading session…" />
  if (state.status === 'error') return <StatusScreen title="Couldn't load session" tone="error">{state.error.message}</StatusScreen>

  const { session } = state.data
  const total = session.rounds.reduce((n, r) => n + r.questionIds.length, 0)

  return (
    <StatusScreen title={session.title}>
      <p>{session.event}</p>
      <p className="mt-2 text-white/50">
        {session.rounds.length} rounds · {total} questions · presenter engine coming next
      </p>
    </StatusScreen>
  )
}
