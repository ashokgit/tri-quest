import { motion } from 'motion/react'
import { useTimeLeft } from './useTimeLeft'

const SIZE = 180
const STROKE = 14
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

/** Circular countdown. Turns red and pulses in the last five seconds. */
export function TimerRing() {
  const { timer, left, running } = useTimeLeft()
  if (timer.key === null) return null

  const seconds = Math.ceil(left / 1000)
  const fraction = timer.durationMs ? left / timer.durationMs : 0
  const urgent = left > 0 && seconds <= 5
  const color = urgent || left === 0 ? 'var(--color-niet-red)' : 'var(--color-gold)'

  return (
    <motion.div
      className="relative grid place-items-center"
      style={{ width: SIZE, height: SIZE }}
      animate={urgent && running ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={urgent && running ? { duration: 1, repeat: Infinity } : undefined}
    >
      <svg width={SIZE} height={SIZE} className="absolute inset-0 -rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="var(--color-stage-900)" stroke="rgb(255 255 255 / 0.1)" strokeWidth={STROKE} />
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
      <span className="relative font-display text-7xl font-extrabold tabular-nums" style={{ color: urgent ? color : undefined }}>
        {seconds}
      </span>
      {!running && left > 0 && (
        <span className="absolute -bottom-9 font-display text-xl font-bold tracking-widest text-white/60 uppercase">Paused</span>
      )}
    </motion.div>
  )
}
