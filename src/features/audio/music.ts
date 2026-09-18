/**
 * The Tri-Quest sound design: one-shot cues, the ticking-clock music bed and
 * the "final answer" suspense drone. Home key is D minor; wins resolve to D major.
 */
import { bell, brass, crash, kick, midi, noise, pad, riser, snareRoll, supersaw, timpani, tone, whoosh, woodblock, type AudioEngine } from './engine'
import type { OneShotCue } from './cues'

// Useful chords (MIDI notes).
const D_MINOR = [50, 53, 57, 62]
const D_MAJOR = [50, 54, 57, 62]
const A_MAJOR = [45, 49, 52, 57]

export const CUE_SYNTHS: Record<OneShotCue, (e: AudioEngine, at: number, variant: number) => void> = {
  /** Opening theme: drum roll and riser into a big minor chord with a bell cascade. */
  theme(e, at) {
    riser(e, at, 1.5, 0.16)
    snareRoll(e, at + 0.3, 1.2, 0.01, 0.16)
    const hit = at + 1.5
    kick(e, hit, 1, 100, 32, 1.2)
    timpani(e, hit, 38, 0.6)
    crash(e, hit, 0.24, 3)
    brass(e, hit, D_MINOR, 2.8, 0.09, 0.2, { reverb: 0.3 })
    tone(e, { at: hit, freq: midi(26), dur: 2.8, gain: 0.35 })
    ;[74, 77, 81, 86, 89].forEach((n, i) => bell(e, hit + 0.15 + i * 0.13, n, 0.1, 2, { pan: i % 2 ? 0.45 : -0.45 }))
  },

  /** Round card: short riser, boom on the tonic, then an expectant hit on the dominant. */
  roundIntro(e, at) {
    riser(e, at, 0.8, 0.14)
    const hit = at + 0.8
    kick(e, hit, 0.9)
    timpani(e, hit, 38, 0.5)
    crash(e, hit, 0.16, 2)
    brass(e, hit, D_MINOR, 0.9, 0.09, 0.02)
    const hit2 = hit + 0.5
    timpani(e, hit2, 33, 0.5)
    brass(e, hit2, A_MAJOR, 1.6, 0.09, 0.03, { reverb: 0.3 })
  },

  /** Answer bar sliding in: whoosh plus a chime, panned to its side of the screen (A/C left, B/D right). */
  optionIn(e, at, i) {
    const pan = i % 2 === 0 ? -0.5 : 0.5
    whoosh(e, at, pan, 0.12)
    bell(e, at + 0.06, [81, 84, 86, 89][i % 4], 0.22, 1.1, { pan })
  },

  /** Countdown tick; `variant` is the seconds left, rising in pitch as time runs out. */
  tick(e, at, secondsLeft) {
    const f = 900 + (5 - Math.min(5, secondsLeft)) * 140
    woodblock(e, at, f, 0.95)
    tone(e, { at, freq: f, dur: 0.16, gain: 0.45, reverb: 0.15 })
    noise(e, { at, dur: 0.02, gain: 0.35, filter: 'highpass', freq: 3000 })
    kick(e, at, 0.7, 180, 90, 0.16)
  },

  /** Time's up: a gong and a dissonant brass stab. */
  timeUp(e, at) {
    kick(e, at, 1, 90, 30, 0.9)
    bell(e, at, 45, 0.22, 3.2)
    brass(e, at, [38, 39, 45, 51], 1.3, 0.1, 0.01)
    crash(e, at, 0.18, 2)
  },

  /** "Final answer": a deep boom and a sucked-in swell (the suspense drone takes over from here). */
  lock(e, at) {
    kick(e, at, 1, 80, 28, 1.4)
    timpani(e, at, 38, 0.55)
    noise(e, { at: at - 0.05, dur: 0.6, gain: 0.08, filter: 'highpass', freq: 3000, attack: 0.5 })
    brass(e, at, [38, 45, 50], 1.2, 0.07, 0.02)
  },

  /** Correct: sparkling D-major arpeggio over a brass swell, timpani and crash. */
  correct(e, at) {
    ;[74, 78, 81, 86, 90].forEach((n, i) => bell(e, at + i * 0.07, n, 0.12, 1.8, { pan: (i / 4) * 1.2 - 0.6 }))
    brass(e, at + 0.05, D_MAJOR, 2.4, 0.1, 0.06, { reverb: 0.35 })
    tone(e, { at, freq: midi(38), dur: 2.2, gain: 0.3 })
    timpani(e, at, 38, 0.45)
    crash(e, at + 0.05, 0.2, 2.4)
    noise(e, { at: at + 0.2, dur: 1.6, gain: 0.04, filter: 'highpass', freq: 9000, attack: 0.3, reverb: 0.5 })
  },

  /** Wrong: a sagging chromatic brass line and a low thud. */
  wrong(e, at) {
    kick(e, at, 0.8, 70, 30, 0.8)
    ;[57, 56, 55, 54].forEach((n, i) => {
      const last = i === 3
      supersaw(e, { at: at + i * 0.3, freq: midi(n - 12), dur: last ? 1.3 : 0.3, gain: 0.1, attack: 0.02, lowpass: 900, voices: 3 })
    })
    timpani(e, at + 0.9, 33, 0.45)
  },

  /** Open-answer reveal: a gentler version of "correct". */
  reveal(e, at) {
    ;[74, 78, 81, 86].forEach((n, i) => bell(e, at + i * 0.08, n, 0.1, 1.8, { pan: (i / 3) * 1.0 - 0.5 }))
    pad(e, at, D_MAJOR, 2, 0.05, 1600, { reverb: 0.4 })
    tone(e, { at, freq: midi(38), dur: 1.8, gain: 0.25 })
    noise(e, { at: at + 0.1, dur: 1.4, gain: 0.035, filter: 'highpass', freq: 9000, attack: 0.3, reverb: 0.5 })
  },

  /** Closing fanfare: drum roll, then I–IV–V–I brass hits and a long bell cascade. */
  finale(e, at) {
    snareRoll(e, at, 1.6, 0.02, 0.22)
    const t = at + 1.6
    const hits: [number, number[], number][] = [
      [0, [50, 54, 57, 62, 66], 0.45],
      [0.5, [55, 59, 62, 67], 0.45],
      [1.0, [57, 61, 64, 69], 0.5],
      [1.6, [50, 54, 57, 62, 66, 69], 3.6],
    ]
    for (const [offset, chord, dur] of hits) {
      brass(e, t + offset, chord, dur, 0.085, 0.02, { reverb: 0.3 })
      timpani(e, t + offset, chord[0] - 12, 0.45)
      kick(e, t + offset, 0.7)
    }
    crash(e, t, 0.22, 2)
    crash(e, t + 1.6, 0.28, 3.5)
    tone(e, { at: t + 1.6, freq: midi(26), dur: 3.6, gain: 0.35 })
    ;[86, 90, 93, 98, 102, 105].forEach((n, i) => bell(e, t + 1.7 + i * 0.12, n, 0.08, 2.2, { pan: i % 2 ? 0.5 : -0.5 }))
  },
}

