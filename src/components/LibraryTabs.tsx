import { NavLink, useLocation } from 'react-router';

const SECTIONS = [
  { to: '/muscles', label: 'Muscles', prefixes: ['/muscles'] },
  { to: '/bones', label: 'Bones & joints', prefixes: ['/bones', '/joints'] },
  { to: '/nerves', label: 'Nerves', prefixes: ['/nerves'] },
  { to: '/tests', label: 'Special tests', prefixes: ['/tests'] },
] as const;

/** Sub-navigation of the Library: the four reference sections. */
export function LibraryTabs() {
  const { pathname } = useLocation();
  return (
    <nav className="tabs" aria-label="Library sections">
      {SECTIONS.map((section) => {
        const active = section.prefixes.some((prefix) => pathname.startsWith(prefix));
        return (
          <NavLink key={section.to} to={section.to} className={`tab ${active ? 'tab-active' : ''}`} aria-current={active ? 'page' : undefined}>
            {section.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
