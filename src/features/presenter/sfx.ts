/**
 * Game-show sound effects, synthesised with the Web Audio API so they work
 * offline with no audio files or licensing to worry about.
 *
 * Any cue can be replaced by a real recording: list it in
 * `public/media/sfx/sfx.json`, e.g. { "correct": "correct.mp3", "bed": "bed.mp3" }.
 * Files are resolved relative to `media/sfx/`. The "bed" cue loops while the clock runs.
 */
import { mediaUrl } from '@/data/source'
import { CUES, type Cue } from './cues'

type Voice = { stop: (fade?: number) => void }

class SoundBoard {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private overrides = new Map<Cue, AudioBuffer>()
  private muted = false
  private bed: Voice | null = null

  /** Must be called from a user gesture (key press/click) before sound can play. */
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.8
      // Gentle limiter so stacked cues never clip through the hall speakers.
      const limiter = this.ctx.createDynamicsCompressor()
      limiter.threshold.value = -6
      limiter.ratio.value = 12
      this.master.connect(limiter).connect(this.ctx.destination)
      void this.loadOverrides()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05)
  }

  /** Plays a one-shot cue. `variant` nudges pitch (e.g. successive option pings). */
  play(cue: Exclude<Cue, 'bed'>, delay = 0, variant = 0) {
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running') return
    const at = ctx.currentTime + delay
    const file = this.overrides.get(cue)
    if (file) return void this.playBuffer(file, at)
    SYNTHS[cue](this, at, variant)
  }

  /** Starts the looping tension bed under a running clock. */
  startBed() {
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running' || this.bed) return
    const file = this.overrides.get('bed')
    this.bed = file ? this.playBuffer(file, ctx.currentTime, true) : synthBed(this)
  }

  stopBed() {
    this.bed?.stop(0.4)
    this.bed = null
  }

  // ---- building blocks for the synth cues ----

  get audio() {
    return { ctx: this.ctx!, out: this.master! }
  }

  tone(opts: {
    at: number
    freq: number
    toFreq?: number
    dur: number
    type?: OscillatorType
    gain?: number
    attack?: number
    lowpass?: number
    detune?: number
  }) {
    const { ctx, out } = this.audio
    const { at, freq, toFreq, dur, type = 'sine', gain = 0.3, attack = 0.005, lowpass, detune = 0 } = opts
    const osc = ctx.createOscillator()
    osc.type = type
    osc.detune.value = detune
    osc.frequency.setValueAtTime(freq, at)
    if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, at + dur)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, at)
    env.gain.linearRampToValueAtTime(gain, at + attack)
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    let node: AudioNode = osc
    if (lowpass) {
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = lowpass
      node = node.connect(f)
    }
    node.connect(env).connect(out)
    osc.start(at)
    osc.stop(at + dur + 0.05)
  }

  noiseBurst(opts: { at: number; dur: number; gain?: number; filter?: BiquadFilterType; from: number; to?: number; attack?: number; q?: number }) {
    const { ctx, out } = this.audio
    const { at, dur, gain = 0.2, filter = 'bandpass', from, to, attack = 0.01, q = 1 } = opts
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer()
    const f = ctx.createBiquadFilter()
    f.type = filter
    f.Q.value = q
    f.frequency.setValueAtTime(from, at)
    if (to) f.frequency.exponentialRampToValueAtTime(to, at + dur)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, at)
    env.gain.exponentialRampToValueAtTime(gain, at + attack)
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    src.connect(f).connect(env).connect(out)
    src.start(at)
    src.stop(at + dur + 0.05)
  }

  private noiseBuffer() {
    if (!this.noise) {
      const { ctx } = this.audio
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const data = this.noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    return this.noise
  }

  private playBuffer(buffer: AudioBuffer, at: number, loop = false): Voice {
    const { ctx, out } = this.audio
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = loop
    const env = ctx.createGain()
    src.connect(env).connect(out)
    src.start(at)
    return {
      stop: (fade = 0.2) => {
        env.gain.setTargetAtTime(0, ctx.currentTime, fade / 3)
        src.stop(ctx.currentTime + fade)
      },
    }
  }

  private async loadOverrides() {
    try {
      const res = await fetch(mediaUrl('media/sfx/sfx.json'), { cache: 'no-cache' })
      if (!res.ok || !res.headers.get('content-type')?.includes('json')) return
      const manifest = (await res.json()) as Partial<Record<Cue, string>>
      // Each file loads independently, so one bad file only falls back for its own cue.
      await Promise.all(
        Object.entries(manifest).map(async ([cue, file]) => {
          if (!CUES.includes(cue as Cue) || !file) return
          try {
            const res = await fetch(mediaUrl(`media/sfx/${file}`))
            if (!res.ok) throw new Error(`${res.status}`)
            this.overrides.set(cue as Cue, await this.audio.ctx.decodeAudioData(await res.arrayBuffer()))
          } catch (e) {
            console.warn(`Sound override "${cue}" (${file}) failed; using the built-in sound.`, e)
          }
        }),
      )
    } catch {
      // No manifest: built-in sounds only.
    }
  }
}

