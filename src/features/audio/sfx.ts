/**
 * Public sound API for the presenter.
 *
 * Every cue is synthesised by default (see music.ts). Any cue can be replaced by
 * a recording listed in `public/media/sfx/sfx.json`, e.g. { "correct": "correct.mp3" };
 * files resolve relative to `media/sfx/`. Looping cues ("bed", "suspense") loop the file.
 */
import { mediaUrl } from '@/data/source'
import { CUES, type Cue, type LoopCue, type OneShotCue } from './cues'
import { AudioEngine } from './engine'
import { CUE_SYNTHS, startBed, startSuspense, type Loop } from './music'

class SoundBoard {
  private engine: AudioEngine | null = null
  private overrides = new Map<Cue, AudioBuffer>()
  private loops = new Map<LoopCue, Loop>()
  private muted = false
  private volume = 0.9

  /** Must be called from a user gesture (key press/click) before sound can play. */
  unlock() {
    if (!this.engine) {
      this.engine = new AudioEngine()
      this.applyVolume()
      void this.loadOverrides()
    }
    if (this.engine.ctx.state === 'suspended') void this.engine.ctx.resume()
  }

  get ready() {
    return this.engine?.ctx.state === 'running'
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.applyVolume()
  }

  /** Master volume, 0 … 1. */
  setVolume(volume: number) {
    this.volume = volume
    this.applyVolume()
  }

  private applyVolume() {
    const e = this.engine
    if (e) e.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, e.now, 0.05)
  }

  /** Plays a one-shot cue. `variant` is cue-specific (option index, seconds left). */
  play(cue: OneShotCue, delay = 0, variant = 0) {
    const e = this.engine
    if (!e || !this.ready) return
    const at = e.now + delay
    const file = this.overrides.get(cue)
    if (file) this.playBuffer(file, at)
    else CUE_SYNTHS[cue](e, at, variant)
  }

  /** Starts a looping cue (no-op if it's already running). */
  startLoop(cue: LoopCue) {
    const e = this.engine
    if (!e || !this.ready || this.loops.has(cue)) return
    const file = this.overrides.get(cue)
    this.loops.set(cue, file ? this.playBuffer(file, e.now, true) : cue === 'bed' ? startBed(e) : startSuspense(e))
  }

  stopLoop(cue: LoopCue, fade?: number) {
    this.loops.get(cue)?.stop(fade)
    this.loops.delete(cue)
  }

  stopAll() {
    for (const cue of [...this.loops.keys()]) this.stopLoop(cue, 0.2)
  }

  /** Bed intensity, 0 (calm) … 1 (final seconds). */
  setBedIntensity(x: number) {
    this.loops.get('bed')?.setIntensity?.(x)
  }

  private playBuffer(buffer: AudioBuffer, at: number, loop = false): Loop {
    const e = this.engine!
    const src = e.ctx.createBufferSource()
    src.buffer = buffer
    src.loop = loop
    const g = e.ctx.createGain()
    src.connect(g).connect(e.out)
    src.start(at)
    return {
      stop: (fade = 0.2) => {
        g.gain.setTargetAtTime(0.0001, e.now, fade / 3)
        src.stop(e.now + fade + 0.1)
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
            const r = await fetch(mediaUrl(`media/sfx/${file}`))
            if (!r.ok) throw new Error(`${r.status}`)
            this.overrides.set(cue as Cue, await this.engine!.ctx.decodeAudioData(await r.arrayBuffer()))
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

export const sfx = new SoundBoard()
