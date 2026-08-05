import * as THREE from 'three';
import type { OMMJsonObject } from 'satellite.js';
import { fetchByNoradId, fetchByName, CelestrakError } from '../data/celestrak';

/** ISS, Hubble, one Starlink, one weather satellite — fixed IDs so the
 *  default set never depends on a rate-limited GROUP= query. */
const DEFAULT_WATCHLIST = [25544, 20580, 44714, 35491];
import { FALLBACK_SATELLITES, FALLBACK_CAPTURED_AT } from './fallbackData';
import { TrackedSatellite } from './TrackedSatellite';
import type { DataFeedStatus, SatelliteRecord } from './types';
import { computeLookAngles, DEFAULT_GROUND_STATION, type GroundStation, type LookAngles } from '../ground/groundStation';

function toRecord(omm: OMMJsonObject): SatelliteRecord {
  return {
    noradId: Number(omm.NORAD_CAT_ID),
    name: omm.OBJECT_NAME,
    omm,
  };
}

export type AddResult = { ok: true; satellite: TrackedSatellite } | { ok: false; error: string };

export class TrackedSatelliteManager {
  private readonly scene: THREE.Scene;
  private readonly satellites = new Map<number, TrackedSatellite>();
  readonly lookAngles = new Map<number, LookAngles>();
  selectedId: number | null = null;
  groundStation: GroundStation = DEFAULT_GROUND_STATION;
  feedStatus: DataFeedStatus = {
    source: 'cached',
    timestamp: FALLBACK_CAPTURED_AT,
    detail: 'not yet loaded',
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  list(): TrackedSatellite[] {
    return [...this.satellites.values()];
  }

  get(noradId: number): TrackedSatellite | undefined {
    return this.satellites.get(noradId);
  }

  /** Loads the initial default watchlist, preferring live CelesTrak data. */
  async loadDefaultSet(): Promise<void> {
    try {
      // Individual CATNR lookups only. CelesTrak hard rate-limits GROUP=
      // queries to once per 2 hours per client (confirmed: it 403s with
      // "GP data has not updated since your last successful download..."),
      // so fetching a GROUP endpoint on every page load would degrade to
      // the cached fallback almost immediately for any real user session.
      const results = await Promise.allSettled(DEFAULT_WATCHLIST.map((id) => fetchByNoradId(id)));
      const records = results
        .filter((result): result is PromiseFulfilledResult<OMMJsonObject[]> => result.status === 'fulfilled')
        .map((result) => result.value[0])
        .filter((record): record is OMMJsonObject => Boolean(record));
      if (records.length === 0) throw new CelestrakError('Empty response set');

      for (const omm of records) this.addRecord(toRecord(omm));

      // Preserve successful live results and fill only missing defaults from
      // cache. One transient request should not downgrade the entire feed.
      for (const fallback of FALLBACK_SATELLITES) {
        if (!this.satellites.has(fallback.noradId)) this.addRecord(fallback);
      }

      this.feedStatus = {
        source: 'live',
        timestamp: new Date(),
        detail:
          records.length === DEFAULT_WATCHLIST.length
            ? 'CelesTrak gp.php'
            : `CelesTrak gp.php (${records.length}/${DEFAULT_WATCHLIST.length} live; remainder cached)`,
      };
    } catch (err) {
      for (const record of FALLBACK_SATELLITES) this.addRecord(record);
      this.feedStatus = {
        source: 'cached',
        timestamp: FALLBACK_CAPTURED_AT,
        detail: err instanceof Error ? err.message : 'live fetch failed',
      };
    }

    if (this.satellites.size > 0) {
      this.select([...this.satellites.keys()][0]);
    }
  }

  addRecord(record: SatelliteRecord): TrackedSatellite {
    const existing = this.satellites.get(record.noradId);
    if (existing) return existing;

    const satellite = new TrackedSatellite(record);
    satellite.refreshTrail(new Date());
    this.scene.add(satellite.marker);
    this.scene.add(satellite.trail);
    this.satellites.set(record.noradId, satellite);
    return satellite;
  }

  removeSatellite(noradId: number): void {
    const satellite = this.satellites.get(noradId);
    if (!satellite) return;
    this.scene.remove(satellite.marker);
    this.scene.remove(satellite.trail);
    satellite.marker.geometry.dispose();
    (satellite.marker.material as THREE.Material).dispose();
    satellite.trail.geometry.dispose();
    (satellite.trail.material as THREE.Material).dispose();
    this.satellites.delete(noradId);
    this.lookAngles.delete(noradId);
    if (this.selectedId === noradId) {
      this.selectedId = null;
      const next = this.list()[0];
      if (next) this.select(next.record.noradId);
    }
  }

  select(noradId: number | null): void {
    if (this.selectedId !== null) this.satellites.get(this.selectedId)?.setSelected(false);
    this.selectedId = noradId;
    if (noradId !== null) this.satellites.get(noradId)?.setSelected(true);
  }

  getSelected(): TrackedSatellite | undefined {
    return this.selectedId !== null ? this.satellites.get(this.selectedId) : undefined;
  }

  /** Fetches and adds a single satellite by NORAD catalog number. Does NOT fall back to cache. */
  async addByNoradId(noradId: number): Promise<AddResult> {
    try {
      const results = await fetchByNoradId(noradId);
      if (results.length === 0) return { ok: false, error: `NORAD ID ${noradId} not found` };
      const satellite = this.addRecord(toRecord(results[0]));
      this.select(satellite.record.noradId);
      return { ok: true, satellite };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'fetch failed' };
    }
  }

  /** Name search — returns raw matches for the caller to present as a picklist. */
  async searchByName(name: string): Promise<OMMJsonObject[]> {
    const results = await fetchByName(name);
    return results.slice(0, 25);
  }

  addFromOmm(omm: OMMJsonObject): TrackedSatellite {
    const satellite = this.addRecord(toRecord(omm));
    this.select(satellite.record.noradId);
    return satellite;
  }

  setGroundStation(station: GroundStation): void {
    this.groundStation = station;
  }

  tick(date: Date): void {
    for (const satellite of this.satellites.values()) {
      satellite.update(date);
      if (satellite.latest) {
        this.lookAngles.set(
          satellite.record.noradId,
          computeLookAngles(this.groundStation, satellite.latest.positionEci, date),
        );
      }
    }
  }
}
