/**
 * Validates everything under public/data before a build or rehearsal:
 * schema shape, unknown categories, duplicate ids, dangling question refs
 * and missing media files. Exits non-zero on any error.
 *
 *   npm run validate
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { z } from 'zod'
import { QuestionBank, Session, SessionIndex } from '../src/data/schema.ts'
import { scalePicks } from '../src/data/draw.ts'
import { CUES, type Cue } from '../src/features/audio/cues.ts'

const publicDir = join(import.meta.dirname, '..', 'public')
/** --strict (event-day check) treats missing media as errors; otherwise they're warnings so work can continue. */
const strict = process.argv.includes('--strict')
const errors: string[] = []
const warnings: string[] = []

function readJson(rel: string): unknown {
  try {
    return JSON.parse(readFileSync(join(publicDir, rel), 'utf8'))
  } catch (e) {
    errors.push(`${rel}: ${(e as Error).message}`)
    return undefined
  }
}

function parse<T>(rel: string, schema: z.ZodType<T>) {
  const raw = readJson(rel)
  if (raw === undefined) return undefined
  const result = schema.safeParse(raw)
  if (!result.success) {
    for (const issue of result.error.issues) errors.push(`${rel} → ${issue.path.join('.')}: ${issue.message}`)
    return undefined
  }
  return result.data
}

/** Every question bank: the shared one, plus any a session names with `bank`. */
const bankFiles = [
  'questions.json',
  ...readdirSync(join(publicDir, 'data')).filter((f) => /^questions-.+\.json$/.test(f)),
]
const banks = new Map<string, z.infer<typeof QuestionBank> | undefined>()
for (const file of bankFiles) {
  const bank = parse(`data/${file}`, QuestionBank)
  banks.set(file, bank)
  if (!bank) continue
  const categoryIds = new Set(bank.categories.map((c) => c.id))
  const seen = new Set<string>()
  for (const q of bank.questions) {
    if (seen.has(q.id)) errors.push(`${file}: duplicate question id "${q.id}"`)
    seen.add(q.id)
    if (!categoryIds.has(q.category)) errors.push(`${file} → ${q.id}: unknown category "${q.category}"`)
    if (q.media?.kind === 'youtube') warnings.push(`${q.id} streams from YouTube: the hall PC needs internet`)
    else if (q.media && !existsSync(join(publicDir, q.media.src))) {
      ;(strict ? errors : warnings).push(`${q.id}: missing media file public/${q.media.src}`)
    }
    if (q.verify) warnings.push(`${q.id} is flagged "verify"`)
  }
}

/** Extra checks for a session in the groups format: the rules must be playable with the pools given. */
function checkGroups(rel: string, session: z.infer<typeof Session>, bank: z.infer<typeof QuestionBank> | undefined) {
  const byId = new Map((bank?.questions ?? []).map((q) => [q.id, q]))
  const groups = session.groups.length
  let total = 0
  for (const round of session.rounds) {
    const rules = round.play
    if (!rules) continue
    const pool = round.questionIds.map((id) => byId.get(id)).filter((q) => q !== undefined)
    const held = pool.filter((q) => q.tags.includes('tiebreak'))
    const main = pool.filter((q) => !q.tags.includes('tiebreak'))
    const pick = round.pick ?? main.length
    total += pick
    if (pick > main.length) errors.push(`${rel} → ${round.id}: pick ${pick} is more than the ${main.length} non-tie-breaker questions in the pool`)
    if (rules.tiebreakers > held.length) errors.push(`${rel} → ${round.id}: ${rules.tiebreakers} tie-breakers wanted, ${held.length} tagged "tiebreak" in the pool`)
    if (held.length && !rules.tiebreakers) warnings.push(`${round.id} has questions tagged "tiebreak" but tiebreakers is 0, so they will never be played`)
    if (rules.mode === 'rapid' && pick % (groups * rules.block) !== 0) {
      warnings.push(`${round.id}: ${pick} questions don't split into whole blocks of ${rules.block} for ${groups} groups (the last block will be short)`)
    }
    if (rules.mode === 'rapid' && (rules.passPoints || rules.penalty || rules.hopSeconds)) warnings.push(`${round.id}: rapid fire ignores passPoints and hopSeconds`)
    if (rules.mode === 'turns' && !rules.passPoints) warnings.push(`${round.id}: a turns round with passPoints 0 passes for nothing`)
    if (!rules.intro.length) warnings.push(`${round.id} has no intro lines for its title card`)
    for (const q of pool) {
      if (q.type === 'open') errors.push(`${rel} → ${q.id}: open questions have no tiles to pick, so groups can't answer them`)
      if (q.media) errors.push(`${rel} → ${q.id}: media is not shown in the groups format`)
      if (rules.lifelines && !q.hint) warnings.push(`${q.id} is in a lifeline round but has no hint`)
    }
  }
  console.log(`✔ ${session.id}: groups format, ${groups} groups, ${session.rounds.length} rounds, ${total} questions (plus tie-breakers) from a pool of ${session.rounds.reduce((n, r) => n + r.questionIds.length, 0)}`)
}

