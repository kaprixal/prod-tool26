import { useState, useEffect } from 'react';
import { updateGeneralInfo } from '../../api';

export default function InfoSubTab({ state, onUpdate }) {
  const [form, setForm] = useState({
    streamTitle: '',
    subtitle: '',
    caster1Name: '',
    caster1Info: '',
    caster2Name: '',
    caster2Info: '',
    guest1Name: '',
    guest1Info: '',
    guest2Name: '',
    guest2Info: '',
  });

  useEffect(() => {
    setForm({
      streamTitle: state.streamTitle || '',
      subtitle: state.subtitle || '',
      caster1Name: state.caster1?.name || '',
      caster1Info: state.caster1?.info || '',
      caster2Name: state.caster2?.name || '',
      caster2Info: state.caster2?.info || '',
      guest1Name: state.guest1?.name || '',
      guest1Info: state.guest1?.info || '',
      guest2Name: state.guest2?.name || '',
      guest2Info: state.guest2?.info || '',
    });
  }, [state]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateGeneralInfo(form);
    onUpdate();
  };

  const fields = [
    { section: 'TITLE', items: [
      { label: 'Stream Title', field: 'streamTitle' },
      { label: 'Subtitle', field: 'subtitle' },
    ]},
    { section: 'CASTERS INFO', items: [
      { label: 'Caster #1 Name', field: 'caster1Name' },
      { label: 'Caster #1 Info', field: 'caster1Info' },
      { label: 'Caster #2 Name', field: 'caster2Name' },
      { label: 'Caster #2 Info', field: 'caster2Info' },
    ]},
    { section: 'GUEST INFO', items: [
      { label: 'Guest #1 Name', field: 'guest1Name' },
      { label: 'Guest #1 Info', field: 'guest1Info' },
      { label: 'Guest #2 Name', field: 'guest2Name' },
      { label: 'Guest #2 Info', field: 'guest2Info' },
    ]},
  ];

  return (
    <form onSubmit={handleSubmit}>
      {fields.map(({ section, items }) => (
        <div key={section} className="mb-2 p-2 bg-gray-700 rounded-lg">
          <h2 className="mb-2 text-gray-400">{section}</h2>
          <div className="space-y-2">
            {items.map(({ label, field }) => (
              <div key={field} className="flex flex-row items-center">
                <label className="pr-3 w-40 text-right">{label}</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 h-6 rounded-md p-1"
                  placeholder={label}
                  value={form[field]}
                  onChange={handleChange(field)}
                />
              </div>
            ))}
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
