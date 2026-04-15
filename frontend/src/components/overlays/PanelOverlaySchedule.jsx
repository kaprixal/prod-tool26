import { useState, useEffect, useRef } from 'react';
import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';
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
        position: 'absolute', top: 300, left: 100, height: 109,
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
      position: 'absolute', top: 300, left: 100, height: 109,
      display: 'flex', alignItems: 'center', color: 'white', fontSize: 140,
    }}>
      {hh}:{mm}:{ss}
    </div>
  );
}

/**
 * Panel schedule overlay – shows stream title, subtitle, and comma-separated
 * panelist names over the schedule background. No match blocks.
 *
 * TODO: fill in top, left, fontSize values for each element below.
 */
export default function PanelOverlaySchedule() {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const title    = state.streamTitle || '';
  const subtitle = state.subtitle    || '';

  const panelCount = parseInt(state.panelCount) || 0;
  const panelistMap = (panelCount && state.panelists?.[String(panelCount)]) || {};
  const panelistNames = Array.from({ length: panelCount }, (_, i) => panelistMap[`p${i + 1}`]?.name || '')
    .filter(Boolean)
    .join(', ');

  return (
    <div className="stack-container">
      {/* Background image */}
      <img
        className="stacked-image"
        src={asset('/assets/break/starting_displaybox.png')}
        alt=""
      />

      {/* Stream title */}
      <div
        className="font-integral-bold"
        style={{
          position: 'absolute',
          top:      472,    /* TODO */
          left:     100,    /* TODO */
          color:    'white',
          fontSize: 54,   /* TODO */
          zIndex:   2,
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div
        className="font-integral-regular"
        style={{
          position: 'absolute',
          top:      570,    /* TODO */
          left:     100,    /* TODO */
          color:    'white',
          fontSize: 24,   /* TODO */
          zIndex:   2,
        }}
      >
        {subtitle}
      </div>

      {/* Panelist names — comma-separated */}
      <div
        className="font-integral-bold"
        style={{
          position: 'absolute',
          top:      678,    /* TODO */
          left:     100,    /* TODO */
          color:    'white',
          fontSize: 20,   /* TODO */
          zIndex:   2,
        }}
      >
        Featuring: {panelistNames}
        
      </div>
      
      <Slideshow images={SLIDESHOW_IMGS} top={128} left={1010} />
      <Countdown totalSeconds={(parseFloat(state.timerMinutes) || 0) * 60} />
    </div>
  );
}
