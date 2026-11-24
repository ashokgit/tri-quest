import { groupColor } from '../colors'

/** A round, group-coloured badge carrying the group's letter. */
export function GroupBadge({
  g,
  name,
  size = 56,
  className = '',
}: {
  g: number
  name: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-display font-black text-white shadow-[inset_0_-4px_8px_rgb(0_0_0/0.25),0_0_0_3px_rgb(255_255_255/0.85)] ${className}`}
      style={{ width: size, height: size, background: groupColor(g), fontSize: size * 0.5 }}
    >
      {name.slice(0, 2)}
    </span>
  )
}
