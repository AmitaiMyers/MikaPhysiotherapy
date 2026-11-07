/** Building sessions for a booking (single, recurring or imported). */
import { newId, nowIso } from './records';
import { contentOf, emptyContent, lastCompletedSession, sessionStructure } from './sessions';
import type { Episode, Session, SessionContent, SessionTemplate } from './types';

/** Where a new session's content comes from. */
export type SessionStart = { kind: 'blank' } | { kind: 'last' } | { kind: 'template'; templateId: string };

export function startingContent(start: SessionStart, sessions: Session[], templates: SessionTemplate[], patientId: string, episode: Episode | null): SessionContent {
  const episodeId = episode?.id ?? null;
  return withPlannedTechniques(baseContent(start, sessions, templates, patientId, episodeId), episode);
}

function baseContent(start: SessionStart, sessions: Session[], templates: SessionTemplate[], patientId: string, episodeId: string | null): SessionContent {
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

/** A session that does not list techniques yet starts with the episode's care plan. */
export function withPlannedTechniques(content: SessionContent, episode: Episode | null): SessionContent {
  if (episode === null || content.techniques.length > 0 || episode.plannedTechniques.length === 0) return content;
  return {
    ...content,
    techniques: episode.plannedTechniques.map((planned) => ({ techniqueId: planned.techniqueId, side: episode.side, values: {}, response: '', adverseEvent: '' })),
  };
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
