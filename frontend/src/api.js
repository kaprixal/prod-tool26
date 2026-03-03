const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = API_URL + '/api';
export const ASSET_BASE = API_URL + '/assets';

export async function fetchState() {
  const res = await fetch(`${API_BASE}/state`);
  return res.json();
}

export async function fetchGameData() {
  const res = await fetch(`${API_BASE}/game-data`);
  return res.json();
}

export async function updateMode(data) {
  const res = await fetch(`${API_BASE}/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateGeneralInfo(data) {
  const res = await fetch(`${API_BASE}/general/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateSchedule(data) {
  const res = await fetch(`${API_BASE}/general/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateMatch(matchNumber, data) {
  const res = await fetch(`${API_BASE}/match/${matchNumber}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function swapTeams(matchNumber) {
  const res = await fetch(`${API_BASE}/match/${matchNumber}/swap`, {
    method: 'POST',
  });
  return res.json();
}

export async function clearMatch(matchNumber) {
  const res = await fetch(`${API_BASE}/match/${matchNumber}/clear`, {
    method: 'POST',
  });
  return res.json();
}

export async function updateOwBan(hero, team) {
  const res = await fetch(`${API_BASE}/owban`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hero, team }),
  });
  return res.json();
}

export async function resetState() {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  return res.json();
}
