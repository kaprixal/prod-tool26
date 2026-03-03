import { useState, useEffect, useCallback } from 'react';
import { usePolledState } from '../../hooks/usePolledState';
import { updateOwBan, asset } from '../../api';

/**
 * Overwatch Hero Ban overlay.
 * Left click = blue team ban, Right click = red team ban,
 * Middle click = previous ban, Click again = remove.
 * Click the Tank header to reset all bans.
 *
 * Ported from legacy live/owban.html
 */

const TANKS = [
  'dva', 'doomfist', 'hazard', 'junkerqueen',
  'mauga', 'orisa', 'ramattra', 'reinhardt',
  'roadhog', 'sigma', 'winston', 'wreckingball', 'zarya',
];

const DPS = [
  'ashe', 'bastion', 'cassidy', 'echo', 'freja',
  'genji', 'hanzo', 'junkrat', 'mei', 'pharah',
  'reaper', 'sojourn', 'soldier76', 'sombra', 'symmetra',
  'torbjorn', 'tracer', 'venture', 'widowmaker',
];

const SUPPORTS = [
  'ana', 'baptiste', 'brigitte', 'illari',
  'juno', 'kiriko', 'lifeweaver', 'lucio',
  'mercy', 'moira', 'wuyang', 'zenyatta',
];

const OVERLAY_IMAGES = {
  t1: asset('/assets/ow_ban_assets/blueban.png'),
  t2: asset('/assets/ow_ban_assets/redban.png'),
  prev: asset('/assets/ow_ban_assets/prevban.png'),
};

export default function OwBanOverlay() {
  const { state } = usePolledState(1000);
  const [bans, setBans] = useState({});

  useEffect(() => {
    if (state?.owBans) {
      setBans(state.owBans);
    }
  }, [state?.owBans]);

  const handleMouseDown = useCallback(
    async (hero, button) => {
      // Prevent context menu
      const team = button === 0 ? 't1' : button === 2 ? 't2' : button === 1 ? 'prev' : null;
      if (team === null) return;

      const currentBan = bans[hero];
      const newTeam = currentBan === team ? null : team;

      // Optimistic update
      setBans((prev) => {
        const next = { ...prev };
        if (newTeam === null) {
          delete next[hero];
        } else {
          next[hero] = newTeam;
        }
        return next;
      });

      await updateOwBan(hero, newTeam);
    },
    [bans]
  );

  const resetAll = useCallback(async () => {
    setBans({});
    // Reset each ban on the server
    for (const hero of Object.keys(bans)) {
      await updateOwBan(hero, null);
    }
  }, [bans]);

  const cm = state?.currMatch || '1';
  const match = state?.matches?.[cm];
  const t1logo = match?.team1?.logo || '';
  const t2logo = match?.team2?.logo || '';

  const renderHeroGrid = (heroes, cols) => (
    <div
      className="grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 7,
        marginTop: 14,
      }}
    >
      {heroes.map((hero) => {
        const banTeam = bans[hero];
        return (
          <div
            key={hero}
            style={{ position: 'relative', cursor: 'pointer' }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleMouseDown(hero, e.button);
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <img src={asset(`/assets/ow_ban_assets/${hero}.png`)} alt={hero} style={{ width: '100%' }} />
            {banTeam && (
              <img
                src={OVERLAY_IMAGES[banTeam]}
                alt="ban"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  zIndex: 10,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div onContextMenu={(e) => e.preventDefault()} onAuxClick={(e) => e.preventDefault()}>
      {/* VS banner with team logos */}
      <img
        className="stacked-image"
        src={asset('/assets/ow_ban_assets/versus.png')}
        style={{ top: 48, left: 696 }}
        alt=""
      />
      <img src={t1logo} style={{ width: 97, position: 'absolute', left: 742, top: 68, zIndex: 4 }} alt="" />
      <img src={t2logo} style={{ width: 97, position: 'absolute', left: 1082, top: 68, zIndex: 4 }} alt="" />

      {/* Hero grids: Tanks | DPS | Supports */}
      <div
        className="justify-center"
        style={{
          display: 'grid',
          gridTemplateColumns: '484.86px 607.87px 484.86px',
          gap: 57,
          marginTop: 265,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Tanks */}
        <div>
          <img
            src={asset('/assets/ow_ban_assets/tank.png')}
            onClick={resetAll}
            style={{ cursor: 'pointer' }}
            alt="Tank"
          />
          {renderHeroGrid(TANKS, 4)}
        </div>

        {/* DPS */}
        <div>
          <img src={asset('/assets/ow_ban_assets/damage.png')} alt="Damage" />
          {renderHeroGrid(DPS, 5)}
        </div>

        {/* Support */}
        <div>
          <img src={asset('/assets/ow_ban_assets/support.png')} alt="Support" />
          {renderHeroGrid(SUPPORTS, 4)}
        </div>
      </div>
    </div>
  );
}
