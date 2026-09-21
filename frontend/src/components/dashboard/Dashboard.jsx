import { useState, useEffect } from 'react';
import { fetchState, fetchGameData, fetchStylePresets } from '../../api';
import GeneralTab from './GeneralTab';
import LiveTab from './LiveTab';
import StyleTab from './StyleTab';

const TABS = ['GENERAL', 'LIVE', 'STYLE'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [state, setState] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [stylePresets, setStylePresets] = useState(null);

  useEffect(() => {
    // State is now read from localStorage (synchronous)
    setState(fetchState());
    fetchGameData().then(setGameData);
    fetchStylePresets().then(setStylePresets);
  }, []);

  /** Re-read state from localStorage after any mutation */
  const loadState = () => {
    setState(fetchState());
  };

  if (!state || !gameData || !stylePresets) {
    return (
      <div className="bg-gray-900 flex items-center justify-center h-screen text-gray-200">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 flex items-center justify-center min-h-screen py-4">
      <div className="w-full max-w-2xl bg-gray-800 p-6 text-gray-200" style={{ minHeight: '700px' }}>
        {/* Top Tabs */}
        <div className="grid grid-cols-3 border-b border-blue-500 mb-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-1 rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'GENERAL' && (
          <GeneralTab state={state} gameData={gameData} onUpdate={loadState} />
        )}
        {activeTab === 'LIVE' && (
          <LiveTab state={state} gameData={gameData} onUpdate={loadState} />
        )}
        {activeTab === 'STYLE' && (
          <StyleTab state={state} stylePresets={stylePresets} onUpdate={loadState} />
        )}
      </div>
    </div>
  );
}
