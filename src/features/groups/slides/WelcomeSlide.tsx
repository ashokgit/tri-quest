import { motion } from 'motion/react'
import type { Session } from '@/data/schema'
import { Lozenge, Rail } from '@/features/presenter/components/Lozenge'
import { NietQuestEmblem } from '@/features/presenter/components/NietQuestEmblem'
import { NietSeal } from '@/features/presenter/components/NietSeal'
import { GroupBadge } from '../components/GroupBadge'

/** Opening title card: the emblem, the course on a gold bar, and the groups lining up below. */
export function GroupWelcomeSlide({ session }: { session: Session }) {
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
        <NietQuestEmblem size={470} label={session.emblem?.label ?? session.title} mark={session.emblem?.mark} />
      </motion.div>

      <motion.div
        className="relative mt-2 w-full px-16"
        initial={{ opacity: 0, scaleX: 0.3 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.9, duration: 0.6, ease: 'easeOut' }}
      >
        <Rail />
        <Lozenge variant="gold" tip={56} className="mx-auto h-[116px] w-[1250px]">
          <span
            className="w-full text-center font-display font-black uppercase"
            style={{
              fontSize: (session.event ?? session.title).length > 28 ? 40 : 46,
              letterSpacing: (session.event ?? session.title).length > 28 ? '0.05em' : '0.1em',
            }}
          >
            {session.event ?? session.title}
          </span>
        </Lozenge>
      </motion.div>

      <div className="mt-9 flex items-center gap-10">
        {session.groups.map((name, g) => (
          <motion.div
            key={g}
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 + g * 0.2, type: 'spring', stiffness: 160, damping: 14 }}
          >
            <GroupBadge g={g} name={name} size={74} />
            <span className="font-display text-[44px] font-black tracking-wide uppercase">Group {name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
