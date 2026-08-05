import { describe, expect, it } from 'vitest';
import { FALLBACK_SATELLITES } from './fallbackData';
import { buildSatrec, orbitalPeriodMinutes, propagateAt } from './propagation';

describe('satellite propagation', () => {
  const issRecord = FALLBACK_SATELLITES[0];
  const satrec = buildSatrec(issRecord.omm);

  it('derives a plausible low-Earth-orbit period', () => {
    expect(orbitalPeriodMinutes(satrec)).toBeGreaterThan(90);
    expect(orbitalPeriodMinutes(satrec)).toBeLessThan(100);
  });

  it('produces finite position and telemetry at the element epoch', () => {
    const sample = propagateAt(satrec, new Date(String(issRecord.omm.EPOCH) + 'Z'));
    expect(sample).not.toBeNull();
    expect(sample?.altitudeKm).toBeGreaterThan(300);
    expect(sample?.speedKmS).toBeGreaterThan(7);
    expect(Number.isFinite(sample?.latDeg)).toBe(true);
    expect(Number.isFinite(sample?.lonDeg)).toBe(true);
  });
});
