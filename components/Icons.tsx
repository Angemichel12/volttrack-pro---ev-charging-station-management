import React from "react";

// Thin, consistent stroke icons (24x24 grid) — sized via className, colored via currentColor.

type IconProps = { className?: string };

const base = (className?: string) => ({
  className: className ?? "w-5 h-5",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const IconDashboard: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const IconStation: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
    <path d="M3 21h14" />
    <path d="M15 8h2a2 2 0 0 1 2 2v6.5a1.5 1.5 0 0 0 3 0V9l-2-2" />
    <path d="M8 7h4" />
  </svg>
);

export const IconUsers: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const IconCar: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
    <path d="M3 17v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
    <circle cx="7.5" cy="17" r="1.5" />
    <circle cx="16.5" cy="17" r="1.5" />
  </svg>
);

export const IconCharger: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M7 7h10v6a5 5 0 0 1-10 0V7z" />
    <path d="M9 7V3M15 7V3" />
    <path d="M12 18v3" />
  </svg>
);

export const IconBolt: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M13 2L4.5 13.5H11L9.5 22 19 10.5h-6.5L13 2z" />
  </svg>
);

export const IconChart: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M3 3v18h18" />
    <path d="M7 15l4-5 3 3 5-7" />
  </svg>
);

export const IconExport: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
    <path d="M14 3v5h5" />
    <path d="M12 11v6M9.5 14.5L12 17l2.5-2.5" />
  </svg>
);

export const IconWallet: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M20 7H5a2 2 0 0 1 0-4h13v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1" />
    <circle cx="16.5" cy="14" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconMoney: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M5.5 9.5h.01M18.5 14.5h.01" />
  </svg>
);

export const IconClock: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconHistory: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 8v4l3 2" />
  </svg>
);

export const IconLogout: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const IconMenu: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconPlus: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

export const IconTrash: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const IconPencil: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export const IconBattery: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <rect x="2" y="8" width="17" height="8" rx="2" />
    <path d="M22 11v2" />
    <path d="M6 11v2M9.5 11v2M13 11v2" />
  </svg>
);

export const IconCalendar: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M8 2v4M16 2v4M3 9h18" />
  </svg>
);

export const IconArrowRight: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export const IconMore: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const IconShift: React.FC<IconProps> = ({ className }) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    <path d="M12 8.5V12l2.5 1.5" />
  </svg>
);
