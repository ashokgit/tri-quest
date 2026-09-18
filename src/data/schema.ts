import { z } from 'zod'

/**
 * Data contract for Quizzeria.
 *
 * The question bank and sessions are kept separate: a session only references
 * question ids. This mirrors the future Supabase tables (questions, sessions,
 * rounds) so moving off static JSON only touches `source.ts`.
 */

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'ids are lowercase kebab-case')

export const Difficulty = z.enum(['easy', 'medium', 'hard'])

export const Category = z.object({
  id,
  name: z.string().min(1),
  /** Emoji or short icon key shown on round cards. */
  icon: z.string().optional(),
})

/** Paths are relative to `public/`, e.g. "media/images/everest.jpg". */
const mediaPath = z.string().regex(/^media\//, 'media paths start with "media/"')

export const Media = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('image'),
    src: mediaPath,
    alt: z.string().optional(),
    /** How the image is uncovered before the answer: progressively unblurred or zoomed out. */
    reveal: z.enum(['none', 'blur', 'zoom']).default('none'),
  }),
  z.object({
    kind: z.literal('audio'),
    src: mediaPath,
    /** Optional clip window in seconds. */
    start: z.number().nonnegative().optional(),
    end: z.number().positive().optional(),
  }),
  z.object({
    kind: z.literal('video'),
    src: mediaPath,
    start: z.number().nonnegative().optional(),
    end: z.number().positive().optional(),
  }),
])

const questionBase = {
  id,
  category: id,
  difficulty: Difficulty,
  prompt: z.string().min(1),
  media: Media.optional(),
  /** Shown under the answer on reveal. */
  explanation: z.string().optional(),
  /** Flag facts that must be checked (current affairs, NIET facts) before going live. */
  verify: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
}

export const McqQuestion = z
  .object({
    ...questionBase,
    type: z.literal('mcq'),
    options: z.array(z.string().min(1)).min(2).max(4),
    answerIndex: z.number().int().nonnegative(),
  })
  .refine((q) => q.answerIndex < q.options.length, {
    message: 'answerIndex is out of range',
    path: ['answerIndex'],
  })

export const TrueFalseQuestion = z.object({
  ...questionBase,
  type: z.literal('truefalse'),
  answer: z.boolean(),
})

export const OpenQuestion = z.object({
  ...questionBase,
  type: z.literal('open'),
  answer: z.string().min(1),
})

export const Question = z.discriminatedUnion('type', [McqQuestion, TrueFalseQuestion, OpenQuestion])

export const QuestionBank = z.object({
  version: z.literal(1),
  categories: z.array(Category).min(1),
  questions: z.array(Question),
})

export const Round = z.object({
  id,
  title: z.string().min(1),
  subtitle: z.string().optional(),
  /** Category used for the round card's icon/colour. */
  category: id.optional(),
  /** Overrides the session's default timer for this round. */
  timerSeconds: z.number().int().positive().optional(),
  questionIds: z.array(id).min(1),
})

export const Session = z.object({
  version: z.literal(1),
  id,
  title: z.string().min(1),
  event: z.string().optional(),
  tagline: z.string().optional(),
  /** Planned length, used for pacing hints only. */
  durationMinutes: z.number().int().positive().optional(),
  defaults: z.object({
    timerSeconds: z.number().int().positive().default(30),
    /** Options appear all together or one by one (A → B → C → D). */
    optionReveal: z.enum(['together', 'sequential']).default('sequential'),
  }),
  rounds: z.array(Round).min(1),
})

export const SessionIndex = z.object({
  sessions: z.array(z.object({ id, title: z.string(), event: z.string().optional() })),
})

export type Difficulty = z.infer<typeof Difficulty>
export type Category = z.infer<typeof Category>
export type Media = z.infer<typeof Media>
export type Question = z.infer<typeof Question>
export type QuestionBank = z.infer<typeof QuestionBank>
export type Round = z.infer<typeof Round>
export type Session = z.infer<typeof Session>
export type SessionIndex = z.infer<typeof SessionIndex>
