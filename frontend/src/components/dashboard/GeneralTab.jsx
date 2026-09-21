import { useState } from 'react';
import InfoSubTab from './InfoSubTab';
import ScheduleSubTab from './ScheduleSubTab';
import PanelSubTab from './PanelSubTab';

export default function GeneralTab({ state, gameData, onUpdate }) {
  const [subTab, setSubTab] = useState('info');

  const tabs = [
    { key: 'info', label: 'INFO' },
    { key: 'schedule', label: 'SCHEDULE' },
    { key: 'panels', label: 'PANELS' },
  ];

  return (
    <>
      {/* Sub-tabs */}
      <div className="flex flex-row w-full border-b border-blue-500 mb-3">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={`px-4 py-1 rounded-t-lg transition-colors ${
              subTab === key ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            onClick={() => setSubTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-sm">
        {subTab === 'info' && <InfoSubTab state={state} onUpdate={onUpdate} />}
        {subTab === 'schedule' && <ScheduleSubTab state={state} onUpdate={onUpdate} />}
        {subTab === 'panels' && <PanelSubTab state={state} onUpdate={onUpdate} />}
      </div>
    </>
  );
}
