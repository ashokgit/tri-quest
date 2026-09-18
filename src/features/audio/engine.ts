/**
 * Audio engine: one AudioContext with a dry bus, a shared hall reverb and a
 * limiter on the master, plus the synthesised instruments every cue is built from.
 * Everything is generated in code, so it works offline and needs no files.
 */

export class AudioEngine {
  readonly ctx: AudioContext
  /** Master volume (host setting). */
  readonly master: GainNode
  /** Dry signal bus. */
  readonly out: GainNode
  /** Send into the hall reverb. */
  readonly reverb: GainNode
  readonly noise: AudioBuffer

  constructor() {
    const ctx = new AudioContext({ latencyHint: 'interactive' })
    this.ctx = ctx

    // Limiter so stacked hits never clip through the hall speakers.
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -10
    limiter.knee.value = 6
    limiter.ratio.value = 10
    limiter.attack.value = 0.003
    limiter.release.value = 0.25
    this.master = ctx.createGain()
    this.master.connect(limiter).connect(ctx.destination)

    this.out = ctx.createGain()
    this.out.connect(this.master)

    const convolver = ctx.createConvolver()
    convolver.buffer = hallImpulse(ctx, 2.8, 2.6)
    const wet = ctx.createGain()
    wet.gain.value = 0.55
    this.reverb = ctx.createGain()
    this.reverb.connect(convolver).connect(wet).connect(this.master)

    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }

  get now() {
    return this.ctx.currentTime
  }
}

/** Stereo decaying-noise impulse response: a cheap, convincing concert-hall tail. */
function hallImpulse(ctx: AudioContext, seconds: number, decay: number) {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay
  }
  return buffer
}

/** MIDI note number → frequency (A4 = 69 = 440 Hz). */
export const midi = (n: number) => 440 * 2 ** ((n - 69) / 12)

// ---------------------------------------------------------------------------
// Routing and envelopes

export interface Placement {
  /** Stereo position, -1 (left) … 1 (right). */
  pan?: number
  /** Amount sent to the hall reverb, 0 … 1. */
  reverb?: number
  /** Where the dry signal goes (defaults to the engine's dry bus). */
  dest?: AudioNode
}

function route(e: AudioEngine, node: AudioNode, { pan = 0, reverb = 0, dest }: Placement) {
  const panner = e.ctx.createStereoPanner()
  panner.pan.value = pan
  node.connect(panner).connect(dest ?? e.out)
  if (reverb > 0) {
    const send = e.ctx.createGain()
    send.gain.value = reverb
    panner.connect(send).connect(e.reverb)
  }
}

/** Gain node with an attack → hold → exponential release envelope. */
function envelope(e: AudioEngine, at: number, peak: number, attack: number, dur: number) {
  const g = e.ctx.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(peak, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, Math.max(at + attack + 0.01, at + dur))
  return g
}

// ---------------------------------------------------------------------------
// Instruments

export interface ToneOpts extends Placement {
  at: number
  freq: number
  toFreq?: number
  dur: number
  type?: OscillatorType
  gain?: number
  attack?: number
  detune?: number
  lowpass?: number
  /** Filter sweep target (with `lowpass`). */
  lowpassTo?: number
}

export function tone(e: AudioEngine, o: ToneOpts) {
  const { ctx } = e
  const osc = ctx.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.detune.value = o.detune ?? 0
  osc.frequency.setValueAtTime(o.freq, o.at)
  if (o.toFreq) osc.frequency.exponentialRampToValueAtTime(o.toFreq, o.at + o.dur)
  let node: AudioNode = osc
  if (o.lowpass) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(o.lowpass, o.at)
    if (o.lowpassTo) f.frequency.exponentialRampToValueAtTime(o.lowpassTo, o.at + Math.min(o.dur, (o.attack ?? 0.01) * 2 + 0.05))
    node = node.connect(f)
  }
  const env = envelope(e, o.at, o.gain ?? 0.2, o.attack ?? 0.005, o.dur)
  route(e, node.connect(env), o)
  osc.start(o.at)
  osc.stop(o.at + o.dur + 0.05)
}

/** Several detuned saws spread across the stereo field: the basis for brass, strings and pads. */
export function supersaw(
  e: AudioEngine,
  o: Omit<ToneOpts, 'type' | 'detune' | 'pan'> & { voices?: number; spread?: number; width?: number },
) {
  const voices = o.voices ?? 5
  const spread = o.spread ?? 16
  const width = o.width ?? 0.7
  for (let v = 0; v < voices; v++) {
    const t = voices === 1 ? 0 : v / (voices - 1) - 0.5
    tone(e, { ...o, type: 'sawtooth', gain: (o.gain ?? 0.1) / Math.sqrt(voices), detune: t * spread * 2, pan: t * 2 * width })
  }
}

/** Brass-like chord: the filter opens during the attack, like a horn section swelling. */
export function brass(e: AudioEngine, at: number, notes: number[], dur: number, gain = 0.08, attack = 0.04, place: Placement = {}) {
  for (const n of notes) {
    supersaw(e, { at, freq: midi(n), dur, gain, attack, lowpass: 350, lowpassTo: 2600, voices: 3, spread: 10, ...place })
  }
}

