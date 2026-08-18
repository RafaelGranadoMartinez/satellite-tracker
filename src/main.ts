import './style.css';
import * as THREE from 'three';
import type { OMMJsonObject } from 'satellite.js';
import { SceneRig } from './core/scene';
import { Earth } from './core/earth';
import { TrackedSatelliteManager } from './satellites/manager';
import { DEFAULT_GROUND_STATION, type GroundStation } from './ground/groundStation';
import { formatPuertoRicoTime } from './utils/time';

const app = document.querySelector<HTMLDivElement>('#app')!;

const viewport = document.createElement('div');
viewport.id = 'viewport';
app.appendChild(viewport);

app.insertAdjacentHTML(
  'beforeend',
  `
  <div class="topbar hud-panel">
    <div class="topbar-title">
      <button class="callsign" id="callsign" type="button" title="Orbital Tracking">ORBITAL TRACKING</button>
      <div class="subtitle">SGP4 PROPAGATION · LIVE INERTIAL FRAME</div>
    </div>
    <div class="topbar-status">
      <div class="feed-badge" id="feed-badge">
        <span class="dot" id="feed-dot"></span>
        <span id="feed-label">LOADING…</span>
      </div>
      <div class="clock-row"><span class="label">PR TIME</span> <span id="clock">--:--:-- AST</span></div>
      <div class="controls-hint">DRAG TO ORBIT · SCROLL TO ZOOM</div>
    </div>
  </div>

  <aside class="sidebar hud-panel">
    <div class="sidebar-search">
      <input id="search-input" type="text" placeholder="NORAD ID or name…" autocomplete="off" />
      <button id="search-btn">ADD</button>
    </div>
    <div id="search-feedback" class="search-feedback"></div>
    <div id="search-results" class="search-results"></div>
    <div class="sat-list-header">TRACKED (<span id="sat-count">0</span>)</div>
    <div id="sat-list" class="sat-list"></div>
  </aside>

  <div class="hud hud-telemetry hud-panel" id="telemetry"></div>
  <div class="hud hud-ground hud-panel" id="ground-panel"></div>
  <div class="boricua-easter-egg" id="boricua-easter-egg" role="status" aria-live="polite">
    <span class="pr-flag" aria-hidden="true">🇵🇷</span>
    <strong>¡WEPA!</strong>
    <span>COQUÍ CONTROL · ISLA DEL ENCANTO · 18.2208° N, 66.5901° W</span>
    <span class="coqui" aria-hidden="true">CO-QUÍ · CO-QUÍ</span>
  </div>
  `,
);

const rig = new SceneRig(viewport);
const earth = new Earth();
rig.scene.add(earth.group);
earth.setGroundStation(DEFAULT_GROUND_STATION.latDeg, DEFAULT_GROUND_STATION.lonDeg);

const manager = new TrackedSatelliteManager(rig.scene);

// --- DOM refs -----------------------------------------------------------

const clockEl = document.querySelector<HTMLDivElement>('#clock')!;
const telemetryEl = document.querySelector<HTMLDivElement>('#telemetry')!;
const feedDotEl = document.querySelector<HTMLSpanElement>('#feed-dot')!;
const feedLabelEl = document.querySelector<HTMLSpanElement>('#feed-label')!;
const satListEl = document.querySelector<HTMLDivElement>('#sat-list')!;
const satCountEl = document.querySelector<HTMLSpanElement>('#sat-count')!;
const searchInputEl = document.querySelector<HTMLInputElement>('#search-input')!;
const searchBtnEl = document.querySelector<HTMLButtonElement>('#search-btn')!;
const searchFeedbackEl = document.querySelector<HTMLDivElement>('#search-feedback')!;
const searchResultsEl = document.querySelector<HTMLDivElement>('#search-results')!;
const groundPanelEl = document.querySelector<HTMLDivElement>('#ground-panel')!;
const callsignEl = document.querySelector<HTMLButtonElement>('#callsign')!;
const easterEggEl = document.querySelector<HTMLDivElement>('#boricua-easter-egg')!;

