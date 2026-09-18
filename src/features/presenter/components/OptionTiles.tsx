import { motion } from 'motion/react'
import { optionColor, optionLetter } from './palette'

interface Props {
  options: string[]
  correctIndex: number
  revealed: boolean
  sequential: boolean
  /** Compact layout when media shares the screen. */
  compact?: boolean
}

/** A–D answer tiles. On reveal the correct tile glows and the rest fade back. */
export function OptionTiles({ options, correctIndex, revealed, sequential, compact = false }: Props) {
  const twoColumns = options.length > 2 || !compact

  return (
    <div className={`grid gap-6 ${twoColumns ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map((text, i) => {
        const correct = i === correctIndex
        const color = optionColor(i)
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{
              opacity: revealed && !correct ? 0.28 : 1,
              y: 0,
              scale: revealed && correct ? 1.04 : 1,
            }}
            transition={{
              delay: revealed ? 0 : sequential ? i * 0.55 : 0,
              type: 'spring',
              stiffness: 260,
              damping: 22,
            }}
            className="relative flex items-center gap-6 rounded-3xl bg-stage-800/90 px-7 ring-2"
            style={{
              minHeight: compact ? 104 : 136,
              ['--tw-ring-color' as string]: revealed && correct ? 'var(--color-correct)' : 'rgb(255 255 255 / 0.1)',
              boxShadow: revealed && correct ? '0 0 60px 0 rgb(34 197 94 / 0.55)' : undefined,
            }}
          >
            <span
              className="grid shrink-0 place-items-center rounded-2xl font-display font-extrabold text-stage-950"
              style={{
                width: compact ? 64 : 80,
                height: compact ? 64 : 80,
                fontSize: compact ? 36 : 44,
                background: revealed && correct ? 'var(--color-correct)' : color,
              }}
            >
              {revealed && correct ? '✓' : optionLetter(i)}
            </span>
            <span className={`font-display leading-tight font-bold ${compact ? 'text-4xl' : 'text-5xl'}`}>{text}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
