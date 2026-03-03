import { useState } from 'react';
import InfoSubTab from './InfoSubTab';
import ScheduleSubTab from './ScheduleSubTab';

export default function GeneralTab({ state, gameData, onUpdate }) {
  const [subTab, setSubTab] = useState('info');

  return (
    <>
      {/* Sub-tabs */}
      <div className="flex flex-row w-full border-b border-blue-500 mb-3">
        <button
          className={`px-4 py-1 rounded-t-lg transition-colors ${
            subTab === 'info' ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          onClick={() => setSubTab('info')}
        >
          INFO
        </button>
        <button
          className={`px-4 py-1 rounded-t-lg transition-colors ${
            subTab === 'schedule' ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          onClick={() => setSubTab('schedule')}
        >
          SCHEDULE
        </button>
      </div>

      <div className="text-sm">
        {subTab === 'info' && <InfoSubTab state={state} onUpdate={onUpdate} />}
        {subTab === 'schedule' && <ScheduleSubTab state={state} onUpdate={onUpdate} />}
      </div>
    </>
  );
}
