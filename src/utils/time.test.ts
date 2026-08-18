import { describe, expect, it } from 'vitest';
import { formatPuertoRicoTime } from './time';

describe('Puerto Rico clock', () => {
  it('formats time in year-round Atlantic Standard Time', () => {
    expect(formatPuertoRicoTime(new Date('2026-01-01T04:05:06Z'))).toBe('00:05:06 AST');
  });
});
