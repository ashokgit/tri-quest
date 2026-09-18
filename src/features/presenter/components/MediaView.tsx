import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
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
  if (media.kind === 'image') {
    const blur = media.reveal === 'blur' ? obscurity * 36 : 0
    const zoom = media.reveal === 'zoom' ? 1 + obscurity * 3 : 1
    return (
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-black/40 ring-2 ring-white/10">
        <motion.img
          src={mediaUrl(media.src)}
          alt={media.alt ?? ''}
          draggable={false}
          className="h-full w-full object-contain"
          animate={{ filter: `blur(${blur}px)`, scale: zoom }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
    )
  }
  return <PlayableMedia media={media} />
}

/** Audio or video clip, honouring optional start/end seconds. Played with the P key. */
function PlayableMedia({ media }: { media: Extract<Media, { kind: 'audio' | 'video' }> }) {
  const ref = useRef<HTMLMediaElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onTime = () => {
      if (media.end !== undefined && el.currentTime >= media.end) {
        el.pause()
        el.currentTime = media.start ?? 0
      }
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    el.currentTime = media.start ?? 0
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    return () => {
      el.pause()
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [media])

  const attrs = { [STAGE_MEDIA_ATTR]: '', src: mediaUrl(media.src), preload: 'auto' as const }

  if (media.kind === 'video') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-black ring-2 ring-white/10">
        <video ref={ref as React.RefObject<HTMLVideoElement>} {...attrs} className="h-full w-full object-contain" playsInline />
        {!playing && <PlayHint />}
      </div>
    )
  }

  return (
    <div className="relative grid h-full w-full place-items-center rounded-3xl bg-stage-800/80 ring-2 ring-white/10">
      <audio ref={ref as React.RefObject<HTMLAudioElement>} {...attrs} />
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
