import { useState, useEffect } from 'react';
import { updateMode } from '../../api';

export default function ModeTab({ state, onUpdate }) {
  const [game, setGame] = useState(state.game || '');
  const [currMatch, setCurrMatch] = useState(state.currMatch || '1');

  useEffect(() => {
    setGame(state.game || '');
    setCurrMatch(state.currMatch || '1');
  }, [state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMode({ game, currMatch });
    onUpdate();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-2 p-2 bg-gray-700 rounded-lg">
        <h2 className="mb-2 text-gray-400">BROADCAST MODE</h2>
        <div className="space-y-2">
          <div className="flex flex-row items-center">
            <label className="pr-3 w-40 text-right">Game</label>
            <select
              className="w-full bg-gray-800 h-6 rounded-md"
              value={game}
              onChange={(e) => setGame(e.target.value)}
            >
              <option value="">Choose a game</option>
              <option value="ow2">Overwatch 2</option>
              <option value="lol">League of Legends</option>
              <option value="val">Valorant</option>
              <option value="mr">Marvel Rivals</option>
            </select>
          </div>
          <div className="flex flex-row items-center">
            <label className="pr-3 w-40 text-right">Current Match</label>
            <select
              className="w-full bg-gray-800 h-6 rounded-md"
              value={currMatch}
              onChange={(e) => setCurrMatch(e.target.value)}
            >
              <option value="">Choose Current Match</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button
          type="button"
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
