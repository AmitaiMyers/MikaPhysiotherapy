import { NavLink } from 'react-router';

const SECTIONS = [
  { to: '/rehab', label: 'Exercises' },
  { to: '/rehab/fractures', label: 'Fractures' },
  { to: '/rehab/surgeries', label: 'Surgeries' },
] as const;

/** Sub-navigation of the Rehab tab. */
export function RehabTabs() {
  return (
    <nav className="tabs" aria-label="Rehab sections">
      {SECTIONS.map((section) => (
        <NavLink key={section.to} to={section.to} end className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
          {section.label}
        </NavLink>
      ))}
    </nav>
  );
}
