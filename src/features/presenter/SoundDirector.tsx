import confetti from 'canvas-confetti'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { Session } from '@/data/schema'
import { sfx } from '@/features/audio/sfx'
import { correctOptionIndex, optionLabels, stagesFor, type Position, type Slide } from './deck'
import { useTimeLeft } from './components/useTimeLeft'
import { usePresenterStore } from './store'

/** Delay between answer bars sliding in; matches the stagger in OptionTiles. */
const OPTION_STAGGER = 0.6

/**
 * Plays sound cues (and the finale confetti) in response to what's on stage.
 * Cues only fire when moving forward, so stepping back to re-read a question stays quiet.
 */
export function SoundDirector({ deck, pos, session }: { deck: Slide[]; pos: Position; session: Session }) {
  const muted = usePresenterStore((s) => s.muted)
  const volume = usePresenterStore((s) => s.volume)
  const locked = usePresenterStore((s) => s.locked)
  const { timer, left, running } = useTimeLeft()
  const prevPos = useRef<Position | null>(null)
  const prevLeft = useRef(left)

  useEffect(() => sfx.setMuted(muted), [muted])
  useEffect(() => sfx.setVolume(volume), [volume])

  // Stage transitions.
  useEffect(() => {
    const prev = prevPos.current
    prevPos.current = pos
    if (!prev) return
    const forward = pos.slide > prev.slide || (pos.slide === prev.slide && pos.stage > prev.stage)
    if (!forward) return

    const slide = deck[pos.slide]
    // The opening theme plays once, leaving the welcome screen; later rounds get the shorter sting.
    if (pos.slide !== prev.slide && slide.kind === 'round') sfx.play(prev.slide === 0 && slide.roundIndex === 0 ? 'theme' : 'roundIntro')
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

  const current = deck[pos.slide]
  const stageKind = stagesFor(current)[pos.stage]

  // Welcome screen: the opening fanfare, then faint lobby music until the show starts.
  // Audio is unlocked by the Present click; after a reload it starts on the first click or key.
  const soundReady = useSyncExternalStore(sfx.subscribe, () => sfx.ready)
  const lobbyOn = soundReady && current.kind === 'welcome'
  useEffect(() => {
    if (lobbyOn) sfx.startLoop('lobby')
    else sfx.stopLoop('lobby', 1.5)
  }, [lobbyOn])

  // Answer locked in: the "final answer" boom, then the suspense drone holds until the reveal.
  useEffect(() => {
    if (locked) sfx.play('lock')
  }, [locked])
  const suspenseOn = locked?.key === pos.slide && stageKind !== 'answer'
  useEffect(() => {
    if (suspenseOn) sfx.startLoop('suspense')
    else sfx.stopLoop('suspense')
  }, [suspenseOn])

  // Music bed while the clock runs, building as time runs out.
  const onQuestion = timer.key === pos.slide
  // No bed under audio/video clips: the clip is the soundtrack. (A muted YouTube clip keeps the bed.)
  const media = current.kind === 'question' ? current.question.media : undefined
  const clipQuestion = media?.kind === 'audio' || media?.kind === 'video' || (media?.kind === 'youtube' && !media.muted)
  const bedOn = onQuestion && running && left > 0 && !clipQuestion
  useEffect(() => {
    if (bedOn) sfx.startLoop('bed')
    else sfx.stopLoop('bed')
  }, [bedOn])
  useEffect(() => {
    if (bedOn && timer.durationMs) sfx.setBedIntensity(1 - left / timer.durationMs)
  }, [bedOn, left, timer.durationMs])
  useEffect(() => () => sfx.stopAll(), [])

  // Countdown ticks for the last five seconds, then the buzzer.
  useEffect(() => {
    const before = prevLeft.current
    prevLeft.current = left
    if (!onQuestion || !running) return
    const secsBefore = Math.ceil(before / 1000)
    const secsNow = Math.ceil(left / 1000)
    if (left === 0 && before > 0) sfx.play('timeUp')
    else if (secsNow < secsBefore && secsNow <= 5 && secsNow > 0) sfx.play('tick', 0, secsNow)
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
