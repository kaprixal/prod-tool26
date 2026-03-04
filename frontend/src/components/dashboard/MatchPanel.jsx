import { useState, useEffect } from 'react';
import { updateMatch, swapTeams, clearMatch } from '../../api';

/* ── Shared styles ── */
const INPUT = 'flex-1 min-w-0 w-16 bg-gray-800 h-6 rounded-md p-1';
const SELECT_SM = 'w-12 shrink-0 bg-gray-800 h-5 rounded-md text-xs truncate';
const SELECT_SM_ALT = 'w-10 shrink-0 bg-gray-700 h-5 rounded-md text-xs truncate';

/* ── Game-data helpers ── */
const toOpts = (arr = []) => arr.map((v) => ({ name: v, value: v }));

function getCharOptions(game, gd) {
  if (!gd?.[game]) return [];
  if (game === 'lol') return gd.lol.champions || [];
  const key = { ow2: 'heroes', val: 'agents', mr: 'heroes', dl: 'heroes' }[game];
  return key ? toOpts(gd[game][key]) : [];
}

const getList = (field) => (game, gd) => gd?.[game]?.[field] || [];
const getRoleOptions = getList('roles');
const getMapOptions = getList('maps');
const getMapTypeOptions = (game, gd) => (game === 'ow2' ? gd?.ow2?.mapTypes || [] : []);

/* ── Sub-components ── */
function LabeledInput({ label, ...props }) {
  return (
    <div className="flex flex-row items-center">
      <label className="pr-3 w-20 text-right text-xs">{label}</label>
      <input className={INPUT} {...props} />
    </div>
  );
}

