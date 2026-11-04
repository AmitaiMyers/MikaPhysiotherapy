/** Building sessions for a booking (single, recurring or imported). */
import { newId, nowIso } from './records';
import { contentOf, emptyContent, lastCompletedSession, sessionStructure } from './sessions';
import type { Session, SessionContent, SessionTemplate } from './types';

/** Where a new session's content comes from. */
export type SessionStart = { kind: 'blank' } | { kind: 'last' } | { kind: 'template'; templateId: string };

export function startingContent(start: SessionStart, sessions: Session[], templates: SessionTemplate[], patientId: string, episodeId: string | null): SessionContent {
  if (start.kind === 'last') {
    const last = lastCompletedSession(sessions, patientId, episodeId);
    return last === null ? emptyContent() : sessionStructure(contentOf(last));
  }
  if (start.kind === 'template') {
    const template = templates.find((t) => t.id === start.templateId);
    if (template === undefined) throw new Error(`Unknown template ${start.templateId}`);
    return sessionStructure(template.content);
  }
  return emptyContent();
}

export interface BookingRequest {
  patientId: string;
  episodeId: string | null;
  dates: string[];
  startTime: string;
  durationMin: number;
  content: SessionContent;
  today: string;
  externalId?: string;
}

/** One session per date; a recurring booking shares a series id. Past dates count as done. */
export function buildSessions(request: BookingRequest): Session[] {
  const seriesId = request.dates.length > 1 ? newId() : null;
  return request.dates.map((date) => ({
    id: newId(),
    patientId: request.patientId,
    episodeId: request.episodeId,
    status: date < request.today ? 'done' : 'planned',
    date,
    startTime: request.startTime,
    durationMin: request.durationMin,
    seriesId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...(request.externalId === undefined ? {} : { externalId: request.externalId }),
    // Each session gets its own copy so editing one does not change the others.
    ...sessionStructureCopy(request.content),
  }));
}

function sessionStructureCopy(content: SessionContent): SessionContent {
  return JSON.parse(JSON.stringify(content)) as SessionContent;
}
