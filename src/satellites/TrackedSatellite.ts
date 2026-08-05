import * as THREE from 'three';
import { eciToSceneVector3 } from '../utils/coords';
import type { SatelliteRecord } from './types';
import { buildSatrec, orbitalPeriodMinutes, propagateAt, type PropagationSample } from './propagation';
import type { SatRec } from 'satellite.js';

const MARKER_COLOR = 0xc7ccd1; // neutral tracked-object gray, unselected
const MARKER_COLOR_SELECTED = 0xfc3d21; // mission red, selected
const TRAIL_COLOR = 0xc7ccd1;
const TRAIL_OPACITY = 0.28;
const TRAIL_OPACITY_SELECTED = 0.75;
const TRAIL_SAMPLES = 180;

export class TrackedSatellite {
  readonly record: SatelliteRecord;
  readonly satrec: SatRec;
  readonly marker: THREE.Mesh;
  readonly trail: THREE.Line;
  readonly inclinationDeg: number;
  readonly periodMinutes: number;
  latest: PropagationSample | null = null;
  selected = false;

  constructor(record: SatelliteRecord) {
    this.record = record;
    this.satrec = buildSatrec(record.omm);
    this.inclinationDeg = THREE.MathUtils.radToDeg(this.satrec.inclo);
    this.periodMinutes = orbitalPeriodMinutes(this.satrec);

    const geometry = new THREE.SphereGeometry(0.055, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: MARKER_COLOR });
    this.marker = new THREE.Mesh(geometry, material);
    this.marker.userData.noradId = record.noradId;

    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
      color: TRAIL_COLOR,
      transparent: true,
      opacity: TRAIL_OPACITY,
    });
    this.trail = new THREE.Line(trailGeometry, trailMaterial);
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    const marker = this.marker.material as THREE.MeshBasicMaterial;
    marker.color.set(selected ? MARKER_COLOR_SELECTED : MARKER_COLOR);
    const trail = this.trail.material as THREE.LineBasicMaterial;
    trail.opacity = selected ? TRAIL_OPACITY_SELECTED : TRAIL_OPACITY;
    trail.color.set(selected ? MARKER_COLOR_SELECTED : TRAIL_COLOR);
  }

  /** Recomputes the static one-orbit trail ring around the given moment. */
  refreshTrail(around: Date): void {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= TRAIL_SAMPLES; i++) {
      const minutesOffset = (i / TRAIL_SAMPLES) * this.periodMinutes - this.periodMinutes / 2;
      const t = new Date(around.getTime() + minutesOffset * 60_000);
      const sample = propagateAt(this.satrec, t);
      if (sample) points.push(eciToSceneVector3(sample.positionEci));
    }
    this.trail.geometry.setFromPoints(points);
  }

  update(date: Date): void {
    const sample = propagateAt(this.satrec, date);
    if (!sample) return;
    this.latest = sample;
    this.marker.position.copy(eciToSceneVector3(sample.positionEci));
  }
}
