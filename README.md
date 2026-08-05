# Satellite Tracker

An interactive browser-based satellite tracker using live orbital elements
from CelesTrak, SGP4 propagation through `satellite.js`, and a Three.js globe.

## Features

- Live NORAD ID and satellite-name search
- Real-time position, velocity, altitude, and orbital telemetry
- Ground-station azimuth, elevation, range, and horizon visibility
- Manual latitude/longitude, browser geolocation, or click-to-drop ground pin
- Cached fallback elements when CelesTrak is unavailable
- Selectable satellites and one-orbit trails in an inertial reference frame
- Puerto Rico-inspired mission-control color palette

## Run locally

Requires a current Node.js LTS release.

```sh
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Checks and production build

```sh
npm run check
npm test
npm run build
```

The production output is written to `dist/`.

## Data and privacy

Orbital elements are fetched from CelesTrak. “Use my location” invokes the
browser geolocation API only after the button is clicked. Users who do not
want to grant location access can type coordinates or choose “Drop pin” and
click the globe; those options do not request location permission.

Cached elements are deliberately labeled as cached because orbital elements
become less accurate as they age.

## Credits

Earth texture and orbital-data sources are documented in
[ATTRIBUTION.md](./ATTRIBUTION.md).
