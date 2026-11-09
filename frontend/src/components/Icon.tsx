import type { ReactNode, SVGAttributes } from 'react'

// Paths exported from Figma 7:217. Add an icon when something first uses it.
const ICONS = {
  x: <path d="M4 4L12 12M12 4L4 12" strokeLinecap="round" />,
  check: <path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />,
  lock: (
    <>
      <path d="M11 7H5C3.89543 7 3 7.89543 3 9V12C3 13.1046 3.89543 14 5 14H11C12.1046 14 13 13.1046 13 12V9C13 7.89543 12.1046 7 11 7Z" />
      <path d="M5.5 7V5C5.5 4.33696 5.76339 3.70107 6.23223 3.23223C6.70107 2.76339 7.33696 2.5 8 2.5C8.66304 2.5 9.29893 2.76339 9.76777 3.23223C10.2366 3.70107 10.5 4.33696 10.5 5V7" />
    </>
  ),
  'arrow-left': <path d="M13 8H3M7 12L3 8L7 4" strokeLinecap="round" strokeLinejoin="round" />,
  branch: (
    <>
      <path d="M4.5 5.3C5.49 5.3 6.3 4.49 6.3 3.5C6.3 2.51 5.49 1.7 4.5 1.7C3.51 1.7 2.7 2.51 2.7 3.5C2.7 4.49 3.51 5.3 4.5 5.3Z" />
      <path d="M4.5 14.3C5.49 14.3 6.3 13.49 6.3 12.5C6.3 11.51 5.49 10.7 4.5 10.7C3.51 10.7 2.7 11.51 2.7 12.5C2.7 13.49 3.51 14.3 4.5 14.3Z" />
      {/* The accent node is part of the Figma icon: it marks the current branch. */}
      <path
        d="M11.5 7.3C12.49 7.3 13.3 6.49 13.3 5.5C13.3 4.51 12.49 3.7 11.5 3.7C10.51 3.7 9.7 4.51 9.7 5.5C9.7 6.49 10.51 7.3 11.5 7.3Z"
        stroke="var(--color-accent)"
      />
      <path d="M4.5 5.3V10.7M11.5 7.3C11.5 9.8 8 9.3 4.5 10.8" strokeLinecap="round" />
    </>
  ),
  commit: (
    <>
      <path d="M8 10.5C9.38071 10.5 10.5 9.38071 10.5 8C10.5 6.61929 9.38071 5.5 8 5.5C6.61929 5.5 5.5 6.61929 5.5 8C5.5 9.38071 6.61929 10.5 8 10.5Z" />
      <path d="M1.5 8H5.5M10.5 8H14.5" strokeLinecap="round" />
    </>
  ),
  // The one filled, two-tone icon in the set: it keeps its colours wherever it is used.
  flame: (
    <>
      <path
        d="M8 1.5C8.5 4 12.5 5.5 12.5 9.5C12.5 10.6935 12.0259 11.8381 11.182 12.682C10.3381 13.5259 9.19347 14 8 14C6.80653 14 5.66193 13.5259 4.81802 12.682C3.97411 11.8381 3.5 10.6935 3.5 9.5C3.5 7.5 4.7 6.3 5.5 5.5C5.8 6.7 6.4 7.5 7.2 7.7C7.2 5.8 7 3.5 8 1.5Z"
        fill="var(--color-accent)"
        stroke="none"
      />
      <path
        d="M8 9C8.3 10 10 10.6 10 12C10 12.5304 9.78929 13.0391 9.41421 13.4142C9.03914 13.7893 8.53043 14 8 14C7.46957 14 6.96086 13.7893 6.58579 13.4142C6.21071 13.0391 6 12.5304 6 12C6 11.1 6.6 10.5 7 10C7.1 10.5 7.5 10.8 8 10.8V9Z"
        fill="var(--color-warning)"
        stroke="none"
      />
    </>
  ),
  user: (
    <>
      <path d="M8 8.25C9.51878 8.25 10.75 7.01878 10.75 5.5C10.75 3.98122 9.51878 2.75 8 2.75C6.48122 2.75 5.25 3.98122 5.25 5.5C5.25 7.01878 6.48122 8.25 8 8.25Z" />
      <path d="M2.5 14C3.1 11.2 5.3 9.7 8 9.7C10.7 9.7 12.9 11.2 13.5 14" strokeLinecap="round" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof ICONS

interface IconProps extends SVGAttributes<SVGSVGElement> {
  name: IconName
}

/** Figma icon set (7:217): 16px, 1.5px stroke, inherits the text colour. Decorative by default. */
export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      {ICONS[name]}
    </svg>
  )
}
