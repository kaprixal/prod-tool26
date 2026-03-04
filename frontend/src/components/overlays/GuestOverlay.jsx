import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';

/**
 * 1-guest interview cam overlay.
 * Shows 2 caster names inline, guest name/tag, scores, team logos.
 * Ported from legacy general/casters_guests/1guest.html
 */
export default function GuestOverlay() {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const cm = state.currMatch || '1';
  const match = state.matches?.[cm];
  const t1score = match?.t1TotalScore ?? 0;
  const t2score = match?.t2TotalScore ?? 0;
  const gameLogoMap = { ow2: 'ow', lol: 'lol', val: 'val', mr: 'mr', dl: 'dl' };
  const defaultLogo = asset(`/assets/game_logos/${gameLogoMap[match?.game] || 'blank'}.png`);
  const t1logo = match?.team1?.logo || defaultLogo;
  const t2logo = match?.team2?.logo || defaultLogo;

  const isZeroZero = t1score === 0 && t2score === 0;
  const vsSrc = isZeroZero
    ? asset('/assets/casters_and_interviews/casters_vs_1.png')
    : asset('/assets/casters_and_interviews/casters_vs_2.png');

  return (
    <div className="stack-container text-white">
      {/* Caster names (inline) */}
      <div id="caster-1-iname" className="caster-int font-built-bold text-3xl" style={{ top: 320 }}>
        {state.caster1?.name}
      </div>
      <div id="caster-2-iname" className="caster-int font-built-bold text-3xl" style={{ top: 670 }}>
        {state.caster2?.name}
      </div>

      {/* Guest info */}
      <div id="caster-2-name" className="font-built-bold text-4xl">{state.guest1?.name}</div>
      <div id="caster-2-tag" className="font-built-bold text-2xl">{state.guest1?.info}</div>

      {/* Title */}
      <div className="flex flex-col">
        <div id="caster-streamtitle" className="font-built-bold text-4xl text-center">{state.streamTitle}</div>
        <div id="caster-subtitle" className="font-built-bold text-center text-2xl">{state.subtitle}</div>
      </div>

      <div id="divider" />

      {/* Team logos */}
      <img
        src={t1logo}
        onError={(e) => { e.target.src = defaultLogo; }}
        style={{
          position: 'absolute',
          height: 136,
          width: 136,
          objectFit: 'contain',
          zIndex: 3,
          top: 868,
          left: isZeroZero ? 1229 : 1170,
        }}
        alt=""
      />
      <img
        src={t2logo}
        onError={(e) => { e.target.src = defaultLogo; }}
        style={{
          position: 'absolute',
          height: 136,
          width: 136,
          objectFit: 'contain',
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
      <img className="stacked-image" src={asset('/assets/casters_and_interviews/interview_cam_box.png')} alt="" />
    </div>
  );
}
