import { useState, useEffect } from 'react';
import { updateSchedule } from '../../api';

export default function ScheduleSubTab({ state, onUpdate }) {
  const [matchCount, setMatchCount] = useState(state.matchCount || '1');
  const [formats, setFormats] = useState({
    match1Format: state.matches?.['1']?.format || 'ft2',
    match1Details: state.matches?.['1']?.details || '',
    match2Format: state.matches?.['2']?.format || 'ft2',
    match2Details: state.matches?.['2']?.details || '',
    match3Format: state.matches?.['3']?.format || 'ft2',
    match3Details: state.matches?.['3']?.details || '',
  });

  useEffect(() => {
    setMatchCount(state.matchCount || '1');
    setFormats({
      match1Format: state.matches?.['1']?.format || 'ft2',
      match1Details: state.matches?.['1']?.details || '',
      match2Format: state.matches?.['2']?.format || 'ft2',
      match2Details: state.matches?.['2']?.details || '',
      match3Format: state.matches?.['3']?.format || 'ft2',
      match3Details: state.matches?.['3']?.details || '',
    });
  }, [state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateSchedule({ matchCount, ...formats });
    onUpdate();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 pl-4 pr-4 pt-1 border-2 border-gray-900 rounded-lg">
        <div className="space-y-2">
          <div className="flex flex-row items-center">
            <label className="pr-5 text-left">Match Count</label>
            <div>
              {['1', '2', '3'].map((val) => (
                <label key={val} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="match-count"
                    value={val}
                    checked={matchCount === val}
                    onChange={(e) => setMatchCount(e.target.value)}
                    className="form-radio text-blue-500"
                  />
                  <span className="m-2">{val}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {[1, 2, 3].map((n) => (
        <div key={n} className="mb-4 p-4 bg-gray-700 rounded-lg">
          <h2 className="mb-2 text-gray-400">Match {n}</h2>
          <div className="space-y-2">
            <div className="flex flex-row items-center">
              <label className="pr-3 w-40 text-right">Series Format</label>
              <select
                className="w-full bg-gray-800 h-6 rounded-md"
                value={formats[`match${n}Format`]}
                onChange={(e) =>
                  setFormats((prev) => ({ ...prev, [`match${n}Format`]: e.target.value }))
                }
              >
                <option value="">Select an option</option>
                <option value="ft1">Best of 1</option>
                <option value="ft2">Best of 3</option>
                <option value="ft3">Best of 5</option>
              </select>
            </div>
            <div className="flex flex-row items-center">
              <label className="pr-3 w-40 text-right">Match Details</label>
              <input
                type="text"
                className="w-full bg-gray-800 h-6 rounded-md p-1"
                value={formats[`match${n}Details`]}
                onChange={(e) =>
                  setFormats((prev) => ({ ...prev, [`match${n}Details`]: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      ))}

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
