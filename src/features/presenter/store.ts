import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { randomSeed } from '@/data/draw'
import type { Position, RoundOrder } from './deck'

/**
 * Countdown for the current question. `key` identifies the slide it belongs to,
 * so stepping back and forth within a question doesn't restart it.
 */
export interface TimerState {
  key: number | null
  durationMs: number
  /** Wall-clock end time while running. */
  endsAt: number | null
  /** Remaining time while paused or stopped. */
  remainingMs: number
}

interface PresenterState {
  /** Last position per session, persisted so a closed tab resumes where it was. */
  positions: Record<string, Position>
  /** Question-draw seed per session. Persisted so a reload never changes the questions mid-show. */
  seeds: Record<string, number>
  /** Host's choice of round order per session (overrides the session file). */
  orders: Record<string, RoundOrder>
  /** Host's choice of how many questions the show has, per session (overrides the session file). */
  counts: Record<string, number>
  /** Questions the host hand-picked on the review page, per session (overrides the seeded draw). */
  picks: Record<string, string[]>
  muted: boolean
  /** Master sound volume, 0 … 1 (set on the sound check page). */
  volume: number
  blackout: boolean
  helpOpen: boolean
  timer: TimerState
  /** Answer the host locked in for the current question (slide index + option index). */
  locked: { key: number; index: number } | null

  setPosition: (sessionId: string, pos: Position) => void
  /** New random draw for a session; restarts it from the welcome slide. */
  reshuffle: (sessionId: string) => void
  /** Switch between category rounds and the difficulty ladder; restarts the session. */
  setOrder: (sessionId: string, order: RoundOrder) => void
  /** Change how many questions the show has (null: back to the session file's); restarts the session. */
  setCount: (sessionId: string, count: number | null) => void
  /** Hand-pick the exact questions of a session (null: back to the seeded draw); restarts the session. */
  setPicks: (sessionId: string, questionIds: string[] | null) => void
  /** Drop this browser's reshuffle and go back to the session file's draw. */
  resetDraw: (sessionId: string) => void
  toggleMuted: () => void
  setVolume: (volume: number) => void
  toggleBlackout: () => void
  setHelpOpen: (open: boolean) => void

  startTimer: (key: number, seconds: number) => void
  toggleTimer: () => void
  addTime: (seconds: number) => void
  stopTimer: () => void
  resetTimer: () => void
  lockAnswer: (key: number, index: number) => void
  clearLock: () => void
}

/** A copy of `map` without `key`. */
const without = <T,>(map: Record<string, T>, key: string): Record<string, T> => {
  const next = { ...map }
  delete next[key]
  return next
}

const idleTimer: TimerState = { key: null, durationMs: 0, endsAt: null, remainingMs: 0 }

/** The session's draw number: the host's reshuffle if any, else the one pinned in the session file. */
export const useSessionSeed = (session: { id: string; seed: number }) => usePresenterStore((s) => s.seeds[session.id] ?? session.seed)

/** The session's round order: the host's choice if any, else the session file's. */
export const useSessionOrder = (session: { id: string; order: RoundOrder }) =>
  usePresenterStore((s) => s.orders[session.id] ?? session.order)

/** The questions the host hand-picked for a session, if any (undefined: the seeded draw decides). */
export const useSessionPicks = (session: { id: string }) => usePresenterStore((s) => s.picks[session.id])

/** How many questions the show has: the host's choice if any, else the session file's (undefined: picks as written). */
export const useSessionCount = (session: { id: string; questionCount?: number }) =>
  usePresenterStore((s) => s.counts[session.id] ?? session.questionCount)

export const remainingMs = (t: TimerState, now = Date.now()) =>
  t.endsAt === null ? t.remainingMs : Math.max(0, t.endsAt - now)

export const usePresenterStore = create<PresenterState>()(
  persist(
    (set) => ({
      positions: {},
      seeds: {},
      orders: {},
      counts: {},
      picks: {},
      muted: false,
      volume: 0.9,
      blackout: false,
      helpOpen: false,
      timer: idleTimer,
      locked: null,

      setPosition: (sessionId, pos) => set((s) => ({ positions: { ...s.positions, [sessionId]: pos } })),
      resetDraw: (sessionId) =>
        set((s) => {
          const seeds = { ...s.seeds }
          delete seeds[sessionId]
          return { seeds, picks: without(s.picks, sessionId), positions: { ...s.positions, [sessionId]: { slide: 0, stage: 0 } } }
        }),
      setOrder: (sessionId, order) =>
        set((s) => ({
          orders: { ...s.orders, [sessionId]: order },
          positions: { ...s.positions, [sessionId]: { slide: 0, stage: 0 } },
        })),
      setCount: (sessionId, count) =>
        set((s) => {
          const counts = { ...s.counts }
          if (count === null) delete counts[sessionId]
          else counts[sessionId] = count
          // A new target makes the old hand-picked set the wrong size, so it goes back to the draw.
          return { counts, picks: without(s.picks, sessionId), positions: { ...s.positions, [sessionId]: { slide: 0, stage: 0 } } }
        }),
      setPicks: (sessionId, questionIds) =>
        set((s) => ({
          picks: questionIds === null ? without(s.picks, sessionId) : { ...s.picks, [sessionId]: questionIds },
          positions: { ...s.positions, [sessionId]: { slide: 0, stage: 0 } },
        })),
      reshuffle: (sessionId) =>
        set((s) => ({
          seeds: { ...s.seeds, [sessionId]: randomSeed() },
          picks: without(s.picks, sessionId),
          positions: { ...s.positions, [sessionId]: { slide: 0, stage: 0 } },
        })),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      setVolume: (volume) => set({ volume }),
      toggleBlackout: () => set((s) => ({ blackout: !s.blackout })),
      setHelpOpen: (helpOpen) => set({ helpOpen }),

      startTimer: (key, seconds) =>
        set({ timer: { key, durationMs: seconds * 1000, endsAt: Date.now() + seconds * 1000, remainingMs: seconds * 1000 } }),
      toggleTimer: () =>
        set(({ timer }) => {
          if (timer.key === null) return {}
          if (timer.endsAt !== null) return { timer: { ...timer, endsAt: null, remainingMs: remainingMs(timer) } }
          if (timer.remainingMs <= 0) return {}
          return { timer: { ...timer, endsAt: Date.now() + timer.remainingMs } }
        }),
      addTime: (seconds) =>
        set(({ timer }) => {
          if (timer.key === null) return {}
          const delta = seconds * 1000
          const left = Math.max(0, remainingMs(timer) + delta)
          return {
            timer: {
              ...timer,
              durationMs: Math.max(timer.durationMs, left),
              endsAt: timer.endsAt === null ? null : Date.now() + left,
              remainingMs: left,
            },
          }
        }),
      stopTimer: () => set(({ timer }) => ({ timer: { ...timer, endsAt: null, remainingMs: remainingMs(timer) } })),
      resetTimer: () => set({ timer: idleTimer }),
      // Locking in pauses the clock (the "final answer" moment); pressing the same letter again unlocks.
      lockAnswer: (key, index) =>
        set(({ locked, timer }) =>
          locked?.key === key && locked.index === index
            ? { locked: null }
            : { locked: { key, index }, timer: { ...timer, endsAt: null, remainingMs: remainingMs(timer) } },
        ),
      clearLock: () => set({ locked: null }),
    }),
    {
      name: 'quizzeria-presenter',
      partialize: (s) => ({
        positions: s.positions,
        seeds: s.seeds,
        orders: s.orders,
        counts: s.counts,
        picks: s.picks,
        muted: s.muted,
        volume: s.volume,
      }),
    },
  ),
)
