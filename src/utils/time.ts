import { gstime } from 'satellite.js';

/** Greenwich Mean Sidereal Time (radians) for a given moment. */
export function gmstFromDate(date: Date): number {
  return gstime(date);
}
