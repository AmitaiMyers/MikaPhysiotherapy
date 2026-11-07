import { NavLink } from 'react-router';

const SECTIONS = [
  { to: '/rehab', label: 'Exercises' },
  { to: '/techniques', label: 'Techniques' },
  { to: '/rehab/protocols', label: 'Protocols' },
  { to: '/rehab/programmes', label: 'Programmes' },
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
