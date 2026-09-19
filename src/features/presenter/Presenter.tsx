import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LoadedSession } from '@/data/source'
import { sfx } from '@/features/audio/sfx'
import { toggleFullscreen } from '@/lib/fullscreen'
import { Backdrop } from './components/Backdrop'
import { HelpOverlay } from './components/HelpOverlay'
import { HostBar } from './components/HostBar'
import { STAGE_MEDIA_ATTR, STAGE_MEDIA_TOGGLE } from './components/MediaView'
import { NietBug } from './components/NietSeal'
import {
  buildDeck,
  clampPosition,
  hasClip,
  nextSlide,
  optionLabels,
  revealAnswer,
  roundIntroIndex,
  stagesFor,
  stepBack,
  stepForward,
  timerStageIndex,
  type Position,
} from './deck'
import { FinaleSlide } from './slides/FinaleSlide'
import { QuestionSlide } from './slides/QuestionSlide'
import { RoundIntroSlide } from './slides/RoundIntroSlide'
import { WelcomeSlide } from './slides/WelcomeSlide'
import { SoundDirector } from './SoundDirector'
import { Stage } from './Stage'
import { usePresenterStore, useSessionOrder, useSessionSeed } from './store'

const START: Position = { slide: 0, stage: 0 }

export function Presenter({ loaded }: { loaded: LoadedSession }) {
  const { session } = loaded
  const seed = useSessionSeed(session)
  const order = useSessionOrder(session)
  const deck = useMemo(() => buildDeck(loaded, seed, order), [loaded, seed, order])

  const saved = usePresenterStore((s) => s.positions[session.id])
  const pos = clampPosition(deck, saved ?? START)
  const setPosition = usePresenterStore((s) => s.setPosition)
  const go = useCallback((next: Position) => setPosition(session.id, next), [setPosition, session.id])

  const blackout = usePresenterStore((s) => s.blackout)
  const muted = usePresenterStore((s) => s.muted)
  const helpOpen = usePresenterStore((s) => s.helpOpen)
  const slide = deck[pos.slide]

  const ladder = useMemo(
    () => deck.flatMap((s) => (s.kind === 'round' ? [{ title: s.round.title, icon: s.category?.icon }] : [])),
    [deck],
  )

  useTimerLifecycle(deck, pos)
  // Count rounds from the deck: the difficulty ladder can have more levels than the session has rounds.
  useHostKeys(deck, session.id, go, ladder.length)
  const cursorHidden = useIdleCursor()

  return (
    <Stage>
      <div className={`absolute inset-0 ${cursorHidden ? 'cursor-none' : ''}`}>
        <Backdrop />

        <AnimatePresence mode="wait">
          <motion.div
            key={pos.slide}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35 }}
          >
            {slide.kind === 'welcome' && <WelcomeSlide session={session} />}
            {slide.kind === 'round' && (
              <RoundIntroSlide
                round={slide.round}
                roundIndex={slide.roundIndex}
                category={slide.category}
                questionCount={slide.round.questionIds.length}
                timerSeconds={slide.round.timerSeconds ?? session.defaults.timerSeconds}
                ladder={ladder}
                label={order === 'difficulty' ? 'Level' : 'Round'}
              />
            )}
            {slide.kind === 'question' && <QuestionSlide slide={slide} slideIndex={pos.slide} stage={pos.stage} session={session} />}
            {slide.kind === 'finale' && <FinaleSlide session={session} />}
          </motion.div>
        </AnimatePresence>

        {slide.kind !== 'welcome' && <NietBug label={session.event?.replace(/^NIET\s*/, '')} />}

        <SoundDirector deck={deck} pos={pos} session={session} />
        {muted && <div className="absolute right-6 bottom-5 z-10 text-3xl opacity-40">🔇</div>}
        <HostBar visible={!cursorHidden && !blackout} />

        <AnimatePresence>{helpOpen && <HelpOverlay />}</AnimatePresence>
        {blackout && <div className="absolute inset-0 z-50 bg-black" />}
      </div>
    </Stage>
  )
}

/**
 * Starts the countdown when a question reaches its timer stage, stops it on the
 * reveal and clears it when leaving the question. Keyed by slide index so
 * stepping back and forth inside a question doesn't restart it.
 */
function useTimerLifecycle(deck: ReturnType<typeof buildDeck>, pos: Position) {
  useEffect(() => {
    const { timer, locked, startTimer, stopTimer, resetTimer, clearLock } = usePresenterStore.getState()
    if (locked && locked.key !== pos.slide) clearLock()
    const slide = deck[pos.slide]
    if (slide.kind !== 'question') {
      if (timer.key !== null) resetTimer()
      return
    }
    const isAnswer = stagesFor(slide)[pos.stage] === 'answer'
    if (timer.key !== pos.slide) {
      // Clip questions start their clock on P instead, so the clip gets its full time.
      if (!isAnswer && pos.stage >= timerStageIndex(slide) && !hasClip(slide.question)) startTimer(pos.slide, slide.timerSeconds)
      else resetTimer()
    } else if (isAnswer) {
      stopTimer()
    }
  }, [deck, pos.slide, pos.stage])
}

