import { motion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { Media } from '@/data/schema'
import { mediaUrl } from '@/data/source'
import { usePresenterStore } from '../store'

/** Marks the playable element on stage so the P key can find it. */
export const STAGE_MEDIA_ATTR = 'data-stage-media'
/** Window event the P key sends when the stage clip isn't a media element (YouTube). */
export const STAGE_MEDIA_TOGGLE = 'quizzeria:toggle-stage-media'

interface Props {
  media: Media
  /** 1 = maximally obscured, 0 = clear. Only used for images with a reveal effect. */
  obscurity: number
  /** The answer is showing. */
  revealed?: boolean
  /** On the presenter stage (false on the slide check, which shows a still instead of a player). */
  live?: boolean
}

export function MediaView({ media, obscurity, revealed = false, live = true }: Props) {
  if (media.kind === 'image') return <ImageMedia media={media} obscurity={obscurity} />
  if (media.kind === 'youtube') return live ? <YouTubeMedia media={media} revealed={revealed} /> : <YouTubeStill media={media} />
  return <PlayableMedia media={media} />
}

function ImageMedia({ media, obscurity }: { media: Extract<Media, { kind: 'image' }>; obscurity: number }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <MissingMedia src={media.src} />

  if (media.reveal === 'peek') return <PeekImage media={media} hidden={obscurity > 0} onError={() => setMissing(true)} />

  const blur = media.reveal === 'blur' ? obscurity * 36 : 0
  const zoom = media.reveal === 'zoom' ? 1 + obscurity * ((media.zoom ?? 4) - 1) : 1
  const [fx, fy] = media.focus ?? [50, 50]
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-black/40 ring-2 ring-white/10">
      <motion.img
        style={{ transformOrigin: `${fx}% ${fy}%` }}
        src={mediaUrl(media.src)}
        alt={media.alt ?? ''}
        draggable={false}
        onError={() => setMissing(true)}
        className="h-full w-full object-contain"
        animate={{ filter: `blur(${blur}px)`, scale: zoom }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </div>
  )
}

/**
 * Only the top strip of the image shows, enlarged to fill the frame; on the answer the
 * window opens out to the whole photo. Sizes are computed from the frame and the photo,
 * since the strip has to be scaled as a share of the photo, not of the frame.
 */
function PeekImage({ media, hidden, onError }: { media: Extract<Media, { kind: 'image' }>; hidden: boolean; onError: () => void }) {
  const frame = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)
  const [photo, setPhoto] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = frame.current
    if (!el) return
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const shown = hidden ? (media.peek ?? 30) / 100 : 1
  // Scale that fits the visible part of the photo (full width × `shown` of its height) inside the frame.
  const scale = box && photo ? Math.min(box.w / photo.w, box.h / (photo.h * shown)) : 0
  const ease = { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <div ref={frame} className="relative grid h-full w-full place-items-center overflow-hidden rounded-3xl bg-black/40 ring-2 ring-white/10">
      <motion.div
        className="relative overflow-hidden"
        initial={false}
        animate={photo && scale ? { width: photo.w * scale, height: photo.h * shown * scale } : { width: 0, height: 0 }}
        transition={ease}
      >
        <motion.img
          src={mediaUrl(media.src)}
          alt={media.alt ?? ''}
          draggable={false}
          onError={onError}
          onLoad={(e) => setPhoto({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          className="absolute top-0 left-0 max-w-none"
          initial={false}
          animate={photo && scale ? { width: photo.w * scale } : { width: 0 }}
          transition={ease}
        />
      </motion.div>
    </div>
  )
}

/** Audio or video clip, honouring optional start/end seconds. Played with the P key. */
function PlayableMedia({ media }: { media: Extract<Media, { kind: 'audio' | 'video' }> }) {
  const ref = useRef<HTMLMediaElement>(null)
  const [playing, setPlaying] = useState(false)
  const [missing, setMissing] = useState(false)
  // Clips follow the hall volume set on the sound check page (mute only silences effects).
  const volume = usePresenterStore((s) => s.volume)
  useEffect(() => {
    if (ref.current) ref.current.volume = volume
  }, [volume])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onError = () => setMissing(true)
    const onTime = () => {
      if (media.end !== undefined && el.currentTime >= media.end) {
        el.pause()
        el.currentTime = media.start ?? 0
      }
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    el.currentTime = media.start ?? 0
    el.addEventListener('error', onError)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    return () => {
      el.pause()
      el.removeEventListener('error', onError)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [media])

  const attrs = { [STAGE_MEDIA_ATTR]: '', src: mediaUrl(media.src), preload: 'auto' as const }

  if (missing) return <MissingMedia src={media.src} />

  if (media.kind === 'video') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-black ring-2 ring-white/10">
        <video ref={ref as RefObject<HTMLVideoElement>} {...attrs} className="h-full w-full object-contain" playsInline />
        {!playing && <PlayHint />}
      </div>
    )
  }

  return (
    <div className="relative grid h-full w-full place-items-center rounded-3xl bg-stage-800/80 ring-2 ring-white/10">
      <audio ref={ref as RefObject<HTMLAudioElement>} {...attrs} />
      <SoundBars playing={playing} />
      {!playing && <PlayHint />}
    </div>
  )
}

/** Animated gold bars standing in for a sound clip's picture. */
function SoundBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex h-48 items-center gap-3">
      {Array.from({ length: 24 }, (_, i) => (
        <motion.span
          key={i}
          className="w-4 rounded-full bg-gold"
          animate={playing ? { height: [24, 60 + ((i * 37) % 120), 24] } : { height: 24 }}
          transition={playing ? { duration: 0.6 + (i % 5) * 0.12, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        />
      ))}
    </div>
  )
}

function PlayHint({ text = '▶ Press P to play' }: { text?: string }) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-6 py-2 font-display text-2xl font-bold text-white/80">
      {text}
    </div>
  )
}

