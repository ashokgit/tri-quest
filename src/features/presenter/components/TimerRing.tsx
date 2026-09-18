import { motion } from 'motion/react'
import { useTimeLeft } from './useTimeLeft'

const SIZE = 200
const STROKE = 16
const R = (SIZE - STROKE) / 2 - 6
const CIRC = 2 * Math.PI * R

/** Game-show clock: gold arc on a dark dial, amber then red and pulsing in the last five seconds. */
export function TimerRing() {
  const { timer, left, running } = useTimeLeft()
  if (timer.key === null) return null

  const seconds = Math.ceil(left / 1000)
  const fraction = timer.durationMs ? left / timer.durationMs : 0
  const urgent = seconds <= 5
  const color = urgent ? '#ef4444' : seconds <= 10 ? 'var(--color-lock)' : 'var(--color-gold)'

  return (
    <motion.div
      className="relative grid place-items-center"
      style={{ width: SIZE, height: SIZE, filter: `drop-shadow(0 0 28px ${urgent ? 'rgb(239 68 68 / 0.6)' : 'rgb(245 197 66 / 0.35)'})` }}
      animate={urgent && running && left > 0 ? { scale: [1, 1.07, 1] } : { scale: 1 }}
      transition={urgent && running ? { duration: 1, repeat: Infinity } : undefined}
    >
      <svg width={SIZE} height={SIZE} className="absolute inset-0 -rotate-90">
        <defs>
          <radialGradient id="dial" cx="0.5" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#1b3f8f" />
            <stop offset="1" stopColor="#030a1c" />
          </radialGradient>
        </defs>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} fill="url(#dial)" stroke="#cfd8e6" strokeWidth={3} />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - fraction)}
          style={{ transition: 'stroke-dashoffset 100ms linear, stroke 300ms' }}
        />
      </svg>
      <span className="relative font-display text-[84px] font-black tabular-nums" style={{ color: urgent ? color : 'white' }}>
        {seconds}
      </span>
      {!running && left > 0 && (
        <span className="absolute -bottom-10 font-display text-2xl font-extrabold tracking-[0.3em] text-white/70 uppercase">Paused</span>
      )}
    </motion.div>
  )
}
