import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LoadedSession } from '@/data/source'
import { sfx } from '@/features/audio/sfx'
import { Backdrop } from '@/features/presenter/components/Backdrop'
import { HostBar } from '@/features/presenter/components/HostBar'
import { NietBug } from '@/features/presenter/components/NietSeal'
import { useTimeLeft } from '@/features/presenter/components/useTimeLeft'
import { Stage } from '@/features/presenter/Stage'
import { usePresenterStore } from '@/features/presenter/store'
import { toggleFullscreen } from '@/lib/fullscreen'
import * as ctl from './controller'
import {
  buildGroupDeck,
  clockFor,
  derivePlay,
  lifelinesUsed,
  roundIntroIndex,
  roundScores,
  scoresOf,
  type GroupSlide,
  type QuestionSlide,
} from './engine'
import { GroupHelp } from './GroupHelp'
import { GroupSounds } from './GroupSounds'
import { GroupFinaleSlide } from './slides/FinaleSlide'
import { GroupQuestionSlide } from './slides/QuestionSlide'
import { GroupRoundSlide } from './slides/RoundSlide'
import { GroupStandingsSlide } from './slides/StandingsSlide'
import { GroupWelcomeSlide } from './slides/WelcomeSlide'
import { useGame, useGroupSeed, useGroupStore } from './store'

/** Pause between a question landing and its options coming in. */
const OPTIONS_AFTER_MS = { turns: 1600, rapid: 900 }

/** Time on the explanation before the next question appears by itself. */
function lingerMs(slide: QuestionSlide) {
  const base = Math.max(4500, 3500 + (slide.question.explanation?.length ?? 0) * 32)
  return Math.min(base, slide.rules.mode === 'rapid' ? 6000 : 12000)
}

export function GroupPresenter({ loaded }: { loaded: LoadedSession }) {
  const { session } = loaded
  const names = session.groups
  const seed = useGroupSeed(session)
  const deck = useMemo(() => buildGroupDeck(loaded, seed), [loaded, seed])
  const game = useGame(session.id)
  const pos = Math.min(game.pos, deck.length - 1)
  const slide = deck[pos]
  const scores = useMemo(() => scoresOf(deck, game.plays, names.length), [deck, game.plays, names.length])
  const question = slide.kind === 'question' ? slide : null
  const view = useMemo(
    () => (question ? derivePlay(question, names.length, game.plays[pos] ?? []) : null),
    [question, names.length, game.plays, pos],
  )
  const ctx = useMemo<ctl.Ctx>(() => ({ sessionId: session.id, deck, names }), [session.id, deck, names])

  const blackout = usePresenterStore((s) => s.blackout)
  const muted = usePresenterStore((s) => s.muted)
  const helpOpen = usePresenterStore((s) => s.helpOpen)
  const hold = useGroupStore((s) => s.hold)
  const flash = useGroupStore((s) => s.flash)

  const ladder = useMemo(
    () => deck.flatMap((s) => (s.kind === 'round' ? [{ title: s.round.title, icon: s.category?.icon }] : [])),
    [deck],
  )
  const lifelines = useMemo(
    () =>
      names.map((_, g) => (question ? lifelinesUsed(deck, game.plays, question.roundIndex, g) : { fifty: false, hint: false })),
    [names, question, deck, game.plays],
  )

  useRoundTimers(ctx, question, view, game.opts, pos, flash?.id ?? 0)
  const autoIn = useAutoAdvance(ctx, question, view, hold || flash !== null, `${pos}:${game.plays[pos]?.length ?? 0}`)
  useHostKeys(ctx, ladder.length)
  const cursorHidden = useIdleCursor()

  return (
    <Stage>
      <div className={`absolute inset-0 ${cursorHidden ? 'cursor-none' : ''}`}>
        <Backdrop />

        <AnimatePresence mode="wait">
          <motion.div
            key={pos}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <SlideView
              slide={slide}
              pos={pos}
              view={view}
              opts={game.opts || (view?.status ?? 'open') !== 'open'}
              scores={scores}
              lifelines={lifelines}
              autoIn={autoIn}
              loaded={loaded}
              ladder={ladder}
              plays={game.plays}
              deck={deck}
            />
          </motion.div>
        </AnimatePresence>

        {slide.kind !== 'welcome' && <NietBug label={session.event?.split('·')[0].trim()} />}

        <GroupSounds deck={deck} pos={pos} opts={game.opts} view={view} />
        {muted && <div className="absolute right-6 bottom-5 z-10 text-3xl opacity-40">🔇</div>}
        {hold && question && view?.status !== 'open' && (
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-6 py-2 font-display text-xl font-bold tracking-widest text-white/70 uppercase">
            Holding · T to resume
          </div>
        )}
        <HostBar visible={!cursorHidden && !blackout} />

        <AnimatePresence>{helpOpen && <GroupHelp />}</AnimatePresence>
        {blackout && <div className="absolute inset-0 z-50 bg-black" />}
      </div>
    </Stage>
  )
}

interface SlideProps {
  slide: GroupSlide
  pos: number
  view: ReturnType<typeof derivePlay> | null
  opts: boolean
  scores: number[]
  lifelines: { fifty: boolean; hint: boolean }[]
  autoIn: number | null
  loaded: LoadedSession
  ladder: { title: string; icon?: string }[]
  plays: Parameters<typeof roundScores>[1]
  deck: GroupSlide[]
}

