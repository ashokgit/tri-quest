import { motion } from 'motion/react'
import type { Session } from '@/data/schema'
import { NietSeal } from '../components/NietSeal'

export function FinaleSlide({ session }: { session: Session }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}>
        <NietSeal size={220} />
      </motion.div>
      <motion.h1
        className="font-display text-[150px] leading-none font-black"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Thank you!
      </motion.h1>
      <motion.p
        className="font-display text-5xl font-bold text-gold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Welcome to the NIET family 🎉
      </motion.p>
      <motion.p className="text-3xl text-white/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        {session.title} · {session.event}
      </motion.p>
    </div>
  )
}
