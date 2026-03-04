import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';

/**
 * In-game overlay – shows team names, logos, scores, format
 * and map-set display with game-specific styling.
 *
 * Ported from legacy live/overlay.html
 */

/* ---- Pip ID lookup tables matching legacy HTML exactly ---- */
const VAL_BO5_T1 = ['p_1', 'p_2', 'p_3'];
const VAL_BO5_T2 = ['p_4', 'p_5', 'p_6'];
const VAL_BO3_T1 = [
  { id: 'p_7', style: { left: 890 } },
  { id: 'p_8', style: { top: 110, left: 908 } },
];
const VAL_BO3_T2 = [
  { id: 'p_9', style: { right: 890 } },
  { id: 'p_10', style: { top: 110, right: 908 } },
];

const LOL_BO5_T1 = ['s1', 's2', 's3'];
const LOL_BO5_T2 = ['s4', 's5', 's6'];
const LOL_BO3_T1 = [
  { id: 's7', style: { top: 17 } },
  { id: 's8', style: { top: 40 } },
];
const LOL_BO3_T2 = [
  { id: 's9', style: { top: 17 } },
  { id: 's10', style: { top: 40 } },
];

const MR_BO5_T1 = ['mr1', 'mr2', 'mr3'];
const MR_BO5_T2 = ['mr4', 'mr5', 'mr6'];
const MR_BO3_T1 = ['mr7', 'mr8'];
const MR_BO3_T2 = ['mr9', 'mr10'];

/* Render a group of pips/squares with their legacy IDs */
function renderPipGroup(items, filledCount, className) {
  return items.map((item, i) => {
    const id = typeof item === 'string' ? item : item.id;
    const extraStyle = typeof item === 'string' ? {} : item.style;
    return (
      <div
        key={id}
        id={id}
        className={className}
        style={{
          backgroundColor: i < filledCount ? '#fff' : 'black',
          ...extraStyle,
        }}
      />
    );
  });
}

