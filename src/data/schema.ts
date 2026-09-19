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
    /**
     * How the image is uncovered before the answer: progressively unblurred or zoomed out,
     * or `peek`: only a top strip shows until the answer drops the rest into view.
     */
    reveal: z.enum(['none', 'blur', 'zoom', 'peek']).default('none'),
    /** For `peek`: how much of the image, from the top, shows before the answer (percent, default 30). */
    peek: z.number().min(5).max(95).optional(),
    /** For `zoom`: how far in the opening close-up is (default 4×). */
    zoom: z.number().min(1.5).max(16).optional(),
    /** For `zoom`: the point to zoom into, as [x%, y%] of the media frame (default centre). */
    focus: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]).optional(),
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
  /** A YouTube clip, streamed on the day (needs internet in the hall). */
  z.object({
    kind: z.literal('youtube'),
    /** The 11-character video id, e.g. "WwNk-zjdAqc" from youtu.be/WwNk-zjdAqc. */
    id: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'a YouTube video id is 11 characters'),
    start: z.number().nonnegative().optional(),
    end: z.number().positive().optional(),
    /** Play the clip silently for the question; the reveal replays it with sound. */
    muted: z.boolean().default(false),
    /** Show only this much of the frame (percent) until the reveal. */
    peek: z.number().min(5).max(95).optional(),
    /** Which edge the `peek` strip is taken from (default bottom). */
    peekFrom: z.enum(['top', 'bottom']).default('bottom'),
    /** Sound only: the picture stays hidden until the reveal. */
    audioOnly: z.boolean().default(false),
  }),
])

/** Where a media item lives: a path under public/ or, for YouTube, its link. */
export function mediaLocation(media: z.infer<typeof Media>): string {
  if (media.kind !== 'youtube') return media.src
  return `https://youtu.be/${media.id}${media.start ? `?t=${media.start}` : ''}`
}

const questionBase = {
  id,
  category: id,
  difficulty: Difficulty,
  prompt: z.string().min(1),
  media: Media.optional(),
  /** Big text shown on the upper stage instead of media, e.g. an emoji puzzle or an equation. */
  showcase: z.string().optional(),
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

export const Round = z
  .object({
    id,
    title: z.string().min(1),
    subtitle: z.string().optional(),
    /** Category used for the round card's icon/colour. */
    category: id.optional(),
    /** Overrides the session's default timer for this round. */
    timerSeconds: z.number().int().positive().optional(),
    /** The round's question pool, in order. */
    questionIds: z.array(id).min(1),
    /** Show only this many questions, drawn at random (balanced by difficulty) from the pool. */
    pick: z.number().int().positive().optional(),
    /** Questions always included in a `pick` draw; the rest of the pick is drawn as usual. */
    keep: z.array(id).default([]),
    /** Randomise which questions appear even without `pick`. */
    shuffle: z.boolean().default(false),
  })
  .refine((r) => r.pick === undefined || r.pick <= r.questionIds.length, {
    message: 'pick is larger than the question pool',
    path: ['pick'],
  })
  .refine((r) => r.keep.every((k) => r.questionIds.includes(k)), {
    message: 'keep lists a question that is not in this round',
    path: ['keep'],
  })
  .refine((r) => r.pick === undefined || r.keep.length <= r.pick, {
    message: 'keep has more questions than pick',
    path: ['keep'],
  })

export const Session = z.object({
  version: z.literal(1),
  id,
  title: z.string().min(1),
  event: z.string().optional(),
  tagline: z.string().optional(),
  /**
   * How many questions the show has. Round picks are scaled in proportion to reach it
   * (the host can change it on the home page). Without it, the picks are used as written.
   */
  questionCount: z.number().int().positive().optional(),
  /** Planned length, used for pacing hints only. */
  durationMinutes: z.number().int().positive().optional(),
  /** Default arrangement: the category rounds as written, or a ladder of rising difficulty built from the same questions. */
  order: z.enum(['category', 'difficulty']).default('category'),
  /** Names for the difficulty-ladder levels, easiest first (defaults to Warm-up … Final Challenge). The last two always name the top two levels. */
  levelTitles: z.array(z.string().min(1)).optional(),
  /** Default draw number for rounds with `pick`, so every device shows the same questions until reshuffled. */
  seed: z.number().int().positive().default(2026),
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