const index = parse('data/sessions/index.json', SessionIndex)
const sessionFiles = readdirSync(join(publicDir, 'data/sessions')).filter((f) => f.endsWith('.json') && f !== 'index.json')
for (const file of sessionFiles) {
  const rel = `data/sessions/${file}`
  const session = parse(rel, Session)
  if (!session) continue
  if (`${session.id}.json` !== file) errors.push(`${rel}: id "${session.id}" does not match file name`)
  if (index && !index.sessions.some((s) => s.id === session.id)) warnings.push(`${session.id} is not listed in sessions/index.json`)
  const bankFile = session.bank ?? 'questions.json'
  const bank = banks.get(bankFile)
  if (!bankFiles.includes(bankFile)) errors.push(`${rel}: bank "${bankFile}" not found in public/data`)
  const used = new Set<string>()
  for (const round of session.rounds) {
    for (const qid of round.questionIds) {
      if (bank && !bank.questions.some((q) => q.id === qid)) errors.push(`${rel} → ${round.id}: unknown question "${qid}"`)
      if (used.has(qid)) errors.push(`${rel} → ${round.id}: question "${qid}" is used twice`)
      used.add(qid)
    }
  }
  if (session.format === 'groups') {
    checkGroups(rel, session, bank)
    continue
  }
  const shown = session.questionCount === undefined ? session.rounds.reduce((n, r) => n + (r.pick ?? r.questionIds.length), 0) : scalePicks(session.rounds, session.questionCount).reduce((a, b) => a + b, 0)
  console.log(`✔ ${session.id}: ${session.rounds.length} rounds, ${shown} shown from a pool of ${used.size}`)
}
// Optional sound overrides: every listed file must exist.
const sfxManifest = join(publicDir, 'media/sfx/sfx.json')
if (existsSync(sfxManifest)) {
  const manifest = readJson('media/sfx/sfx.json') as Record<string, string> | undefined
  for (const [cue, file] of Object.entries(manifest ?? {})) {
    if (!CUES.includes(cue as Cue)) errors.push(`sfx.json: unknown cue "${cue}" (expected one of ${CUES.join(', ')})`)
    else if (!existsSync(join(publicDir, 'media/sfx', file))) errors.push(`sfx.json → ${cue}: missing file public/media/sfx/${file}`)
  }
  console.log(`✔ sound overrides: ${Object.keys(manifest ?? {}).length} cue(s)`)
}

for (const [file, bank] of banks) if (bank) console.log(`✔ question bank ${file}: ${bank.questions.length} questions in ${bank.categories.length} categories`)

for (const w of warnings) console.warn(`⚠ ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`✖ ${e}`)
  process.exit(1)
}