export default function Overlay() {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const game = state.game;
  const cm = state.currMatch || '1';
  const match = state.matches?.[cm];
  if (!match) return null;

  const t1name = match.team1?.name || '';
  const t2name = match.team2?.name || '';
  const t1logo = match.team1?.logo || '';
  const t2logo = match.team2?.logo || '';
  const t1score = match.t1TotalScore ?? 0;
  const t2score = match.t2TotalScore ?? 0;
  const format = match.format || 'ft2';
  const maps = match.maps || {};
  const streamTitle = state.streamTitle || '';

  /* ---- map label helpers (OW / VAL) ---- */
  const mapCount = format === 'ft1' ? 1 : format === 'ft2' ? 3 : 5;
  const mapEntries = [];
  for (let i = 1; i <= mapCount; i++) {
    const m = maps[`map${i}`] || {};
    mapEntries.push({
      name: m.name === '+' ? (m.type === '+' ? 'Undecided' : m.type) : m.name,
      type: m.type || '+',
      state: m.state || 'unplayed',
    });
  }

  const findActiveMapIndex = () => {
    for (let i = 0; i < mapEntries.length; i++) {
      if (mapEntries[i].state === 'in progress' || mapEntries[i].state === 'up next') return i;
    }
    return mapEntries.length - 1;
  };
  const activeIdx = findActiveMapIndex();

  /* ---- Determine overlay image ---- */
  const overlayImgMap = {
    ow2: asset('/assets/in_game_overlay/ingame_ow_main.png'),
    lol: asset('/assets/in_game_overlay/ingame_league_main.png'),
    val: asset('/assets/in_game_overlay/ingame_valo_main.png'),
    mr: asset('/assets/in_game_overlay/ingame_rivals_main.png'),
    dl: asset('/assets/in_game_overlay/ingame_deadlock_main.png'),
  };
  const overlayImg = overlayImgMap[game] || '';

  /* Deadlock: surface player names for overlay */
  const players = match.players || {};

  /* ---- Format text for OW ---- */
  const formatLabel = format === 'ft3' ? 'Best of 5' : format === 'ft2' ? 'Best of 3' : 'Best of 1';

  /* ---- OW map-type icon path ---- */
  const owTypeIcon = (type) =>
    type === '+'
      ? asset('/assets/in_game_overlay/ow_icons/undecided.png')
      : asset(`/assets/in_game_overlay/ow_icons/${type.toLowerCase()}.png`);

  /* ------------ RENDER ------------ */
  return (
    <div className="stack-container font-integral-bold">
      <div style={{ color: 'black' }}>
        {/* Background overlay image */}
        <img className="stacked-image" src={overlayImg} style={{ zIndex: 0 }} alt="" />

        {/* Team logos */}
        <img
          className={`overlay-logo ${game === 'ow2' ? 'ow-overlay-logo1' : game === 'lol' ? 'lol-overlay-logo1' : game === 'val' ? 'val-overlay-logo1' : game === 'mr' ? 'rivals-overlay-logo1' : game === 'dl' ? 'dl-overlay-logo1' : ''}`}
          src={t1logo}
          alt=""
        />
        <img
          className={`overlay-logo ${game === 'ow2' ? 'ow-overlay-logo2' : game === 'lol' ? 'lol-overlay-logo2' : game === 'val' ? 'val-overlay-logo2' : game === 'mr' ? 'rivals-overlay-logo2' : game === 'dl' ? 'dl-overlay-logo2' : ''}`}
          src={t2logo}
          alt=""
        />

        {/* Team names */}
        <div
          className={`font-integral-bold text-white ${game === 'ow2' ? 'ow-overlay-name-1' : game === 'lol' ? 'lol-overlay-name-1' : game === 'val' ? 'val-overlay-name-1' : game === 'mr' ? 'rivals-overlay-name-1' : game === 'dl' ? 'dl-overlay-name-1' : ''}`}
          style={{ zIndex: 2 }}
        >
          {t1name}
        </div>
        <div
          className={`font-integral-bold text-white ${game === 'ow2' ? 'ow-overlay-name-2' : game === 'lol' ? 'lol-overlay-name-2' : game === 'val' ? 'val-overlay-name-2' : game === 'mr' ? 'rivals-overlay-name-2' : game === 'dl' ? 'dl-overlay-name-2' : ''}`}
          style={{ zIndex: 2 }}
        >
          {t2name}
        </div>

        {/* OW scores (only visible for OW) */}
        {game === 'ow2' && (
          <>
            <div className="font-integral-bold ow-overlay-score-1" style={{ zIndex: 2 }}>{t1score}</div>
            <div className="font-integral-bold ow-overlay-score-2" style={{ zIndex: 2 }}>{t2score}</div>
          </>
        )}

        {/* OW format + title */}
        {game === 'ow2' && (
          <>
            <div className="font-integral-bold ow-overlay-format capitalize">{formatLabel}</div>
            <div className="font-integral-bold ow-overlay-title capitalize" style={{ marginTop: 4 }}>{streamTitle}</div>
          </>
        )}

        {/* VAL title */}
        {game === 'val' && (
          <div className="font-integral-bold val-overlay-title capitalize" style={{ marginTop: 4 }}>{streamTitle}</div>
        )}

        {/* ---- Deadlock overlay data ---- */}
        {game === 'dl' && (
          <>
            <div className="font-integral-bold dl-overlay-format capitalize" style={{ zIndex: 2 }}>{formatLabel}</div>
            <div className="dl-overlay-players dl-overlay-players-t1" style={{ zIndex: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="dl-player-name">{players[`p${i}`]?.name || ''}</div>
              ))}
              <div className="dl-player-name">{players['p11']?.name || ''}</div>
            </div>
            <div className="dl-overlay-players dl-overlay-players-t2" style={{ zIndex: 2 }}>
              {[6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="dl-player-name">{players[`p${i}`]?.name || ''}</div>
              ))}
              <div className="dl-player-name">{players['p12']?.name || ''}</div>
            </div>
            <div className="font-integral-bold dl-overlay-score-1" style={{ zIndex: 2 }}>{t1score}</div>
            <div className="font-integral-bold dl-overlay-score-2" style={{ zIndex: 2 }}>{t2score}</div>
          </>
        )}

        {/* ---- LoL Score Pips ---- */}
        {game === 'lol' && format === 'ft2' && (
          <div id="lol-bo3">
            {renderPipGroup(LOL_BO3_T1, t1score, 'lol_square')}
            {renderPipGroup(LOL_BO3_T2, t2score, 'lol_square')}
          </div>
        )}
        {game === 'lol' && format === 'ft3' && (
          <div id="lol-bo5" style={{ zIndex: 10 }}>
            {renderPipGroup(LOL_BO5_T1, t1score, 'lol_square')}
            {renderPipGroup(LOL_BO5_T2, t2score, 'lol_square')}
          </div>
        )}

        {/* ---- MR Score Pips ---- */}
        {game === 'mr' && format === 'ft2' && (
          <div id="mr-bo3">
            {renderPipGroup(MR_BO3_T1, t1score, 'mr_square')}
            {renderPipGroup(MR_BO3_T2, t2score, 'mr_square')}
          </div>
        )}
        {game === 'mr' && format === 'ft3' && (
          <div id="mr-bo5" style={{ zIndex: 10 }}>
            {renderPipGroup(MR_BO5_T1, t1score, 'mr_square')}
            {renderPipGroup(MR_BO5_T2, t2score, 'mr_square')}
          </div>
        )}

        {/* ---- VAL Score Pips ---- */}
        {game === 'val' && format === 'ft2' && (
          <div id="val-bo3">
            {renderPipGroup(VAL_BO3_T1, t1score, 'val_p')}
            {renderPipGroup(VAL_BO3_T2, t2score, 'val_p')}
          </div>
        )}
        {game === 'val' && format === 'ft3' && (
          <div id="val-bo5">
            {renderPipGroup(VAL_BO5_T1, t1score, 'val_p')}
            {renderPipGroup(VAL_BO5_T2, t2score, 'val_p')}
          </div>
        )}

        {/* ---- Map-set labels (OW / VAL) ---- */}
        {(game === 'ow2' || game === 'val') && format !== 'ft1' && (
          <div
            className={`mapset ${
              game === 'ow2'
                ? format === 'ft2' ? 'ow-bo3-mapset' : 'ow-bo5-mapset'
                : format === 'ft2' ? 'val-bo3-mapset' : 'val-bo5-mapset'
            }`}
            style={{ color: 'white', fontSize: format === 'ft2' ? '8px' : undefined }}
          >
            {mapEntries.map((entry, i) => {
              const isActive = i === activeIdx;
              const iconSrc = game === 'ow2'
                ? owTypeIcon(entry.type)
                : asset('/assets/in_game_overlay/ow_icons/undecided.png');
              return (
                <div className="map-label" key={i}>
                  <div className={`font-integral-bold ${isActive ? 'map-on' : 'map-off'}`}>
                    {game === 'ow2' ? (entry.name === '+' ? (entry.type === '+' ? 'Undecided' : entry.type.toUpperCase()) : entry.name.toUpperCase()) : (entry.name === '+' ? 'Undecided' : entry.name.toUpperCase())}
                  </div>
                  <img
                    src={iconSrc}
                    style={{ height: 12, width: 12, opacity: isActive ? 1 : 0.31 }}
                    alt=""
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
