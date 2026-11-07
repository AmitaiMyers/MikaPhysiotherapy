import { describe, expect, it } from 'vitest';
import { upgradeRecord } from './migrate';

describe('upgrading stored records', () => {
  it('adds the technique lists to old sessions, templates and episodes', () => {
    expect(upgradeRecord('session', { id: 's1' })).toEqual({ id: 's1', techniques: [] });
    expect(upgradeRecord('template', { id: 't1', content: { plan: '' } })).toEqual({ id: 't1', content: { plan: '', techniques: [] } });
    expect(upgradeRecord('episode', { id: 'e1' })).toEqual({ id: 'e1', plannedTechniques: [] });
  });

  it('leaves current records and other kinds untouched', () => {
    const session = { id: 's1', techniques: [{ techniqueId: 'dn-masseter' }] };
    expect(upgradeRecord('session', session)).toBe(session);
    const patient = { id: 'p1' };
    expect(upgradeRecord('patient', patient)).toBe(patient);
  });
});
