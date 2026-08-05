import type { OMMJsonObject } from 'satellite.js';

export interface SatelliteRecord {
  noradId: number;
  name: string;
  omm: OMMJsonObject;
}

export type DataSource = 'live' | 'cached';

export interface DataFeedStatus {
  source: DataSource;
  timestamp: Date;
  detail: string;
}
