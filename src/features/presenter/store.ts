import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { randomSeed } from '@/data/draw'
import type { Position } from './deck'

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
  muted: boolean
  blackout: boolean
  helpOpen: boolean
  timer: TimerState
  /** Answer the host locked in for the current question (slide index + option index). */
  locked: { key: number; index: number } | null

  setPosition: (sessionId: string, pos: Position) => void
  /** New random draw for a session; restarts it from the welcome slide. */
  reshuffle: (sessionId: string) => void
  /** Drop this browser's reshuffle and go back to the session file's draw. */
  resetDraw: (sessionId: string) => void
  toggleMuted: () => void
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

const idleTimer: TimerState = { key: null, durationMs: 0, endsAt: null, remainingMs: 0 }

/** The session's draw number: the host's reshuffle if any, else the one pinned in the session file. */
export const useSessionSeed = (session: { id: string; seed: number }) => usePresenterStore((s) => s.seeds[session.id] ?? session.seed)

export const remainingMs = (t: TimerState, now = Date.now()) =>
  t.endsAt === null ? t.remainingMs : Math.max(0, t.endsAt - now)

export const usePresenterStore = create<PresenterState>()(
  persist(
    (set) => ({
      positions: {},
      seeds: {},
      muted: false,
      blackout: false,
      helpOpen: false,
      timer: idleTimer,
      locked: null,

      setPosition: (sessionId, pos) => set((s) => ({ positions: { ...s.positions, [sessionId]: pos } })),
      resetDraw: (sessionId) =>
        set((s) => {
          const seeds = { ...s.seeds }
          delete seeds[sessionId]
          return { seeds, positions: { ...s.positions, [sessionId]: { slide: 0, stage: 0 } } }
        }),
      reshuffle: (sessionId) =>
        set((s) => ({
          seeds: { ...s.seeds, [sessionId]: randomSeed() },
          positions: { ...s.positions, [sessionId]: { slide: 0, stage: 0 } },
        })),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
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
      partialize: (s) => ({ positions: s.positions, seeds: s.seeds, muted: s.muted }),
    },
  ),
)
