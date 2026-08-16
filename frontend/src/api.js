/**
 * API layer — state operations now use localStorage via localStore.
 * Only fetchGameData still hits the backend (read-only reference data).
 */

import * as store from './localStore';

const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = API_URL + '/api';
export const ASSET_BASE = API_URL;

/** Prefix an /assets/... path with the backend URL for production.
 *  Appends a cache-busting version param so browsers fetch fresh files. */
const ASSET_VERSION = '1.0.11';
export const asset = (path) => `${API_URL}${path}?v=${ASSET_VERSION}`;

/** Build an asset URL for a category whose files are split per style preset
 *  (e.g. casters_and_interviews/CIE2026/casters_cam_box.png). Falls back to
 *  the default preset if none is selected yet. */
export const presetAsset = (category, filename) => {
  const preset = store.getState().stylePreset || 'CIE2026';
  return asset(`/assets/${category}/${preset}/${filename}`);
};

// ---------------------------------------------------------------------------
// Read state (from localStorage)
// ---------------------------------------------------------------------------

export function fetchState() {
  return store.getState();
}

// ---------------------------------------------------------------------------
// Game data still comes from the backend (read-only, same for all users)
// ---------------------------------------------------------------------------

export async function fetchGameData() {
  const res = await fetch(`${API_BASE}/game-data`);
  return res.json();
}

export async function fetchStylePresets() {
  const res = await fetch(`${API_BASE}/style-presets`);
  return res.json();
}

/** Rank/AVP/top-traits lookup for a single TFT player. riotId must be
 *  'gameName#tagLine'. Throws with the backend's error detail on failure. */
export async function fetchTftStats(riotId, region = 'na1') {
  const res = await fetch(`${API_BASE}/tft-stats?${new URLSearchParams({ riotId, region })}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `TFT stats lookup failed (${res.status})`);
  }
  return res.json();
}

/** Full 8-player lobby breakdown for a player's last `count` (1-5) games.
 *  riotId must be 'gameName#tagLine'. Throws with the backend's error detail on failure. */
export async function fetchTftMatchHistory(riotId, region = 'na1', count = 3) {
  const res = await fetch(`${API_BASE}/tft-match-history?${new URLSearchParams({ riotId, region, count })}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `TFT match history lookup failed (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Mutations — all local, synchronous (return the updated state)
// ---------------------------------------------------------------------------

export function setCurrMatch(matchNumber) {
  return store.setCurrMatch(matchNumber);
}

export function updateGeneralInfo(data) {
  return store.updateGeneralInfo(data);
}

export function updateSchedule(data) {
  return store.updateSchedule(data);
}

export function updateMatch(matchNumber, data) {
  return store.updateMatch(matchNumber, data);
}

export function swapTeams(matchNumber) {
  return store.swapTeams(matchNumber);
}

export function clearMatch(matchNumber) {
  return store.clearMatch(matchNumber);
}

export function updateOwBan(hero, team) {
  return store.updateOwBan(hero, team);
}

export function setPanelCount(count) {
  return store.setPanelCount(count);
}

export function updatePanelInfo(count, panelists) {
  return store.updatePanelInfo(count, panelists);
}

export function resetState() {
  return store.resetState();
}

export function restoreState(data) {
  return store.restoreState(data);
}

export function triggerBmoPlay() {
  return store.triggerBmoPlay();
}

export function clearBmoPlay() {
  return store.clearBmoPlay();
}

export function setStylePreset(presetId) {
  return store.setStylePreset(presetId);
}

export function setTftLobbyHistoryPlayerKey(playerKey) {
  return store.setTftLobbyHistoryPlayerKey(playerKey);
}
