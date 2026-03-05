import React from 'react';
import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';

/**
 * Map display overlay – shows map images and states (unplayed / up next / in progress / done).
 * Ported from legacy live/maps.html
 *
 * Legacy renders ALL 9 slots (1 bo1, 3 bo3, 5 bo5) as direct children of the
 * stack-container. Each slot has an <img> and a <div> that share the same
 * absolute position (via CSS IDs), stacked on top of each other. Only the
 * active format's slots get real map images; the rest get blank.png.
 */

/* Per-slot positions exactly from legacy CSS  */
const SLOTS = {
  bo1: [{ left: 329, width: 1262, height: 701, borderRadius: 0 }],
  bo3: [
    { left: 296, width: 416, height: 701, borderRadius: 30 },
    { left: 753, width: 414, height: 701, borderRadius: 30 },
    { left: 1208, width: 416, height: 701, borderRadius: 30 },
  ],
  bo5: [
    { left: 166, width: 295, height: 701, borderRadius: 30 },
    { left: 489, width: 295, height: 701, borderRadius: 30 },
    { left: 813, width: 295, height: 701, borderRadius: 30 },
    { left: 1136, width: 295, height: 701, borderRadius: 30 },
    { left: 1459, width: 295, height: 701, borderRadius: 30 },
  ],
};

const BLANK = '/assets/maps/blank.png';

