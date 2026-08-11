import { useState, useEffect, useRef } from 'react';
import { usePolledState } from '../../hooks/usePolledState';
import { asset, presetAsset } from '../../api';
import Slideshow from './Slideshow';

/* Drop images into assets/schedule_slideshow/ — picked up at build time */
const slideshowModules = import.meta.glob(
  './assets/schedule_slideshow/*.{png,jpg,jpeg,webp,gif}',
  { eager: true }
);
const SLIDESHOW_IMGS = Object.values(slideshowModules).map((m) => m.default);

function Countdown({ totalSeconds }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const savedTotal = useRef(totalSeconds);

  // Restart the countdown whenever the source value changes
  useEffect(() => {
    savedTotal.current = totalSeconds;
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  if (remaining <= 0) {
    return (
      <div className="font-integral-bold" style={{
        position: 'absolute', top: 190, left: 85, height: 109,
        display: 'flex', alignItems: 'center', color: 'white', fontSize: 85,
      }}>
        STARTING SOON
      </div>
    );
  }
  const hh = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div className="font-integral-bold" style={{
      position: 'absolute', top: 190, left: 85, height: 109,
      display: 'flex', alignItems: 'center', color: 'white', fontSize: 140,
    }}>
      {hh}:{mm}:{ss}
    </div>
  );
}

/**
 * Schedule / break screen overlay.
 * Shows match list (1-3 matches), team logos, names, scores, format, details.
 *
 * Ported from legacy general/schedule.html
 */
export default function ScheduleOverlay() {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const matchCount = state.matchCount !== undefined ? parseInt(state.matchCount) : 1;

  const renderMatchBlock = (n) => {
    const match = state.matches?.[String(n)];
    if (!match) return null;

    const t1name = match.team1?.name || '';
    const t2name = match.team2?.name || '';
    const gameLogoMap = { ow2: 'ow', lol: 'lol', val: 'val', mr: 'mr', dl: 'dl', cs2: 'cs2', tft: 'tft' };
    const defaultLogo = asset(`/assets/game_logos/${gameLogoMap[match?.game] || 'blank'}.png`);
    const t1logo = match.team1?.logo || defaultLogo;
    const t2logo = match.team2?.logo || defaultLogo;
    const t1s = match.t1TotalScore ?? 0;
    const t2s = match.t2TotalScore ?? 0;
    const winner = match.winner || 'none';
    const fmtRaw = match.format || '';
    const fmt = { ft1: 'bo1', ft2: 'bo3', ft3: 'bo5' }[fmtRaw] || fmtRaw;
    const details = match.details || '';

    /* Winner state determines background graphic */
    let bgSrc = asset('/assets/break/startingsoon_vs.png');
    if (winner === 't1') bgSrc = asset('/assets/break/startingsoon_blue.png');
    else if (winner === 't2') bgSrc = asset('/assets/break/startingsoon_red.png');

    const scoreDisplay =
      t1s === 0 && t2s === 0 && winner === 'none' ? 'VS' : `${t1s} - ${t2s}`;

    const t1GrayOut = winner === 't2' ? 'gray-out' : '';
    const t2GrayOut = winner === 't1' ? 'gray-out' : '';

    /* Vertical offsets per block based on legacy CSS (approximate), shifted down
       90px to make room for the event logo above the countdown timer. */
    const blockTopOffsets = [396, 624.15, 852.3];
    const nameTopOffsets = [529.4, 757.45, 985.6];
    const logoTopOffsets = [418, 646, 874];
    const scoreTopOffsets = [440, 663.73, 896];
    const dateTopOffsets = [510, 743.73, 976];
    const gameTopOffsets = [469, 697, 925];
    const idx = n - 1;

    return (
      <div key={n} style={{ color: 'white' }}>
        <img
          className="stacked-image"
          src={bgSrc}
          style={{ position: 'absolute', top: blockTopOffsets[idx], left: 86 }}
          alt=""
        />
        {/* Team names */}
        <div className="bname font-integral-regular" style={{ top: nameTopOffsets[idx], left: 172 }}>{t1name}</div>
        <div className="bname font-integral-regular" style={{ top: nameTopOffsets[idx], left: 545 }}>{t2name}</div>

        {/* Team logos */}
        <img className={`blogo ${t1GrayOut}`} src={t1logo} onError={(e) => { e.target.src = defaultLogo; }} style={{ top: logoTopOffsets[idx], left: 228 }} alt="" />
        <img className={`blogo ${t2GrayOut}`} src={t2logo} onError={(e) => { e.target.src = defaultLogo; }} style={{ top: logoTopOffsets[idx], left: 601 }} alt="" />

        {/* Score */}
        <div
          className="font-integral-bold"
          style={{
            top: scoreTopOffsets[idx],
            fontSize: 38,
            zIndex: 2,
            position: 'absolute',
            left: 86,
            width: 762,
            textAlign: 'center',
          }}
        >
          {scoreDisplay}
        </div>

        {/* Details/date */}
        <div className="bdate font-integral-regular" style={{ top: dateTopOffsets[idx] }}>{details}</div>

        {/* Game label + format */}
        <div className="font-integral-bold games" style={{ top: gameTopOffsets[idx] }}>Game {n}</div>
        <div className="font-integral-bold bformat" style={{ top: gameTopOffsets[idx] }}>{fmt}</div>
      </div>
    );
  };

  return (
    <div className="stack-container">
      <div style={{ color: 'white' }}>
        <img className="stacked-image" src={asset('/assets/break/starting_displaybox.png')} alt="" />

        {/* Event/tournament logo — sits above the countdown timer */}
        <img
          src={presetAsset('break', 'schedule_logo.png')}
          style={{ position: 'absolute', top: 30, left: 85, height: 140, width: 'auto', objectFit: 'contain' }}
          alt=""
        />

        <div
          className="font-integral-bold"
          style={{
            position: 'absolute',
            width: 762,
            height: 24,
            top: 334,
            left: 86,
            fontSize: 20,
            color: 'white',
            textAlign: 'left',
          }}
        >
          {state.streamTitle}
        </div>

        {[1, 2, 3].map((n) => (n <= matchCount ? renderMatchBlock(n) : null))}
        <Countdown key={state.timerResetAt} totalSeconds={(parseFloat(state.timerMinutes) || 0) * 60} />
      </div>
      <Slideshow images={SLIDESHOW_IMGS} top={128} left={1010} />
    </div>
  );
}
