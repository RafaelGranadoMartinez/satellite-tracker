import type { SatelliteRecord } from './types';

/**
 * Offline fallback set — captured from CelesTrak's gp.php JSON endpoint on
 * 2026-07-28. Used only when a live fetch fails (CORS, offline, rate
 * limiting), so this becomes stale over time; that's expected, and the UI
 * marks it as CACHED with this capture date rather than presenting it as
 * current.
 */
export const FALLBACK_CAPTURED_AT = new Date('2026-07-28T06:00:00Z');

export const FALLBACK_SATELLITES: SatelliteRecord[] = [
  {
    noradId: 25544,
    name: 'ISS (ZARYA)',
    omm: {
      OBJECT_NAME: 'ISS (ZARYA)',
      OBJECT_ID: '1998-067A',
      EPOCH: '2026-07-28T03:39:38.218752',
      MEAN_MOTION: 15.49220842,
      ECCENTRICITY: 0.0007093,
      INCLINATION: 51.632,
      RA_OF_ASC_NODE: 97.3682,
      ARG_OF_PERICENTER: 345.612,
      MEAN_ANOMALY: 14.4666,
      EPHEMERIS_TYPE: 0,
      CLASSIFICATION_TYPE: 'U',
      NORAD_CAT_ID: 25544,
      ELEMENT_SET_NO: 999,
      REV_AT_EPOCH: 57810,
      BSTAR: 0.00020282,
      MEAN_MOTION_DOT: 0.00010831,
      MEAN_MOTION_DDOT: 0,
    },
  },
  {
    noradId: 20580,
    name: 'HST (HUBBLE)',
    omm: {
      OBJECT_NAME: 'HST',
      OBJECT_ID: '1990-037B',
      EPOCH: '2026-07-28T01:55:24.800160',
      MEAN_MOTION: 15.31181501,
      ECCENTRICITY: 0.0001698,
      INCLINATION: 28.4723,
      RA_OF_ASC_NODE: 160.9885,
      ARG_OF_PERICENTER: 238.9636,
      MEAN_ANOMALY: 121.0793,
      EPHEMERIS_TYPE: 0,
      CLASSIFICATION_TYPE: 'U',
      NORAD_CAT_ID: 20580,
      ELEMENT_SET_NO: 999,
      REV_AT_EPOCH: 79484,
      BSTAR: 0.00021494,
      MEAN_MOTION_DOT: 6.899e-5,
      MEAN_MOTION_DDOT: 0,
    },
  },
  {
    noradId: 44714,
    name: 'STARLINK-1008',
    omm: {
      OBJECT_NAME: 'STARLINK-1008',
      OBJECT_ID: '2019-074B',
      EPOCH: '2026-07-28T06:00:02.000160',
      MEAN_MOTION: 15.58620649,
      ECCENTRICITY: 0.0006369,
      INCLINATION: 53.148,
      RA_OF_ASC_NODE: 231.3457,
      ARG_OF_PERICENTER: 356.1324,
      MEAN_ANOMALY: 16.2036,
      EPHEMERIS_TYPE: 0,
      CLASSIFICATION_TYPE: 'U',
      NORAD_CAT_ID: 44714,
      ELEMENT_SET_NO: 999,
      REV_AT_EPOCH: 597,
      BSTAR: 0.0034297,
      MEAN_MOTION_DOT: 0.00276968,
      MEAN_MOTION_DDOT: 0,
    },
  },
  {
    noradId: 35491,
    name: 'EWS-G3 (GOES 14)',
    omm: {
      OBJECT_NAME: 'EWS-G3 (GOES 14)',
      OBJECT_ID: '2009-033A',
      EPOCH: '2026-07-28T00:37:51.542400',
      MEAN_MOTION: 1.00091977,
      ECCENTRICITY: 0.0002295,
      INCLINATION: 1.7908,
      RA_OF_ASC_NODE: 82.5336,
      ARG_OF_PERICENTER: 44.4582,
      MEAN_ANOMALY: 305.0829,
      EPHEMERIS_TYPE: 0,
      CLASSIFICATION_TYPE: 'U',
      NORAD_CAT_ID: 35491,
      ELEMENT_SET_NO: 999,
      REV_AT_EPOCH: 699,
      BSTAR: 0,
      MEAN_MOTION_DOT: -0.00000351,
      MEAN_MOTION_DDOT: 0,
    },
  },
];
