/** Creating and deleting patient records, keeping related records consistent. */
import { deleteFileBytes, deleteRecord, listRecords, saveRecord } from './vault';
import type { Episode, Patient } from './types';

export const newId = (): string => crypto.randomUUID();
export const nowIso = (): string => new Date().toISOString();

export function emptyPatient(today: string): Patient {
  return { id: newId(), firstName: '', age: null, ageRecordedOn: today, sex: null, medicalBackground: '', lifestyle: '', createdAt: nowIso() };
}

export function emptyEpisode(patientId: string): Episode {
  return { id: newId(), patientId, title: '', side: 'none', diagnosis: '', protocolId: null, startDate: null, status: 'active', notes: '', createdAt: nowIso() };
}

/** Delete a patient with all their episodes, sessions and attachments. */
export function deletePatientAndRecords(patientId: string): void {
  for (const episode of listRecords('episode').filter((e) => e.patientId === patientId)) deleteRecord('episode', episode.id);
  for (const session of listRecords('session').filter((s) => s.patientId === patientId)) deleteRecord('session', session.id);
  for (const attachment of listRecords('attachment').filter((a) => a.patientId === patientId)) {
    deleteRecord('attachment', attachment.id);
    deleteFileBytes(attachment.id);
  }
  deleteRecord('patient', patientId);
}

/** Delete an episode; its sessions and attachments stay with the patient, unlinked. */
export function deleteEpisode(episodeId: string): void {
  for (const session of listRecords('session').filter((s) => s.episodeId === episodeId)) saveRecord('session', { ...session, episodeId: null });
  for (const attachment of listRecords('attachment').filter((a) => a.episodeId === episodeId)) saveRecord('attachment', { ...attachment, episodeId: null });
  deleteRecord('episode', episodeId);
}
