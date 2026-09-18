import { motion } from 'motion/react'

const SHORTCUTS: [string, string][] = [
  ['→  Space  PgDn', 'Next step'],
  ['←  PgUp', 'Previous step'],
  ['A – D', "Lock in a student's answer (amber)"],
  ['R', 'Reveal answer'],
  ['N', 'Skip to next slide'],
  ['T', 'Start / pause timer'],
  ['+  −', 'Add / remove 10 seconds'],
  ['P', 'Play / pause audio or video'],
  ['1 – 9', 'Jump to round'],
  ['Home', 'Back to welcome'],
  ['.', 'Blank the screen'],
  ['M', 'Mute sounds'],
  ['F', 'Full screen'],
  ['H  ?', 'Show / hide this help'],
]

export function HelpOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-40 grid place-items-center bg-stage-950/85 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-[960px] rounded-[40px] bg-stage-800 p-14 ring-2 ring-white/10">
        <h2 className="mb-8 font-display text-5xl font-extrabold">Host controls</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-10 gap-y-3 text-[28px]">
          {SHORTCUTS.map(([keys, action]) => (
            <div key={keys} className="contents">
              <dt className="font-display font-bold text-gold">{keys}</dt>
              <dd className="text-white/80">{action}</dd>
            </div>
          ))}
        </dl>
      </div>
    </motion.div>
  )
}
