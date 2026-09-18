import { motion } from 'motion/react'
import type { Category, Round } from '@/data/schema'
import { Lozenge, Rail } from '../components/Lozenge'

export interface LadderRung {
  title: string
  icon?: string
}

interface Props {
  round: Round
  roundIndex: number
  category?: Category
  questionCount: number
  timerSeconds: number
  ladder: LadderRung[]
  /** "Round" for category rounds, "Level" for the difficulty ladder. */
  label?: string
}

/** Round title card with a round "ladder" on the right, like a prize ladder. */
export function RoundIntroSlide({ round, roundIndex, category, questionCount, timerSeconds, ladder, label = 'Round' }: Props) {
  return (
    <div className="flex h-full items-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-10 pl-16 text-center">
        {category?.icon && (
          <motion.div
            className="text-[170px] leading-none drop-shadow-[0_0_40px_rgb(245_197_66/0.5)]"
            initial={{ scale: 0, rotate: -120 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12 }}
          >
            {category.icon}
          </motion.div>
        )}

        <motion.p
          className="font-display text-[56px] font-black tracking-[0.5em] text-gold uppercase"
          initial={{ opacity: 0, letterSpacing: '1.2em' }}
          animate={{ opacity: 1, letterSpacing: '0.5em' }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          {label} {roundIndex + 1}
        </motion.p>

        <motion.div
          className="relative w-full"
          initial={{ opacity: 0, scaleX: 0.3 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
        >
          <Rail />
          <Lozenge tip={64} rim={4} className="mx-auto h-[170px] w-fit min-w-[900px]">
            <h2 className="w-full text-center font-display text-[96px] leading-none font-black whitespace-nowrap">{round.title}</h2>
          </Lozenge>
        </motion.div>

        <motion.p
          className="font-display text-[40px] font-semibold text-white/75"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {round.subtitle ?? `${questionCount} question${questionCount === 1 ? '' : 's'} · ${timerSeconds} seconds each`}
        </motion.p>
      </div>

      {/* Round ladder */}
      <div className="mr-16 flex w-[460px] flex-col-reverse gap-3 rounded-3xl bg-black/45 p-6 ring-2 ring-white/10 backdrop-blur">
        {ladder.map((rung, i) => {
          const current = i === roundIndex
          const done = i < roundIndex
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
            >
              <Lozenge variant={current ? 'locked' : 'idle'} tip={22} rim={current ? 3 : 2} className="h-[64px]">
                <span className={`mr-4 w-9 font-display text-3xl font-black ${current ? '' : done ? 'text-white/35' : 'text-gold'}`}>{i + 1}</span>
                <span className={`truncate font-display text-[28px] font-bold ${done ? 'text-white/35 line-through' : ''}`}>
                  {rung.title}
                </span>
              </Lozenge>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
