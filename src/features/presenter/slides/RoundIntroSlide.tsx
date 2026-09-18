import { motion } from 'motion/react'
import type { Category, Round } from '@/data/schema'

interface Props {
  round: Round
  roundIndex: number
  category?: Category
  questionCount: number
  timerSeconds: number
}

/** "Round 2" card on the seal's red ribbon. */
export function RoundIntroSlide({ round, roundIndex, category, questionCount, timerSeconds }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-12 text-center">
      {category?.icon && (
        <motion.div
          className="text-[180px] leading-none"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 12 }}
        >
          {category.icon}
        </motion.div>
      )}

      <motion.p
        className="font-display text-5xl font-bold tracking-[0.4em] text-white/60 uppercase"
        initial={{ opacity: 0, letterSpacing: '1em' }}
        animate={{ opacity: 1, letterSpacing: '0.4em' }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        Round {roundIndex + 1}
      </motion.p>

      <motion.div
        className="relative bg-niet-red px-24 py-8 shadow-[0_20px_60px_rgb(198_43_47/0.45)]"
        style={{ clipPath: 'polygon(0 0, 100% 0, 96% 50%, 100% 100%, 0 100%, 4% 50%)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.45, type: 'spring', stiffness: 140, damping: 16 }}
      >
        <h2 className="font-display text-[110px] leading-none font-black">{round.title}</h2>
      </motion.div>

      <motion.p
        className="font-display text-4xl font-semibold text-white/70"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        {round.subtitle ?? `${questionCount} question${questionCount === 1 ? '' : 's'} · ${timerSeconds} seconds each`}
      </motion.p>
    </div>
  )
}
