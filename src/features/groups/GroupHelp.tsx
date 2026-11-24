import { motion } from 'motion/react'

const SHORTCUTS: [string, string][] = [
  ['A – D', "Lock in the answering group's choice (amber)"],
  ['→  Space  Enter', 'Next step · confirm the locked answer · next question'],
  ['A – D  (rapid fire)', 'Counts straight away, no lock'],
  ['U', 'Undo the last thing on this question'],
  ['R', 'Show the answer, nobody scores'],
  ['X', "Time's up now (pass it on)"],
  ['T', 'Pause / resume the clock (or the auto-advance)'],
  ['+  −', 'Add / remove 10 seconds'],
  ['L   K', '50:50 · Hint (hard round, once per group)'],
  ['←  PgUp', 'Previous slide'],
  ['N', 'Skip to the next slide'],
  ['1 – 9', 'Jump to round'],
  ['Home  End', 'Welcome · result'],
  ['.', 'Blank the screen'],
  ['M   F   H', 'Mute · full screen · this help'],
]

export function GroupHelp() {
  return (
    <motion.div
      className="absolute inset-0 z-40 grid place-items-center bg-stage-950/85 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-[1040px] rounded-[40px] bg-stage-800 p-12 ring-2 ring-white/10">
        <h2 className="mb-6 font-display text-5xl font-extrabold">Host controls · groups</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-10 gap-y-2 text-[26px]">
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
