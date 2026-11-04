import { NavLink } from 'react-router';
import { lockVault } from '../patients/vault';

const SECTIONS = [
  { to: '/patients', label: 'Patients' },
  { to: '/patients/calendar', label: 'Calendar' },
  { to: '/patients/templates', label: 'Templates' },
  { to: '/patients/settings', label: 'Settings' },
] as const;

/** Sub-navigation of the Patients tab, with a lock button. */
export function PatientsTabs() {
  return (
    <nav className="tabs" aria-label="Patients sections">
      {SECTIONS.map((section) => (
        <NavLink key={section.to} to={section.to} end className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
          {section.label}
        </NavLink>
      ))}
      <button type="button" className="tab" onClick={lockVault} aria-label="Lock patient data">
        🔒 Lock
      </button>
    </nav>
  );
}
