import { describe, expect, it } from 'vitest';
import { addDays, daysBetween } from './dates';
import { currentAge, patientSummary } from './patients';
import type { Patient } from './types';

const patient: Patient = { id: '1', firstName: 'Dana', age: 34, ageRecordedOn: '2026-03-01', sex: 'female', medicalBackground: '', lifestyle: '', createdAt: '' };

describe('patients', () => {
  it('ages the patient from the date the age was entered', () => {
    expect(currentAge(patient, '2026-11-04')).toBe(34);
    expect(currentAge(patient, '2028-03-02')).toBe(36);
    expect(currentAge({ ...patient, age: null }, '2026-11-04')).toBeNull();
  });

  it('summarises age and sex', () => {
    expect(patientSummary(patient, '2026-11-04')).toBe('34 y · Female');
    expect(patientSummary({ ...patient, sex: null, age: null }, '2026-11-04')).toBe('');
  });

  it('counts calendar days across month ends', () => {
    expect(daysBetween('2026-10-30', '2026-11-04')).toBe(5);
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });
});
