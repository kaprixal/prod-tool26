/**
 * Local state store — all production-tool state lives in localStorage.
 * Both the dashboard and overlay pages (same origin) share this store.
 */

const LS_KEY = 'prodToolState';

// ---------------------------------------------------------------------------
// Default state factories (mirrors backend defaults)
// ---------------------------------------------------------------------------

function makeDefaultPlayer() {
  return { name: '', character: '+', role: '+' };
}

function makeDefaultMap() {
  return { type: '+', name: '+', t1: '', t2: '', done: false, state: 'unplayed' };
}

function makeDefaultMatch() {
  return {
    team1: { name: '', logo: '' },
    team2: { name: '', logo: '' },
    players: Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`p${i + 1}`, makeDefaultPlayer()])
    ),
    maps: Object.fromEntries(
      Array.from({ length: 5 }, (_, i) => [`map${i + 1}`, makeDefaultMap()])
    ),
    t1TotalScore: 0,
    t2TotalScore: 0,
    winner: 'none',
  };
}

export function makeDefaultState() {
  return {
    game: '',
    currMatch: '1',
    streamTitle: '',
    subtitle: '',
    caster1: { name: '', info: '' },
    caster2: { name: '', info: '' },
    guest1: { name: '', info: '' },
    guest2: { name: '', info: '' },
    matchCount: '1',
    matches: {
      '1': { ...makeDefaultMatch(), format: 'ft2', details: '' },
      '2': { ...makeDefaultMatch(), format: 'ft2', details: '' },
      '3': { ...makeDefaultMatch(), format: 'ft2', details: '' },
    },
    owBans: {},
  };
}

// ---------------------------------------------------------------------------
// Score / state computation (ported from backend compute_match_scores)
// ---------------------------------------------------------------------------

export function computeMatchScores(matchData) {
  const fmt = matchData.format;
  const totalMaps = 5;
  const winners = [];
  const mapdone = [];

  for (let i = 1; i <= totalMaps; i++) {
    const m = matchData.maps[`map${i}`];
    const t1 = parseInt(m.t1, 10) || 0;
    const t2 = parseInt(m.t2, 10) || 0;
    if (t1 > t2) winners.push(1);
    else if (t2 > t1) winners.push(2);
    else winners.push(0);
    mapdone.push(m.done ? 1 : 0);
  }

  // Determine map states based on format
  if (fmt === 'ft1') {
    matchData.maps.map1.state = mapdone[0] === 0 ? 'up next' : 'done';
  } else if (fmt === 'ft2') {
    for (let i = 0; i < 3; i++) {
      if (mapdone[i] === 0) {
        matchData.maps[`map${i + 1}`].state = 'up next';
        for (let j = i + 1; j < 3; j++) matchData.maps[`map${j + 1}`].state = 'unplayed';
        for (let j = 3; j < totalMaps; j++) matchData.maps[`map${j + 1}`].state = 'unplayed';
        break;
      } else {
        matchData.maps[`map${i + 1}`].state = 'done';
      }
    }
  } else if (fmt === 'ft3') {
    for (let i = 0; i < totalMaps; i++) {
      if (mapdone[i] === 0) {
        matchData.maps[`map${i + 1}`].state = 'up next';
        for (let j = i + 1; j < totalMaps; j++) matchData.maps[`map${j + 1}`].state = 'unplayed';
        break;
      } else {
        matchData.maps[`map${i + 1}`].state = 'done';
      }
    }
  }

  // Count wins
  const numMaps = { ft1: 1, ft2: 3, ft3: 5 }[fmt] || 3;
  let count1 = 0;
  let count2 = 0;
  for (let i = 0; i < numMaps; i++) {
    if (winners[i] === 1 && mapdone[i] === 1) count1++;
    if (winners[i] === 2 && mapdone[i] === 1) count2++;
  }
  matchData.t1TotalScore = count1;
  matchData.t2TotalScore = count2;

  // Determine winner
  const mapDoneKey = { ft1: 0, ft2: 2, ft3: 4 }[fmt] ?? 2;
  if (mapdone[mapDoneKey] === 1) {
    if (count1 > count2) matchData.winner = 't1';
    else if (count2 > count1) matchData.winner = 't2';
    else matchData.winner = 'none';
  } else {
    matchData.winner = 'none';
  }
}

