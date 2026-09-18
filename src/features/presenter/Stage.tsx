import { useLayoutEffect, useState, type ReactNode } from 'react'

export const STAGE_WIDTH = 1920
export const STAGE_HEIGHT = 1080

/**
 * A fixed 1920×1080 canvas scaled to fit the window, so the layout looks the
 * same on any laptop or projector resolution (letterboxed if the ratio differs).
 */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="grid h-full w-full place-items-center overflow-hidden bg-black">
      <div style={{ width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale }}>
        <div
          className="relative origin-top-left overflow-hidden"
          style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
