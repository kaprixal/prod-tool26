import { useState, useEffect, useRef } from 'react';
import { getState, clearBmoPlay } from '../../localStore';
import bmoLogo from './assets/sponsor_slideshow_ingame/BMO-logo_blue-red.png';
import bmoNxtLvlLogo from './assets/sponsor_slideshow_ingame/BMONXTLVL_Blue_E 1.png';
import bannerBg from './assets/in_game_overlay/bg.png';

const TOTAL_DURATION = 4000;

const BANNER_WIDTH = 780;
const BANNER_LEFT = (1920 - BANNER_WIDTH) / 2;
const BANNER_TOP = 390;

export default function BmoBudgetingPlay() {
  const [phase, setPhase] = useState('hidden');
  const [logosIn, setLogosIn] = useState(false);
  const timersRef = useRef([]);
  const prevActiveRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const s = getState();
      const active = !!s.bmoPlayActive;

      if (active && !prevActiveRef.current) {
        prevActiveRef.current = true;
        timersRef.current.forEach(clearTimeout);

        setPhase('in');
        setLogosIn(false);

        timersRef.current = [
          // Banner finishes sliding in → hold
          setTimeout(() => setPhase('hold'), 350),
          // 500ms after hold: text shrinks, logos swipe in
          setTimeout(() => setLogosIn(true), 850),
          // Begin exit
          setTimeout(() => setPhase('out'), TOTAL_DURATION - 500),
          // Fully hidden, reset
          setTimeout(() => {
            setPhase('hidden');
            setLogosIn(false);
            clearBmoPlay();
            prevActiveRef.current = false;
          }, TOTAL_DURATION),
        ];
      }
    }, 300);

    return () => {
      clearInterval(interval);
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  if (phase === 'hidden') return null;

  const bannerClass =
    phase === 'in'  ? 'bmo-play-enter' :
    phase === 'out' ? 'bmo-play-exit'  :
    'bmo-play-hold';

  return (
    <div
      className={`bmo-play-card ${bannerClass}`}
      style={{
        position: 'absolute',
        left: BANNER_LEFT,
        top: BANNER_TOP,
        width: BANNER_WIDTH,
        zIndex: 100,
        overflow: 'hidden',
        boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundImage: `url(${bannerBg})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        padding: '28px 40px 28px 0',
        minHeight: 130,
      }}>
        {/* Red accent block */}
        <div style={{
          flexShrink: 0,
          width: 40,
          alignSelf: 'stretch',
          background: 'linear-gradient(180deg, #FF2A2A 0%, #C8102E 50%, #7A0000 100%)',
          marginRight: 32,
        }} />

        {/* Text + logos */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* Title — transitions between large (fills box) and normal size */}
          <div style={{
            fontFamily: 'IntegralCF, sans-serif',
            fontWeight: 700,
            fontSize: logosIn ? 70 : 80,
            color: '#0079C1',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            lineHeight: 1,
            marginBottom: logosIn ? 10 : 0,
            transition: 'font-size 0.35s cubic-bezier(0.22, 1, 0.36, 1), margin-bottom 0.35s ease',
          }}>
            Budgeting Play
          </div>

          {/* Logos — overflow hidden wrapper so the swipe is clipped */}
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transform: logosIn ? 'translateX(0)' : 'translateX(-110%)',
              opacity: logosIn ? 1 : 0,
              transition: logosIn
                ? 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease'
                : 'none',
            }}>
              <span style={{
                fontFamily: 'IntegralCF, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}>
                Powered by:
              </span>
              <img
                src={bmoLogo}
                alt="BMO"
                style={{ height: 52, objectFit: 'contain' }}
              />
              <div style={{ width: 1, height: 42, background: '#ccc' }} />
              <img
                src={bmoNxtLvlLogo}
                alt="BMO NXT LVL"
                style={{ height: 36, objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
