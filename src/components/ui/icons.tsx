import type { ReactNode } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function make(children: ReactNode) {
  return function Icon({ size = 24 }: { size?: number }) {
    return (
      <svg {...base} width={size} height={size}>
        {children}
      </svg>
    );
  };
}

export const IconBack = make(
  <>
    <path d="M20 12H5" />
    <path d="M11 6l-6 6 6 6" />
  </>,
);
export const IconChevronLeft = make(<path d="M15 5l-7 7 7 7" />);
export const IconChevronRight = make(<path d="M9 5l7 7-7 7" />);
export const IconBriefcase = make(
  <>
    <rect x="3.5" y="8" width="17" height="11.5" rx="2" />
    <path d="M9 8V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2" />
    <path d="M3.5 13h17" />
    <rect x="10.5" y="11.5" width="3" height="3" rx="0.5" />
  </>,
);
export const IconUser = make(
  <>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20c.8-4 3.7-6 7.5-6s6.7 2 7.5 6" />
  </>,
);
export const IconGear = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8l1.2 2.4 2.6.5 1.8-1.9 2 2-1.9 1.8.5 2.6 2.4 1.2v2.8l-2.4 1.2-.5 2.6 1.9 1.8-2 2-1.8-1.9-2.6.5L12 21.2l-1.2-2.4-2.6-.5-1.8 1.9-2-2 1.9-1.8-.5-2.6-2.4-1.2V9.8l2.4-1.2.5-2.6-1.9-1.8 2-2 1.8 1.9 2.6-.5z" />
  </>,
);
export const IconExit = make(
  <>
    <path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10" />
    <path d="M15 8l4 4-4 4" />
    <path d="M19 12H9.5" />
  </>,
);
export const IconSpeaker = make(
  <>
    <path d="M4 9h4l5-4v14l-5-4H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </>,
);
export const IconSpeakerOff = make(
  <>
    <path d="M4 9h4l5-4v14l-5-4H4z" />
    <path d="M17 9l5 6M22 9l-5 6" />
  </>,
);
export const IconClose = make(<path d="M6 6l12 12M18 6L6 18" />);
export const IconBan = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M6 6l12 12" />
  </>,
);
export const IconCheck = make(<path d="M5 12.5l4.5 4.5L19 7.5" />);

export const IconBrain = make(
  <>
    <path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 2.8 3 3 0 0 0 1.4 2.5 3 3 0 0 0 2.1 4.2A2.8 2.8 0 0 0 12 18V6a2.5 2.5 0 0 0-3-1.5z" />
    <path d="M15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 2.8 3 3 0 0 1-1.4 2.5 3 3 0 0 1-2.1 4.2A2.8 2.8 0 0 1 12 18V6a2.5 2.5 0 0 1 3-1.5z" />
  </>,
);
export const IconEye = make(
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
export const IconBolt = make(<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />);
export const IconShield = make(
  <path d="M12 3l7 2.5v6c0 4.3-2.9 8-7 9.5-4.1-1.5-7-5.2-7-9.5v-6z" />,
);
export const IconPuzzle = make(
  <path d="M9 4h3a2 2 0 1 1 4 0h3v5a2 2 0 1 0 0 4v5h-5a2 2 0 1 0-4 0H5v-5a2 2 0 1 1 0-4V4z"/>,
);