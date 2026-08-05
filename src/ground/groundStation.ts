import { ecfToLookAngles, eciToEcf, radiansLat, radiansLong, radiansToDegrees } from 'satellite.js';
import { gmstFromDate } from '../utils/time';

export interface GroundStation {
  label: string;
  latDeg: number;
  lonDeg: number;
  /** Station altitude above the ellipsoid, km. */
  heightKm: number;
}

export const DEFAULT_GROUND_STATION: GroundStation = {
  label: 'MAYAGÜEZ, PR',
  latDeg: 18.2013,
  lonDeg: -67.1441,
  heightKm: 0.03,
};

export interface LookAngles {
  azimuthDeg: number;
  elevationDeg: number;
  rangeKm: number;
  aboveHorizon: boolean;
}

export function computeLookAngles(
  station: GroundStation,
  positionEciKm: { x: number; y: number; z: number },
  date: Date,
): LookAngles {
  const gmst = gmstFromDate(date);
  const satEcf = eciToEcf(positionEciKm, gmst);
  const observerGeodetic = {
    longitude: radiansLong(station.lonDeg),
    latitude: radiansLat(station.latDeg),
    height: station.heightKm,
  };
  const { azimuth, elevation, rangeSat } = ecfToLookAngles(observerGeodetic, satEcf);
  const elevationDeg = radiansToDegrees(elevation);
  return {
    azimuthDeg: radiansToDegrees(azimuth),
    elevationDeg,
    rangeKm: rangeSat,
    aboveHorizon: elevationDeg > 0,
  };
}
