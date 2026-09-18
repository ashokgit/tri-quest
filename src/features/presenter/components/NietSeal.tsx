import { mediaUrl } from '@/data/source'

/** The NIET seal, cropped to a circle (the source image has a grey square background). */
export function NietSeal({ size, className = '' }: { size: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-white shadow-2xl ring-4 ring-white/20 ${className}`} style={{ width: size, height: size }}>
      <img src={mediaUrl('media/brand/niet-logo.webp')} alt="NIET" className="h-full w-full scale-[1.13] object-cover" draggable={false} />
    </div>
  )
}
