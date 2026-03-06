import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';

/**
 * Unified team roster overlay — automatically picks the 5- or 6-player
 * layout based on the current match's game.
 *
 * 5-player: OW2, LoL, Valorant
 * 6-player: Marvel Rivals, Deadlock
 */

/* ── 5-player layout constants ── */
const LAYOUT_5 = {
  imgLeft:   [100, 448, 796, 1144, 1492],
  nameLeft:  [100, 448, 796, 1144, 1492],
  nameWidth: [327, 327, 327, 327, 327],
  nameHeight:[100, 100, 100, 100, 100],
  cardWidth:  327,
  cardHeight: 660,
  cardTop:    222,
  nameFontSize: '20px',
  roleClass: 'flex flex-row justify-between roles',
  bgBlue:  '/assets/roster/roster_box_blueteam.png',
  bgRed:   '/assets/roster/roster_box_redteam.png',
  team1Keys: ['p1', 'p2', 'p3', 'p4', 'p5'],
  team2Keys: ['p6', 'p7', 'p8', 'p9', 'p10'],
};

/* ── 6-player layout constants ── */
const LAYOUT_6 = {
  imgLeft:   [102, 392, 682, 972, 1262, 1553],
  nameLeft:  [100, 392, 682, 972, 1262, 1553],
  nameWidth: [262, 263, 263, 263, 263, 263],
  nameHeight:[102, 100, 100, 100, 100, 100],
  cardWidth:  263,
  cardHeight: 737,
  cardTop:    226,
  nameFontSize: 18,
  roleClass: 'flex flex-row roles6',
  bgBlue:  '/assets/roster/roster_box_blueteam6.png',
  bgRed:   '/assets/roster/roster_box_redteam6.png',
  team1Keys: ['p1', 'p2', 'p3', 'p4', 'p5', 'p11'],
  team2Keys: ['p6', 'p7', 'p8', 'p9', 'p10', 'p12'],
};

const SIX_PLAYER_GAMES = new Set(['mr', 'dl']);

export default function TeamRoster({ team = 1 }) {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const cm = state.currMatch || '1';
  const match = state.matches?.[cm];
  if (!match) return null;

  const game = match.game || '';
  const is6 = SIX_PLAYER_GAMES.has(game);
  const L = is6 ? LAYOUT_6 : LAYOUT_5;

  const isTeam1 = team === 1;
  const teamData = isTeam1 ? match.team1 : match.team2;
  const bgImage = asset(isTeam1 ? L.bgBlue : L.bgRed);

  const playerKeys = isTeam1 ? L.team1Keys : L.team2Keys;
  const players = playerKeys.map((key) => match.players?.[key] || { name: '', character: '+', role: '+' });

  /* ── Hero image resolution (all games) ── */
  const mrHeroCandidates = (hero) => {
    if (!hero || hero === '+') return [];
    const clean = hero.replace(/\s+/g, '_');
    return [
      asset(`/assets/mr_heroes/Rivals_Hero_${clean}.png`),
      asset(`/assets/mr_heroes/${clean}_Full_Hero_Portrait.png`),
      asset(`/assets/mr_heroes/${clean}_Hero_Portrait.png`),
    ];
  };

  const heroImgPath = (hero) => {
    if (!hero || hero === '+') return '';
    const clean = hero.replace(/[\s:.-]+/g, '');
    if (game === 'lol') return asset(`/assets/league_champs/${clean}.png`);
    if (game === 'ow2') {
      const OW_FILE_OVERRIDES = { 'Jetpack Cat': 'JETPACK_CAT' };
      const file = OW_FILE_OVERRIDES[hero] || clean.toUpperCase();
      return asset(`/assets/ow_heroes/${file}.png`);
    }
    if (game === 'val') return asset(`/assets/val_agents/${clean.toLowerCase()}.png`);
    if (game === 'dl') {
      const c = hero.replace(/\s+/g, '_');
      return asset(`/assets/deadlock_heroes/${c}_Render.png`);
    }
    if (game === 'mr') return mrHeroCandidates(hero)[0] || '';
    return '';
  };

  /* onError handler — cycles through MR hero image candidates */
  const handleHeroImgError = (e, hero) => {
    if (game !== 'mr') return;
    const candidates = mrHeroCandidates(hero);
    const currentSrc = e.target.src;
    const idx = candidates.findIndex(
      (c) => currentSrc.endsWith(new URL(c, window.location.origin).pathname) || currentSrc === c
    );
    const next = candidates[idx + 1];
    e.target.src = next || '';
  };

  /* ── Role icon resolution (all games) ── */
  const roleIconPath = (role) => {
    if (!role || role === '+') return '';
    const r = role.toLowerCase();
    if (game === 'lol') return asset(`/assets/roster/icons/lol/${r}.png`);
    if (game === 'ow2') return asset(`/assets/roster/icons/ow/${r}.png`);
    if (game === 'val') return asset(`/assets/roster/icons/val/${r}.png`);
    if (game === 'mr')  return asset(`/assets/roster/icons/mr/${r}.png`);
    if (game === 'dl')  return asset(`/assets/roster/icons/dl/${r}.png`);
    return '';
  };

  return (
    <div className="stack-container text-center">
      <img className="roster-logo" src={teamData?.logo || asset(`/assets/game_logos/${{ ow2: 'ow', lol: 'lol', val: 'val', mr: 'mr', dl: 'dl' }[game] || 'blank'}.png`)} onError={(e) => { e.target.src = asset(`/assets/game_logos/${{ ow2: 'ow', lol: 'lol', val: 'val', mr: 'mr', dl: 'dl' }[game] || 'blank'}.png`); }} alt="" />
      <div className="roster-team uppercase font-integral-bold">{teamData?.name || ''}</div>
      <img className="stacked-image" src={bgImage} alt="" />

      {/* Role icons */}
      {game !== 'dl' && (
        <div className={L.roleClass}>
          {players.map((p, i) => (
            <img key={i} id={`role${i + 1}`} src={roleIconPath(p.role)} alt="" />
          ))}
        </div>
      )}

      {/* Player cards */}
      {players.map((p, i) => (
        <div key={i} className="font-integral-bold">
          <img
            id={`roster-img-${i + 1}`}
            src={heroImgPath(p.character)}
            onError={(e) => handleHeroImgError(e, p.character)}
            alt=""
            style={{
              borderRadius: 31,
              position: 'absolute',
              top: L.cardTop,
              left: L.imgLeft[i],
              width: L.cardWidth,
              height: L.cardHeight,
              objectFit: 'cover',
              objectPosition: 'top center',
            }}
          />
          <div
            id={`roster-name-${i + 1}`}
            style={{
              color: 'white',
              fontSize: L.nameFontSize,
              position: 'absolute',
              height: L.nameHeight[i],
              width: L.nameWidth[i],
              top: 900,
              left: L.nameLeft[i],
              zIndex: 1,
            }}
          >
            {p.name}
          </div>
        </div>
      ))}
    </div>
  );
}
