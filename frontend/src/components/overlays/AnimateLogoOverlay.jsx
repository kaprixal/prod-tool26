import { usePolledState } from '../../hooks/usePolledState';

/**
 * Animated logo overlay – two team logos slide in from opposite sides.
 * Ported from legacy animatelogo.html
 */
export default function AnimateLogoOverlay() {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const cm = state.currMatch || '1';
  const match = state.matches?.[cm];
  if (!match) return null;

  const t1logo = match.team1?.logo || '';
  const t2logo = match.team2?.logo || '';

  return (
    <div id="animatedbox" className="flex flex-row justify-evenly">
      <img id="animatedImage1" src={t1logo} alt="" />
      <img id="animatedImage2" src={t2logo} alt="" />
    </div>
  );
}
