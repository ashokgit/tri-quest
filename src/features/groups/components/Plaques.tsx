import { motion } from 'motion/react'
import { Lozenge } from '@/features/presenter/components/Lozenge'
import { placesOf } from '../engine'
import { GroupBadge } from './GroupBadge'

interface Props {
  names: string[]
  scores: number[]
  /** The group answering now, lit amber. */
  lit: number | null
  /** The group that just scored, lit green. */
  won: number | null
  /** Lifelines left per group, when the round has them. */
  lifelines?: { fifty: boolean; hint: boolean }[]
  className?: string
}

/** The scoreboard: one lozenge per group with its score and place. */
export function Plaques({ names, scores, lit, won, lifelines, className = '' }: Props) {
  const places = placesOf(scores)
  const compact = names.length > 3
  return (
    <div className={`flex gap-3 ${className}`}>
      {names.map((name, g) => {
        const variant = won === g ? 'correct' : lit === g ? 'locked' : 'idle'
        const light = variant !== 'idle'
        return (
          <motion.div
            key={g}
            className="min-w-0 flex-1"
            animate={{ y: lit === g || won === g ? -4 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Lozenge variant={variant} tip={26} rim={3} className="h-[88px]">
              <GroupBadge g={g} name={name} size={54} className="mr-3" />
              {!compact && (
                <span className="min-w-0 flex-1 leading-tight">
                  <span
                    className={`block truncate font-display text-[19px] font-extrabold tracking-[0.14em] uppercase ${light ? '' : 'text-white/70'}`}
                  >
                    Group {name}
                  </span>
                  {lifelines ? (
                    <span className="mt-1 flex gap-1.5">
                      {(['fifty', 'hint'] as const).map((k) => (
                        <span
                          key={k}
                          className={`rounded px-1.5 font-display text-[12px] font-black tracking-wide ${
                            lifelines[g][k]
                              ? 'bg-black/25 text-white/45 line-through'
                              : light
                                ? 'bg-stage-950/80 text-gold'
                                : 'bg-gold/20 text-gold'
                          }`}
                        >
                          {k === 'fifty' ? '50:50' : 'HINT'}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className={`block font-display text-[16px] font-bold ${light ? 'opacity-70' : 'text-white/40'}`}>
                      #{places[g]}
                    </span>
                  )}
                </span>
              )}
              <motion.span
                key={scores[g]}
                className="ml-auto font-display text-[52px] leading-none font-black tabular-nums"
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              >
                {scores[g]}
              </motion.span>
            </Lozenge>
          </motion.div>
        )
      })}
    </div>
  )
}
