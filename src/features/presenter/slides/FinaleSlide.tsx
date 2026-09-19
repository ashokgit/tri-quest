import { motion } from 'motion/react'
import type { Session } from '@/data/schema'
import { Lozenge, Rail } from '../components/Lozenge'
import { NietSeal } from '../components/NietSeal'
import { NietQuestEmblem } from '../components/NietQuestEmblem'

export function FinaleSlide({ session }: { session: Session }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-10">
      <motion.div initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 80, damping: 12 }}>
        <NietQuestEmblem size={400} />
      </motion.div>

      <motion.div
        className="relative w-full px-16"
        initial={{ opacity: 0, scaleX: 0.3 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Rail />
        <Lozenge variant="correct" tip={70} rim={4} flash className="mx-auto h-[170px] w-[1000px]">
          <span className="w-full text-center font-display text-[110px] leading-none font-black">Thank you!</span>
        </Lozenge>
      </motion.div>

      <motion.div
        className="flex items-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <NietSeal size={110} className="ring-2" />
        <div className="font-display">
          <p className="text-[52px] leading-tight font-black text-gold">Welcome to the NIET family 🎉</p>
          <p className="text-3xl font-semibold text-white/60">
            {session.title} · {session.event}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
