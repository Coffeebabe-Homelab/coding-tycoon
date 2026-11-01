interface AvatarProps {
  /** Seat position in the room's SVG coordinates. */
  x: number
  y: number
}

/** Placeholder player figure seen from behind, sitting and facing the desk (up-right). */
export function Avatar({ x, y }: AvatarProps) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      {/* arms reaching to the keyboard */}
      <path
        d="M-10 -28 L22 -40"
        className="stroke-room-avatar-shirt"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M12 -24 L34 -34"
        className="stroke-room-avatar-shirt"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <rect x="-16" y="-50" width="34" height="46" rx="12" className="fill-room-avatar-shirt" />
      <rect x="-4" y="-56" width="12" height="8" className="fill-room-avatar-skin" />
      {/* back of the head: the player faces the monitor, away from the camera */}
      <circle cx="2" cy="-64" r="14" className="fill-room-avatar-hair" />
      <circle cx="15" cy="-62" r="3" className="fill-room-avatar-skin" />
    </g>
  )
}
