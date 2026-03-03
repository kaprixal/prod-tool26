import { usePolledState } from '../../hooks/usePolledState';

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
  const t1logo = match?.team1?.logo || '';
  const t2logo = match?.team2?.logo || '';

  return (
    <div id="animatedbox" className="flex flex-row justify-evenly" style={{ textAlign: 'center' }}>
      <img id="animatedImage1" src={t1logo} alt="" />
      <img id="animatedImage2" src={t2logo} alt="" />
    </div>
  );
}
