import { useState, useEffect } from 'react';
import { updateMatch, swapTeams, clearMatch } from '../../api';

/**
 * Get the character/hero options for the current game.
 */
function getCharOptions(game, gameData) {
  if (!gameData || !game) return [];
  switch (game) {
    case 'lol': return gameData.lol?.champions || [];
    case 'ow2': return (gameData.ow2?.heroes || []).map((h) => ({ name: h, value: h }));
    case 'val': return (gameData.val?.agents || []).map((a) => ({ name: a, value: a }));
    case 'mr': return (gameData.mr?.heroes || []).map((h) => ({ name: h, value: h }));
    default: return [];
  }
}

function getRoleOptions(game, gameData) {
  if (!gameData || !game) return [];
  switch (game) {
    case 'lol': return gameData.lol?.roles || [];
    case 'ow2': return gameData.ow2?.roles || [];
    case 'val': return gameData.val?.roles || [];
    case 'mr': return gameData.mr?.roles || [];
    default: return [];
  }
}

function getMapOptions(game, gameData) {
  if (!gameData || !game) return [];
  switch (game) {
    case 'ow2': return gameData.ow2?.maps || [];
    case 'val': return gameData.val?.maps || [];
    case 'mr': return gameData.mr?.maps || [];
    default: return [];
  }
}

function getMapTypeOptions(game, gameData) {
  if (game === 'ow2') return gameData.ow2?.mapTypes || [];
  return [];
}

