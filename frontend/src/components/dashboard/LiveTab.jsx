import { useState } from 'react';
import MatchPanel from './MatchPanel';

export default function LiveTab({ state, gameData, onUpdate }) {
  const [activeMatch, setActiveMatch] = useState('1');

  return (
    <>
      {/* Match sub-tabs */}
      <div className="flex flex-row w-full border-b border-blue-500 mb-3">
        {['1', '2', '3'].map((n) => (
          <button
            key={n}
            className={`px-4 py-1 rounded-t-lg transition-colors ${
              activeMatch === n
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            onClick={() => setActiveMatch(n)}
          >
            Match {n}
          </button>
        ))}
      </div>

      <MatchPanel
        matchNumber={activeMatch}
        matchData={state.matches?.[activeMatch]}
        game={state.game}
        gameData={gameData}
        onUpdate={onUpdate}
      />
    </>
  );
}
