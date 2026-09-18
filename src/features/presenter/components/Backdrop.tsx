/**
 * TV-studio stage: deep NIET-blue darkness, a central spotlight, slowly
 * rotating light beams and a vignette. Pure CSS so it stays smooth on any laptop.
 */
const beams =
  'repeating-conic-gradient(from 0deg at 50% 50%, rgb(90 150 255 / 0.10) 0deg 5deg, transparent 5deg 15deg)'
const beamsFine =
  'repeating-conic-gradient(from 7deg at 50% 50%, rgb(255 255 255 / 0.05) 0deg 2deg, transparent 2deg 24deg)'

export function Backdrop({ intensity = 1 }: { intensity?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#01040d]">
      {/* Base glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_42%,#123a86_0%,#07183f_45%,transparent_75%)]" />

      {/* Rotating beams, faded out towards the edges */}
      <div
        className="absolute top-1/2 left-1/2 size-[3200px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow"
        style={{
          background: beams,
          opacity: 0.9 * intensity,
          maskImage: 'radial-gradient(circle, black 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 size-[3200px] -translate-x-1/2 -translate-y-1/2 animate-spin-slower"
        style={{ background: beamsFine, opacity: intensity, maskImage: 'radial-gradient(circle, black 0%, transparent 50%)' }}
      />

      {/* Spotlight hotspot and floor sheen */}
      <div className="absolute top-[18%] left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#4f8cff]/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/2 h-[260px] w-[1600px] -translate-x-1/2 rounded-[50%] bg-[#1a56db]/20 blur-[100px]" />

      {/* Brand warmth and vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgb(198_43_47/0.16)_0%,transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(0_0_0/0.75)_100%)]" />
    </div>
  )
}
