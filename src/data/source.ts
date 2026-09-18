import { QuestionBank, Session, SessionIndex, type Question } from './schema'

/**
 * Data access layer. Today it reads static JSON from `public/data`;
 * later these functions get swapped for Supabase queries with the same signatures.
 */

const dataUrl = (path: string) => `${import.meta.env.BASE_URL}data/${path}`

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(dataUrl(path), { cache: 'no-cache' })
  // Dev and static hosts may answer a missing file with index.html, so check the type too.
  if (!res.ok || !res.headers.get('content-type')?.includes('json')) throw new Error(`Couldn't find ${path}`)
  return res.json()
}

export async function getSessionIndex(): Promise<SessionIndex> {
  return SessionIndex.parse(await fetchJson('sessions/index.json'))
}

export async function getQuestionBank(): Promise<QuestionBank> {
  return QuestionBank.parse(await fetchJson('questions.json'))
}

export async function getSession(id: string): Promise<Session> {
  return Session.parse(await fetchJson(`sessions/${id}.json`))
}

export interface LoadedSession {
  session: Session
  bank: QuestionBank
  questionsById: Map<string, Question>
}

/** Loads a session together with the questions it references. */
export async function loadSession(id: string): Promise<LoadedSession> {
  const [session, bank] = await Promise.all([getSession(id), getQuestionBank()])
  const questionsById = new Map(bank.questions.map((q) => [q.id, q]))
  const missing = session.rounds.flatMap((r) => r.questionIds).filter((qid) => !questionsById.has(qid))
  if (missing.length) throw new Error(`Session "${id}" references unknown questions: ${missing.join(', ')}`)
  return { session, bank, questionsById }
}

/** Resolves a public/ media path (e.g. "media/images/x.jpg") to a URL under the app base. */
export const mediaUrl = (src: string) => `${import.meta.env.BASE_URL}${src}`
