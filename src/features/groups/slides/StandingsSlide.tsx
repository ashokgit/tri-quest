import { motion } from 'motion/react'
import { Lozenge, Rail } from '@/features/presenter/components/Lozenge'
import { GroupBadge } from '../components/GroupBadge'
import { placesOf } from '../engine'

interface Props {
  title: string
  names: string[]
  scores: number[]
  /** Points each group earned in the round just played. */
  gained: number[]
}

const MEDAL = ['🥇', '🥈', '🥉']

/** Between rounds: every group, best first, with the points just earned. */
export function GroupStandingsSlide({ title, names, scores, gained }: Props) {
  const places = placesOf(scores)
  const order = names.map((_, g) => g).sort((a, b) => scores[b] - scores[a] || a - b)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-9 px-40">
      <motion.p
        className="font-display text-[44px] font-black tracking-[0.45em] text-gold uppercase"
        initial={{ opacity: 0, letterSpacing: '1em' }}
        animate={{ opacity: 1, letterSpacing: '0.45em' }}
        transition={{ duration: 0.7 }}
      >
        Standings
      </motion.p>
      <motion.p
        className="-mt-5 font-display text-[34px] font-semibold text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        after {title}
      </motion.p>

      <div className="w-full space-y-6">
        {order.map((g, row) => (
          <motion.div
            key={g}
            className="relative"
            initial={{ opacity: 0, scaleX: 0.5, y: 30 }}
            animate={{ opacity: 1, scaleX: 1, y: 0 }}
            transition={{ delay: 0.5 + row * 0.35, duration: 0.45, ease: 'easeOut' }}
          >
            <Rail />
            <Lozenge variant={places[g] === 1 ? 'gold' : 'idle'} tip={56} className="mx-auto h-[130px] w-[1250px]">
              <span className="mr-5 w-16 text-center text-[54px]">{MEDAL[places[g] - 1] ?? `#${places[g]}`}</span>
              <GroupBadge g={g} name={names[g]} size={80} className="mr-6" />
              <span className="flex-1 font-display text-[50px] font-black tracking-wide uppercase">Group {names[g]}</span>
              {gained[g] !== 0 && (
                <span
                  className={`mr-8 font-display text-[34px] font-extrabold ${gained[g] > 0 ? 'text-correct' : 'text-rose-300'}`}
                >
                  {gained[g] > 0 ? '+' : ''}
                  {gained[g]}
                </span>
              )}
              <span className="font-display text-[78px] leading-none font-black tabular-nums">{scores[g]}</span>
            </Lozenge>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
