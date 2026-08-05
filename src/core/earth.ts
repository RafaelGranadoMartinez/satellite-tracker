import * as THREE from 'three';
import { EARTH_RADIUS_KM, KM_TO_SCENE, latLonToVector3 } from '../utils/coords';
import { gmstFromDate } from '../utils/time';

export const EARTH_SCENE_RADIUS = EARTH_RADIUS_KM * KM_TO_SCENE;

const STATION_COLOR = 0xffb020; // amber, matches the ground-station HUD accent

export class Earth {
  readonly group: THREE.Group;
  private readonly surface: THREE.Mesh;
  private readonly clouds: THREE.Mesh;
  private readonly stationMarker: THREE.Group;

  constructor() {
    this.group = new THREE.Group();

    const loader = new THREE.TextureLoader();
    const map = loader.load('/textures/earth_atmos_2048.jpg');
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    const specularMap = loader.load('/textures/earth_specular_2048.jpg');
    const normalMap = loader.load('/textures/earth_normal_2048.jpg');

    const geometry = new THREE.SphereGeometry(EARTH_SCENE_RADIUS, 96, 96);
    const material = new THREE.MeshPhongMaterial({
      map,
      specularMap,
      normalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      specular: new THREE.Color(0x333333),
      shininess: 12,
    });
    this.surface = new THREE.Mesh(geometry, material);
    this.group.add(this.surface);

    this.clouds = this.buildClouds();
    this.group.add(this.clouds);

    this.group.add(this.buildAtmosphere());

    // Parented to the surface mesh (not the group) so it inherits the
    // surface's own rotation.y and stays pinned to its lat/lon as Earth spins.
    this.stationMarker = this.buildStationMarker();
    this.surface.add(this.stationMarker);
  }

  private buildStationMarker(): THREE.Group {
    const marker = new THREE.Group();

    const pin = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.16, 12),
      new THREE.MeshBasicMaterial({ color: STATION_COLOR }),
    );
    pin.position.y = 0.08; // half-height, so the tip sits away from the surface and the base touches it
    marker.add(pin);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.07, 0.09, 32),
      new THREE.MeshBasicMaterial({
        color: STATION_COLOR,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2; // lay flat against the surface, facing outward
    marker.add(ring);

    return marker;
  }

  /** Repositions the ground-station marker to the given geodetic lat/lon. */
  setGroundStation(latDeg: number, lonDeg: number): void {
    const position = latLonToVector3(latDeg, lonDeg, EARTH_SCENE_RADIUS);
    this.stationMarker.position.copy(position);
    this.stationMarker.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      position.clone().normalize(),
    );
  }

  /** Returns the geodetic coordinates under a raycast hit on the globe. */
  pickGroundCoordinates(raycaster: THREE.Raycaster): { latDeg: number; lonDeg: number } | null {
    const hit = raycaster.intersectObject(this.surface, false)[0];
    if (!hit) return null;

    // Convert from world space into the rotating surface's local frame so the
    // longitude corresponds to the texture rather than the inertial scene.
    const local = this.surface.worldToLocal(hit.point.clone()).normalize();
    return {
      latDeg: THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(local.y, -1, 1))),
      lonDeg: THREE.MathUtils.radToDeg(Math.atan2(-local.z, local.x)),
    };
  }

  private buildClouds(): THREE.Mesh {
    const loader = new THREE.TextureLoader();
    const cloudMap = loader.load('/textures/earth_clouds_1024.png');
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    const geometry = new THREE.SphereGeometry(EARTH_SCENE_RADIUS * 1.006, 96, 96);
    const material = new THREE.MeshPhongMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    return new THREE.Mesh(geometry, material);
  }

  private buildAtmosphere(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(EARTH_SCENE_RADIUS * 1.015, 64, 64);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color(0x4a8fc4) },
      },
      vertexShader: `
        varying float intensity;
        void main() {
          vec3 viewNormal = normalize(normalMatrix * normal);
          vec3 viewDir = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
          intensity = pow(1.0 - max(dot(viewNormal, viewDir), 0.0), 2.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          gl_FragColor = vec4(glowColor, intensity * 0.5);
        }
      `,
    });
    return new THREE.Mesh(geometry, material);
  }

  /** Rotates the Earth mesh to its true orientation for the given moment. */
  update(date: Date): void {
    const gmst = gmstFromDate(date);
    this.surface.rotation.y = gmst;
    this.clouds.rotation.y = gmst * 1.03; // slow independent cloud drift
  }
}
