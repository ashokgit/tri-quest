/**
 * Stage background: deep navy with a soft brand-blue glow and a faint
 * triangle lattice echoing the NIET seal.
 */
const lattice =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='104'%3E%3Cpath d='M0 104 60 0l60 104Z' fill='none' stroke='white' stroke-opacity='.05' stroke-width='1.5'/%3E%3C/svg%3E\")"

export function Backdrop() {
  return (
    <div className="absolute inset-0 bg-stage-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-stage-700)_0%,transparent_60%)] opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgb(198_43_47/0.18)_0%,transparent_45%)]" />
      <div className="absolute inset-0" style={{ backgroundImage: lattice }} />
    </div>
  )
}
