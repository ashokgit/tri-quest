import confetti from 'canvas-confetti'
import { useEffect, useRef } from 'react'
import type { Session } from '@/data/schema'
import { correctOptionIndex, optionLabels, stagesFor, type Position, type Slide } from './deck'
import { useTimeLeft } from './components/useTimeLeft'
import { sfx } from './sfx'
import { usePresenterStore } from './store'

/** Delay between answer bars sliding in; matches the stagger in OptionTiles. */
const OPTION_STAGGER = 0.6

/**
 * Plays sound cues (and the finale confetti) in response to what's on stage.
 * Cues only fire when moving forward, so stepping back to re-read a question stays quiet.
 */
export function SoundDirector({ deck, pos, session }: { deck: Slide[]; pos: Position; session: Session }) {
  const muted = usePresenterStore((s) => s.muted)
  const locked = usePresenterStore((s) => s.locked)
  const { timer, left, running } = useTimeLeft()
  const prevPos = useRef<Position | null>(null)
  const prevLeft = useRef(left)

  useEffect(() => sfx.setMuted(muted), [muted])

  // Stage transitions.
  useEffect(() => {
    const prev = prevPos.current
    prevPos.current = pos
    if (!prev) return
    const forward = pos.slide > prev.slide || (pos.slide === prev.slide && pos.stage > prev.stage)
    if (!forward) return

    const slide = deck[pos.slide]
    if (pos.slide !== prev.slide && slide.kind === 'round') sfx.play('roundIntro')
    if (pos.slide !== prev.slide && slide.kind === 'finale') {
      sfx.play('finale')
      celebrate()
    }
    if (slide.kind !== 'question') return

    const q = slide.question
    const stage = stagesFor(slide)[pos.stage]
    if (stage === 'options') {
      const count = optionLabels(q)?.length ?? 0
      const sequential = session.defaults.optionReveal === 'sequential'
      for (let i = 0; i < (sequential ? count : 1); i++) sfx.play('optionIn', i * OPTION_STAGGER, i)
    }
    if (stage === 'answer') {
      const lockedIndex = usePresenterStore.getState().locked?.key === pos.slide ? usePresenterStore.getState().locked!.index : null
      if (q.type === 'open') sfx.play('reveal')
      else if (lockedIndex !== null && lockedIndex !== correctOptionIndex(q)) sfx.play('wrong')
      else sfx.play('correct')
    }
  }, [deck, pos, session.defaults.optionReveal])

  // Answer locked in.
  useEffect(() => {
    if (locked) sfx.play('lock')
  }, [locked])

  // Tension bed while the clock runs on the current question.
  const onQuestion = timer.key === pos.slide
  const current = deck[pos.slide]
  // No bed under audio/video clips: the clip is the soundtrack.
  const clipQuestion = current.kind === 'question' && (current.question.media?.kind === 'audio' || current.question.media?.kind === 'video')
  const bedOn = onQuestion && running && left > 0 && !clipQuestion
  useEffect(() => {
    if (bedOn) sfx.startBed()
    else sfx.stopBed()
  }, [bedOn])
  useEffect(() => () => sfx.stopBed(), [])

  // Countdown ticks for the last five seconds, then the buzzer.
  useEffect(() => {
    const before = prevLeft.current
    prevLeft.current = left
    if (!onQuestion || !running) return
    const secsBefore = Math.ceil(before / 1000)
    const secsNow = Math.ceil(left / 1000)
    if (left === 0 && before > 0) sfx.play('timeUp')
    else if (secsNow < secsBefore && secsNow <= 5 && secsNow > 0) sfx.play('tick')
  }, [left, onQuestion, running])

  return null
}

/** Gold-and-blue confetti bursts from both sides of the stage. */
function celebrate() {
  const colors = ['#f5c542', '#ffffff', '#1a56db', '#c62b2f', '#22c55e']
  const end = Date.now() + 3500
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.75 }, colors, zIndex: 100 })
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.75 }, colors, zIndex: 100 })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  confetti({ particleCount: 160, spread: 110, startVelocity: 55, origin: { y: 0.6 }, colors, zIndex: 100 })
  frame()
}