/** Slide-check stand-in for a YouTube clip: its thumbnail and the clip window. */
function YouTubeStill({ media }: { media: Extract<Media, { kind: 'youtube' }> }) {
  const time = (s = 0) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="relative aspect-video h-full max-w-full overflow-hidden rounded-3xl bg-black ring-2 ring-white/10">
        <img src={`https://i.ytimg.com/vi/${media.id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-60" />
        <PlayHint text={`YouTube ${time(media.start)}–${media.end ? time(media.end) : 'end'}${media.muted ? ' · muted' : ''}`} />
      </div>
    </div>
  )
}

/** `starting`: the host pressed P and the cover is already off (YouTube pauses a clip it can't see). */
type YouTubeState = 'loading' | 'ready' | 'starting' | 'playing' | 'paused' | 'error'

/**
 * A YouTube clip driven through the embed's postMessage API (no extra script).
 * Until the reveal, a cover hides YouTube's title and thumbnail whenever the clip isn't
 * playing, a strip hides the title bar across the top while it plays, and the clip
 * loops back to `start` at `end`. A `muted` clip replays with sound on the reveal.
 */
function YouTubeMedia({ media, revealed }: { media: Extract<Media, { kind: 'youtube' }>; revealed: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [state, setState] = useState<YouTubeState>('loading')
  const volume = usePresenterStore((s) => s.volume)
  const start = media.start ?? 0
  // Some browsers start the embed on their own; only the host (P or the reveal) may play it.
  const hostStarted = useRef(false)

  const src = useMemo(() => {
    const params = new URLSearchParams({
      start: String(Math.floor(start)),
      mute: '1',
      controls: '0',
      disablekb: '1',
      fs: '0',
      rel: '0',
      iv_load_policy: '3',
      playsinline: '1',
      enablejsapi: '1',
      origin: window.location.origin,
    })
    return `https://www.youtube.com/embed/${media.id}?${params}`
  }, [media.id, start])

  const command = useCallback((func: string, args: unknown[] = []) => {
    ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
  }, [])

  // Subscribe to the player's state; keep asking until it answers (it ignores us before it's ready).
  useEffect(() => {
    const listen = () => ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: media.id }), '*')
    const retry = window.setInterval(listen, 400)
    const onMessage = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || typeof e.data !== 'string') return
      let data: { event?: string; info?: { playerState?: number; currentTime?: number } | number }
      try {
        data = JSON.parse(e.data)
      } catch {
        return
      }
      // Any reply means the player is listening.
      window.clearInterval(retry)
      if (data.event === 'onReady') {
        // P pressed while YouTube was still loading: play now.
        if (hostStarted.current) command('playVideo')
        setState((s) => (s === 'loading' ? 'ready' : s))
      }
      if (data.event === 'onError') setState('error')
      const info = typeof data.info === 'object' ? data.info : undefined
      const playerState = data.event === 'onStateChange' ? (data.info as number) : info?.playerState
      const running = playerState === 1 || (info?.currentTime !== undefined && info.currentTime > start + 0.5)
      if (running && !hostStarted.current) {
        command('pauseVideo')
        command('seekTo', [start, true])
        return
      }
      if (playerState === 1) setState('playing')
      else if (playerState === 0) {
        setState('paused')
        // Played to the end: rewind (seeking restarts playback, so pause again) so P plays it again.
        if (!revealed) {
          command('seekTo', [start, true])
          command('pauseVideo')
        }
      }
      // A pause straight after P is YouTube settling in, not the host; only a later one counts.
      else if (playerState === 2) setState((s) => (s === 'starting' ? s : 'paused'))
      // Loop the question clip back to the start at `end`.
      if (media.end !== undefined && info?.currentTime !== undefined && info.currentTime >= media.end && !revealed) {
        command('pauseVideo')
        command('seekTo', [start, true])
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.clearInterval(retry)
      window.removeEventListener('message', onMessage)
    }
  }, [media.id, media.end, start, command, revealed])

  // P key: play / pause.
  useEffect(() => {
    const toggle = () => {
      if (state === 'playing' || state === 'starting') {
        setState('paused')
        return command('pauseVideo')
      }
      hostStarted.current = true
      setState('starting')
      if (!media.muted || revealed) {
        command('unMute')
        command('setVolume', [Math.round(volume * 100)])
      }
      command('playVideo')
    }
    window.addEventListener(STAGE_MEDIA_TOGGLE, toggle)
    return () => window.removeEventListener(STAGE_MEDIA_TOGGLE, toggle)
  }, [state, media.muted, revealed, volume, command])

  // The reveal replays a muted clip from the top, with sound (once per reveal).
  const replayed = useRef(false)
  useEffect(() => {
    if (!revealed) {
      replayed.current = false
      return
    }
    if (replayed.current || !media.muted || state === 'loading' || state === 'error') return
    replayed.current = true
    hostStarted.current = true
    command('unMute')
    command('setVolume', [Math.round(volume * 100)])
    command('seekTo', [start, true])
    command('playVideo')
  }, [revealed, media.muted, state, volume, start, command])

  const playing = state === 'playing' || state === 'starting'
  const covered = !revealed && !playing
  // Until the reveal, a `peek` clip shows only a strip of the frame (the bottom, by default).
  const hidden = !revealed && media.peek !== undefined ? 100 - media.peek : 0
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="relative aspect-video h-full max-w-full overflow-hidden rounded-3xl bg-black ring-2 ring-white/10">
        <iframe
          ref={ref}
          src={src}
          title="Clip"
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: media.id }), '*')}
          className="pointer-events-none absolute inset-0 h-full w-full border-0"
        />
        {/* YouTube flashes the video title across the top; keep it hidden until the reveal. */}
        {!revealed && <div className="absolute inset-x-0 top-0 h-[16%] bg-stage-900" />}
        {hidden > 0 && (
          <div
            className={`absolute inset-x-0 bg-stage-900 ${media.peekFrom === 'top' ? 'bottom-0' : 'top-0'}`}
            style={{ height: `${hidden}%` }}
          />
        )}
        {/* Sound-only clip: the picture stays hidden behind the bars until the reveal. */}
        {media.audioOnly && !revealed && (
          <div className="absolute inset-0 grid place-items-center bg-stage-800">
            <SoundBars playing={playing} />
          </div>
        )}
        {covered && !media.audioOnly && (
          <div className="absolute inset-0 grid place-items-center bg-stage-900">
            <span className="font-display text-[120px] leading-none text-white/15">{state === 'error' ? '⚠' : '🎬'}</span>
          </div>
        )}
        {state === 'error' ? (
          <PlayHint text="YouTube can't play this clip: check the internet" />
        ) : state === 'loading' ? (
          <PlayHint text="Loading YouTube…" />
        ) : (
          covered && <PlayHint text={media.muted ? '▶ Press P to play (muted)' : undefined} />
        )}
      </div>
    </div>
  )
}

/** Shown in place of a media file that failed to load, so a rehearsal catches it. */
function MissingMedia({ src }: { src: string }) {
  return (
    <div className="grid h-full w-full place-items-center rounded-3xl border-4 border-dashed border-lock/70 bg-black/50 p-10 text-center">
      <div>
        <p className="font-display text-5xl font-black text-lock">Missing media</p>
        <p className="mt-4 font-mono text-3xl text-white/70">public/{src}</p>
      </div>
    </div>
  )
}
