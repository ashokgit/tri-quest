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
import { CUES, type Cue } from '../src/features/presenter/cues.ts'

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

const bank = parse('data/questions.json', QuestionBank)
if (bank) {
  const categoryIds = new Set(bank.categories.map((c) => c.id))
  const seen = new Set<string>()
  for (const q of bank.questions) {
    if (seen.has(q.id)) errors.push(`questions.json: duplicate question id "${q.id}"`)
    seen.add(q.id)
    if (!categoryIds.has(q.category)) errors.push(`questions.json → ${q.id}: unknown category "${q.category}"`)
    if (q.media && !existsSync(join(publicDir, q.media.src))) {
      ;(strict ? errors : warnings).push(`${q.id}: missing media file public/${q.media.src}`)
    }
    if (q.verify) warnings.push(`${q.id} is flagged "verify"`)
  }
}

const index = parse('data/sessions/index.json', SessionIndex)
const sessionFiles = readdirSync(join(publicDir, 'data/sessions')).filter((f) => f.endsWith('.json') && f !== 'index.json')
for (const file of sessionFiles) {
  const rel = `data/sessions/${file}`
  const session = parse(rel, Session)
  if (!session) continue
  if (`${session.id}.json` !== file) errors.push(`${rel}: id "${session.id}" does not match file name`)
  if (index && !index.sessions.some((s) => s.id === session.id)) warnings.push(`${session.id} is not listed in sessions/index.json`)
  const used = new Set<string>()
  for (const round of session.rounds) {
    for (const qid of round.questionIds) {
      if (bank && !bank.questions.some((q) => q.id === qid)) errors.push(`${rel} → ${round.id}: unknown question "${qid}"`)
      if (used.has(qid)) errors.push(`${rel} → ${round.id}: question "${qid}" is used twice`)
      used.add(qid)
    }
  }
  console.log(`✔ ${session.id}: ${session.rounds.length} rounds, ${used.size} questions`)
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

if (bank) console.log(`✔ question bank: ${bank.questions.length} questions in ${bank.categories.length} categories`)

for (const w of warnings) console.warn(`⚠ ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`✖ ${e}`)
  process.exit(1)
}
