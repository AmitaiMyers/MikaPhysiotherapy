import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PageHeader } from '../../../components/ui';
import { layoutLanes, minutesToTime, timeToMinutes, weekDays } from '../../../patients/calendar';
import { addDays, localDate, parseLocalDate } from '../../../patients/dates';
import { useSettings } from '../../../patients/settings';
import type { Session } from '../../../patients/types';
import { useRecords } from '../../../patients/vault';
import { BookingSheet } from './BookingSheet';
import { Icon } from '../../../components/Icon';
import { Segmented } from '../../../components/Segmented';

type View = 'day' | 'week';
const SLOT_MIN = 30;
const SLOT_PX = 32;

function rangeLabel(view: View, date: string): string {
  if (view === 'day') return parseLocalDate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const days = weekDays(date);
  const first = parseLocalDate(days[0] ?? date);
  const last = parseLocalDate(days[6] ?? date);
  return `${first.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${last.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function CalendarPage() {
  const [params, setParams] = useSearchParams();
  const today = localDate(new Date());
  const view: View = params.get('view') === 'week' ? 'week' : 'day';
  const date = params.get('date') ?? today;
  const go = (patch: { view?: View; date?: string }) => setParams({ view: patch.view ?? view, date: patch.date ?? date }, { replace: true });
  const settings = useSettings();
  const sessions = useRecords('session');
  const patients = useRecords('patient');
  const [booking, setBooking] = useState<{ date: string; startTime: string } | null>(null);
  const days = view === 'day' ? [date] : weekDays(date);
  const visible = sessions.filter((s) => days.includes(s.date));

  // Show the working hours, stretched to include any session booked outside them.
  const startMin = Math.min(timeToMinutes(settings.dayStart), ...visible.map((s) => Math.floor(timeToMinutes(s.startTime) / 60) * 60));
  const endMin = Math.max(timeToMinutes(settings.dayEnd), ...visible.map((s) => timeToMinutes(s.startTime) + s.durationMin));
  const slots = Array.from({ length: Math.ceil((endMin - startMin) / SLOT_MIN) }, (_, i) => startMin + i * SLOT_MIN);
  const step = view === 'day' ? 1 : 7;
  const patientName = (session: Session) => patients.find((p) => p.id === session.patientId)?.firstName ?? '—';
  // A slot under a session cannot be tapped; leaving it out keeps every target full size.
  const isBooked = (day: string, slot: number) => visible.some((s) => s.date === day && timeToMinutes(s.startTime) <= slot && slot < timeToMinutes(s.startTime) + s.durationMin);

  return (
    <div className="page">
      <PageHeader
        title="Calendar"
        subtitle={`${visible.length} ${visible.length === 1 ? 'session' : 'sessions'} ${view === 'day' ? 'this day' : 'this week'}`}
        actions={
          <Link to="/calendar/import" className="button">
            Import
          </Link>
        }
      />
      <div className="calendar-toolbar">
        <Segmented
          label="View"
          value={view}
          onChange={(v) => go({ view: v })}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
          ]}
        />
        <div className="button-row">
          <button type="button" className="icon-button" aria-label="Previous" onClick={() => go({ date: addDays(date, -step) })}>
            <Icon name="back" size={20} />
          </button>
          <button type="button" className="button" onClick={() => go({ date: today })}>
            Today
          </button>
          <button type="button" className="icon-button" aria-label="Next" onClick={() => go({ date: addDays(date, step) })}>
            <Icon name="chevron" size={20} />
          </button>
        </div>
      </div>
      <p className="calendar-range">{rangeLabel(view, date)}</p>

      <div className={`calendar calendar-${view}`} style={{ gridTemplateColumns: `40px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div className="calendar-corner" />
        {days.map((day) => (
          <button key={day} type="button" className={`calendar-day-head ${day === today ? 'calendar-today' : ''}`} onClick={() => go({ view: 'day', date: day })}>
            <span>{parseLocalDate(day).toLocaleDateString(undefined, { weekday: 'short' })}</span>
            <strong>{parseLocalDate(day).getDate()}</strong>
          </button>
        ))}
        <div className="calendar-times">
          {slots.map((slot) => (
            <span key={slot} className="calendar-time" style={{ height: SLOT_PX }}>
              {slot % 60 === 0 ? minutesToTime(slot) : ''}
            </span>
          ))}
        </div>
        {days.map((day) => (
          <div key={day} className="calendar-column" style={{ height: slots.length * SLOT_PX }}>
            {slots.filter((slot) => !isBooked(day, slot)).map((slot) => (
              <button
                key={slot}
                type="button"
                className={`calendar-slot ${slot % 60 === 0 ? 'calendar-slot-hour' : ''}`}
                style={{ top: ((slot - startMin) / SLOT_MIN) * SLOT_PX, height: SLOT_PX }}
                aria-label={`Book ${day} ${minutesToTime(slot)}`}
                onClick={() => setBooking({ date: day, startTime: minutesToTime(slot) })}
              />
            ))}
            {layoutLanes(
              visible.filter((s) => s.date === day).map((s) => ({ session: s, start: timeToMinutes(s.startTime), end: timeToMinutes(s.startTime) + s.durationMin })),
            ).map(({ item, lane, lanes }) => (
              <Link
                key={item.session.id}
                to={`/patients/sessions/${item.session.id}`}
                className={`calendar-event calendar-event-${item.session.status}`}
                aria-label={`${patientName(item.session)}, ${item.session.startTime}, ${item.session.durationMin} minutes, ${item.session.status}`}
                style={{
                  top: ((item.start - startMin) / SLOT_MIN) * SLOT_PX,
                  height: Math.max(((item.end - item.start) / SLOT_MIN) * SLOT_PX - 2, 18),
                  left: `${(lane / lanes) * 100}%`,
                  width: `${100 / lanes}%`,
                }}
              >
                <strong>{patientName(item.session)}</strong>
                {view === 'day' && <span> · {item.session.startTime}</span>}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <p className="muted small center">Tap a free time to book a session. Planned sessions are outlined; done sessions are filled.</p>
      {booking !== null && <BookingSheet date={booking.date} startTime={booking.startTime} onClose={() => setBooking(null)} />}
    </div>
  );
}
