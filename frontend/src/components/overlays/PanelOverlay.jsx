import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';
import Slideshow from './Slideshow';

const slideshowModules = import.meta.glob(
  './assets/sponsor_slideshow_ingame/*.{png,jpg,jpeg,webp,gif}',
  { eager: true }
);
const SLIDESHOW_IMGS = Object.values(slideshowModules).map((m) => m.default);

const SLIDESHOW_CONFIG = {
  '2': { top: 808, left: 73, width: 440, height: 100 },
  '3': { top: 808, left: 73, width: 440, height: 100 },
  '4': { top: 930, left: 90, width: 440, height: 110 },
  '5':  { top: 910, left: 50, width: 440, height: 120 },
  '6':  { top: 914, left: 50, width: 440, height: 120 },
};

/**
 * Panel overlay – shows panelist names over the panel background image.
 * count: 2 | 3 | 4 | 5 | 6
 * variant: 'standard' | 'rankdle'
 */

// Pixel positions matching the legacy CIE2024 HTML files exactly.
// Each entry: { top, left?, right?, width?, height? }
const POSITIONS = {
  '2-standard': [
    { top: 657, left: 329 },
    { top: 657, right: 329 },
  ],
  '2-rankdle': [
    { top: 415, left: 1230.85, width: 332, height: 40 },
    { top: 786, left: 1230.85, width: 332, height: 40 },
  ],
  '3-standard': [
    { top: 648, left: 187 },
    { top: 648, left: 768 },
    { top: 648, right: 187 },
  ],
  '3-rankdle': [
    { top: 302, left: 1331, width: 332, height: 40 },
    { top: 547, left: 1331, width: 332, height: 40 },
    { top: 800, left: 1331, width: 332, height: 40 },
  ],
  '4-standard': [
    { top: 406, left: 429 },
    { top: 406, right: 429 },
    { top: 785, left: 429 },
    { top: 785, right: 429 },
  ],
  '4-rankdle': [
    { top: 302, left: 1331, width: 332, height: 40 },
    { top: 415, left: 1331, width: 332, height: 40 },
    { top: 547, left: 1331, width: 332, height: 40 },
    { top: 786, left: 1331, width: 332, height: 40 },
  ],
  '5-standard': [
    { top: 408, left: 205 },
    { top: 408, left: 789 },
    { top: 408, right: 205 },
    { top: 757, left: 497 },
    { top: 756, right: 497 },
  ],
  '5-rankdle': [
    { top: 302, left: 1331, width: 332, height: 40 },
    { top: 415, left: 1331, width: 332, height: 40 },
    { top: 547, left: 1331, width: 332, height: 40 },
    { top: 670, left: 1331, width: 332, height: 40 },
    { top: 786, left: 1331, width: 332, height: 40 },
  ],
  '6-standard': [
    { top: 411, left: 205 },
    { top: 411, left: 789 },
    { top: 411, right: 205 },
    { top: 755, left: 205 },
    { top: 755, left: 789 },
    { top: 755, right: 205 },
  ],
  '6-rankdle': [
    { top: 302, left: 1331, width: 332, height: 40 },
    { top: 415, left: 1331, width: 332, height: 40 },
    { top: 547, left: 1331, width: 332, height: 40 },
    { top: 670, left: 1331, width: 332, height: 40 },
    { top: 786, left: 1331, width: 332, height: 40 },
    { top: 916, left: 1331, width: 332, height: 40 },
  ],
};

// Stream title positions for rankdle variant
const RANKDLE_TITLE_TOP = {
  '2': 916,
  '3': 916,
  '4': 916,
  '5': 916,
  '6': 1040,
};

// Standard title default (no override — uses CSS class positioning)
const STANDARD_TITLE_OVERRIDES = {
  '4': { width: 1287, top: 900, left: 560 },
  '5': { width: 1287, top: 890, left: 560 },
  '6': { width: 1287, top: 900, left: 560 },
};

export default function PanelOverlay({ count, variant = 'standard' }) {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const key = `${count}-${variant}`;
  const positions = POSITIONS[key] || [];
  const panelists = state.panelists?.[String(count)] || {};
  const streamTitle = state.streamTitle || '';
  const subtitle = state.subtitle || '';

  const imgSrc = variant === 'rankdle'
    ? asset(`/assets/panels/${count}_rankdle.png`)
    : asset(`/assets/panels/${count}.png`);

  const labelClass = count >= 5 ? 'panel_label5' : 'panel_label';

  // Stream title: rankdle has a specific top position; standard 4/5/6 override width/top/left;
  // standard 2/3 rely entirely on the .panel-streamtitle CSS class positioning.
  const titleInlineStyle = variant === 'rankdle'
    ? {
        top: RANKDLE_TITLE_TOP[String(count)] || 916,
        left: 0,
        width: '100%',
        height: 60,
        position: 'absolute',
        zIndex: 3,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    : STANDARD_TITLE_OVERRIDES[String(count)]
    ? {
        width: STANDARD_TITLE_OVERRIDES[String(count)].width,
        height: STANDARD_TITLE_OVERRIDES[String(count)].height,
        top: STANDARD_TITLE_OVERRIDES[String(count)].top,
        left: STANDARD_TITLE_OVERRIDES[String(count)].left,
        position: 'absolute',
        zIndex: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
      }
    : undefined; // fallback: .panel-streamtitle CSS class handles position for 2/3-panel

  const subtitleInlineStyle = variant === 'rankdle'
    ? {
        top: (RANKDLE_TITLE_TOP[String(count)] || 916) + 60,
        left: 0,
        width: '100%',
        height: 40,
        position: 'absolute',
        zIndex: 3,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    : STANDARD_TITLE_OVERRIDES[String(count)]
    ? {
        width: STANDARD_TITLE_OVERRIDES[String(count)].width,
        height: 60,
        top: STANDARD_TITLE_OVERRIDES[String(count)].top + (STANDARD_TITLE_OVERRIDES[String(count)].height ?? 80),
        left: STANDARD_TITLE_OVERRIDES[String(count)].left,
        position: 'absolute',
        zIndex: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
      }
    : undefined; // fallback: .panel-subtitle CSS class handles position for 2/3-panel

  return (
    <div className="stack-container">
      <img className="stacked-image" src={imgSrc} alt="" />

      {positions.map((pos, i) => {
        const pKey = `p${i + 1}`;
        const name = panelists[pKey]?.name || '';
        const pronouns = panelists[pKey]?.pronouns ? ` (${panelists[pKey].pronouns})` : '';
        return (
          <div
            key={pKey}
            className={`${labelClass} font-built-bold text-xl`}
            style={{
              position: 'absolute',
              zIndex: 3,
              top: pos.top,
              ...(pos.left !== undefined ? { left: pos.left } : {}),
              ...(pos.right !== undefined ? { right: pos.right } : {}),
              ...(pos.width !== undefined ? { width: pos.width } : {}),
              ...(pos.height !== undefined ? { height: pos.height } : {}),
            }}
          >
            {name}{pronouns}
          </div>
        );
      })}

      <div
        className="panel-streamtitle font-built-bold text-4xl"
        style={titleInlineStyle}
      >
        {streamTitle}
      </div>

      <div
        className="panel-subtitle font-built-bold text-2xl"
        style={subtitleInlineStyle}
      >
        {subtitle}
      </div>
      {/* Sponsor slideshow — position/size configured per game above */}
            {SLIDESHOW_CONFIG[String(count)] && (
              <Slideshow images={SLIDESHOW_IMGS} {...SLIDESHOW_CONFIG[String(count)]} />
            )}
    </div>
  );
}
