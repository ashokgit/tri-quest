import { motion } from 'motion/react'
import { Lozenge, Rail, type LozengeVariant } from './Lozenge'
import { optionLetter } from './palette'

interface Props {
  options: string[]
  correctIndex: number
  revealed: boolean
  /** Answer the host locked in for the student (shown amber until the reveal). */
  lockedIndex: number | null
  sequential: boolean
}

/**
 * Game-show answer rows: two lozenges per row on a rail. A locked answer turns
 * amber; on reveal the correct one flashes green and a wrong lock turns red.
 */
export function OptionTiles({ options, correctIndex, revealed, lockedIndex, sequential }: Props) {
  const rows: number[][] = []
  for (let i = 0; i < options.length; i += 2) rows.push(options.slice(i, i + 2).map((_, j) => i + j))

  const variantFor = (i: number): LozengeVariant => {
    if (revealed && i === correctIndex) return 'correct'
    if (revealed && i === lockedIndex) return 'wrong'
    if (i === lockedIndex) return 'locked'
    return 'idle'
  }

  return (
    <div className="space-y-6">
      {rows.map((row, r) => (
        <div key={r} className="relative px-16">
          <Rail />
          <div className="relative grid grid-cols-2 gap-x-24">
            {row.map((i) => {
              const variant = variantFor(i)
              const faded = revealed && variant === 'idle'
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scaleX: 0.6 }}
                  animate={{ opacity: faded ? 0.35 : 1, scaleX: 1 }}
                  transition={{ delay: revealed ? 0 : sequential ? i * 0.6 : 0, duration: 0.35, ease: 'easeOut' }}
                >
                  <Lozenge variant={variant} flash={variant === 'correct'} className="h-[118px]">
                    <span className={`mr-5 font-display text-[44px] font-black ${variant === 'idle' ? 'text-gold' : ''}`}>
                      {variant === 'idle' ? '◆' : ''} {optionLetter(i)}:
                    </span>
                    <span className="font-display text-[44px] leading-tight font-bold">{options[i]}</span>
                  </Lozenge>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