// ---------------------------------------------------------------------------
// Loops

export interface Loop {
  stop: (fade?: number) => void
  /** 0 = calm … 1 = last seconds. Only the bed uses it. */
  setIntensity?: (x: number) => void
  /** Briefly dip the loop so a cue (e.g. a countdown tick) cuts through. */
  duck?: (at: number) => void
}

/** Lookahead scheduler: calls `schedule(step, time)` for each 16th note just before it's due. */
function sequencer(e: AudioEngine, stepSeconds: number, schedule: (step: number, time: number) => void) {
  let step = 0
  let next = e.now + 0.05
  const id = window.setInterval(() => {
    while (next < e.now + 0.15) {
      schedule(step++, next)
      next += stepSeconds
    }
  }, 25)
  return () => window.clearInterval(id)
}

/**
 * The clock's music bed: 100 bpm in D minor over Dm – B♭ – Gm – A.
 * Always: bass pulse, heartbeat, pad. As intensity rises: bell arpeggio,
 * then hi-hats, then high tense strings.
 */
export function startBed(e: AudioEngine): Loop {
  const bus = e.ctx.createGain()
  bus.gain.setValueAtTime(0.0001, e.now)
  bus.gain.exponentialRampToValueAtTime(1, e.now + 0.6)
  bus.connect(e.out)
  const dest = { dest: bus }

  const bars = [
    { root: 38, chord: [50, 53, 57] },
    { root: 34, chord: [46, 50, 53] },
    { root: 31, chord: [43, 46, 50] },
    { root: 33, chord: [45, 49, 52] },
  ]
  const sixteenth = 60 / 100 / 4
  let intensity = 0

  const stopSeq = sequencer(e, sixteenth, (step, t) => {
    const s = step % 16
    const { root, chord } = bars[Math.floor(step / 16) % bars.length]

    if (s % 2 === 0) {
      tone(e, { at: t, freq: midi(root), dur: 0.14, type: 'sawtooth', gain: s === 0 ? 0.16 : 0.1, lowpass: 260 + intensity * 300, ...dest })
    }
    if (s === 0) kick(e, t, 0.55, 90, 38, 0.3, dest)
    if (s === 3) kick(e, t, 0.35, 90, 38, 0.25, dest)
    if (s === 0) pad(e, t, chord, sixteenth * 16, 0.028 + intensity * 0.02, 700 + intensity * 1600, dest)

    if (intensity > 0.35) {
      const arp = [...chord, chord[0] + 12]
      tone(e, {
        at: t,
        freq: midi(arp[s % arp.length] + 24),
        dur: 0.12,
        type: 'triangle',
        gain: 0.025 + intensity * 0.03,
        pan: s % 2 ? 0.4 : -0.4,
        reverb: 0.2,
        ...dest,
      })
    }
    if (intensity > 0.7) {
      noise(e, { at: t, dur: s % 2 ? 0.05 : 0.025, gain: s % 2 ? 0.035 : 0.02, filter: 'highpass', freq: 8000, pan: 0.25, ...dest })
    }
    if (intensity > 0.85 && s === 0) {
      supersaw(e, { at: t, freq: midi(chord[2] + 24), dur: sixteenth * 16, gain: 0.03, attack: 0.6, lowpass: 3000, reverb: 0.3, ...dest })
    }
  })

  let stopped = false
  return {
    setIntensity: (x) => {
      intensity = Math.max(0, Math.min(1, x))
    },
    duck: (at) => {
      if (stopped) return
      bus.gain.cancelScheduledValues(at)
      bus.gain.setTargetAtTime(0.3, at, 0.008)
      bus.gain.setTargetAtTime(1, at + 0.2, 0.08)
    },
    stop: (fade = 0.4) => {
      stopped = true
      stopSeq()
      bus.gain.cancelScheduledValues(e.now)
      bus.gain.setTargetAtTime(0.0001, e.now, fade / 3)
      window.setTimeout(() => bus.disconnect(), (fade + 1.5) * 1000)
    },
  }
}