// ---- the synthesised cues ----

const NOTE = (semitonesFromA4: number) => 440 * 2 ** (semitonesFromA4 / 12)

const SYNTHS: Record<Exclude<Cue, 'bed'>, (s: SoundBoard, at: number, variant: number) => void> = {
  // Rising whoosh into a deep hit with a minor chord stab.
  roundIntro(s, at) {
    s.noiseBurst({ at, dur: 1.3, from: 180, to: 5000, gain: 0.22, attack: 1.1, q: 2 })
    const hit = at + 1.15
    s.tone({ at: hit, freq: 55, toFreq: 40, dur: 1.8, gain: 0.7 })
    s.tone({ at: hit, freq: 110, dur: 1.4, type: 'sawtooth', gain: 0.18, lowpass: 700 })
    for (const n of [-12, -9, -5, 0]) s.tone({ at: hit, freq: NOTE(n), dur: 1.6, type: 'sawtooth', gain: 0.07, lowpass: 2200, detune: 6 })
    s.noiseBurst({ at: hit, dur: 1.2, filter: 'highpass', from: 6000, gain: 0.08 })
  },

  // Crisp ping as each answer bar slides in, stepping up in pitch.
  optionIn(s, at, i) {
    const f = NOTE(12 + [0, 3, 5, 7][i % 4])
    s.tone({ at, freq: f, dur: 0.35, type: 'triangle', gain: 0.18 })
    s.tone({ at, freq: f * 2, dur: 0.2, gain: 0.05 })
    s.noiseBurst({ at, dur: 0.12, filter: 'highpass', from: 4000, gain: 0.05 })
  },

  // The "final answer" moment: low thud with a tense dissonant swell.
  lock(s, at) {
    s.tone({ at, freq: 70, toFreq: 50, dur: 1.2, gain: 0.6 })
    s.tone({ at, freq: 140, dur: 0.8, type: 'square', gain: 0.08, lowpass: 500 })
    s.tone({ at, freq: NOTE(0), dur: 1.6, type: 'sawtooth', gain: 0.05, attack: 0.5, lowpass: 1800 })
    s.tone({ at, freq: NOTE(1), dur: 1.6, type: 'sawtooth', gain: 0.05, attack: 0.5, lowpass: 1800 })
  },

  // Wood-block tick for the last seconds.
  tick(s, at) {
    s.tone({ at, freq: 1500, dur: 0.06, type: 'square', gain: 0.12, lowpass: 3000 })
    s.tone({ at, freq: 750, dur: 0.08, gain: 0.15 })
  },

  // Brassy buzzer when the clock hits zero.
  timeUp(s, at) {
    for (const f of [NOTE(-12), NOTE(-9), NOTE(-6)]) s.tone({ at, freq: f, dur: 0.9, type: 'sawtooth', gain: 0.12, lowpass: 1400 })
    s.tone({ at, freq: 55, dur: 0.9, gain: 0.5 })
    s.noiseBurst({ at, dur: 0.5, from: 800, gain: 0.1 })
  },

  // Bright rising arpeggio and a shimmering major chord.
  correct(s, at) {
    const arp = [3, 7, 10, 15].map(NOTE)
    arp.forEach((f, i) => s.tone({ at: at + i * 0.07, freq: f, dur: 0.5, type: 'triangle', gain: 0.2 }))
    const chord = at + 0.3
    for (const n of [3, 7, 10, 15]) s.tone({ at: chord, freq: NOTE(n), dur: 1.8, type: 'sawtooth', gain: 0.05, lowpass: 3500, detune: 5 })
    s.tone({ at: chord, freq: NOTE(-9), dur: 1.4, gain: 0.35 })
    s.noiseBurst({ at: chord, dur: 1.5, filter: 'highpass', from: 7000, gain: 0.07, attack: 0.1 })
  },

  // Falling "not quite" tone with a low thud.
  wrong(s, at) {
    s.tone({ at, freq: NOTE(-6), toFreq: NOTE(-14), dur: 1.1, type: 'sawtooth', gain: 0.16, lowpass: 900 })
    s.tone({ at, freq: NOTE(-5), toFreq: NOTE(-13), dur: 1.1, type: 'sawtooth', gain: 0.1, lowpass: 900, detune: 10 })
    s.tone({ at, freq: 60, toFreq: 40, dur: 0.8, gain: 0.5 })
  },

  // Reveal for open questions: a softer version of "correct".
  reveal(s, at) {
    for (const n of [3, 7, 10]) s.tone({ at, freq: NOTE(n), dur: 1.4, type: 'triangle', gain: 0.12 })
    s.tone({ at, freq: NOTE(-9), dur: 1.2, gain: 0.3 })
    s.noiseBurst({ at, dur: 1.2, filter: 'highpass', from: 7000, gain: 0.06, attack: 0.1 })
  },

  // Closing fanfare: I–IV–V–I brass stabs with a cymbal swell.
  finale(s, at) {
    const chords = [
      [3, 7, 10],
      [8, 12, 15],
      [10, 14, 17],
      [15, 19, 22],
    ]
    chords.forEach((c, i) => {
      const t = at + i * 0.38
      const len = i === chords.length - 1 ? 2.4 : 0.4
      for (const n of c) s.tone({ at: t, freq: NOTE(n - 12), dur: len, type: 'sawtooth', gain: 0.07, lowpass: 2600, detune: 6 })
      s.tone({ at: t, freq: NOTE(c[0] - 24), dur: len, gain: 0.35 })
    })
    s.noiseBurst({ at, dur: 3.2, filter: 'highpass', from: 5000, gain: 0.12, attack: 1.2 })
  },
}

