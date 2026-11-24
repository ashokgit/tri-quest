import { AnimatePresence, motion } from 'motion/react'
import { Lozenge, type LozengeVariant } from '@/features/presenter/components/Lozenge'
import type { Flash } from '../store'

const VARIANT: Record<Flash['kind'], LozengeVariant> = {
  wrong: 'wrong',
  timeup: 'locked',
  pass: 'gold',
  block: 'gold',
  right: 'correct',
}

/** A big call-out over the stage: wrong answer, time up, a pass, or a new group's block starting. */
export function FlashOverlay({ flash }: { flash: Flash | null }) {
  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.id}
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            initial={{ scale: 0.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          >
            <Lozenge variant={VARIANT[flash.kind]} tip={90} rim={5} className="min-h-[250px] min-w-[1100px] px-8">
              <span className="flex w-full flex-col items-center gap-3 py-6 text-center">
                <span className="font-display text-[130px] leading-none font-black tracking-tight">{flash.title}</span>
                {flash.sub && <span className="font-display text-[44px] font-bold opacity-85">{flash.sub}</span>}
              </span>
            </Lozenge>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
