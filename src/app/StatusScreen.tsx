import type { ReactNode } from 'react'

/** Full-screen centred message for loading and error states. */
export function StatusScreen({ title, children, tone = 'info' }: { title: string; children?: ReactNode; tone?: 'info' | 'error' }) {
  return (
    <main className="grid h-full place-items-center p-8 text-center">
      <div className="max-w-2xl space-y-4">
        <h1 className={`font-display text-4xl font-bold ${tone === 'error' ? 'text-niet-red' : ''}`}>{title}</h1>
        {children && <div className="text-lg text-white/70">{children}</div>}
      </div>
    </main>
  )
}
