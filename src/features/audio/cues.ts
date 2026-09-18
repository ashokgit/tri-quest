/** Sound cue names. Kept dependency-free so the Node validation script can import it. */
export const CUES = [
  'theme',
  'roundIntro',
  'optionIn',
  'tick',
  'timeUp',
  'lock',
  'correct',
  'wrong',
  'reveal',
  'finale',
  'bed',
  'suspense',
] as const

export type Cue = (typeof CUES)[number]

/** Cues that loop until stopped (a file override for these should loop cleanly). */
export const LOOPING_CUES = ['bed', 'suspense'] as const satisfies readonly Cue[]

export type LoopCue = (typeof LOOPING_CUES)[number]
export type OneShotCue = Exclude<Cue, LoopCue>
