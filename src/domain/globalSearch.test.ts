import { describe, expect, it } from 'vitest';
import { searchAll } from './globalSearch';

describe('global search', () => {
  it('finds structures of every kind', () => {
    const kinds = new Set(searchAll('knee', 200).map((r) => r.kind));
    expect(kinds).toContain('Joint');
    expect(kinds).toContain('Protocol');
    expect(kinds).toContain('Exercise');
  });

  it('puts titles that start with the query first', () => {
    expect(searchAll('supraspinatus')[0]).toMatchObject({ kind: 'Muscle', title: 'Supraspinatus' });
    expect(searchAll('femur')[0]?.kind).toBe('Bone');
  });

  it('returns nothing for an empty query', () => {
    expect(searchAll('  ')).toEqual([]);
  });
});