/** Soft sustained chord for beds and backgrounds. */
export function pad(e: AudioEngine, at: number, notes: number[], dur: number, gain = 0.03, cutoff = 900, place: Placement = {}) {
  for (const n of notes) supersaw(e, { at, freq: midi(n), dur, gain, attack: Math.min(0.4, dur / 3), lowpass: cutoff, voices: 4, ...place })
}

export interface NoiseOpts extends Placement {
  at: number
  dur: number
  gain?: number
  filter?: BiquadFilterType
  freq: number
  toFreq?: number
  q?: number
  attack?: number
}

export function noise(e: AudioEngine, o: NoiseOpts) {
  const { ctx } = e
  const src = ctx.createBufferSource()
  src.buffer = e.noise
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = o.filter ?? 'bandpass'
  f.Q.value = o.q ?? 1
  f.frequency.setValueAtTime(o.freq, o.at)
  if (o.toFreq) f.frequency.exponentialRampToValueAtTime(o.toFreq, o.at + o.dur)
  const env = envelope(e, o.at, o.gain ?? 0.1, o.attack ?? 0.005, o.dur)
  route(e, src.connect(f).connect(env), o)
  src.start(o.at, Math.random())
  src.stop(o.at + o.dur + 0.05)
}

/** Deep electronic kick / boom. */
export function kick(e: AudioEngine, at: number, gain = 0.8, from = 110, to = 38, dur = 0.6, place: Placement = {}) {
  tone(e, { at, freq: from, toFreq: to, dur, gain, attack: 0.002, ...place })
  noise(e, { at, dur: 0.03, gain: gain * 0.15, filter: 'lowpass', freq: 3000, ...place })
}

/** Timpani: pitched boom with a skin "thwack". */
export function timpani(e: AudioEngine, at: number, note: number, gain = 0.5) {
  const f = midi(note)
  tone(e, { at, freq: f * 1.03, toFreq: f, dur: 2.2, gain, attack: 0.004, reverb: 0.35 })
  tone(e, { at, freq: f * 1.5, dur: 0.6, gain: gain * 0.3, attack: 0.004, reverb: 0.2 })
  noise(e, { at, dur: 0.18, gain: gain * 0.35, filter: 'lowpass', freq: 900, reverb: 0.3 })
}

/** FM bell / chime. */
export function bell(e: AudioEngine, at: number, note: number, gain = 0.12, dur = 1.6, place: Placement = {}) {
  const { ctx } = e
  const f = midi(note)
  const carrier = ctx.createOscillator()
  carrier.frequency.value = f
  const mod = ctx.createOscillator()
  mod.frequency.value = f * 3.5
  const modGain = ctx.createGain()
  modGain.gain.setValueAtTime(f * 2.2, at)
  modGain.gain.exponentialRampToValueAtTime(1, at + dur)
  mod.connect(modGain).connect(carrier.frequency)
  const env = envelope(e, at, gain, 0.002, dur)
  route(e, carrier.connect(env), { reverb: 0.35, ...place })
  carrier.start(at)
  mod.start(at)
  carrier.stop(at + dur + 0.05)
  mod.stop(at + dur + 0.05)
  tone(e, { at, freq: f * 2.76, dur: dur * 0.4, gain: gain * 0.25, reverb: 0.3, ...place })
}

/** Cymbal crash. */
export function crash(e: AudioEngine, at: number, gain = 0.2, dur = 2.6) {
  noise(e, { at, dur, gain, filter: 'highpass', freq: 5500, reverb: 0.4, pan: -0.3 })
  noise(e, { at, dur: dur * 0.8, gain: gain * 0.7, filter: 'bandpass', freq: 8500, q: 0.6, reverb: 0.4, pan: 0.3 })
}

/** Snare roll that swells from `from` to `to` volume. */
export function snareRoll(e: AudioEngine, at: number, dur: number, from = 0.02, to = 0.18) {
  const hits = Math.floor(dur * 28)
  for (let i = 0; i < hits; i++) {
    const t = i / hits
    noise(e, { at: at + i / 28, dur: 0.07, gain: from + (to - from) * t * t, filter: 'bandpass', freq: 2200, q: 0.8, reverb: 0.2, pan: (i % 2) * 0.3 - 0.15 })
  }
}

/** Rising whoosh that builds into a hit at `at + dur`. */
export function riser(e: AudioEngine, at: number, dur: number, gain = 0.15) {
  noise(e, { at, dur: dur + 0.05, gain, filter: 'bandpass', freq: 300, toFreq: 7000, q: 1.5, attack: dur * 0.9, reverb: 0.3 })
  tone(e, { at, freq: 180, toFreq: 900, dur: dur + 0.05, type: 'sawtooth', gain: gain * 0.25, attack: dur * 0.9, lowpass: 1500 })
}

/** Short air swoosh, e.g. an answer bar sliding in. */
export function whoosh(e: AudioEngine, at: number, pan = 0, gain = 0.07) {
  noise(e, { at, dur: 0.28, gain, filter: 'bandpass', freq: 700, toFreq: 3500, q: 1.2, attack: 0.12, pan, reverb: 0.15 })
}

/** Wood-block tick. */
export function woodblock(e: AudioEngine, at: number, freq = 1100, gain = 0.18) {
  tone(e, { at, freq, dur: 0.07, gain, reverb: 0.1 })
  tone(e, { at, freq: freq * 2.6, dur: 0.03, type: 'triangle', gain: gain * 0.4 })
}
