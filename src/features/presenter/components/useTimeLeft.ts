import { useEffect, useState } from 'react'
import { remainingMs, usePresenterStore } from '../store'

/** Remaining countdown time in ms, re-rendering a few times a second while running. */
export function useTimeLeft() {
  const timer = usePresenterStore((s) => s.timer)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (timer.endsAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [timer.endsAt])

  return { timer, left: remainingMs(timer, now), running: timer.endsAt !== null }
}
