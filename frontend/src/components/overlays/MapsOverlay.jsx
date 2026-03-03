import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';

/**
 * Map display overlay – shows map images and states (unplayed / up next / in progress / done).
 * Ported from legacy live/maps.html
 */

/* Pixel-perfect slot positions from legacy CSS */
const SLOT_POSITIONS = {
  bo1: [{ left: 329, width: 1262, height: 701 }],
  bo3: [
    { left: 296, width: 416, height: 701 },
    { left: 753, width: 414, height: 701 },
    { left: 1208, width: 416, height: 701 },
  ],
  bo5: [
    { left: 166, width: 295, height: 701 },
    { left: 489, width: 295, height: 701 },
    { left: 813, width: 295, height: 701 },
    { left: 1136, width: 295, height: 701 },
    { left: 1459, width: 295, height: 701 },
  ],
};

export default function MapsOverlay() {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const game = state.game;
  const cm = state.currMatch || '1';
  const match = state.matches?.[cm];
  if (!match) return null;

  const format = match.format || 'ft2';
  const t1score = match.t1TotalScore ?? 0;
  const t2score = match.t2TotalScore ?? 0;
  const t1logo = match.team1?.logo || '';
  const t2logo = match.team2?.logo || '';
  const maps = match.maps || {};
  const winners = [];
  for (let i = 1; i <= 5; i++) {
    const m = maps[`map${i}`] || {};
    const a = parseInt(m.t1) || 0;
    const b = parseInt(m.t2) || 0;
    winners.push(a > b ? 1 : b > a ? 2 : 0);
  }

  const mapCount = format === 'ft1' ? 1 : format === 'ft2' ? 3 : 5;
  const mapsetSrc = asset(`/assets/maps/map_${format}_box.png`);

  /* Determine CSS class prefix per format */
  const slotClass = format === 'ft1' ? 'bo1' : format === 'ft2' ? 'bo3' : 'bo5';
  const positions = SLOT_POSITIONS[slotClass] || SLOT_POSITIONS.bo3;

  /* Helper to resolve image path per game */
  const resolveMapImg = (m, idx) => {
    const mapName = m.name === '+' ? 'undecided' : m.name;
    const clean = mapName.replace(/[\s:.'-]+/g, '');
    if (game === 'ow2') {
      const src = m.name === '+' ? (m.type || '+') : clean.toUpperCase();
      return asset(`/assets/maps/ow2/${format}/${src}.png`);
    }
    if (game === 'val') {
      return asset(`/assets/maps/val/map_tile_valo_${slotClass}_${clean.toLowerCase()}.png`);
    }
    if (game === 'mr') {
      const suffix = format === 'ft1' ? '5-1' : format === 'ft2' ? '3' : '5';
      return asset(`/assets/maps/rivals/Rivals_Map_${clean}${suffix}.png`);
    }
    return asset('/assets/maps/blank.png');
  };

  /* Map state rendering */
  const renderMapState = (m, idx) => {
    const mapName = m.name === '+' ? 'Undecided' : m.name;
    const scores = `${m.t1 || ''} - ${m.t2 || ''}`;
    const mapState = m.state || 'unplayed';
    const effectiveState = mapState === 'up next' && m.t1 && m.t2 ? 'in progress' : mapState;
    const w = winners[idx];
    const typeIcon = game === 'ow2' && m.type && m.type !== '+' ? asset(`/assets/maps/ow2/ow_icons/modeicon_${m.type.toLowerCase()}.png`) : asset('/assets/maps/blank.png');

    if (effectiveState === 'unplayed') {
      return (
        <div className="unplayed">
          <br /><br />
          <h1 style={{ marginTop: 210, fontSize: 20, height: 100 }}>{mapName}</h1>
          <img className="icon" style={{ marginTop: 135 }} src={typeIcon} alt="" />
        </div>
      );
    }
    if (effectiveState === 'up next') {
      return (
        <div className="upnext">
          <br />
          <h1 style={{ marginTop: 210, fontSize: 20 }}>UP NEXT:</h1>
          <h2 style={{ fontSize: 20, marginTop: 35 }}>{mapName}</h2>
          <img className="icon" src={typeIcon} alt="" />
        </div>
      );
    }
    if (effectiveState === 'in progress') {
      return (
        <div className="ipr">
          <br />
          <h1 style={{ fontSize: 80, marginTop: 210 }}>{scores}</h1>
          <h2>{mapName}</h2>
          <img className="icon" src={typeIcon} alt="" />
        </div>
      );
    }
    if (effectiveState === 'done') {
      const winnerLogo = w === 1 ? t1logo : w === 2 ? t2logo : '';
      const colorClass = w === 1 ? 'done-blue' : w === 2 ? 'done-red' : 'done-draw';
      return (
        <div className={colorClass}>
          <br />
          {winnerLogo && <img className="winner-logo" src={winnerLogo} alt="" />}
          <h1 style={{ fontSize: 80, marginTop: 35 }}>{scores}</h1>
          <h2>{mapName}</h2>
          <img className="icon" src={typeIcon} alt="" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="stack-container text-center">
      {/* Background map set box */}
      <img className="stacked-image" src={mapsetSrc} alt="" />

      {/* Score header */}
      <div id="total-score">
        <div id="match-score" style={{ fontSize: 25, color: '#0D534D' }} className="font-integral-bold">MATCH SCORE</div>
        <br />
        <div id="miniscore" style={{ fontSize: 80, fontWeight: 900 }} className="font-integral-bold">{t1score} - {t2score}</div>
        <img id="logo1" src={t1logo} style={{ height: 136, width: 136 }} alt="" />
        <img id="logo2" src={t2logo} style={{ height: 136, width: 136 }} alt="" />
      </div>

      {/* Map slots */}
      {Array.from({ length: 5 }, (_, idx) => {
        const m = maps[`map${idx + 1}`] || {};
        const visible = idx < mapCount;
        const imgSrc = visible ? resolveMapImg(m, idx) : asset('/assets/maps/blank.png');
        const pos = positions[idx] || positions[0];
        return (
          <div
            key={idx}
            className={`font-integral-regular ${slotClass}`}
            style={
              visible
                ? {
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 30,
                    position: 'absolute',
                    top: 292,
                    left: pos.left,
                    width: pos.width,
                    height: pos.height,
                  }
                : { visibility: 'hidden' }
            }
          >
            <img src={imgSrc} alt="" />
            {visible && renderMapState(m, idx)}
          </div>
        );
      })}
    </div>
  );
}