// ---------------------------------------------------------------------------
// Read / write helpers
// ---------------------------------------------------------------------------

export function getState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all expected keys exist (defensive merge with defaults)
      const def = makeDefaultState();
      return { ...def, ...parsed, matches: { ...def.matches, ...parsed.matches } };
    }
  } catch (e) {
    console.warn('[localStore] Could not read state:', e);
  }
  return makeDefaultState();
}

function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[localStore] Could not save state:', e);
  }
  return state;
}

// ---------------------------------------------------------------------------
// Mutation helpers (mirror the old API endpoints)
// ---------------------------------------------------------------------------

export function updateMode({ game, currMatch }) {
  const s = getState();
  s.game = game;
  s.currMatch = currMatch;
  return saveState(s);
}

export function updateGeneralInfo(data) {
  const s = getState();
  s.streamTitle = data.streamTitle;
  s.subtitle = data.subtitle;
  s.caster1 = { name: data.caster1Name, info: data.caster1Info };
  s.caster2 = { name: data.caster2Name, info: data.caster2Info };
  s.guest1 = { name: data.guest1Name, info: data.guest1Info };
  s.guest2 = { name: data.guest2Name, info: data.guest2Info };
  return saveState(s);
}

export function updateSchedule(data) {
  const s = getState();
  s.matchCount = data.matchCount;
  s.matches['1'].format = data.match1Format;
  s.matches['1'].details = data.match1Details;
  s.matches['2'].format = data.match2Format;
  s.matches['2'].details = data.match2Details;
  s.matches['3'].format = data.match3Format;
  s.matches['3'].details = data.match3Details;
  return saveState(s);
}

export function updateMatch(matchNumber, data) {
  const s = getState();
  if (!s.matches[matchNumber]) return s;

  const match = s.matches[matchNumber];
  match.team1.name = data.team1Name;
  match.team1.logo = data.team1Logo;
  match.team2.name = data.team2Name;
  match.team2.logo = data.team2Logo;

  for (const [key, player] of Object.entries(data.players || {})) {
    match.players[key] = { ...match.players[key], ...player };
  }
  for (const [key, mapData] of Object.entries(data.maps || {})) {
    const prevState = match.maps[key]?.state || 'unplayed';
    match.maps[key] = { ...mapData, state: prevState };
  }

  computeMatchScores(match);
  return saveState(s);
}

export function swapTeams(matchNumber) {
  const s = getState();
  if (!s.matches[matchNumber]) return s;

  const match = s.matches[matchNumber];
  // Swap team names and logos
  [match.team1, match.team2] = [match.team2, match.team1];

  // Swap players: p1-p5 <-> p6-p10
  const players = match.players;
  for (let i = 1; i <= 5; i++) {
    [players[`p${i}`], players[`p${i + 5}`]] = [players[`p${i + 5}`], players[`p${i}`]];
  }
  // Swap p11 <-> p12
  if (players.p11 && players.p12) {
    [players.p11, players.p12] = [players.p12, players.p11];
  }

  // Swap map scores
  for (let i = 1; i <= 5; i++) {
    const m = match.maps[`map${i}`];
    [m.t1, m.t2] = [m.t2, m.t1];
  }

  computeMatchScores(match);
  return saveState(s);
}

export function clearMatch(matchNumber) {
  const s = getState();
  if (!s.matches[matchNumber]) return s;

  const fmt = s.matches[matchNumber].format;
  const details = s.matches[matchNumber].details;
  s.matches[matchNumber] = { ...makeDefaultMatch(), format: fmt, details };
  return saveState(s);
}

export function updateOwBan(hero, team) {
  const s = getState();
  if (team == null) {
    delete s.owBans[hero];
  } else {
    s.owBans[hero] = team;
  }
  return saveState(s);
}

export function resetState() {
  return saveState(makeDefaultState());
}

export function restoreState(data) {
  const def = makeDefaultState();
  const merged = { ...def, ...data };
  // Recompute scores for all matches
  for (const mn of Object.keys(merged.matches)) {
    computeMatchScores(merged.matches[mn]);
  }
  return saveState(merged);
}