export default function MatchPanel({ matchNumber, matchData, game, gameData, onUpdate }) {
  const [team1Name, setTeam1Name] = useState('');
  const [team1Logo, setTeam1Logo] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [team2Logo, setTeam2Logo] = useState('');
  const [players, setPlayers] = useState({});
  const [maps, setMaps] = useState({});

  const showMapType = game === 'ow2';
  const showMapName = ['ow2', 'val', 'mr'].includes(game);
  const showChars = ['lol', 'ow2', 'val', 'mr'].includes(game);
  const showRoles = ['lol', 'ow2', 'val', 'mr'].includes(game);
  const showPlayer6 = game === 'mr';

  const charOptions = getCharOptions(game, gameData);
  const roleOptions = getRoleOptions(game, gameData);
  const mapOptions = getMapOptions(game, gameData);
  const mapTypeOptions = getMapTypeOptions(game, gameData);

  useEffect(() => {
    if (!matchData) return;
    setTeam1Name(matchData.team1?.name || '');
    setTeam1Logo(matchData.team1?.logo || '');
    setTeam2Name(matchData.team2?.name || '');
    setTeam2Logo(matchData.team2?.logo || '');
    setPlayers(matchData.players || {});
    setMaps(matchData.maps || {});
  }, [matchData, matchNumber]);

  const updatePlayer = (key, field, value) => {
    setPlayers((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const updateMap = (key, field, value) => {
    setMaps((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: field === 'done' ? value : value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMatch(matchNumber, {
      team1Name,
      team1Logo,
      team2Name,
      team2Logo,
      players,
      maps,
    });
    onUpdate();
  };

  const handleSwap = async () => {
    await swapTeams(matchNumber);
    onUpdate();
  };

  const handleClear = async () => {
    await clearMatch(matchNumber);
    onUpdate();
  };

  const renderPlayerRow = (pKey, placeholder) => {
    const player = players[pKey] || { name: '', character: '+', role: '+' };
    return (
      <div key={pKey} className="flex flex-row items-center gap-1">
        <input
          type="text"
          className="w-full bg-gray-800 h-6 rounded-md p-1"
          placeholder={placeholder}
          value={player.name}
          onChange={(e) => updatePlayer(pKey, 'name', e.target.value)}
        />
        {showChars && (
          <select
            className="w-auto bg-gray-800 h-5 rounded-md text-xs"
            value={player.character}
            onChange={(e) => updatePlayer(pKey, 'character', e.target.value)}
          >
            {charOptions.map((opt) => (
              <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                {typeof opt === 'string' ? opt : opt.name}
              </option>
            ))}
          </select>
        )}
        {showRoles && (
          <select
            className="w-auto bg-gray-700 h-5 rounded-md text-xs"
            value={player.role}
            onChange={(e) => updatePlayer(pKey, 'role', e.target.value)}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="text-sm">
      <div className="flex flex-row gap-2">
        {/* Team 1 */}
        <div className="mb-2 p-2 bg-gray-900 rounded-lg flex-1">
          <h2 className="mb-2 text-gray-400">Team 1</h2>
          <div className="space-y-2">
            <div className="flex flex-row items-center">
              <label className="pr-3 w-20 text-right text-xs">Team</label>
              <input
                type="text"
                className="w-full bg-gray-800 h-6 rounded-md p-1"
                placeholder="Team 1 Name"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
              />
            </div>
            <div className="flex flex-row items-center">
              <label className="pr-3 w-20 text-right text-xs">Logo</label>
              <input
                type="text"
                className="w-full bg-gray-800 h-6 rounded-md p-1"
                placeholder="Team 1 Logo Link"
                value={team1Logo}
                onChange={(e) => setTeam1Logo(e.target.value)}
              />
            </div>
            {[1, 2, 3, 4, 5].map((i) => renderPlayerRow(`p${i}`, `P${i} IGN`))}
            {showPlayer6 && renderPlayerRow('p11', 'P6 IGN')}
          </div>
        </div>

        {/* Team 2 */}
        <div className="mb-2 p-2 bg-gray-900 rounded-lg flex-1">
          <h2 className="mb-2 text-gray-400">Team 2</h2>
          <div className="space-y-2">
            <div className="flex flex-row items-center">
              <label className="pr-3 w-20 text-right text-xs">Team</label>
              <input
                type="text"
                className="w-full bg-gray-800 h-6 rounded-md p-1"
                placeholder="Team 2 Name"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
              />
            </div>
            <div className="flex flex-row items-center">
              <label className="pr-3 w-20 text-right text-xs">Logo</label>
              <input
                type="text"
                className="w-full bg-gray-800 h-6 rounded-md p-1"
                placeholder="Team 2 Logo Link"
                value={team2Logo}
                onChange={(e) => setTeam2Logo(e.target.value)}
              />
            </div>
            {[6, 7, 8, 9, 10].map((i) => renderPlayerRow(`p${i}`, `P${i - 5} IGN`))}
            {showPlayer6 && renderPlayerRow('p12', 'P6 IGN')}
          </div>
        </div>
      </div>

      {/* Swap button */}
      <button
        type="button"
        onClick={handleSwap}
        className="bg-gray-500 hover:bg-gray-400 px-6 py-2 rounded-lg text-white w-full"
      >
        SWAP
      </button>

      <div className="h-4" />

      {/* Maps section */}
      <div className="py-2 bg-gray-900 rounded-lg flex flex-row justify-evenly w-full overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => {
          const mapKey = `map${i}`;
          const mapData = maps[mapKey] || { type: '+', name: '+', t1: '', t2: '', done: false };
          return (
            <div key={i} className="flex flex-col items-center px-1">
              <label className="text-xs">Map {i}</label>
              {showMapType && (
                <select
                  className="w-20 bg-gray-800 h-6 rounded-md text-xs"
                  value={mapData.type}
                  onChange={(e) => updateMap(mapKey, 'type', e.target.value)}
                >
                  {mapTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
              {showMapName && (
                <select
                  className="w-24 bg-gray-800 h-6 rounded-md text-xs"
                  value={mapData.name}
                  onChange={(e) => updateMap(mapKey, 'name', e.target.value)}
                >
                  {mapOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
              <div className="flex flex-row items-center gap-1">
                <input
                  type="text"
                  className="w-10 bg-gray-800 h-6 rounded-md text-center text-xs"
                  value={mapData.t1}
                  onChange={(e) => updateMap(mapKey, 't1', e.target.value)}
                />
                <span>:</span>
                <input
                  type="text"
                  className="w-10 bg-gray-800 h-6 rounded-md text-center text-xs"
                  value={mapData.t2}
                  onChange={(e) => updateMap(mapKey, 't2', e.target.value)}
                />
              </div>
              <label className="text-xs mt-1">Done?</label>
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={mapData.done || false}
                onChange={(e) => updateMap(mapKey, 'done', e.target.checked)}
              />
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={handleClear}
          className="w-10 h-10 bg-gray-700 hover:bg-red-500 rounded-full flex items-center justify-center"
        >
          <span className="text-xl text-gray-200">X</span>
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-400 px-6 py-2 rounded-lg text-white"
        >
          APPLY
        </button>
      </div>
    </form>
  );
}
