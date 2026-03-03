import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';

/**
 * Schedule / break screen overlay.
 * Shows match list (1-3 matches), team logos, names, scores, format, details.
 *
 * Ported from legacy general/schedule.html
 */
export default function ScheduleOverlay() {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const matchCount = parseInt(state.matchCount) || 1;

  const renderMatchBlock = (n) => {
    const match = state.matches?.[String(n)];
    if (!match) return null;

    const t1name = match.team1?.name || '';
    const t2name = match.team2?.name || '';
    const t1logo = match.team1?.logo || '';
    const t2logo = match.team2?.logo || '';
    const t1s = match.t1TotalScore ?? 0;
    const t2s = match.t2TotalScore ?? 0;
    const winner = match.winner || 'none';
    const fmt = match.format || '';
    const details = match.details || '';

    /* Winner state determines background graphic */
    let bgSrc = asset('/assets/break/startingsoon_vs.png');
    if (winner === 't1') bgSrc = asset('/assets/break/startingsoon_blue.png');
    else if (winner === 't2') bgSrc = asset('/assets/break/startingsoon_red.png');

    const scoreDisplay =
      t1s === 0 && t2s === 0 && winner === 'none' ? 'VS' : `${t1s} - ${t2s}`;

    const t1GrayOut = winner === 't2' ? 'gray-out' : '';
    const t2GrayOut = winner === 't1' ? 'gray-out' : '';

    /* Vertical offsets per block based on legacy CSS (approximate) */
    const blockTopOffsets = [306, 534.15, 762.3];
    const nameTopOffsets = [439.4, 667.45, 895.6];
    const logoTopOffsets = [328, 556, 784];
    const scoreTopOffsets = [350, 573.73, 806];
    const dateTopOffsets = [420, 653.73, 886];
    const gameTopOffsets = [379, 607, 835];
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
        <img className={`blogo ${t1GrayOut}`} src={t1logo} style={{ top: logoTopOffsets[idx], left: 228 }} alt="" />
        <img className={`blogo ${t2GrayOut}`} src={t2logo} style={{ top: logoTopOffsets[idx], left: 601 }} alt="" />

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
        <div
          className="font-integral-bold"
          style={{
            position: 'absolute',
            width: 762,
            height: 24,
            top: 244,
            left: 86,
            fontSize: 20,
            color: 'white',
            textAlign: 'left',
          }}
        >
          {state.streamTitle}
        </div>

        {[1, 2, 3].map((n) => (n <= matchCount ? renderMatchBlock(n) : null))}
      </div>
    </div>
  );
}
