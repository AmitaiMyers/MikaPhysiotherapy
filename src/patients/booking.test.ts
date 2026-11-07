import { describe, expect, it } from 'vitest';
import { withPlannedTechniques } from './booking';
import { emptyEpisode } from './records';
import { emptyContent, sessionStructure } from './sessions';

describe('techniques in new sessions', () => {
  const episode = { ...emptyEpisode('p1'), side: 'left' as const, plannedTechniques: [{ techniqueId: 'dn-upper-trapezius', note: 'Weekly' }] };

  it('starts a session with the episode care plan', () => {
    expect(withPlannedTechniques(emptyContent(), episode).techniques).toEqual([{ techniqueId: 'dn-upper-trapezius', side: 'left', values: {}, response: '', adverseEvent: '' }]);
  });

  it('keeps techniques copied from the last session or a template', () => {
    const content = { ...emptyContent(), techniques: [{ techniqueId: 'mulligan-cervical-snag', side: 'none' as const, values: { reps: '3 × 6' }, response: 'Better', adverseEvent: '' }] };
    expect(withPlannedTechniques(content, episode)).toBe(content);
  });

  it('copies the dosage but not the response when repeating a session', () => {
    const content = { ...emptyContent(), techniques: [{ techniqueId: 'mulligan-cervical-snag', side: 'right' as const, values: { reps: '3 × 6' }, response: 'Better', adverseEvent: 'Sore' }] };
    expect(sessionStructure(content).techniques).toEqual([{ techniqueId: 'mulligan-cervical-snag', side: 'right', values: { reps: '3 × 6' }, response: '', adverseEvent: '' }]);
  });
});
