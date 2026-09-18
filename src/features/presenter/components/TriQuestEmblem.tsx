/**
 * Show logo: gold rings around the NIET triangle (split into four, like the seal),
 * with a slowly turning outer ring.
 */
export function TriQuestEmblem({ size = 520, glow = true }: { size?: number; glow?: boolean }) {
  // Equilateral triangle centred in a 400×400 box.
  const top = [200, 92]
  const left = [106.5, 254]
  const right = [293.5, 254]
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const [ml, mr, mb] = [mid(top, left), mid(top, right), mid(left, right)]
  const pts = (...p: number[][]) => p.map((x) => x.join(',')).join(' ')

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {glow && <div className="absolute inset-[12%] rounded-full bg-[#4f8cff]/30 blur-[70px]" />}
      <svg viewBox="0 0 400 400" className="relative h-full w-full">
        <defs>
          <linearGradient id="tq-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3c4" />
            <stop offset="0.45" stopColor="#e2ad3c" />
            <stop offset="0.55" stopColor="#a8741a" />
            <stop offset="1" stopColor="#ffe39a" />
          </linearGradient>
          <radialGradient id="tq-disc" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0" stopColor="#1f4fa8" />
            <stop offset="0.6" stopColor="#0a1f4d" />
            <stop offset="1" stopColor="#040b1c" />
          </radialGradient>
          <linearGradient id="tq-tri" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#0c4e93" />
          </linearGradient>
        </defs>

        <circle cx="200" cy="200" r="186" fill="url(#tq-disc)" stroke="url(#tq-gold)" strokeWidth="7" />
        <circle cx="200" cy="200" r="168" fill="none" stroke="url(#tq-gold)" strokeWidth="1.5" opacity="0.7" />

        {/* Outer tick ring, turning slowly. A native SVG rotation pivots exactly on the
            emblem centre (CSS transform-origin on SVG groups follows the bounding box and drifts). */}
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="60s" repeatCount="indefinite" />
          {Array.from({ length: 60 }, (_, i) => (
            <line
              key={i}
              x1="200"
              y1="22"
              x2="200"
              y2={i % 5 === 0 ? 36 : 30}
              stroke="#f5c542"
              strokeWidth={i % 5 === 0 ? 3 : 1.5}
              opacity={i % 5 === 0 ? 0.9 : 0.45}
              transform={`rotate(${i * 6} 200 200)`}
            />
          ))}
        </g>

        {/* NIET triangle: three blue corners around a white centre */}
        <g stroke="url(#tq-gold)" strokeWidth="4" strokeLinejoin="round">
          <polygon points={pts(top, ml, mr)} fill="url(#tq-tri)" />
          <polygon points={pts(ml, left, mb)} fill="url(#tq-tri)" />
          <polygon points={pts(mr, mb, right)} fill="url(#tq-tri)" />
          <polygon points={pts(ml, mr, mb)} fill="#f8fafc" />
        </g>
        <text x="200" y="226" textAnchor="middle" fontFamily="Montserrat Variable" fontWeight="900" fontSize="30" fill="#0c4e93">
          ?
        </text>

        <text
          x="200"
          y="318"
          textAnchor="middle"
          fontFamily="Montserrat Variable"
          fontWeight="900"
          fontSize="46"
          letterSpacing="3"
          fill="url(#tq-gold)"
          stroke="#3a2600"
          strokeWidth="1"
        >
          TRI-QUEST
        </text>
      </svg>
    </div>
  )
}
