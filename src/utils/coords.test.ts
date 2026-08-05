import { describe, expect, it } from 'vitest';
import { eciToSceneVector3, latLonToVector3 } from './coords';

describe('coordinate conversion', () => {
  it('places geographic reference points on the expected scene axes', () => {
    const primeMeridian = latLonToVector3(0, 0, 1);
    expect(primeMeridian.x).toBeCloseTo(1);
    expect(primeMeridian.y).toBeCloseTo(0);
    expect(primeMeridian.z).toBeCloseTo(0);
    expect(latLonToVector3(90, 0, 1).y).toBeCloseTo(1);
    expect(latLonToVector3(0, 90, 1).z).toBeCloseTo(-1);
  });

  it('maps ECI Z to scene Y and preserves vector length', () => {
    const scene = eciToSceneVector3({ x: 1000, y: 2000, z: 3000 });
    expect(scene.toArray()).toEqual([1, 3, -2]);
    expect(scene.length()).toBeCloseTo(Math.sqrt(14));
  });
});
