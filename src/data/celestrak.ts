import type { OMMJsonObject } from 'satellite.js';

const BASE_URL = 'https://celestrak.org/NORAD/elements/gp.php';
const FETCH_TIMEOUT_MS = 8000;

export class CelestrakError extends Error {}

async function getJson(params: Record<string, string>): Promise<OMMJsonObject[]> {
  const url = `${BASE_URL}?${new URLSearchParams({ ...params, FORMAT: 'JSON' }).toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (err) {
    throw new CelestrakError(`Network error reaching CelesTrak: ${(err as Error).message}`);
  }

  if (!response.ok) {
    throw new CelestrakError(`CelesTrak responded with HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new CelestrakError('Unexpected response shape from CelesTrak');
  }
  return data as OMMJsonObject[];
}

/** Fetches a single satellite's current elements by NORAD catalog number. */
export function fetchByNoradId(noradId: number): Promise<OMMJsonObject[]> {
  return getJson({ CATNR: String(noradId) });
}

/** Fuzzy name search — CelesTrak matches substrings, case-insensitively. */
export function fetchByName(name: string): Promise<OMMJsonObject[]> {
  return getJson({ NAME: name });
}

/** Bulk fetch of a curated CelesTrak group (e.g. 'stations', 'weather', 'starlink'). */
export function fetchByGroup(group: string): Promise<OMMJsonObject[]> {
  return getJson({ GROUP: group });
}
