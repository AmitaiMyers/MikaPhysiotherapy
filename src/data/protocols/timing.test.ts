import { describe, expect, it } from 'vitest';
import { getProtocol, PROTOCOLS } from './index';
import { parsePhaseTiming, protocolPosition } from './timing';

describe('phase timing', () => {
  it.each([
    ['Weeks 2–6', { startDay: 14, endDay: 42 }],
    ['Weeks 0–6 to 8', { startDay: 0, endDay: 42 }],
    ['Months 3–6 and beyond', { startDay: 91, endDay: null }],
    ['Month 3 onwards', { startDay: 91, endDay: null }],
    ['Days 0–3', { startDay: 0, endDay: 3 }],
    ['Day 1 to discharge (about 1 week)', { startDay: 1, endDay: null }],
  ])('reads %s', (text, timing) => {
    expect(parsePhaseTiming(text)).toEqual(timing);
  });

  it('does not place phases timed from cast removal', () => {
    expect(parsePhaseTiming('First 4 weeks out of the cast')).toBeNull();
  });

  it('can read the timing of every phase except those relative to cast removal', () => {
    for (const protocol of PROTOCOLS) {
      for (const phase of protocol.phases) {
        if (/out of the cast/.test(phase.timeframe)) continue;
        expect(parsePhaseTiming(phase.timeframe), `${protocol.id}: ${phase.timeframe}`).not.toBeNull();
      }
    }
  });

  it('finds the current phase from the days since surgery', () => {
    const aclr = getProtocol('aclr');
    expect(protocolPosition(aclr, 5).phaseIndex).toBe(0);
    expect(protocolPosition(aclr, 30)).toEqual({ daysSinceStart: 30, week: 4, phaseIndex: 1 });
    expect(protocolPosition(aclr, 400).phaseIndex).toBe(aclr.phases.length - 1);
  });

  it('does not guess a phase that depends on cast removal', () => {
    expect(protocolPosition(getProtocol('distal-radius-fracture-cast'), 60).phaseIndex).toBeNull();
    expect(protocolPosition(getProtocol('distal-radius-fracture-cast'), 10).phaseIndex).toBe(0);
  });
});