let callsignClicks = 0;
let easterEggTimer: ReturnType<typeof setTimeout> | undefined;

callsignEl.addEventListener('click', () => {
  callsignClicks += 1;
  if (callsignClicks < 5) return;

  callsignClicks = 0;
  window.clearTimeout(easterEggTimer);
  easterEggEl.classList.remove('visible');
  // Restart the entrance animation when the easter egg is discovered again.
  void easterEggEl.offsetWidth;
  easterEggEl.classList.add('visible');
  document.documentElement.classList.add('boricua-mode');
  easterEggTimer = window.setTimeout(() => {
    easterEggEl.classList.remove('visible');
    document.documentElement.classList.remove('boricua-mode');
  }, 7000);
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

// --- Telemetry / feed status ---------------------------------------------

function renderTelemetry(): void {
  const sat = manager.getSelected();
  if (!sat || !sat.latest) {
    telemetryEl.innerHTML = '<div class="sat-name">NO SATELLITE SELECTED</div>';
    return;
  }
  const s = sat.latest;
  const look = manager.lookAngles.get(sat.record.noradId);
  const row = (label: string, value: string) =>
    `<div class="telemetry-row"><span>${label}</span><span class="value">${value}</span></div>`;
  telemetryEl.innerHTML = `
    <div class="sat-name">${escapeHtml(sat.record.name)}</div>
    ${row('NORAD ID', String(sat.record.noradId))}
    ${row('ALTITUDE', `${s.altitudeKm.toFixed(1)} km`)}
    ${row('VELOCITY', `${s.speedKmS.toFixed(3)} km/s`)}
    ${row('INCLINATION', `${sat.inclinationDeg.toFixed(2)}°`)}
    ${row('PERIOD', `${sat.periodMinutes.toFixed(1)} min`)}
    ${row('LATITUDE', `${s.latDeg.toFixed(3)}°`)}
    ${row('LONGITUDE', `${s.lonDeg.toFixed(3)}°`)}
    ${look ? row('ELEVATION', `${look.elevationDeg.toFixed(1)}°`) : ''}
    ${look ? row('AZIMUTH', `${look.azimuthDeg.toFixed(1)}°`) : ''}
    ${look ? row('IN VIEW', look.aboveHorizon ? 'ABOVE HORIZON' : 'BELOW HORIZON') : ''}
  `;
}

function renderFeedStatus(): void {
  const status = manager.feedStatus;
  feedDotEl.className = `dot ${status.source}`;
  const time = status.timestamp.toISOString().slice(0, 16).replace('T', ' ') + 'Z';
  feedLabelEl.textContent = `${status.source.toUpperCase()} · ${time}`;
  feedLabelEl.title = status.detail;
}

// --- Satellite list (re-rendered on a slow interval, not per-frame) ------

function renderSatList(): void {
  const satellites = manager.list();
  satCountEl.textContent = String(satellites.length);
  satListEl.innerHTML = satellites
    .map((sat) => {
      const look = manager.lookAngles.get(sat.record.noradId);
      const visClass = look?.aboveHorizon ? 'above' : 'below';
      const visText = look ? `${look.aboveHorizon ? '▲' : '▼'} ${look.elevationDeg.toFixed(0)}°` : '—';
      const selected = sat.record.noradId === manager.selectedId ? 'selected' : '';
      return `
        <div class="sat-row ${selected}" data-norad="${sat.record.noradId}">
          <span class="sat-row-dot ${selected ? 'sel' : ''}"></span>
          <span class="sat-row-name">${escapeHtml(sat.record.name)}</span>
          <span class="sat-row-vis ${visClass}">${visText}</span>
          <button class="sat-row-remove" data-remove="${sat.record.noradId}" title="Stop tracking">&times;</button>
        </div>`;
    })
    .join('');
}

satListEl.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const removeId = target.getAttribute('data-remove');
  if (removeId) {
    manager.removeSatellite(Number(removeId));
    renderSatList();
    renderTelemetry();
    return;
  }
  const row = target.closest<HTMLElement>('.sat-row');
  if (row) {
    manager.select(Number(row.dataset.norad));
    renderSatList();
    renderTelemetry();
  }
});

