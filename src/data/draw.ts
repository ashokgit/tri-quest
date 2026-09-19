/**
 * Seeded, difficulty-balanced question draws for rounds that use `pick`.
 * Dependency-free so the Node validation script can use it too.
 */

type Difficulty = 'easy' | 'medium' | 'hard'
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

/** Small deterministic PRNG: the same seed always gives the same draw. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Short draw numbers (1–99999) so the host can note one down and pin it in the session file. */
export const randomSeed = () => 1 + Math.floor(Math.random() * 99999)

function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Picks `pick` questions from a round's pool, keeping the pool's difficulty mix
 * (largest-remainder allocation) and ordering the result easy → medium → hard.
 * Questions in `keep` are always included; the rest of the pick is drawn around them.
 * Without `pick` or `shuffle`, the pool is returned unchanged.
 */
export function drawRound<Q extends { id: string; difficulty: Difficulty }>(
  pool: Q[],
  opts: { pick?: number; shuffle?: boolean; keep?: string[] },
  rng: () => number,
): Q[] {
  if (!opts.pick && !opts.shuffle) return pool
  const keep = new Set(opts.keep ?? [])
  if (keep.size) {
    const kept = pool.filter((q) => keep.has(q.id))
    const rest = pool.filter((q) => !keep.has(q.id))
    const drawn = drawRound(rest, { ...opts, keep: [], pick: Math.max(0, (opts.pick ?? pool.length) - kept.length) }, rng)
    return DIFFICULTIES.flatMap((d) => [...kept, ...drawn].filter((q) => q.difficulty === d))
  }
  const pick = Math.min(opts.pick ?? pool.length, pool.length)
  if (pick === 0) return []

  const groups = DIFFICULTIES.map((d) => pool.filter((q) => q.difficulty === d))
  const exact = groups.map((g) => (g.length / pool.length) * pick)
  const counts = exact.map(Math.floor)
  // Hand out the remaining slots to the groups with the largest remainders.
  const order = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r)
  for (let k = 0, left = pick - counts.reduce((a, b) => a + b, 0); left > 0; k++) {
    const { i } = order[k % order.length]
    if (counts[i] < groups[i].length) {
      counts[i]++
      left--
    }
  }

  return groups.flatMap((g, i) => shuffled(g, rng).slice(0, counts[i]))
}
