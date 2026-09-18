import { mediaUrl } from '@/data/source'

/** The NIET seal, cropped to a circle (the source image has a grey square background). */
export function NietSeal({ size, className = '' }: { size: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-white shadow-2xl ring-4 ring-white/20 ${className}`} style={{ width: size, height: size }}>
      <img src={mediaUrl('media/brand/niet-logo.webp')} alt="NIET" className="h-full w-full scale-[1.13] object-cover" draggable={false} />
    </div>
  )
}

/** Broadcast-style corner "bug" shown on every slide after the welcome screen. */
export function NietBug({ label }: { label?: string }) {
  return (
    <div className="absolute top-10 left-12 z-10 flex items-center gap-4 opacity-85">
      <NietSeal size={84} className="ring-2" />
      <div className="font-display leading-tight">
        <p className="text-2xl font-black tracking-wider">NIET</p>
        {label && <p className="text-lg font-semibold tracking-[0.2em] text-white/60 uppercase">{label}</p>}
      </div>
    </div>
  )
}
