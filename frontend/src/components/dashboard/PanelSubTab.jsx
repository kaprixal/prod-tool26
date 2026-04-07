import { useState, useEffect } from 'react';
import { updatePanelInfo } from '../../api';

const COUNTS = [2, 3, 4, 5, 6];

function makeEmpty(count) {
  return Object.fromEntries(
    Array.from({ length: count }, (_, i) => [`p${i + 1}`, { name: '', pronouns: '' }])
  );
}

export default function PanelSubTab({ state, onUpdate }) {
  const [count, setCount] = useState(2);
  const [form, setForm] = useState(makeEmpty(2));

  useEffect(() => {
    const saved = state?.panelists?.[String(count)];
    setForm(saved ? { ...makeEmpty(count), ...saved } : makeEmpty(count));
  }, [state, count]);

  const handleChange = (key, field) => (e) => {
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], [field]: e.target.value } }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePanelInfo(count, form);
    onUpdate();
  };

  const handleClear = () => {
    const empty = makeEmpty(count);
    setForm(empty);
    updatePanelInfo(count, empty);
    onUpdate();
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Panel count selector */}
      <div className="mb-3 p-2 bg-gray-700 rounded-lg">
        <h2 className="mb-2 text-gray-400">PANEL SIZE</h2>
        <div className="flex gap-2">
          {COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              className={`px-3 py-1 rounded transition-colors ${
                count === n ? 'bg-blue-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
              }`}
              onClick={() => setCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Panelist fields */}
      <div className="mb-2 p-2 bg-gray-700 rounded-lg">
        <h2 className="mb-2 text-gray-400">PANELISTS ({count})</h2>
        <div className="space-y-3">
          {Array.from({ length: count }, (_, i) => {
            const key = `p${i + 1}`;
            return (
              <div key={key} className="space-y-1">
                <p className="text-gray-400 text-xs">Panelist #{i + 1}</p>
                <div className="flex flex-row items-center">
                  <label className="pr-3 w-24 text-right text-xs">Name</label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 h-6 rounded-md p-1"
                    placeholder={`Panelist ${i + 1} Name`}
                    value={form[key]?.name || ''}
                    onChange={handleChange(key, 'name')}
                  />
                </div>
                <div className="flex flex-row items-center">
                  <label className="pr-3 w-24 text-right text-xs">Pronouns</label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 h-6 rounded-md p-1"
                    placeholder={`they/them`}
                    value={form[key]?.pronouns || ''}
                    onChange={handleChange(key, 'pronouns')}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button
          type="button"
          className="w-10 h-10 bg-gray-700 hover:bg-red-500 rounded-full flex items-center justify-center"
          onClick={handleClear}
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
