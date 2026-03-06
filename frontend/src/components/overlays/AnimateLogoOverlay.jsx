import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';

/**
 * Animated logo overlay – two team logos slide in from opposite sides.
 * Ported from legacy animatelogo.html
 *
 * The container always renders so the CSS animation only fires once on
 * initial page load (matching legacy behaviour where the HTML is static).
 */
export default function AnimateLogoOverlay() {
  const { state } = usePolledState(1000);

  const cm = state?.currMatch || '1';
  const match = state?.matches?.[cm];
  const gameLogoMap = { ow2: 'ow', lol: 'lol', val: 'val', mr: 'mr', dl: 'dl' };
  const defaultLogo = asset(`/assets/game_logos/${gameLogoMap[match?.game] || 'blank'}.png`);
  const t1logo = match?.team1?.logo || defaultLogo;
  const t2logo = match?.team2?.logo || defaultLogo;

  return (
    <div id="animatedbox" className="flex flex-row justify-evenly" style={{ textAlign: 'center' }}>
      <img id="animatedImage1" src={t1logo} onError={(e) => { e.target.src = defaultLogo; }} alt="" />
      <img id="animatedImage2" src={t2logo} onError={(e) => { e.target.src = defaultLogo; }} alt="" />
    </div>
  );
}
