import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { randomSeed } from '@/data/draw'
import type { Action } from './engine'

/** A transient full-screen call-out: a wrong answer, time up, a pass, a block starting. */
export interface Flash {
  id: number
  kind: 'wrong' | 'timeup' | 'pass' | 'block' | 'right'
  title: string
  sub?: string
  /** For a wrong answer: the option to show in red while the flash is up. */
  k?: number
  /** Wall-clock time it clears. */
  until: number
}

interface Game {
  /** Index of the current slide in the deck. */
  pos: number
  /** Whether the current question's options are on screen (they follow the prompt after a beat). */
  opts: boolean
  /** What the host did on each question, by slide index. */
  plays: Record<number, Action[]>
}

const fresh = (): Game => ({ pos: 0, opts: false, plays: {} })

interface GroupState {
  games: Record<string, Game>
  /** Question-draw seed per session, so a reload never changes the questions mid-contest. */
  seeds: Record<string, number>
  /** Auto-advance after an answer is paused. */
  hold: boolean
  flash: Flash | null

  goto: (sessionId: string, pos: number, opts?: boolean) => void
  showOptions: (sessionId: string) => void
  act: (sessionId: string, slide: number, action: Action) => void
  undo: (sessionId: string, slide: number) => void
  /** Same questions, scores back to zero. */
  restart: (sessionId: string) => void
  /** A new random draw; scores back to zero. */
  reshuffle: (sessionId: string) => void
  toggleHold: () => void
  setFlash: (flash: Flash | null) => void
}

const update = (games: Record<string, Game>, id: string, patch: Partial<Game>) => ({
  ...games,
  [id]: { ...(games[id] ?? fresh()), ...patch },
})

export const useGroupStore = create<GroupState>()(
  persist(
    (set) => ({
      games: {},
      seeds: {},
      hold: false,
      flash: null,

      goto: (sessionId, pos, opts = false) => set((s) => ({ games: update(s.games, sessionId, { pos, opts }), flash: null })),
      showOptions: (sessionId) => set((s) => ({ games: update(s.games, sessionId, { opts: true }) })),
      act: (sessionId, slide, action) =>
        set((s) => {
          const game = s.games[sessionId] ?? fresh()
          return {
            games: update(s.games, sessionId, { plays: { ...game.plays, [slide]: [...(game.plays[slide] ?? []), action] } }),
          }
        }),
      undo: (sessionId, slide) =>
        set((s) => {
          const game = s.games[sessionId] ?? fresh()
          const list = game.plays[slide] ?? []
          return { games: update(s.games, sessionId, { plays: { ...game.plays, [slide]: list.slice(0, -1) } }), flash: null }
        }),
      restart: (sessionId) => set((s) => ({ games: { ...s.games, [sessionId]: fresh() }, flash: null })),
      reshuffle: (sessionId) =>
        set((s) => ({
          games: { ...s.games, [sessionId]: fresh() },
          seeds: { ...s.seeds, [sessionId]: randomSeed() },
          flash: null,
        })),
      toggleHold: () => set((s) => ({ hold: !s.hold })),
      setFlash: (flash) => set({ flash }),
    }),
    {
      name: 'quizzeria-groups',
      partialize: (s) => ({ games: s.games, seeds: s.seeds }),
    },
  ),
)

const EMPTY: Game = fresh()
export const useGame = (sessionId: string) => useGroupStore((s) => s.games[sessionId] ?? EMPTY)

/** The session's draw number: this browser's reshuffle if any, else the one pinned in the session file. */
export const useGroupSeed = (session: { id: string; seed: number }) => useGroupStore((s) => s.seeds[session.id] ?? session.seed)