export default function MapsOverlay() {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const cm = state.currMatch || '1';
  const match = state.matches?.[cm];
  if (!match) return null;

  const game = match.game || '';

  const format = match.format || 'ft2';
  const t1score = match.t1TotalScore ?? 0;
  const t2score = match.t2TotalScore ?? 0;
  const gameLogoMap = { ow2: 'ow', lol: 'lol', val: 'val', mr: 'mr', dl: 'dl' };
  const defaultLogo = asset(`/assets/game_logos/${gameLogoMap[game] || 'blank'}.png`);
  const t1logo = match.team1?.logo || defaultLogo;
  const t2logo = match.team2?.logo || defaultLogo;
  const maps = match.maps || {};

  /* Compute per-map winner (1 = t1, 2 = t2, 0 = draw/none) */
  const winners = [];
  for (let i = 1; i <= 5; i++) {
    const m = maps[`map${i}`] || {};
    const a = parseInt(m.t1) || 0;
    const b = parseInt(m.t2) || 0;
    winners.push(a > b ? 1 : b > a ? 2 : 0);
  }

  /* Active format info */
  const activeKey = format === 'ft1' ? 'bo1' : format === 'ft2' ? 'bo3' : 'bo5';
  const mapCount = format === 'ft1' ? 1 : format === 'ft2' ? 3 : 5;

  /* ---- Image path helpers ---- */
  const resolveMapImg = (m) => {
    const mapName = m.name === '+' ? 'undecided' : m.name;
    const clean = mapName.replace(/[\s:.'-]+/g, '');
    if (game === 'ow2') {
      const src = m.name === '+' ? (m.type || '+') : clean.toUpperCase();
      return asset(`/assets/maps/ow2/${format}/${src}.png`);
    }
    if (game === 'val') {
      return asset(`/assets/maps/val/map_tile_valo_${activeKey}_${clean.toLowerCase()}.png`);
    }
    if (game === 'mr') {
      const suffix = format === 'ft1' ? '5-1' : format === 'ft2' ? '3' : '5';
      return asset(`/assets/maps/rivals/Rivals_Map_${clean}${suffix}.png`);
    }
    return asset(BLANK);
  };

  const typeIcon = (m) =>
    game === 'ow2' && m.type && m.type !== '+'
      ? asset(`/assets/maps/ow2/ow_icons/modeicon_${m.type.toLowerCase()}.png`)
      : asset(BLANK);

  /* ---- State div content (mirrors legacy setDivState) ---- */
  const renderState = (m, idx, pos) => {
    const mapName = m.name === '+' ? 'Undecided' : m.name;
    const scores = `${m.t1 || ''} - ${m.t2 || ''}`;
    let mapState = m.state || 'unplayed';
    if (mapState === 'up next' && m.t1 && m.t2) mapState = 'in progress';
    const w = winners[idx];
    const icon = typeIcon(m);

    /* Shared absolute style matching the img's position exactly */
    const base = {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: pos.borderRadius,
      position: 'absolute',
      top: 292,
      left: pos.left,
      width: pos.width,
      height: pos.height,
    };

    if (mapState === 'unplayed') {
      return (
        <div className="unplayed font-integral-regular" style={base}>
          <br /><br />
          <h1 style={{ marginTop: 210, fontSize: 20, height: 100 }}>{mapName}</h1>
          <img className="icon" style={{ marginTop: 135 }} src={icon} alt="" />
        </div>
      );
    }
    if (mapState === 'up next') {
      return (
        <div className="upnext font-integral-regular" style={base}>
          <br />
          <h1 style={{ marginTop: 210, fontSize: 20 }}>UP NEXT:</h1>
          <h2 style={{ fontSize: 20, marginTop: 35 }}>{mapName}</h2>
          <img className="icon" src={icon} alt="" />
        </div>
      );
    }
    if (mapState === 'in progress') {
      return (
        <div className="ipr font-integral-regular" style={base}>
          <br />
          <h1 style={{ fontSize: 80, marginTop: 210 }}>{scores}</h1>
          {m.name !== '+' && <h2>{mapName}</h2>}
          <img className="icon" src={icon} alt="" />
        </div>
      );
    }
    if (mapState === 'done') {
      const winnerLogo = w === 1 ? t1logo : w === 2 ? t2logo : '';
      const colorClass = w === 1 ? 'done-blue' : w === 2 ? 'done-red' : 'done-draw';
      return (
        <div className={`${colorClass} font-integral-regular`} style={base}>
          <br />
          {winnerLogo && <img className="winner-logo" src={winnerLogo} alt="" />}
          <h1 style={{ fontSize: 80, marginTop: 35 }}>{scores}</h1>
          {m.name !== '+' && <h2>{mapName}</h2>}
          <img className="icon" src={icon} alt="" />
        </div>
      );
    }
    return null;
  };

  /* ---- Build all 9 slots (bo1×1 + bo3×3 + bo5×5) like legacy ---- */
  const renderSlotGroup = (key, count) => {
    const positions = SLOTS[key];
    const isActive = key === activeKey;
    return positions.slice(0, count).map((pos, i) => {
      const mapIdx = i; // 0-based index within format
      const m = isActive ? (maps[`map${mapIdx + 1}`] || {}) : {};
      const imgSrc = isActive ? resolveMapImg(m) : asset(BLANK);
      const imgStyle = {
        display: 'flex',
        flexDirection: 'column',
        borderRadius: pos.borderRadius,
        position: 'absolute',
        top: 292,
        left: pos.left,
        width: pos.width,
        height: pos.height,
      };
      return (
        <React.Fragment key={`${key}-${i}`}>
          <img
            src={imgSrc}
            style={imgStyle}
            alt=""
          />
          {isActive && renderState(m, mapIdx, pos)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="stack-container text-center">
      {/* Background map set box */}
      <img className="stacked-image" src={asset(`/assets/maps/map_${format}_box.png`)} alt="" />

      {/* Score header */}
      <div id="total-score">
        <div id="match-score" style={{ fontSize: 25, color: '#0D534D' }} className="font-integral-bold">MATCH SCORE</div>
        <br />
        <div id="miniscore" style={{ fontSize: 80, fontWeight: 900 }} className="font-integral-bold">{t1score} - {t2score}</div>
        <img id="logo1" src={t1logo} style={{ height: 136, width: 136, objectFit: 'contain' }} alt="" />
        <img id="logo2" src={t2logo} style={{ height: 136, width: 136, objectFit: 'contain' }} alt="" />
      </div>

      {/* All 9 map slots — only the active format shows real content */}
      {renderSlotGroup('bo1', 1)}
      {renderSlotGroup('bo3', 3)}
      {renderSlotGroup('bo5', 5)}
    </div>
  );
}
