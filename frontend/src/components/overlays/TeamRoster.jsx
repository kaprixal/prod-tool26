import { usePolledState } from '../../hooks/usePolledState';

/**
 * Team roster overlay for 5-player teams (OW2, LoL, Valorant).
 * team=1 → players p1-p5 (blue box), team=2 → players p6-p10 (red box).
 *
 * Ported from legacy live/team1.html & team2.html
 */

/* Pixel-perfect positions from legacy CSS */
const IMG_LEFT = [100, 448, 796, 1144, 1492];
const NAME_LEFT = [100, 448, 796, 1144, 1492];

export default function TeamRoster({ team = 1, playerCount = 5 }) {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const game = state.game;
  const cm = state.currMatch || '1';
  const match = state.matches?.[cm];
  if (!match) return null;

  const isTeam1 = team === 1;
  const teamData = isTeam1 ? match.team1 : match.team2;
  const bgImage = isTeam1
    ? '/assets/roster/roster_box_blueteam.png'
    : '/assets/roster/roster_box_redteam.png';

  /* Player keys: team1 → p1-p5, team2 → p6-p10 */
  const playerKeys = isTeam1
    ? [1, 2, 3, 4, 5].map((i) => `p${i}`)
    : [6, 7, 8, 9, 10].map((i) => `p${i}`);

  const players = playerKeys.map((key) => match.players?.[key] || { name: '', character: '+', role: '+' });

  /* Resolve hero image path per game */
  const heroImgPath = (hero) => {
    const clean = hero.replace(/[\s:.-]+/g, '');
    if (game === 'lol') return `/assets/league_champs/${clean}.png`;
    if (game === 'ow2') return `/assets/ow_heroes/${clean.toUpperCase()}.png`;
    if (game === 'val') return `/assets/val_agents/${clean.toLowerCase()}.png`;
    return '';
  };

  /* Resolve role icon path per game */
  const roleIconPath = (role) => {
    const r = role.toLowerCase();
    if (game === 'lol') return `/assets/roster/icons/lol/${r}.png`;
    if (game === 'ow2') return `/assets/roster/icons/ow/${r}.png`;
    if (game === 'val') return `/assets/roster/icons/val/${r}.png`;
    return '';
  };

  return (
    <div className="stack-container text-center">
      <img className="roster-logo" src={teamData?.logo || ''} alt="" />
      <div className="roster-team uppercase font-integral-bold">{teamData?.name || ''}</div>
      <img className="stacked-image" src={bgImage} alt="" />

      {/* Role icons */}
      <div className="flex flex-row justify-between roles">
        {players.map((p, i) => (
          <img key={i} id={`role${i + 1}`} src={roleIconPath(p.role)} alt="" />
        ))}
      </div>

      {/* Player cards */}
      {players.map((p, i) => (
        <div key={i} className="font-integral-bold">
          <img
            id={`roster-img-${i + 1}`}
            src={heroImgPath(p.character)}
            alt=""
            style={{
              borderRadius: 31,
              position: 'absolute',
              top: 222,
              left: IMG_LEFT[i],
            }}
          />
          <div
            id={`roster-name-${i + 1}`}
            style={{
              color: 'white',
              fontSize: '20px',
              position: 'absolute',
              height: 100,
              width: 327,
              top: 900,
              left: NAME_LEFT[i],
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
