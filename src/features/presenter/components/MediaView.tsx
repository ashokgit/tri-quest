import { motion } from 'motion/react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Media } from '@/data/schema'
import { mediaUrl } from '@/data/source'

/** Marks the playable element on stage so the P key can find it. */
export const STAGE_MEDIA_ATTR = 'data-stage-media'

interface Props {
  media: Media
  /** 1 = maximally obscured, 0 = clear. Only used for images with a reveal effect. */
  obscurity: number
}

export function MediaView({ media, obscurity }: Props) {
  if (media.kind === 'image') return <ImageMedia media={media} obscurity={obscurity} />
  return <PlayableMedia media={media} />
}

function ImageMedia({ media, obscurity }: { media: Extract<Media, { kind: 'image' }>; obscurity: number }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <MissingMedia src={media.src} />

  const blur = media.reveal === 'blur' ? obscurity * 36 : 0
  const zoom = media.reveal === 'zoom' ? 1 + obscurity * 3 : 1
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-black/40 ring-2 ring-white/10">
      <motion.img
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

/** Audio or video clip, honouring optional start/end seconds. Played with the P key. */
function PlayableMedia({ media }: { media: Extract<Media, { kind: 'audio' | 'video' }> }) {
  const ref = useRef<HTMLMediaElement>(null)
  const [playing, setPlaying] = useState(false)
  const [missing, setMissing] = useState(false)

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
      {!playing && <PlayHint />}
    </div>
  )
}

function PlayHint() {
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-6 py-2 font-display text-2xl font-bold text-white/80">
      ▶ Press P to play
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
