import type { Slide } from '../deck'

/** Slim footer: event name and position in the quiz. */
export function Hud({ slide, event, roundCount }: { slide: Slide; event?: string; roundCount: number }) {
  if (slide.kind === 'welcome' || slide.kind === 'finale') return null
  return (
    <footer className="absolute inset-x-0 bottom-0 flex items-center justify-between px-16 pb-8 font-display text-2xl font-semibold text-white/45">
      <span>{event}</span>
      <span>
        Round {slide.roundIndex + 1} of {roundCount} · {slide.round.title}
      </span>
    </footer>
  )
}
