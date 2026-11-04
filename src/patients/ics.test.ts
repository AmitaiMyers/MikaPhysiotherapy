import { describe, expect, it } from 'vitest';
import { matchPatient, readCalendar } from './ics';
import { icsFilesInZip } from './zip';

const ICS = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'UID:single@google.com',
  'DTSTART;TZID=Asia/Jerusalem:20261110T093000',
  'DTEND;TZID=Asia/Jerusalem:20261110T100000',
  'SUMMARY:Dana - knee',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:weekly@google.com',
  'DTSTART:20261102T160000',
  'DTEND:20261102T170000',
  'RRULE:FREQ=WEEKLY;BYDAY=MO,TH;COUNT=4',
  'EXDATE:20261105T160000',
  'SUMMARY:Physio Yossi',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:allday@google.com',
  'DTSTART;VALUE=DATE:20261111',
  'SUMMARY:Holiday',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:cancelled@google.com',
  'DTSTART:20261112T080000',
  'STATUS:CANCELLED',
  'SUMMARY:Cancelled',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:folded@google.com',
  'DTSTART:20261113T080000',
  'DTEND:20261113T083000',
  'SUMMARY:Long title for',
  '  Noa',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

describe('reading Google Calendar exports', () => {
  it('reads single, repeating and folded events and skips all-day, cancelled and excluded ones', () => {
    const events = readCalendar(ICS, '2026-11-01', '2026-12-31');
    expect(events.map((e) => `${e.date} ${e.startTime} ${e.durationMin} ${e.summary}`)).toEqual([
      '2026-11-02 16:00 60 Physio Yossi',
      '2026-11-09 16:00 60 Physio Yossi',
      '2026-11-10 09:30 30 Dana - knee',
      '2026-11-12 16:00 60 Physio Yossi',
      '2026-11-13 08:00 30 Long title for Noa',
    ]);
  });

  it('keeps only events in the chosen range', () => {
    expect(readCalendar(ICS, '2026-11-10', '2026-11-10').map((e) => e.summary)).toEqual(['Dana - knee']);
  });

  it('matches a patient whose name is in the title, only when unique', () => {
    const patients = [
      { id: '1', firstName: 'Dana' },
      { id: '2', firstName: 'Yossi' },
      { id: '3', firstName: 'Dan' },
    ];
    expect(matchPatient('Dana - knee', patients)?.id).toBe('1');
    expect(matchPatient('physio yossi', patients)?.id).toBe('2');
    expect(matchPatient('Team meeting', patients)).toBeNull();
    expect(matchPatient('Dana and Yossi', patients)).toBeNull();
    expect(matchPatient('מיכל טיפול', [{ id: '4', firstName: 'מיכל' }])?.id).toBe('4');
  });

  it('extracts .ics files from a zip export', async () => {
    const text = new TextEncoder().encode(ICS);
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    const name = new TextEncoder().encode('mika@gmail.com.ics');
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(8, 8, true);
    lv.setUint32(18, compressed.length, true);
    lv.setUint32(22, text.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(10, 8, true);
    cv.setUint32(20, compressed.length, true);
    cv.setUint32(24, text.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, 0, true);
    central.set(name, 46);
    const endRecord = new Uint8Array(22);
    const ev = new DataView(endRecord.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(10, 1, true);
    ev.setUint32(12, central.length, true);
    ev.setUint32(16, local.length + compressed.length, true);
    const zip = new Uint8Array([...local, ...compressed, ...central, ...endRecord]);
    const [extracted] = await icsFilesInZip(zip);
    expect(extracted).toBe(ICS);
  });
});
