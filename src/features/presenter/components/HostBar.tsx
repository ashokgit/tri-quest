import { AnimatePresence, motion } from 'motion/react'
import type { MouseEvent, ReactNode } from 'react'
import { toggleFullscreen, useIsFullscreen } from '@/lib/fullscreen'
import { usePresenterStore } from '../store'

/**
 * Small host controls that appear only while the mouse moves (and hide with the
 * pointer), so the audience rarely sees them. Everything here also has a key.
 */
export function HostBar({ visible }: { visible: boolean }) {
  const full = useIsFullscreen()
  const muted = usePresenterStore((s) => s.muted)
  const toggleMuted = usePresenterStore((s) => s.toggleMuted)
  const setHelpOpen = usePresenterStore((s) => s.setHelpOpen)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute right-8 bottom-8 z-30 flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <BarButton onClick={toggleFullscreen} hint="F">
            {full ? '⤡ Exit full screen' : '⛶ Full screen'}
          </BarButton>
          <BarButton onClick={toggleMuted} hint="M">
            {muted ? '🔇 Sound off' : '🔊 Sound on'}
          </BarButton>
          <BarButton onClick={() => setHelpOpen(true)} hint="H">
            ? Controls
          </BarButton>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BarButton({ onClick, hint, children }: { onClick: () => void; hint: string; children: ReactNode }) {
  const handle = (e: MouseEvent<HTMLButtonElement>) => {
    onClick()
    // Drop focus so Space/Enter keep driving the show instead of re-pressing this button.
    e.currentTarget.blur()
  }
  return (
    <button
      type="button"
      onClick={handle}
      className="flex items-center gap-3 rounded-2xl bg-black/70 px-6 py-4 font-display text-2xl font-bold text-white ring-2 ring-white/20 backdrop-blur transition hover:bg-stage-700 hover:ring-gold"
    >
      {children}
      <kbd className="rounded-md bg-white/15 px-2 py-0.5 text-lg text-white/70">{hint}</kbd>
    </button>
  )
}
