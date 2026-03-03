import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';

/**
 * 2-guest interview cam overlay.
 * Shows 2 caster names inline + 2 guest names inline, scores, team logos.
 * Ported from legacy general/casters_guests/2guests.html
 */
export default function TwoGuestsOverlay() {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const cm = state.currMatch || '1';
  const match = state.matches?.[cm];
  const t1score = match?.t1TotalScore ?? 0;
  const t2score = match?.t2TotalScore ?? 0;
  const t1logo = match?.team1?.logo || '';
  const t2logo = match?.team2?.logo || '';

  const isZeroZero = t1score === 0 && t2score === 0;
  const vsSrc = isZeroZero
    ? asset('/assets/casters_and_interviews/casters_vs_1.png')
    : asset('/assets/casters_and_interviews/casters_vs_2.png');

  return (
    <div className="stack-container text-white">
      {/* Caster names (inline, left side) */}
      <div id="caster-1-iname" className="caster-int font-built-bold text-4xl" style={{ top: 315 }}>
        {state.caster1?.name}
      </div>
      <div id="caster-2-iname" className="caster-int font-built-bold text-4xl" style={{ top: 663 }}>
        {state.caster2?.name}
      </div>

      {/* Guest names (inline, right side) */}
      <div id="guest-1-name" className="caster-int font-built-bold text-4xl" style={{ left: 970, top: 315 }}>
        {state.guest1?.name}
      </div>
      <div id="guest-2-name" className="caster-int font-built-bold text-4xl" style={{ left: 970, top: 663 }}>
        {state.guest2?.name}
      </div>

      {/* Title */}
      <div className="flex flex-col">
        <div id="caster-streamtitle" className="font-built-bold text-7xl text-center">{state.streamTitle}</div>
        <div id="caster-subtitle" className="font-built-bold text-center text-2xl">{state.subtitle}</div>
      </div>

      <div id="divider" />

      {/* Team logos */}
      <img
        src={t1logo}
        style={{
          position: 'absolute',
          height: 136,
          width: 136,
          zIndex: 3,
          top: 868,
          left: isZeroZero ? 1229 : 1170,
        }}
        alt=""
      />
      <img
        src={t2logo}
        style={{
          position: 'absolute',
          height: 136,
          width: 136,
          zIndex: 3,
          top: 868,
          left: isZeroZero ? 1595 : 1640,
        }}
        alt=""
      />

      {/* VS asset */}
      <img className="stacked-image" src={vsSrc} style={{ zIndex: 2 }} alt="" />

      {/* Score */}
      {!isZeroZero && (
        <div
          className="druk-wide-heavy"
          style={{
            fontSize: 80,
            borderRadius: 38,
            fontWeight: 900,
            position: 'absolute',
            top: 890,
            left: 1340,
            width: 259.53,
            height: 122,
            zIndex: 3,
          }}
        >
          {t1score} - {t2score}
        </div>
      )}

      {/* Background */}
      <img className="stacked-image" src={asset('/assets/casters_and_interviews/interview2_cam_box.png')} alt="" />
    </div>
  );
}
