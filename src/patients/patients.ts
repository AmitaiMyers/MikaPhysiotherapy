import type { Patient } from './types';
import { daysBetween } from './dates';

/** Age now, from the age entered and the date it was entered. */
export function currentAge(patient: Patient, today: string): number | null {
  if (patient.age === null) return null;
  return patient.age + Math.floor(daysBetween(patient.ageRecordedOn, today) / 365.25);
}

export const SEX_LABELS = { female: 'Female', male: 'Male', other: 'Other' } as const;

export function patientSummary(patient: Patient, today: string): string {
  const age = currentAge(patient, today);
  return [age === null ? null : `${age} y`, patient.sex === null ? null : SEX_LABELS[patient.sex]].filter((part) => part !== null).join(' · ');
}
