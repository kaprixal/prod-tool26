import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';

/**
 * 2-caster cam overlay – shows caster names/tags, scores, team logos.
 * Ported from legacy general/casters_guests/2casters.html
 */
export default function CastersOverlay() {
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
      {/* Caster 1 */}
      <div id="caster-1-name" className="font-built-bold text-4xl">{state.caster1?.name}</div>
      <div id="caster-1-tag" className="font-built-bold text-2xl">{state.caster1?.info}</div>

      {/* Caster 2 */}
      <div id="caster-2-name" className="font-built-bold text-4xl">{state.caster2?.name}</div>
      <div id="caster-2-tag" className="font-built-bold text-2xl">{state.caster2?.info}</div>

      {/* Title */}
      <div className="flex flex-col">
        <div id="caster-streamtitle" className="font-built-bold text-4xl text-center">{state.streamTitle}</div>
        <div id="caster-subtitle" className="font-built-bold text-center text-2xl">{state.subtitle}</div>
      </div>

      <div id="divider" />

      {/* Background */}
      <img className="stacked-image" src={asset('/assets/casters_and_interviews/casters_cam_box.png')} alt="" />

      {/* VS asset */}
      <img className="stacked-image" src={vsSrc} style={{ zIndex: 2 }} alt="" />

      {/* Score */}
      {!isZeroZero && (
        <div
          className="text-center font-integral-bold"
          style={{
            fontSize: 80,
            borderRadius: 38,
            fontWeight: 900,
            position: 'absolute',
            top: 875,
            left: 1340,
            width: 259.53,
            height: 115,
            zIndex: 3,
            color: '#172953',
          }}
        >
          {t1score} - {t2score}
        </div>
      )}

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
    </div>
  );
}
