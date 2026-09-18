import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { Session } from '@/data/schema'
import { NietSeal } from '../components/NietSeal'

const MOTTO = ['Happy', 'Healthy', 'Learning']

export function WelcomeSlide({ session }: { session: Session }) {
  const [word, setWord] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setWord((w) => (w + 1) % MOTTO.length), 2200)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      >
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          <NietSeal size={280} />
        </motion.div>
      </motion.div>

      {session.event && (
        <motion.p
          className="font-display text-4xl font-semibold tracking-[0.35em] text-white/70 uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {session.event}
        </motion.p>
      )}

      <motion.h1
        className="font-display text-[190px] leading-none font-black tracking-tight"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 150, damping: 15 }}
      >
        <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">{session.title}</span>
      </motion.h1>

      <div className="h-16 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={word}
            className="font-display text-5xl font-bold text-niet-red"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {MOTTO[word]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