function SlideView({ slide, pos, view, opts, scores, lifelines, autoIn, loaded, ladder, plays, deck }: SlideProps) {
  const { session } = loaded
  const names = session.groups
  switch (slide.kind) {
    case 'welcome':
      return <GroupWelcomeSlide session={session} />
    case 'round':
      return (
        <GroupRoundSlide
          round={slide.round}
          rules={slide.rules}
          roundIndex={slide.roundIndex}
          category={slide.category}
          ladder={ladder}
        />
      )
    case 'question':
      return (
        <GroupQuestionSlide
          slide={slide}
          pos={pos}
          view={view!}
          opts={opts}
          names={names}
          scores={scores}
          lifelines={lifelines}
          session={session}
          autoIn={autoIn}
        />
      )
    case 'standings':
      return (
        <GroupStandingsSlide
          title={`Round ${slide.afterRound + 1} · ${session.rounds[slide.afterRound].title}`}
          names={names}
          scores={scores}
          gained={roundScores(deck, plays, names.length, slide.afterRound)}
        />
      )
    case 'finale':
      return <GroupFinaleSlide session={session} names={names} scores={scores} />
  }
}

/**
 * The clock and the pace of a question: options follow the prompt after a beat, the countdown starts
 * with them (and restarts on a pass, once the call-out has cleared), and running out of time hands the
 * question on. The block call-out introduces the next group in rapid fire.
 */
function useRoundTimers(
  ctx: ctl.Ctx,
  question: QuestionSlide | null,
  view: ReturnType<typeof derivePlay> | null,
  opts: boolean,
  pos: number,
  flashId: number,
) {
  const { timer, left, running } = useTimeLeft()
  const open = question !== null && view?.status === 'open'

  // The options follow the prompt.
  useEffect(() => {
    if (!open || opts) return
    const id = window.setTimeout(() => useGroupStore.getState().showOptions(ctx.sessionId), OPTIONS_AFTER_MS[question.rules.mode])
    return () => window.clearTimeout(id)
  }, [open, opts, pos, ctx.sessionId, question])

  // A new group's block in rapid fire.
  useEffect(() => {
    if (!question?.blockStart || useGroupStore.getState().games[ctx.sessionId]?.plays[pos]?.length) return
    ctl.flashBlock(`Group ${ctx.names[question.opener]}`, `${question.rules.block} questions · ${question.seconds} seconds each`)
  }, [question, pos, ctx.sessionId, ctx.names])

  // Start (or restart after a pass) the countdown; clear it once the question is settled.
  useEffect(() => {
    const store = usePresenterStore.getState()
    if (!open || !opts || !view) {
      if (store.timer.key !== null) store.resetTimer()
      return
    }
    if (useGroupStore.getState().flash) return
    const key = ctl.turnKey(pos, view.hop)
    if (store.timer.key !== key) store.startTimer(key, clockFor(question, view.hop))
  }, [open, opts, pos, view, question, flashId])

  // Out of time.
  const key = view ? ctl.turnKey(pos, view.hop) : null
  useEffect(() => {
    if (open && timer.key === key && running && left === 0) ctl.timeout(ctx, true)
  }, [open, timer.key, key, running, left, ctx])
}

/** After an answer, count down and move on by itself, unless the host is holding. Returns seconds left. */
function useAutoAdvance(
  ctx: ctl.Ctx,
  question: QuestionSlide | null,
  view: ReturnType<typeof derivePlay> | null,
  held: boolean,
  token: string,
) {
  const [tick, setTick] = useState<{ id: string; left: number } | null>(null)
  const latest = useRef(ctx)
  useEffect(() => {
    latest.current = ctx
  })
  const settled = question !== null && view !== null && view.status !== 'open'
  const ms = question ? lingerMs(question) : 0
  // `token` restarts the countdown whenever something new happens on the question.
  const id = `${token}:${ms}`

  useEffect(() => {
    if (!settled || held) return
    const end = Date.now() + ms
    const timer = window.setInterval(() => {
      const remaining = end - Date.now()
      if (remaining <= 0) {
        window.clearInterval(timer)
        ctl.next(latest.current)
      } else setTick({ id, left: Math.ceil(remaining / 1000) })
    }, 200)
    return () => window.clearInterval(timer)
  }, [settled, held, ms, id])

  if (!settled || held) return null
  return tick?.id === id ? tick.left : Math.ceil(ms / 1000)
}

function useHostKeys(ctx: ctl.Ctx, roundCount: number) {
  const latest = useRef(ctx)
  useEffect(() => {
    latest.current = ctx
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      // Browsers only allow audio after a user gesture; any host key press unlocks it.
      sfx.unlock()
      const c = latest.current
      const store = usePresenterStore.getState()
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
          ctl.forward(c)
          return handled()
        case 'ArrowLeft':
        case 'PageUp':
        case 'Backspace':
          ctl.back(c)
          return handled()
        case 'n':
        case 'N':
          return ctl.next(c)
        case 'u':
        case 'U':
          return ctl.undo(c)
        case 'r':
        case 'R':
          return ctl.showAnswer(c)
        case 'x':
        case 'X':
          return ctl.timeout(c)
        case 't':
        case 'T':
          return ctl.pauseToggle(c)
        case '+':
        case '=':
          return store.addTime(10)
        case '-':
        case '_':
          return store.addTime(-10)
        case 'l':
        case 'L':
          return ctl.fifty(c)
        case 'k':
        case 'K':
          return ctl.hint(c)
        case 'Home':
          ctl.go(c, 0)
          return handled()
        case 'End':
          ctl.go(c, c.deck.length - 1)
          return handled()
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
      if (/^[a-dA-D]$/.test(e.key)) return ctl.lock(c, e.key.toLowerCase().charCodeAt(0) - 97)
      if (/^[1-9]$/.test(e.key) && Number(e.key) <= roundCount) ctl.go(c, roundIntroIndex(c.deck, Number(e.key) - 1))
    }
    const onPointer = () => sfx.unlock()
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [roundCount])
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
