import { motion } from 'motion/react'
import type { Session } from '@/data/schema'
import { Lozenge, Rail } from '@/features/presenter/components/Lozenge'
import { NietSeal } from '@/features/presenter/components/NietSeal'
import { GroupBadge } from '../components/GroupBadge'
import { placesOf } from '../engine'

const MEDAL = ['🥇', '🥈', '🥉']

/** The result: the winner on a green bar (or the tie), then every group's final score. */
export function GroupFinaleSlide({ session, names, scores }: { session: Session; names: string[]; scores: number[] }) {
  const places = placesOf(scores)
  const champs = names.map((_, g) => g).filter((g) => places[g] === 1)
  const order = names.map((_, g) => g).sort((a, b) => scores[b] - scores[a] || a - b)
  const tie = champs.length > 1
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-32">
      <motion.p
        className="font-display text-[40px] font-black tracking-[0.5em] text-gold uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {tie ? 'Dead heat' : 'The winner'}
      </motion.p>

      <motion.div
        className="relative w-full"
        initial={{ opacity: 0, scaleX: 0.3 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Rail />
        <Lozenge variant="correct" tip={80} rim={4} flash className="mx-auto h-[190px] w-[1500px]">
          <span className="flex w-full items-center justify-center gap-8">
            {champs.map((g) => (
              <GroupBadge key={g} g={g} name={names[g]} size={110} />
            ))}
            <span className="font-display text-[88px] leading-none font-black">
              {tie ? `Groups ${champs.map((g) => names[g]).join(' & ')}` : `Group ${names[champs[0]]} wins!`}
            </span>
          </span>
        </Lozenge>
      </motion.div>

      <div className="flex gap-6">
        {order.map((g, i) => (
          <motion.div
            key={g}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.25, type: 'spring', stiffness: 150, damping: 14 }}
          >
            <Lozenge variant={places[g] === 1 ? 'gold' : 'idle'} tip={34} className="h-[110px] w-[500px]">
              <span className="mr-3 text-[40px]">{MEDAL[places[g] - 1] ?? `#${places[g]}`}</span>
              <GroupBadge g={g} name={names[g]} size={60} className="mr-4" />
              <span className="flex-1 font-display text-[28px] font-black tracking-wide whitespace-nowrap uppercase">
                Group {names[g]}
              </span>
              <span className="font-display text-[56px] leading-none font-black tabular-nums">{scores[g]}</span>
            </Lozenge>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-2 flex items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
      >
        <NietSeal size={84} className="ring-2" />
        <p className="font-display text-[34px] font-semibold text-white/65">
          {session.title} · {session.event}
        </p>
      </motion.div>
    </div>
  )
}
