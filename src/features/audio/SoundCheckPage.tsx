import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { usePresenterStore } from '@/features/presenter/store'
import type { OneShotCue } from './cues'
import { sfx } from './sfx'

const ONE_SHOTS: { cue: OneShotCue; label: string; when: string; variant?: number }[] = [
  { cue: 'theme', label: 'Round 1 theme', when: 'Leaving the welcome screen' },
  { cue: 'roundIntro', label: 'Round intro', when: 'Each round title card' },
  { cue: 'optionIn', label: 'Answer slides in', when: 'Each answer bar (A/C left, B/D right)' },
  { cue: 'tick', label: 'Countdown tick', when: 'Last 5 seconds, rising in pitch', variant: 3 },
  { cue: 'timeUp', label: 'Time up', when: 'Clock hits zero: "Hands up!"' },
  { cue: 'lock', label: 'Final answer', when: 'Host locks an answer with A–D' },
  { cue: 'correct', label: 'Correct', when: 'Reveal: right answer' },
  { cue: 'wrong', label: 'Wrong', when: 'Reveal: locked answer was wrong' },
  { cue: 'reveal', label: 'Answer reveal', when: 'Open questions' },
  { cue: 'finale', label: 'Finale fanfare', when: 'Closing slide (with confetti)' },
]

/** Audition every sound and set the hall volume before the show. */
export function SoundCheckPage() {
  const volume = usePresenterStore((s) => s.volume)
  const setVolume = usePresenterStore((s) => s.setVolume)
  const muted = usePresenterStore((s) => s.muted)
  const toggleMuted = usePresenterStore((s) => s.toggleMuted)
  const [bed, setBed] = useState(false)
  const [intensity, setIntensity] = useState(0)
  const [suspense, setSuspense] = useState(false)
  const [lobby, setLobby] = useState(false)

  useEffect(() => sfx.setVolume(volume), [volume])
  useEffect(() => sfx.setMuted(muted), [muted])
  useEffect(() => sfx.setBedIntensity(intensity), [intensity, bed])
  useEffect(() => () => sfx.stopAll(), [])

  const play = (cue: OneShotCue, variant = 0) => {
    sfx.unlock()
    // The first click only unlocks audio; give the context a moment to start.
    window.setTimeout(() => {
      if (cue === 'optionIn') [0, 1, 2, 3].forEach((i) => sfx.play('optionIn', i * 0.6, i))
      else sfx.play(cue, 0, variant)
    }, sfx.ready ? 0 : 150)
  }

  const toggleLoop = (cue: 'bed' | 'suspense' | 'lobby', on: boolean, set: (v: boolean) => void) => {
    sfx.unlock()
    window.setTimeout(() => (on ? sfx.stopLoop(cue) : sfx.startLoop(cue)), sfx.ready ? 0 : 150)
    set(!on)
  }

  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto max-w-4xl space-y-8 p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.3em] text-white/50 uppercase">Sound check</p>
            <h1 className="font-display text-4xl font-extrabold">Tri-Quest sounds</h1>
            <p className="mt-2 text-white/60">Test every cue on the hall speakers and set the volume. It's saved for the show.</p>
          </div>
          <Link to="/" className="rounded-xl px-4 py-2 font-display font-semibold ring-1 ring-white/15 hover:bg-stage-700">
            ← Sessions
          </Link>
        </header>

        <section className="flex flex-wrap items-center gap-6 rounded-2xl bg-stage-800 p-5 ring-1 ring-white/10">
          <label className="flex flex-1 items-center gap-4 font-display font-semibold">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-[var(--color-gold)]"
            />
            <span className="w-12 text-right tabular-nums">{Math.round(volume * 100)}%</span>
          </label>
          <button
            type="button"
            onClick={toggleMuted}
            className={`rounded-xl px-4 py-2 font-display font-semibold ring-1 ${muted ? 'bg-niet-red ring-niet-red' : 'ring-white/15 hover:bg-stage-700'}`}
          >
            {muted ? '🔇 Muted' : '🔊 Sound on'}
          </button>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Cues</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ONE_SHOTS.map(({ cue, label, when, variant }) => (
              <button
                key={cue}
                type="button"
                onClick={() => play(cue, variant)}
                className="rounded-2xl bg-stage-800 p-4 text-left ring-1 ring-white/10 transition hover:bg-stage-700 hover:ring-gold/50 active:scale-[0.98]"
              >
                <span className="block font-display text-lg font-bold">▶ {label}</span>
                <span className="text-sm text-white/55">{when}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Loops</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3 rounded-2xl bg-stage-800 p-4 ring-1 ring-white/10 sm:col-span-2">
              <button type="button" onClick={() => toggleLoop('lobby', lobby, setLobby)} className="font-display text-lg font-bold">
                {lobby ? '■ Stop' : '▶ Play'} intro + welcome music
              </button>
              <p className="text-sm text-white/55">
                On the welcome screen: an opening fanfare (~10 s), then faint music the host can talk over. Press I to replay the fanfare.
              </p>
            </div>
            <div className="space-y-3 rounded-2xl bg-stage-800 p-4 ring-1 ring-white/10">
              <button type="button" onClick={() => toggleLoop('bed', bed, setBed)} className="font-display text-lg font-bold">
                {bed ? '■ Stop' : '▶ Play'} clock music
              </button>
              <p className="text-sm text-white/55">Plays while the timer runs, building up as time runs out. Drag to hear it build:</p>
              <label className="flex items-center gap-3 text-sm">
                Calm
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="flex-1 accent-[var(--color-gold)]"
                />
                Final seconds
              </label>
            </div>
            <div className="space-y-3 rounded-2xl bg-stage-800 p-4 ring-1 ring-white/10">
              <button type="button" onClick={() => toggleLoop('suspense', suspense, setSuspense)} className="font-display text-lg font-bold">
                {suspense ? '■ Stop' : '▶ Play'} final-answer suspense
              </button>
              <p className="text-sm text-white/55">Holds from lock-in (A–D) until the reveal.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
