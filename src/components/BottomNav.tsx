import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

const icon = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

const ITEMS = [
  {
    to: '/',
    label: 'Muscles',
    icon: icon(<path d="M7 4c3 2 3 6 2 9s0 6 3 7M12 4c3 2 4 5 3 8s0 6 3 8M5 9c2 0 3 1 4 2" />),
  },
  {
    to: '/bones',
    label: 'Bones & joints',
    icon: icon(
      <>
        <path d="M8 8l8 8" />
        <circle cx="6.5" cy="6" r="2" />
        <circle cx="8" cy="4.5" r="2" />
        <circle cx="17.5" cy="18" r="2" />
        <circle cx="16" cy="19.5" r="2" />
      </>,
    ),
  },
  {
    to: '/nerves',
    label: 'Nerves',
    icon: icon(<path d="M12 3v6m0 0l-5 5v7m5-12l5 5v7M12 9v12" />),
  },
  {
    to: '/tests',
    label: 'Special tests',
    icon: icon(
      <>
        <path d="M9 3h6v4l4 11a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3L9 7z" />
        <path d="M7.5 14h9" />
      </>,
    ),
  },
] as const;

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
          {item.icon}
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
