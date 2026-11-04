import type { ReactNode } from 'react';

/** One line-icon set (24 × 24, 1.8 px stroke). Decorative: label the button that holds it. */
const PATHS = {
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />,
  share: <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  chart: <path d="M4 19h16M6 15l4-4 3 3 5-6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  home: <path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z" />,
  book: <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10" />,
  dumbbell: <path d="M3 10v4M6.5 7v10M17.5 7v10M21 10v4M6.5 12h11" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-4 3.1-6.5 7-6.5s7 2.5 7 6.5" />
    </>
  ),
  rotate: <path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4" />,
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2M11 8v6M8 11h6" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2M8 11h6" />
    </>
  ),
  muscle: <path d="M7 4c3 2 3 6 2 9s0 6 3 7M12 4c3 2 4 5 3 8s0 6 3 8M5 9c2 0 3 1 4 2" />,
  bone: (
    <>
      <path d="M8 8l8 8" />
      <circle cx="6.5" cy="6" r="2" />
      <circle cx="8" cy="4.5" r="2" />
      <circle cx="17.5" cy="18" r="2" />
      <circle cx="16" cy="19.5" r="2" />
    </>
  ),
  nerve: <path d="M12 3v6m0 0l-5 5v7m5-12l5 5v7M12 9v12" />,
  test: (
    <>
      <path d="M9 3h6v4l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3L9 7z" />
      <path d="M7.5 14h9" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v3H9zM8.5 12h7M8.5 16h5" />
    </>
  ),
  layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="icon">
      {PATHS[name] as ReactNode}
    </svg>
  );
}