// --- Search / add ---------------------------------------------------------

function renderSearchResults(results: OMMJsonObject[]): void {
  searchResultsEl.innerHTML = results
    .map(
      (r) => `
      <div class="search-result-row" data-catnr="${r.NORAD_CAT_ID}">
        <span>${escapeHtml(String(r.OBJECT_NAME))}</span>
        <span class="value">${r.NORAD_CAT_ID}</span>
      </div>`,
    )
    .join('');
}

searchResultsEl.addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest<HTMLElement>('.search-result-row');
  if (!row) return;
  const catnr = row.dataset.catnr!;
  const cached = lastSearchResults.find((r) => String(r.NORAD_CAT_ID) === catnr);
  if (cached) {
    manager.addFromOmm(cached);
    renderSatList();
    renderTelemetry();
    searchResultsEl.innerHTML = '';
    searchInputEl.value = '';
  }
});

let lastSearchResults: OMMJsonObject[] = [];

async function handleSearchSubmit(): Promise<void> {
  const raw = searchInputEl.value.trim();
  if (!raw) return;

  searchBtnEl.disabled = true;
  searchFeedbackEl.textContent = 'SEARCHING…';
  searchFeedbackEl.className = 'search-feedback';
  searchResultsEl.innerHTML = '';

  try {
    if (/^\d+$/.test(raw)) {
      const result = await manager.addByNoradId(Number(raw));
      if (result.ok) {
        searchFeedbackEl.textContent = `ADDED ${result.satellite.record.name}`;
        searchInputEl.value = '';
        renderSatList();
        renderTelemetry();
      } else {
        searchFeedbackEl.textContent = result.error.toUpperCase();
        searchFeedbackEl.className = 'search-feedback error';
      }
    } else {
      lastSearchResults = await manager.searchByName(raw);
      if (lastSearchResults.length === 0) {
        searchFeedbackEl.textContent = 'NO MATCHES';
        searchFeedbackEl.className = 'search-feedback error';
      } else {
        searchFeedbackEl.textContent = `${lastSearchResults.length} MATCH(ES) — SELECT ONE`;
        renderSearchResults(lastSearchResults);
      }
    }
  } catch (err) {
    searchFeedbackEl.textContent = (err instanceof Error ? err.message : 'search failed').toUpperCase();
    searchFeedbackEl.className = 'search-feedback error';
  } finally {
    searchBtnEl.disabled = false;
  }
}

searchBtnEl.addEventListener('click', handleSearchSubmit);
searchInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearchSubmit();
});

// --- Ground station panel --------------------------------------------------

function applyGroundStation(station: GroundStation): void {
  manager.setGroundStation(station);
  earth.setGroundStation(station.latDeg, station.lonDeg);
  renderGroundPanel();
}

let dropPinMode = false;

function setDropPinMode(enabled: boolean): void {
  dropPinMode = enabled;
  rig.renderer.domElement.classList.toggle('drop-pin-mode', enabled);
  renderGroundPanel();
}

