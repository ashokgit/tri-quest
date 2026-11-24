import confetti from 'canvas-confetti'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { sfx } from '@/features/audio/sfx'
import { useTimeLeft } from '@/features/presenter/components/useTimeLeft'
import { usePresenterStore } from '@/features/presenter/store'
import { turnKey } from './controller'
import type { GroupSlide, PlayView } from './engine'

/**
 * Sound for the groups format. One-shot results (right, wrong, reveal) are played by the controller
 * at the moment of the action; this plays the rest: round stings, the options coming in, the clock's
 * music bed and ticks, the suspense drone while an answer is locked, the lobby loop and the finale.
 */
export function GroupSounds({
  deck,
  pos,
  opts,
  view,
}: {
  deck: GroupSlide[]
  pos: number
  opts: boolean
  view: PlayView | null
}) {
  const muted = usePresenterStore((s) => s.muted)
  const volume = usePresenterStore((s) => s.volume)
  const locked = usePresenterStore((s) => s.locked)
  const { timer, left, running } = useTimeLeft()
  const prev = useRef<{ pos: number; opts: boolean } | null>(null)
  const prevLeft = useRef(left)

  useEffect(() => sfx.setMuted(muted), [muted])
  useEffect(() => sfx.setVolume(volume), [volume])

  // Moving forward onto a slide, or the options coming in.
  useEffect(() => {
    const before = prev.current
    prev.current = { pos, opts }
    if (!before) return
    const slide = deck[pos]
    if (pos > before.pos) {
      if (slide.kind === 'round') sfx.play(deck[before.pos].kind === 'welcome' && slide.roundIndex === 0 ? 'theme' : 'roundIntro')
      else if (slide.kind === 'standings') sfx.play('roundIntro')
      else if (slide.kind === 'question') sfx.play('questionIn')
      else if (slide.kind === 'finale') {
        sfx.play('finale')
        celebrate()
      }
    }
    if (pos === before.pos && opts && !before.opts && slide.kind === 'question') sfx.play('optionIn')
  }, [deck, pos, opts])

  const current = deck[pos]
  const key = view ? turnKey(pos, view.hop) : null

  // Welcome screen: fanfare, then faint lobby music until the contest starts.
  const soundReady = useSyncExternalStore(sfx.subscribe, () => sfx.ready)
  const lobbyOn = soundReady && current.kind === 'welcome'
  useEffect(() => {
    if (lobbyOn) sfx.startLoop('lobby')
    else sfx.stopLoop('lobby', 1.5)
  }, [lobbyOn])

  // A locked answer (the lock sound itself comes from the controller): the drone holds until the host confirms.
  const suspenseOn = view?.status === 'open' && locked?.key === key
  useEffect(() => {
    if (suspenseOn) sfx.startLoop('suspense')
    else sfx.stopLoop('suspense')
  }, [suspenseOn])

  // The clock's music bed, building as time runs out, then ticks and the buzzer.
  const ticking = key !== null && timer.key === key && view?.status === 'open'
  const bedOn = ticking && running && left > 0
  useEffect(() => {
    if (bedOn) sfx.startLoop('bed')
    else sfx.stopLoop('bed')
  }, [bedOn])
  useEffect(() => {
    if (bedOn && timer.durationMs) sfx.setBedIntensity(1 - left / timer.durationMs)
  }, [bedOn, left, timer.durationMs])
  useEffect(() => () => sfx.stopAll(), [])
  useEffect(() => {
    const before = prevLeft.current
    prevLeft.current = left
    if (!ticking || !running) return
    const secsBefore = Math.ceil(before / 1000)
    const secsNow = Math.ceil(left / 1000)
    if (left === 0 && before > 0) sfx.play('timeUp')
    else if (secsNow < secsBefore && secsNow <= 5 && secsNow > 0) sfx.play('tick', 0, secsNow)
  }, [left, ticking, running])

  return null
}

/** Gold-and-blue confetti bursts from both sides of the stage. */
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const colors = ['#f5c542', '#ffffff', '#3b82f6', '#14b8a6', '#c084fc', '#22c55e']
  const end = Date.now() + 3500
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
