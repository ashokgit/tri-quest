import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LoadedSession } from '@/data/source'
import { Backdrop } from './components/Backdrop'
import { HelpOverlay } from './components/HelpOverlay'
import { Hud } from './components/Hud'
import { STAGE_MEDIA_ATTR } from './components/MediaView'
import {
  buildDeck,
  clampPosition,
  nextSlide,
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
import { Stage } from './Stage'
import { usePresenterStore } from './store'

const START: Position = { slide: 0, stage: 0 }

export function Presenter({ loaded }: { loaded: LoadedSession }) {
  const { session } = loaded
  const deck = useMemo(() => buildDeck(loaded), [loaded])

  const saved = usePresenterStore((s) => s.positions[session.id])
  const pos = clampPosition(deck, saved ?? START)
  const setPosition = usePresenterStore((s) => s.setPosition)
  const go = useCallback((next: Position) => setPosition(session.id, next), [setPosition, session.id])

  const blackout = usePresenterStore((s) => s.blackout)
  const helpOpen = usePresenterStore((s) => s.helpOpen)
  const slide = deck[pos.slide]

  useTimerLifecycle(deck, pos)
  useHostKeys(deck, pos, go, session.rounds.length)
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
              />
            )}
            {slide.kind === 'question' && <QuestionSlide slide={slide} slideIndex={pos.slide} stage={pos.stage} session={session} />}
            {slide.kind === 'finale' && <FinaleSlide session={session} />}
          </motion.div>
        </AnimatePresence>

        <Hud slide={slide} event={session.event} roundCount={session.rounds.length} />

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
    const { timer, startTimer, stopTimer, resetTimer } = usePresenterStore.getState()
    const slide = deck[pos.slide]
    if (slide.kind !== 'question') {
      if (timer.key !== null) resetTimer()
      return
    }
    const isAnswer = stagesFor(slide)[pos.stage] === 'answer'
    if (timer.key !== pos.slide) {
      if (!isAnswer && pos.stage >= timerStageIndex(slide)) startTimer(pos.slide, slide.timerSeconds)
      else resetTimer()
    } else if (isAnswer) {
      stopTimer()
    }
  }, [deck, pos.slide, pos.stage])
}

function useHostKeys(deck: ReturnType<typeof buildDeck>, pos: Position, go: (p: Position) => void, roundCount: number) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const store = usePresenterStore.getState()

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
          return store.toggleTimer()
        case '+':
        case '=':
          return store.addTime(10)
        case '-':
        case '_':
          return store.addTime(-10)
        case 'p':
        case 'P':
          return toggleStageMedia()
        case 'b':
        case 'B':
        case '.':
          return store.toggleBlackout()
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

      if (/^[1-9]$/.test(e.key)) {
        const roundIndex = Number(e.key) - 1
        if (roundIndex < roundCount) go({ slide: roundIntroIndex(deck, roundIndex), stage: 0 })
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deck, pos, go, roundCount])
}

function toggleStageMedia() {
  const el = document.querySelector<HTMLMediaElement>(`[${STAGE_MEDIA_ATTR}]`)
  if (!el) return
  if (el.paused) el.play().catch(() => {})
  else el.pause()
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  else document.documentElement.requestFullscreen().catch(() => {})
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
