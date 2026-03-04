/**
 * API layer — state operations now use localStorage via localStore.
 * Only fetchGameData still hits the backend (read-only reference data).
 */

import * as store from './localStore';

const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = API_URL + '/api';
export const ASSET_BASE = API_URL;

/** Prefix an /assets/... path with the backend URL for production */
export const asset = (path) => API_URL + path;

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

// ---------------------------------------------------------------------------
// Mutations — all local, synchronous (return the updated state)
// ---------------------------------------------------------------------------

export function updateMode(data) {
  return store.updateMode(data);
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

export function resetState() {
  return store.resetState();
}

export function restoreState(data) {
  return store.restoreState(data);
}
