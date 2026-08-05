import * as THREE from 'three';

/** Mean Earth radius, km. */
export const EARTH_RADIUS_KM = 6371;

/** Scene units per km. Earth radius becomes 6.371 three.js units. */
export const KM_TO_SCENE = 1 / 1000;

/**
 * Converts geodetic lat/lon (degrees) + radius (scene units) into a
 * position in the Earth-local frame, matching THREE.SphereGeometry's own
 * vertex parametrization (theta = lon+180 swept over u, phi = colatitude
 * swept over v). Using this exact formula keeps a canvas-drawn
 * equirectangular texture aligned with markers placed via this function,
 * with no custom UVs required.
 */
export function latLonToVector3(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - latDeg); // colatitude
  const theta = THREE.MathUtils.degToRad(lonDeg + 180);
  const x = -radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(theta) * Math.sin(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Remaps a satellite.js ECI position (km, x/y/z with z = north/rotation
 * axis) into three.js scene space (Y-up). This is a proper rotation
 * (x,y,z) -> (x,z,-y), so it preserves handedness — the Earth mesh's own
 * rotation.y (driven by GMST, see earth.ts) then reproduces Earth's real
 * rotation in this same frame. Satellites are added directly to the
 * scene using this function (never parented to the rotating Earth mesh),
 * which is what keeps the propagation physically an inertial-frame one.
 */
export function eciToSceneVector3(eciKm: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(eciKm.x * KM_TO_SCENE, eciKm.z * KM_TO_SCENE, -eciKm.y * KM_TO_SCENE);
}
