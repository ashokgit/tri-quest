import { useParams } from 'react-router'
import { StatusScreen } from '@/app/StatusScreen'
import { loadSession } from '@/data/source'
import { useAsync } from '@/lib/useAsync'
import { Presenter } from './Presenter'

export function PresenterPage() {
  const { sessionId = '' } = useParams()
  const state = useAsync(() => loadSession(sessionId), sessionId)

  if (state.status === 'loading') return <StatusScreen title="Loading session…" />
  if (state.status === 'error') return <StatusScreen title="Couldn't load session" tone="error">{state.error.message}</StatusScreen>

  return <Presenter loaded={state.data} />
}