function useHostKeys(deck: ReturnType<typeof buildDeck>, sessionId: string, go: (p: Position) => void, roundCount: number) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      // Browsers only allow audio after a user gesture; any host key press unlocks it.
      sfx.unlock()
      const store = usePresenterStore.getState()
      // Read the position fresh from the store so rapid key presses (clicker double-taps) each count.
      const pos = clampPosition(deck, store.positions[sessionId] ?? START)

      // While help is open, any key closes it.
      if (store.helpOpen && e.key !== 'h' && e.key !== '?') {
        store.setHelpOpen(false)
        e.preventDefault()
        return
      }

      const handled = () => e.preventDefault()
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
        case 'Enter':
          go(stepForward(deck, pos))
          return handled()
        case 'ArrowLeft':
        case 'PageUp':
        case 'Backspace':
          go(stepBack(deck, pos))
          return handled()
        case 'r':
        case 'R':
          return go(revealAnswer(deck, pos))
        case 'n':
        case 'N':
          return go(nextSlide(deck, pos))
        case 'Home':
          go({ slide: 0, stage: 0 })
          return handled()
        case 'End':
          go({ slide: deck.length - 1, stage: 0 })
          return handled()
        case 't':
        case 'T':
          // No clock yet (a clip that hasn't been played): T starts one.
          return startClock(deck, pos) || store.toggleTimer()
        case '+':
        case '=':
          return store.addTime(10)
        case '-':
        case '_':
          return store.addTime(-10)
        case 'p':
        case 'P':
          toggleStageMedia()
          // The first play of a clip starts the clock.
          if (slideHasClip(deck, pos)) startClock(deck, pos)
          return
        case '.':
          return store.toggleBlackout()
        case 'i':
        case 'I':
          // Replay the opening fanfare (e.g. once the hall is seated).
          if (deck[pos.slide].kind === 'welcome') {
            sfx.stopLoop('lobby', 0.3)
            sfx.startLoop('lobby')
          }
          return
        case 'm':
        case 'M':
          return store.toggleMuted()
        case 'f':
        case 'F':
          return toggleFullscreen()
        case 'h':
        case 'H':
        case '?':
          return store.setHelpOpen(!store.helpOpen)
        case 'Escape':
          if (store.blackout) store.toggleBlackout()
          return
      }

      // A–D lock in the answer a student gave (amber), before the reveal.
      if (/^[a-dA-D]$/.test(e.key)) {
        const slide = deck[pos.slide]
        const stage = stagesFor(slide)[pos.stage]
        if (slide.kind !== 'question' || stage !== 'options') return
        const count = optionLabels(slide.question)?.length ?? 0
        const index = e.key.toLowerCase().charCodeAt(0) - 97
        if (index < count) store.lockAnswer(pos.slide, index)
        return
      }

      if (/^[1-9]$/.test(e.key)) {
        const roundIndex = Number(e.key) - 1
        if (roundIndex < roundCount) go({ slide: roundIntroIndex(deck, roundIndex), stage: 0 })
      }
    }

    const onPointer = () => sfx.unlock()
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [deck, sessionId, go, roundCount])
}

function slideHasClip(deck: ReturnType<typeof buildDeck>, pos: Position) {
  const slide = deck[pos.slide]
  return slide.kind === 'question' && hasClip(slide.question)
}

/** Starts the countdown on a question that doesn't have one yet (not on the answer). Returns whether it did. */
function startClock(deck: ReturnType<typeof buildDeck>, pos: Position) {
  const slide = deck[pos.slide]
  const store = usePresenterStore.getState()
  if (slide.kind !== 'question' || store.timer.key === pos.slide || stagesFor(slide)[pos.stage] === 'answer') return false
  store.startTimer(pos.slide, slide.timerSeconds)
  return true
}

function toggleStageMedia() {
  const el = document.querySelector<HTMLMediaElement>(`[${STAGE_MEDIA_ATTR}]`)
  // A YouTube clip isn't a media element; it listens for this event instead.
  if (!el) return void window.dispatchEvent(new Event(STAGE_MEDIA_TOGGLE))
  if (el.paused) el.play().catch(() => {})
  else el.pause()
}


/** Hides the mouse pointer after a couple of seconds without movement. */
function useIdleCursor(delayMs = 2000) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let id = window.setTimeout(() => setHidden(true), delayMs)
    const onMove = () => {
      setHidden(false)
      window.clearTimeout(id)
      id = window.setTimeout(() => setHidden(true), delayMs)
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('mousemove', onMove)
    }
  }, [delayMs])
  return hidden
}
