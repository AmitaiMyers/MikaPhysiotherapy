import { NavLink, useLocation } from 'react-router';
import { Icon, type IconName } from './Icon';

const ITEMS: { to: string; label: string; icon: IconName; prefixes: string[] }[] = [
  { to: '/', label: 'Home', icon: 'home', prefixes: [] },
  { to: '/muscles', label: 'Library', icon: 'book', prefixes: ['/muscles', '/bones', '/joints', '/nerves', '/tests', '/library', '/search'] },
  { to: '/rehab', label: 'Rehab', icon: 'dumbbell', prefixes: ['/rehab', '/techniques'] },
  { to: '/patients', label: 'Patients', icon: 'user', prefixes: ['/patients'] },
  { to: '/calendar', label: 'Calendar', icon: 'calendar', prefixes: ['/calendar'] },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const isActive = (item: (typeof ITEMS)[number]) => (item.to === '/' ? pathname === '/' : item.prefixes.some((prefix) => pathname.startsWith(prefix)));
  return (
    <nav className="bottom-nav" aria-label="Main">
      {ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} className={`nav-item ${isActive(item) ? 'nav-active' : ''}`} aria-current={isActive(item) ? 'page' : undefined}>
          <span className="nav-icon">
            <Icon name={item.icon} />
          </span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