function PlayerRow({ player, showChars, showRoles, charOptions, roleOptions, onChange }) {
  return (
    <div className="flex flex-row items-center gap-1">
      <input
        type="text"
        className={INPUT}
        placeholder={player.placeholder}
        value={player.name}
        onChange={(e) => onChange('name', e.target.value)}
      />
      {showChars && (
        <select className={SELECT_SM} value={player.character} onChange={(e) => onChange('character', e.target.value)}>
          {charOptions.map((opt) => {
            const v = typeof opt === 'string' ? opt : opt.value;
            return <option key={v} value={v}>{typeof opt === 'string' ? opt : opt.name}</option>;
          })}
        </select>
      )}
      {showRoles && (
        <select className={SELECT_SM_ALT} value={player.role} onChange={(e) => onChange('role', e.target.value)}>
          {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      )}
    </div>
  );
}

function TeamSection({ label, teamName, teamLogo, onNameChange, onLogoChange, playerKeys, players, showPlayer6, p6Key, showChars, showRoles, charOptions, roleOptions, onPlayerChange }) {
  return (
    <div className="mb-2 p-2 bg-gray-900 rounded-lg flex-1">
      <h2 className="mb-2 text-gray-400">{label}</h2>
      <div className="space-y-2">
        <LabeledInput label="Team" type="text" placeholder={`${label} Name`} value={teamName} onChange={(e) => onNameChange(e.target.value)} />
        <LabeledInput label="Logo" type="text" placeholder={`${label} Logo Link`} value={teamLogo} onChange={(e) => onLogoChange(e.target.value)} />
        {playerKeys.map(({ key, placeholder }) => (
          <PlayerRow
            key={key}
            player={{ ...(players[key] || { name: '', character: '+', role: '+' }), placeholder }}
            showChars={showChars} showRoles={showRoles} charOptions={charOptions} roleOptions={roleOptions}
            onChange={(field, val) => onPlayerChange(key, field, val)}
          />
        ))}
        {showPlayer6 && (
          <PlayerRow
            key={p6Key}
            player={{ ...(players[p6Key] || { name: '', character: '+', role: '+' }), placeholder: 'P6 IGN' }}
            showChars={showChars} showRoles={showRoles} charOptions={charOptions} roleOptions={roleOptions}
            onChange={(field, val) => onPlayerChange(p6Key, field, val)}
          />
        )}
      </div>
    </div>
  );
}

function MapColumn({ index, mapData, showMapType, showMapName, mapTypeOptions, mapOptions, onUpdate }) {
  const mapKey = `map${index}`;
  const data = mapData[mapKey] || { type: '+', name: '+', t1: '', t2: '', done: false };
  return (
    <div className="flex flex-col items-center px-1">
      <label className="text-xs">Map {index}</label>
      {showMapType && (
        <select className="w-20 bg-gray-800 h-6 rounded-md text-xs" value={data.type} onChange={(e) => onUpdate(mapKey, 'type', e.target.value)}>
          {mapTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      {showMapName && (
        <select className="w-24 bg-gray-800 h-6 rounded-md text-xs" value={data.name} onChange={(e) => onUpdate(mapKey, 'name', e.target.value)}>
          {mapOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      )}
      <div className="flex flex-row items-center gap-1">
        <input type="text" className="w-10 bg-gray-800 h-6 rounded-md text-center text-xs" value={data.t1} onChange={(e) => onUpdate(mapKey, 't1', e.target.value)} />
        <span>:</span>
        <input type="text" className="w-10 bg-gray-800 h-6 rounded-md text-center text-xs" value={data.t2} onChange={(e) => onUpdate(mapKey, 't2', e.target.value)} />
      </div>
      <label className="text-xs mt-1">Done?</label>
      <input type="checkbox" className="w-4 h-4" checked={data.done || false} onChange={(e) => onUpdate(mapKey, 'done', e.target.checked)} />
    </div>
  );
}

/* ── Main component ── */
export default function MatchPanel({ matchNumber, matchData, game, gameData, onUpdate }) {
  const [selectedGame, setSelectedGame] = useState(game || '');
  const [team1Name, setTeam1Name] = useState('');
  const [team1Logo, setTeam1Logo] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [team2Logo, setTeam2Logo] = useState('');
  const [players, setPlayers] = useState({});
  const [maps, setMaps] = useState({});

  const activeGame = selectedGame;
  const showChars = ['lol', 'ow2', 'val', 'mr', 'dl'].includes(activeGame);
  const showRoles = showChars;
  const showPlayer6 = activeGame === 'mr' || activeGame === 'dl';
  const showMapType = activeGame === 'ow2';
  const showMapName = ['ow2', 'val', 'mr'].includes(activeGame);
  const showMaps = ['ow2', 'val', 'mr', 'lol', 'dl'].includes(activeGame);

  const charOptions = getCharOptions(activeGame, gameData);
  const roleOptions = getRoleOptions(activeGame, gameData);
  const mapOptions = getMapOptions(activeGame, gameData);
  const mapTypeOptions = getMapTypeOptions(activeGame, gameData);

  useEffect(() => {
    if (!matchData) return;
    setSelectedGame(matchData.game || game || '');
    setTeam1Name(matchData.team1?.name || '');
    setTeam1Logo(matchData.team1?.logo || '');
    setTeam2Name(matchData.team2?.name || '');
    setTeam2Logo(matchData.team2?.logo || '');
    setPlayers(matchData.players || {});
    setMaps(matchData.maps || {});
  }, [matchData, matchNumber]);

  const updatePlayer = (key, field, value) =>
    setPlayers((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const updateMap = (key, field, value) =>
    setMaps((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMatch(matchNumber, { game: selectedGame, team1Name, team1Logo, team2Name, team2Logo, players, maps });
    onUpdate();
  };

  const handleSwap = async () => { await swapTeams(matchNumber); onUpdate(); };
  const handleClear = async () => { await clearMatch(matchNumber); onUpdate(); };

  /* Player key lists for each team */
  const team1Players = [1, 2, 3, 4, 5].map((i) => ({ key: `p${i}`, placeholder: `P${i} IGN` }));
  const team2Players = [6, 7, 8, 9, 10].map((i) => ({ key: `p${i}`, placeholder: `P${i - 5} IGN` }));

  return (
    <form onSubmit={handleSubmit} className="text-sm">
      {/* Game selector */}
      <div className="mb-2 p-2 bg-gray-700 rounded-lg">
        <div className="flex flex-row items-center">
          <label className="pr-3 w-20 text-right text-xs">Game</label>
          <select
            className="w-full bg-gray-800 h-6 rounded-md"
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
          >
            <option value="">Choose a game</option>
            <option value="ow2">Overwatch 2</option>
            <option value="lol">League of Legends</option>
            <option value="val">Valorant</option>
            <option value="mr">Marvel Rivals</option>
            <option value="dl">Deadlock</option>
          </select>
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <TeamSection
          label="Team 1"
          teamName={team1Name} teamLogo={team1Logo}
          onNameChange={setTeam1Name} onLogoChange={setTeam1Logo}
          playerKeys={team1Players} players={players}
          showPlayer6={showPlayer6} p6Key="p11"
          showChars={showChars} showRoles={showRoles} charOptions={charOptions} roleOptions={roleOptions}
          onPlayerChange={updatePlayer}
        />
        <TeamSection
          label="Team 2"
          teamName={team2Name} teamLogo={team2Logo}
          onNameChange={setTeam2Name} onLogoChange={setTeam2Logo}
          playerKeys={team2Players} players={players}
          showPlayer6={showPlayer6} p6Key="p12"
          showChars={showChars} showRoles={showRoles} charOptions={charOptions} roleOptions={roleOptions}
          onPlayerChange={updatePlayer}
        />
      </div>

      <button type="button" onClick={handleSwap} className="bg-gray-500 hover:bg-gray-400 px-6 py-2 rounded-lg text-white w-full">
        SWAP
      </button>

      <div className="h-4" />

      {showMaps && (
        <div className="py-2 bg-gray-900 rounded-lg flex flex-row justify-evenly w-full overflow-x-auto">
          {Array.from({ length: (matchData?.format === 'ft3' ? 5 : matchData?.format === 'ft1' ? 1 : 3) }, (_, i) => i + 1).map((i) => (
            <MapColumn
              key={i} index={i} mapData={maps}
              showMapType={showMapType} showMapName={showMapName}
              mapTypeOptions={mapTypeOptions} mapOptions={mapOptions}
              onUpdate={updateMap}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between mt-4">
        <button type="button" onClick={handleClear} className="w-10 h-10 bg-gray-700 hover:bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xl text-gray-200">X</span>
        </button>
        <button type="submit" className="bg-blue-500 hover:bg-blue-400 px-6 py-2 rounded-lg text-white">
          APPLY
        </button>
      </div>
    </form>
  );
}
