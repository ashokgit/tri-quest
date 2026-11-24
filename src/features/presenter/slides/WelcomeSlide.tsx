import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { Session } from '@/data/schema'
import { Lozenge, Rail } from '../components/Lozenge'
import { NietSeal } from '../components/NietSeal'
import { NietQuestEmblem } from '../components/NietQuestEmblem'

const NIET_MOTTO = ['Happy', 'Healthy', 'Learning']

/** Opening title card: the show emblem, the event on a gold bar, and the NIET motto cycling below. */
export function WelcomeSlide({ session }: { session: Session }) {
  const [word, setWord] = useState(0)
  // NIET-Quest keeps the NIET motto; other sessions show their own tagline, still.
  const MOTTO = session.emblem ? [session.tagline ?? ''] : NIET_MOTTO

  useEffect(() => {
    const id = window.setInterval(() => setWord((w) => (w + 1) % MOTTO.length), 2400)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <motion.div
        className="absolute top-12 flex items-center gap-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
      >
        <NietSeal size={96} className="ring-2" />
        <div className="font-display leading-tight">
          <p className="text-3xl font-black tracking-wider">NIET</p>
          <p className="text-xl font-semibold text-white/60">National Institute of Engineering and Technology</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.2, opacity: 0, rotate: -40 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 70, damping: 13 }}
      >
        <NietQuestEmblem size={560} label={session.emblem?.label} mark={session.emblem?.mark} />
      </motion.div>

      <motion.div
        className="relative mt-4 w-full px-16"
        initial={{ opacity: 0, scaleX: 0.3 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.9, duration: 0.6, ease: 'easeOut' }}
      >
        <Rail />
        <Lozenge variant="gold" tip={56} className="mx-auto h-[120px] w-[1100px]">
          <span className="w-full text-center font-display text-[56px] font-black tracking-[0.12em] uppercase">{session.event ?? session.title}</span>
        </Lozenge>
      </motion.div>

      <div className="mt-10 h-20 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={word}
            className={`px-16 text-center font-display font-extrabold text-gold uppercase ${session.emblem ? 'text-[44px] tracking-[0.14em]' : 'text-[60px] tracking-[0.25em]'}`}
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -70, opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {MOTTO[word]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