function renderGroundPanel(): void {
  const gs = manager.groundStation;
  groundPanelEl.innerHTML = `
    <div class="sat-name">GROUND STATION</div>
    <div class="ground-station-label">${gs.label}</div>
    <div class="ground-inputs">
      <label>LAT <input id="gs-lat" type="number" step="0.0001" value="${gs.latDeg}" /></label>
      <label>LON <input id="gs-lon" type="number" step="0.0001" value="${gs.lonDeg}" /></label>
    </div>
    <div class="ground-buttons">
      <button id="gs-apply">APPLY</button>
      <button id="gs-pin">${dropPinMode ? 'CANCEL PIN' : 'DROP PIN'}</button>
      <button id="gs-locate">USE MY LOCATION</button>
      <button id="gs-reset">RESET</button>
    </div>
    <div class="search-feedback" id="gs-feedback"></div>
  `;

  const feedbackEl = document.querySelector<HTMLDivElement>('#gs-feedback')!;

  if (dropPinMode) feedbackEl.textContent = 'CLICK THE EARTH TO PLACE THE STATION';

  document.querySelector<HTMLButtonElement>('#gs-apply')!.addEventListener('click', () => {
    const lat = Number(document.querySelector<HTMLInputElement>('#gs-lat')!.value);
    const lon = Number(document.querySelector<HTMLInputElement>('#gs-lon')!.value);
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return;
    }
    applyGroundStation({ label: 'CUSTOM', latDeg: lat, lonDeg: lon, heightKm: 0.03 });
  });

  document.querySelector<HTMLButtonElement>('#gs-reset')!.addEventListener('click', () => {
    dropPinMode = false;
    rig.renderer.domElement.classList.remove('drop-pin-mode');
    applyGroundStation(DEFAULT_GROUND_STATION);
  });

  document.querySelector<HTMLButtonElement>('#gs-pin')!.addEventListener('click', () => {
    setDropPinMode(!dropPinMode);
  });

  document.querySelector<HTMLButtonElement>('#gs-locate')!.addEventListener('click', () => {
    if (!navigator.geolocation) {
      feedbackEl.textContent = 'GEOLOCATION NOT SUPPORTED';
      feedbackEl.className = 'search-feedback error';
      return;
    }
    feedbackEl.textContent = 'LOCATING…';
    feedbackEl.className = 'search-feedback';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyGroundStation({
          label: 'MY LOCATION',
          latDeg: pos.coords.latitude,
          lonDeg: pos.coords.longitude,
          heightKm: 0.03,
        });
      },
      (err) => {
        feedbackEl.textContent = err.message.toUpperCase();
        feedbackEl.className = 'search-feedback error';
      },
    );
  });
}

// --- Click-to-select on the 3D markers -------------------------------------

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
let pointerDownPos: { x: number; y: number } | null = null;

rig.renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

rig.renderer.domElement.addEventListener('pointerup', (e) => {
  if (!pointerDownPos) return;
  const dx = e.clientX - pointerDownPos.x;
  const dy = e.clientY - pointerDownPos.y;
  pointerDownPos = null;
  if (Math.hypot(dx, dy) > 5) return; // treat as a drag, not a click

  const rect = rig.renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, rig.camera);

  if (dropPinMode) {
    const coordinates = earth.pickGroundCoordinates(raycaster);
    if (coordinates) {
      dropPinMode = false;
      rig.renderer.domElement.classList.remove('drop-pin-mode');
      applyGroundStation({
        label: 'DROPPED PIN',
        latDeg: coordinates.latDeg,
        lonDeg: coordinates.lonDeg,
        heightKm: 0.03,
      });
    }
    return;
  }

  const markers = manager.list().map((sat) => sat.marker);
  const hits = raycaster.intersectObjects(markers, false);
  if (hits.length > 0) {
    const noradId = hits[0].object.userData.noradId as number;
    manager.select(noradId);
    renderSatList();
    renderTelemetry();
  }
});

// --- Main loop --------------------------------------------------------------

let lastTelemetryRender = 0;

function tick(now: number): void {
  const date = new Date();
  earth.update(date);
  manager.tick(date);
  if (now - lastTelemetryRender >= 100) {
    renderTelemetry();
    lastTelemetryRender = now;
  }
  clockEl.textContent = formatPuertoRicoTime(date);
  rig.render();
  requestAnimationFrame(tick);
}

async function main(): Promise<void> {
  renderGroundPanel();
  renderFeedStatus();
  await manager.loadDefaultSet();
  renderFeedStatus();
  renderSatList();
  renderTelemetry();
  setInterval(renderSatList, 1000);
  requestAnimationFrame(tick);
}

main();
