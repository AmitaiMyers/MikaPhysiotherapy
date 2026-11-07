import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BodyExplorer } from '../components/BodyExplorer';
import { SkeletonRows } from '../components/feedback';
import { EmptyState, SessionStatusBadge } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { BONES, MUSCLES, NERVES, SPECIAL_TESTS } from '../data';
import { EXERCISES } from '../data/exercises';
import { PROTOCOLS } from '../data/protocols';
import { TECHNIQUES } from '../data/techniques';
import { localDate } from '../patients/dates';
import { useRecords, useVaultState } from '../patients/vault';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomePage() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const now = new Date();
  return (
    <div className="page home">
      <header className="home-header">
        <div>
          <p className="home-date">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="home-greeting">{greeting(now.getHours())}, Mika</h1>
        </div>
        <Link to="/about" className="icon-button" aria-label="About and sources">
          <Icon name="info" />
        </Link>
      </header>
      <form
        className="global-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          void navigate(`/search?q=${encodeURIComponent(text)}`);
        }}
      >
        <Icon name="search" size={20} />
        <input type="search" placeholder="Search everything" value={text} onChange={(event) => setText(event.target.value)} aria-label="Search everything" />
      </form>
      <BodyExplorer />
      <TodayCard />
      <h2 className="section-heading">Explore</h2>
      <div className="tile-grid">
        <Tile to="/muscles" icon="muscle" title="Muscles" detail={`${MUSCLES.length} with images & 3D`} />
        <Tile to="/bones" icon="bone" title="Bones & joints" detail={`${BONES.length} bones`} />
        <Tile to="/nerves" icon="nerve" title="Nerves" detail={`${NERVES.length} nerves & myotomes`} />
        <Tile to="/tests" icon="test" title="Special tests" detail={`${SPECIAL_TESTS.length} tests`} />
        <Tile to="/rehab" icon="dumbbell" title="Exercises" detail={`${EXERCISES.length} exercises`} />
        <Tile to="/rehab/protocols" icon="clipboard" title="Protocols" detail={`${PROTOCOLS.length} fractures & surgeries`} />
        <Tile to="/techniques" icon="layers" title="Techniques" detail={`${TECHNIQUES.length} techniques, evidence-graded`} />
      </div>
    </div>
  );
}

function Tile({ to, icon, title, detail }: { to: string; icon: IconName; title: string; detail: string }) {
  return (
    <Link to={to} className="tile">
      <span className="tile-icon">
        <Icon name={icon} />
      </span>
      <span className="tile-title">{title}</span>
      <span className="tile-detail">{detail}</span>
    </Link>
  );
}

/** Today's sessions from the calendar, or a prompt to unlock the patient data. */
function TodayCard() {
  const vault = useVaultState();
  const sessions = useRecords('session');
  const patients = useRecords('patient');
  const today = localDate(new Date());
  const todays = sessions.filter((s) => s.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  return (
    <section className="card today-card">
      <div className="today-header">
        <h2>Today</h2>
        <Link to="/calendar" className="text-button">
          Calendar <Icon name="chevron" size={16} />
        </Link>
      </div>
      {vault.status === 'loading' ? (
        <SkeletonRows count={2} label="Loading today’s sessions" />
      ) : vault.status !== 'unlocked' ? (
        <>
          <p className="muted">{vault.status === 'empty' ? 'Set up the Patients tab to plan and record sessions.' : 'Unlock patient data to see today’s sessions.'}</p>
          <Link to="/calendar" className="button button-primary spaced-top">
            <Icon name="lock" size={18} /> {vault.status === 'empty' ? 'Set up' : 'Unlock'}
          </Link>
        </>
      ) : todays.length === 0 ? (
        <EmptyState
          icon="calendar"
          action={
            <Link to="/calendar" className="button">
              Open the calendar
            </Link>
          }
        >
          No sessions today.
        </EmptyState>
      ) : (
        <ul className="today-list">
          {todays.map((session) => (
            <li key={session.id}>
              <Link to={`/patients/sessions/${session.id}`} className="today-row">
                <span className="today-time">{session.startTime}</span>
                <span className="today-name">{patients.find((p) => p.id === session.patientId)?.firstName ?? '—'}</span>
                <SessionStatusBadge status={session.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
