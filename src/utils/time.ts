import { gstime } from 'satellite.js';

const PUERTO_RICO_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Puerto_Rico',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/** Greenwich Mean Sidereal Time (radians) for a given moment. */
export function gmstFromDate(date: Date): number {
  return gstime(date);
}

/** Formats a moment using Puerto Rico's year-round Atlantic Standard Time. */
export function formatPuertoRicoTime(date: Date): string {
  return `${PUERTO_RICO_TIME.format(date)} AST`;
}
