import { Avatar } from './Avatar'
import { Hotspot } from './Hotspot'

interface RoomSceneProps {
  onOpenTaskBoard: () => void
  /** Omitted while the End of Day screen doesn't exist: the door is then disabled. */
  onOpenEndOfDay?: () => void
}

const LABEL_CLASS = 'fill-text-muted text-sm'

/**
 * Static isometric developer room. Kept free of routing so it can later be swapped for an
 * animated version without touching navigation.
 *
 * Geometry: the floor diamond's back corner is (600,250); walls are 230 units tall.
 */
export function RoomScene({ onOpenTaskBoard, onOpenEndOfDay }: RoomSceneProps) {
  return (
    <svg
      viewBox="0 0 1200 680"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="group"
      aria-label="Your developer room"
    >
      {/* Shell */}
      <polygon points="200,220 600,20 600,250 200,450" className="fill-room-wall-left" />
      <polygon points="600,20 1000,220 1000,450 600,250" className="fill-room-wall-right" />
      <polygon points="600,250 1000,450 600,650 200,450" className="fill-room-floor" />
      <g className="stroke-room-floor-line" strokeWidth="1" aria-hidden="true">
        <line x1="300" y1="400" x2="700" y2="600" />
        <line x1="400" y1="350" x2="800" y2="550" />
        <line x1="500" y1="300" x2="900" y2="500" />
      </g>
      <polyline
        points="200,450 600,250 1000,450"
        className="fill-none stroke-room-trim"
        strokeWidth="4"
      />

      {/* Kanban board on the left wall → Task Board */}
      <Hotspot label="Kanban board: open the Task Board" onActivate={onOpenTaskBoard}>
        <polygon
          points="270,245 490,135 490,245 270,355"
          className="fill-room-board stroke-room-trim"
          strokeWidth="4"
        />
        <g className="stroke-room-trim" strokeWidth="2">
          <line x1="343" y1="208" x2="343" y2="318" />
          <line x1="416" y1="172" x2="416" y2="282" />
        </g>
        <g className="fill-room-note">
          <polygon points="285,260 325,240 325,265 285,285" />
          <polygon points="285,295 325,275 325,300 285,320" />
          <polygon points="358,225 398,205 398,230 358,250" />
          <polygon points="431,188 471,168 471,193 431,213" />
        </g>
      </Hotspot>
      <text x="380" y="385" textAnchor="middle" className={LABEL_CLASS}>
        Task Board
      </text>

      {/* Door on the right wall → End of Day */}
      <Hotspot
        label={onOpenEndOfDay ? 'Door: end the day' : 'Door: End of Day coming soon'}
        onActivate={onOpenEndOfDay}
      >
        <polygon
          points="820,190 900,230 900,400 820,360"
          className="fill-room-door stroke-room-trim"
          strokeWidth="4"
        />
        <circle cx="888" cy="320" r="5" className="fill-room-note" />
      </Hotspot>
      <text x="860" y="430" textAnchor="middle" className={LABEL_CLASS}>
        End of Day
      </text>

      {/* Desk */}
      <g aria-hidden="true">
        <polygon points="580,320 740,400 740,460 580,380" className="fill-room-desk-side" />
        <polygon points="740,400 820,360 820,420 740,460" className="fill-room-desk-side" />
        <polygon points="660,280 820,360 740,400 580,320" className="fill-room-desk-top" />
      </g>

      {/* Monitor → Codebase Explorer (Phase 3) / Editor (Phase 4); disabled until those exist */}
      <Hotspot label="Computer: Codebase Explorer coming soon">
        <line x1="724" y1="318" x2="724" y2="334" className="stroke-room-monitor" strokeWidth="6" />
        <polygon points="684,228 764,268 764,338 684,298" className="fill-room-monitor" />
        <polygon points="690,240 758,274 758,328 690,294" className="fill-room-screen" />
      </Hotspot>

      {/* Chair and avatar sit in front of the desk, so they are drawn after it */}
      <g aria-hidden="true">
        <line x1="612" y1="412" x2="612" y2="450" className="stroke-room-chair" strokeWidth="6" />
        <polygon points="612,397 642,412 612,427 582,412" className="fill-room-chair" />
      </g>
      <Avatar x={612} y={412} />
    </svg>
  )
}
