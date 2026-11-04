import { describe, expect, it } from 'vitest';
import { getExercise } from '../data/exercises';
import { itemFor, moveItem, programmeShareText, whatsAppUrl, withItems, type Programme } from './programmes';

const NOW = '2026-11-04T10:00:00.000Z';
const programme = (exerciseIds: string[]): Programme => ({
  id: 'p1',
  title: 'Knee programme',
  notes: 'Twice a day.',
  items: exerciseIds.map((id) => itemFor(getExercise(id))),
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('programmes', () => {
  it('starts an item from the exercise’s typical dosage', () => {
    expect(itemFor(getExercise('quad-set')).dosage).toBe(getExercise('quad-set').dosage);
  });

  it('adds new exercises and skips ones already present', () => {
    const next = withItems(programme(['quad-set']), [itemFor(getExercise('quad-set')), itemFor(getExercise('heel-slide'))], NOW);
    expect(next.items.map((i) => i.exerciseId)).toEqual(['quad-set', 'heel-slide']);
    expect(next.updatedAt).toBe(NOW);
  });

  it('moves items and ignores moves past either end', () => {
    const start = programme(['quad-set', 'heel-slide', 'bridge']);
    expect(moveItem(start, 2, -1, NOW).items.map((i) => i.exerciseId)).toEqual(['quad-set', 'bridge', 'heel-slide']);
    expect(moveItem(start, 0, -1, NOW)).toBe(start);
    expect(moveItem(start, 2, 1, NOW)).toBe(start);
  });

  it('shares numbered exercises with steps, dosage and notes', () => {
    const text = programmeShareText(
      { ...programme(['quad-set']), items: [{ exerciseId: 'quad-set', dosage: '3 × 10', note: 'Left knee' }] },
      getExercise,
    );
    expect(text).toContain('Knee programme');
    expect(text).toContain('1. Quadriceps set');
    expect(text).toContain('Dosage: 3 × 10');
    expect(text).toContain('Note: Left knee');
  });

  it('builds a WhatsApp link with the encoded text', () => {
    expect(whatsAppUrl('a & b')).toBe('https://wa.me/?text=a%20%26%20b');
  });
});
