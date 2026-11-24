import { motion } from 'motion/react'
import { Lozenge, Rail, type LozengeVariant } from '@/features/presenter/components/Lozenge'
import { optionLetter } from '@/features/presenter/components/palette'
import { GroupBadge } from './GroupBadge'

interface Props {
  options: string[]
  correct: number
  resolved: boolean
  /** Option the host locked in for the group answering (amber). */
  locked: number | null
  /** Option shown red while a wrong-answer call-out is up. */
  wrong: number | null
  /** Options earlier groups already got wrong, with who tried them. */
  tried: { k: number; g: number }[]
  names: string[]
  /** Options a 50:50 has taken away. */
  hidden: number[]
  /** Fade each tile in one after the other. */
  sequential: boolean
}

/**
 * Answer rows, two lozenges per row on a rail, as in the main show, plus the states a group
 * contest needs: tiles ruled out by an earlier group, and tiles removed by a 50:50.
 */
export function GroupOptionTiles({ options, correct, resolved, locked, wrong, tried, names, hidden, sequential }: Props) {
  const rows: number[][] = []
  for (let i = 0; i < options.length; i += 2) rows.push(options.slice(i, i + 2).map((_, j) => i + j))

  const variantFor = (i: number): LozengeVariant => {
    if (resolved && i === correct) return 'correct'
    if (wrong === i) return 'wrong'
    if (locked === i) return 'locked'
    if (resolved || hidden.includes(i) || tried.some((t) => t.k === i)) return 'dim'
    return 'idle'
  }

  return (
    <div className="space-y-4">
      {rows.map((row, r) => (
        <div key={r} className="relative px-14">
          <Rail />
          <div className="relative grid grid-cols-2 gap-x-20">
            {row.map((i) => {
              const variant = variantFor(i)
              const plain = variant === 'idle' || variant === 'dim'
              const out = !resolved && (hidden.includes(i) || tried.some((t) => t.k === i))
              const by = tried.find((t) => t.k === i)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scaleX: 0.6 }}
                  animate={{ opacity: hidden.includes(i) && !resolved ? 0.45 : 1, scaleX: 1 }}
                  transition={{ delay: resolved ? 0 : sequential ? i * 0.5 : 0, duration: 0.35, ease: 'easeOut' }}
                >
                  <Lozenge variant={variant} flash={variant === 'correct'} className="h-[108px]">
                    <span
                      className={`mr-4 shrink-0 font-display text-[40px] font-black whitespace-nowrap ${variant === 'idle' ? 'text-gold' : variant === 'dim' ? 'text-gold/30' : ''}`}
                    >
                      {plain ? '◆ ' : ''}
                      {optionLetter(i)}:
                    </span>
                    <span
                      data-option-text
                      className={`font-display leading-[1.12] font-bold ${out ? 'line-through decoration-2' : ''}`}
                      style={{ fontSize: optionFontSize(options[i]) }}
                    >
                      {options[i]}
                    </span>
                    {by && <GroupBadge g={by.g} name={names[by.g]} size={40} className="ml-auto shrink-0 opacity-90" />}
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
  if (text.length > 44) return 29
  if (text.length > 36) return 32
  if (text.length > 26) return 35
  return 40
}
