import { useEffect, useState } from 'react'

/** Enter full screen. Must be called from a user gesture (click/key press); failures are ignored. */
export function enterFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {})
}

export function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  else enterFullscreen()
}

/** Tracks whether the page is currently full screen. */
export function useIsFullscreen() {
  const [full, setFull] = useState(() => Boolean(document.fullscreenElement))
  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  return full
}
