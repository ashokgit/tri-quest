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
    return revealed ? 'dim' : 'idle'
  }

  return (
    <div className="space-y-6">
      {rows.map((row, r) => (
        <div key={r} className="relative px-16">
          <Rail />
          <div className="relative grid grid-cols-2 gap-x-24">
            {row.map((i) => {
              const variant = variantFor(i)
              const plain = variant === 'idle' || variant === 'dim'
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scaleX: 0.6 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: revealed ? 0 : sequential ? i * 0.6 : 0, duration: 0.35, ease: 'easeOut' }}
                >
                  <Lozenge variant={variant} flash={variant === 'correct'} className="h-[118px]">
                    <span
                      className={`mr-5 shrink-0 font-display text-[44px] font-black whitespace-nowrap ${variant === 'idle' ? 'text-gold' : variant === 'dim' ? 'text-gold/30' : ''}`}
                    >
                      {plain ? '◆ ' : ''}
                      {optionLetter(i)}:
                    </span>
                    <span data-option-text className="font-display leading-[1.12] font-bold" style={{ fontSize: optionFontSize(options[i]) }}>
                      {options[i]}
                    </span>
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

/** Long answers shrink so they fit the bar in at most two lines. */
function optionFontSize(text: string) {
  if (text.length > 38) return 34
  if (text.length > 26) return 38
  return 44
}
