import {
  json2satrec,
  propagate,
  eciToGeodetic,
  degreesLat,
  degreesLong,
  type SatRec,
  type OMMJsonObject,
} from 'satellite.js';
import { gmstFromDate } from '../utils/time';

export interface PropagationSample {
  /** ECI position, km. */
  positionEci: { x: number; y: number; z: number };
  /** ECI velocity, km/s. */
  velocityEci: { x: number; y: number; z: number };
  latDeg: number;
  lonDeg: number;
  altitudeKm: number;
  /** Instantaneous speed, km/s. */
  speedKmS: number;
}

export function buildSatrec(omm: OMMJsonObject): SatRec {
  return json2satrec(omm);
}

/** Orbital period, minutes, derived from the TLE's mean motion. */
export function orbitalPeriodMinutes(satrec: SatRec): number {
  const revsPerDay = satrec.no / (2 * Math.PI) * 1440;
  return 1440 / revsPerDay;
}

export function propagateAt(satrec: SatRec, date: Date): PropagationSample | null {
  const result = propagate(satrec, date);
  if (!result) return null;
  const { position, velocity } = result;

  const gmst = gmstFromDate(date);
  const geodetic = eciToGeodetic(position, gmst);
  const speedKmS = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

  return {
    positionEci: position,
    velocityEci: velocity,
    latDeg: degreesLat(geodetic.latitude),
    lonDeg: degreesLong(geodetic.longitude),
    altitudeKm: geodetic.height,
    speedKmS,
  };
}
