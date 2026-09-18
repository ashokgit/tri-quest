import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

/**
 * The game-show "lozenge": an elongated hexagon with a metallic rim, used for
 * the question bar, answer options and labels.
 */
export type LozengeVariant = 'idle' | 'locked' | 'correct' | 'wrong' | 'gold'

const RIM: Record<LozengeVariant, string> = {
  idle: 'linear-gradient(180deg, #f1f5fb 0%, #8795ad 48%, #5d6b84 52%, #e3e9f2 100%)',
  gold: 'linear-gradient(180deg, #fff1c2 0%, #d9a534 48%, #a8741a 52%, #ffe39a 100%)',
  locked: 'linear-gradient(180deg, #fff6dc 0%, #ffd27a 50%, #fff0c8 100%)',
  correct: 'linear-gradient(180deg, #e3ffe9 0%, #8ff0a4 50%, #dcffe5 100%)',
  wrong: 'linear-gradient(180deg, #ffd9d9 0%, #e07a7a 50%, #ffd0d0 100%)',
}

const FILL: Record<LozengeVariant, string> = {
  idle: 'linear-gradient(180deg, #13295a 0%, #050b1d 46%, #020612 54%, #102350 100%)',
  gold: 'linear-gradient(180deg, #13295a 0%, #050b1d 46%, #020612 54%, #102350 100%)',
  locked: 'linear-gradient(180deg, #ffd88a 0%, #f59e0b 48%, #d97f00 52%, #ffb938 100%)',
  correct: 'linear-gradient(180deg, #9ef5b0 0%, #22c55e 48%, #149a45 52%, #52e07f 100%)',
  wrong: 'linear-gradient(180deg, #f08a8a 0%, #c62b2f 48%, #9c1d21 52%, #e0484c 100%)',
}

const GLOW: Partial<Record<LozengeVariant, string>> = {
  locked: 'drop-shadow(0 0 22px rgb(245 158 11 / 0.75))',
  correct: 'drop-shadow(0 0 30px rgb(34 197 94 / 0.85))',
  gold: 'drop-shadow(0 0 18px rgb(245 197 66 / 0.35))',
}

const shape = (tip: number) =>
  `polygon(${tip}px 0, calc(100% - ${tip}px) 0, 100% 50%, calc(100% - ${tip}px) 100%, ${tip}px 100%, 0 50%)`

interface Props {
  variant?: LozengeVariant
  /** Width of the pointed ends in px. */
  tip?: number
  rim?: number
  className?: string
  style?: CSSProperties
  /** Blink the fill a few times (the "correct answer" flash). */
  flash?: boolean
  children?: ReactNode
}

export function Lozenge({ variant = 'idle', tip = 48, rim = 3, className = '', style, flash = false, children }: Props) {
  const dark = variant === 'idle' || variant === 'gold'
  return (
    <div className={`relative flex ${className}`} style={{ filter: GLOW[variant], ...style }}>
      <div className="absolute inset-0" style={{ clipPath: shape(tip), background: RIM[variant] }} />
      <motion.div
        className="absolute"
        style={{ inset: rim, clipPath: shape(tip - rim / 2), background: FILL[variant] }}
        animate={flash ? { opacity: [1, 0.35, 1, 0.35, 1, 0.35, 1] } : { opacity: 1 }}
        transition={flash ? { duration: 1.4, ease: 'linear' } : { duration: 0.2 }}
      />
      <div
        className={`relative flex flex-1 items-center ${dark ? 'text-white' : 'text-stage-950'}`}
        style={{ paddingInline: tip + 8 }}
      >
        {children}
      </div>
    </div>
  )
}

/** The thin rail that runs edge to edge behind a row of lozenges. */
export function Rail({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 ${className}`}
      style={{ background: 'linear-gradient(90deg, transparent 0%, #8795ad 12%, #e3e9f2 50%, #8795ad 88%, transparent 100%)' }}
    />
  )
}
