import { useState } from 'react'
import { Link } from 'react-router'
import { getSession } from '@/data/source'
import { sfx } from '@/features/audio/sfx'
import { enterFullscreen } from '@/lib/fullscreen'
import { useAsync } from '@/lib/useAsync'
import { groupColor } from './colors'
import { useGame, useGroupSeed, useGroupStore } from './store'

/** The Present click is the user gesture that lets the welcome music start straight away. */
function startShow() {
  enterFullscreen()
  sfx.unlock()
}

/** Home-page card for a session in the groups format: its rounds, and the controls to start, resume or redo it. */
export function GroupSessionCard({ id, title, event }: { id: string; title: string; event?: string }) {
  const state = useAsync(() => getSession(id), id)
  const session = state.status === 'ready' ? state.data : undefined
  const game = useGame(id)
  const seed = useGroupSeed(session ?? { id, seed: 2026 })
  const reshuffle = useGroupStore((s) => s.reshuffle)
  const restart = useGroupStore((s) => s.restart)
  const [pending, setPending] = useState<'reshuffle' | 'restart' | null>(null)
  const inProgress = game.pos > 0

  const confirm = () => {
    if (pending === 'reshuffle') reshuffle(id)
    if (pending === 'restart') restart(id)
    setPending(null)
  }
  // Before the contest starts a new draw is harmless; once it has, ask first.
  const ask = (kind: 'reshuffle' | 'restart') =>
    inProgress ? setPending(kind) : kind === 'reshuffle' ? reshuffle(id) : restart(id)

  return (
    <li className="space-y-4 rounded-2xl bg-stage-800 px-6 py-5 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-4">
        <span>
          <span className="flex items-center gap-3 font-display text-2xl font-bold">
            {title}
            <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs font-extrabold tracking-widest text-gold uppercase">
              Groups
            </span>
          </span>
          {event && <span className="text-white/60">{event}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2 font-display font-semibold">
          <button
            type="button"
            onClick={() => ask('reshuffle')}
            className="rounded-xl px-4 py-2 text-white/60 ring-1 ring-white/15 transition hover:bg-stage-700 hover:text-white"
          >
            Reshuffle
          </button>
          {inProgress && (
            <button
              type="button"
              onClick={() => ask('restart')}
              className="rounded-xl px-4 py-2 text-white/60 ring-1 ring-white/15 transition hover:bg-stage-700 hover:text-white"
            >
              Restart
            </button>
          )}
          <Link
            to={`/review/${id}`}
            className="rounded-xl px-4 py-2 text-white/80 ring-1 ring-white/15 transition hover:bg-stage-700"
          >
            Review
          </Link>
          <Link
            to={`/present/${id}`}
            onClick={startShow}
            className="rounded-xl bg-niet-red px-5 py-2 text-white transition hover:brightness-110"
          >
            {inProgress ? 'Resume →' : 'Present →'}
          </Link>
        </span>
      </div>

      {session && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
            {session.groups.map((name, g) => (
              <span
                key={g}
                className="flex items-center gap-2 rounded-lg bg-stage-950/60 py-1 pr-3 pl-1 font-display font-semibold ring-1 ring-white/10"
              >
                <span
                  className="grid size-6 place-items-center rounded-full text-xs font-black text-white"
                  style={{ background: groupColor(g) }}
                >
                  {name}
                </span>
                Group {name}
              </span>
            ))}
            <span className="flex-1 text-right text-white/50">
              draw #{seed}
              {session.durationMinutes ? ` · planned for ${session.durationMinutes} min` : ''}
            </span>
          </div>
          <ol className="grid gap-2 sm:grid-cols-3">
            {session.rounds.map((round, i) => (
              <li key={round.id} className="rounded-xl bg-stage-950/50 px-4 py-3 text-sm ring-1 ring-white/10">
                <p className="font-display text-xs font-semibold tracking-wider text-white/45 uppercase">Round {i + 1}</p>
                <p className="font-display text-lg font-bold">{round.title}</p>
                <p className="text-white/55">
                  {round.pick ?? round.questionIds.length} questions · {round.timerSeconds ?? session.defaults.timerSeconds}s ·{' '}
                  {round.play?.points} pts
                  {round.play?.passPoints ? ` (${round.play.passPoints} on a pass)` : ''}
                  {round.play?.penalty ? ` · −${round.play.penalty} if wrong` : ''}
                </p>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/slides/${id}`} className="font-display text-sm font-semibold text-white/60 hover:text-white">
              Slide check →
            </Link>
          </div>
        </div>
      )}

      {pending && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-lock/10 px-4 py-3 ring-1 ring-lock/40"
          role="alert"
        >
          <p className="text-sm text-white/85">
            {pending === 'reshuffle'
              ? 'Draw a new random set of questions? The scores go back to zero and the contest restarts from the welcome screen.'
              : 'Wipe the scores and restart from the welcome screen? The questions stay the same.'}
          </p>
          <span className="flex gap-2 font-display text-sm font-semibold">
            <button
              type="button"
              onClick={() => setPending(null)}
              className="rounded-lg px-3 py-1.5 ring-1 ring-white/20 hover:bg-stage-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              className="rounded-lg bg-lock px-3 py-1.5 text-stage-950 hover:brightness-110"
            >
              {pending === 'reshuffle' ? 'Reshuffle & restart' : 'Restart'}
            </button>
          </span>
        </div>
      )}
    </li>
  )
}