/** Low drone with a heartbeat pulse, for suspense while the clock runs. */
function synthBed(s: SoundBoard): Voice {
  const { ctx, out } = s.audio
  const bus = ctx.createGain()
  bus.gain.setValueAtTime(0, ctx.currentTime)
  bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.8)
  bus.connect(out)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 420
  filter.connect(bus)
  const drones = [NOTE(-24), NOTE(-24), NOTE(-17)].map((f, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = f
    osc.detune.value = [-7, 7, 0][i]
    const g = ctx.createGain()
    g.gain.value = 0.045
    osc.connect(g).connect(filter)
    osc.start()
    return osc
  })

  const beat = () => {
    const t = ctx.currentTime + 0.02
    for (const offset of [0, 0.22]) {
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(65, t + offset)
      osc.frequency.exponentialRampToValueAtTime(40, t + offset + 0.15)
      const env = ctx.createGain()
      env.gain.setValueAtTime(offset ? 0.28 : 0.4, t + offset)
      env.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.18)
      osc.connect(env).connect(bus)
      osc.start(t + offset)
      osc.stop(t + offset + 0.2)
    }
  }
  beat()
  const id = window.setInterval(beat, 900)

  return {
    stop(fade = 0.4) {
      window.clearInterval(id)
      bus.gain.setTargetAtTime(0, ctx.currentTime, fade / 3)
      drones.forEach((o) => o.stop(ctx.currentTime + fade + 0.1))
    },
  }
}

export const sfx = new SoundBoard()
