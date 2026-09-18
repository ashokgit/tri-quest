/** Sound cue names. Kept dependency-free so the Node validation script can import it. */
export const CUES = ['roundIntro', 'optionIn', 'lock', 'tick', 'timeUp', 'correct', 'wrong', 'reveal', 'finale', 'bed'] as const

export type Cue = (typeof CUES)[number]
