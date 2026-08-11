import { setStylePreset } from '../../api';

/**
 * Lets the user pick which overlay style preset is active (fonts, per-preset
 * assets, and — in the future — per-preset position overrides).
 * Preset definitions come from the backend (/api/style-presets); adding a
 * new preset there and to index.css/asset folders is all that's needed to
 * extend this list.
 */
export default function StyleTab({ state, stylePresets, onUpdate }) {
  const activeId = state.stylePreset || stylePresets.default;
  const presets = Object.values(stylePresets.presets);

  const handleSelect = (presetId) => {
    setStylePreset(presetId);
    onUpdate();
  };

  return (
    <div className="text-sm">
      <p className="text-gray-400 mb-4">
        Choose the overlay styling preset. This controls fonts and themed assets
        (e.g. caster/interview cam boxes) used across all overlays.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelect(preset.id)}
            className={`px-4 py-3 rounded-lg border text-left transition-colors ${
              activeId === preset.id
                ? 'bg-blue-500 border-blue-400 text-white'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white'
            }`}
          >
            <div className="font-semibold">{preset.label}</div>
            <div className="text-xs text-gray-300 mt-1">{preset.id}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