/** "Final answer" suspense: a low pedal, a trembling high minor second and a slow heartbeat. */
export function startSuspense(e: AudioEngine): Loop {
  const { ctx } = e
  const bus = ctx.createGain()
  bus.gain.setValueAtTime(0.0001, e.now)
  bus.gain.exponentialRampToValueAtTime(1, e.now + 1.2)
  bus.connect(e.out)

  // Tremolo on the high strings.
  const trem = ctx.createGain()
  trem.gain.value = 0.5
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 7
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 0.5
  lfo.connect(lfoDepth).connect(trem.gain)
  trem.connect(bus)
  lfo.start()

  const held: OscillatorNode[] = []
  const hold = (note: number, gain: number, cutoff: number, dest: AudioNode, detunes = [-8, 0, 8]) => {
    for (const d of detunes) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = midi(note)
      osc.detune.value = d
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = cutoff
      const g = ctx.createGain()
      g.gain.value = gain / detunes.length
      osc.connect(f).connect(g).connect(dest)
      osc.start()
      held.push(osc)
    }
  }
  hold(26, 0.12, 220, bus) // low D pedal
  hold(38, 0.05, 400, bus)
  hold(81, 0.03, 2800, trem) // A5 against B♭5: a nervous minor second
  hold(82, 0.022, 2800, trem)

  const reverbSend = ctx.createGain()
  reverbSend.gain.value = 0.4
  bus.connect(reverbSend).connect(e.reverb)

  const stopSeq = sequencer(e, 0.6, (step, t) => {
    if (step % 2 === 0) kick(e, t, 0.45, 80, 36, 0.35, { dest: bus })
    if (step % 2 === 0) kick(e, t + 0.2, 0.3, 80, 36, 0.3, { dest: bus })
  })

  return {
    stop: (fade = 0.3) => {
      stopSeq()
      bus.gain.setTargetAtTime(0.0001, e.now, fade / 3)
      const end = e.now + fade + 0.3
      held.forEach((o) => o.stop(end))
      lfo.stop(end)
      window.setTimeout(() => bus.disconnect(), (fade + 2) * 1000)
    },
  }
}
