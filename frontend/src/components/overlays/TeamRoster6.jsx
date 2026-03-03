import { usePolledState } from '../../hooks/usePolledState';
import { asset } from '../../api';

/**
 * 6-player roster overlay (used for Marvel Rivals).
 * team=1 → players p1-p5 + p11 (blue box), team=2 → p6-p10 + p12 (red box).
 *
 * Ported from legacy live/team1_6players.html & team2_6players.html
 */

/* Pixel-perfect positions from legacy CSS */
const IMG_LEFT = [102, 392, 682, 972, 1262, 1553];
const NAME_LEFT = [100, 392, 682, 972, 1262, 1553];
const NAME_WIDTH = [262, 263, 263, 263, 263, 263];
const NAME_HEIGHT = [102, 100, 100, 100, 100, 100];

export default function TeamRoster6({ team = 1 }) {
  const { state } = usePolledState(1000);
  if (!state) return null;

  const cm = state.currMatch || '1';
  const match = state.matches?.[cm];
  if (!match) return null;

  const isTeam1 = team === 1;
  const teamData = isTeam1 ? match.team1 : match.team2;
  const bgImage = isTeam1
    ? asset('/assets/roster/roster_box_blueteam6.png')
    : asset('/assets/roster/roster_box_redteam6.png');

  /* Player keys: team1 → p1-p5 + p11, team2 → p6-p10 + p12 */
  const playerKeys = isTeam1
    ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p11']
    : ['p6', 'p7', 'p8', 'p9', 'p10', 'p12'];

  const players = playerKeys.map((key) => match.players?.[key] || { name: '', character: '+', role: '+' });

  /* Marvel Rivals hero image path */
  const heroImgPath = (hero) => {
    const clean = hero.replace(/\s+/g, '_');
    return asset(`/assets/mr_heroes/Rivals_Hero_${clean}.png`);
  };

  /* Role icon path for MR */
  const roleIconPath = (role) => asset(`/assets/roster/icons/mr/${role.toLowerCase()}.png`);

  return (
    <div className="stack-container text-center">
      <img className="roster-logo" src={teamData?.logo || ''} alt="" />
      <div className="roster-team uppercase font-integral-bold">{teamData?.name || ''}</div>
      <img className="stacked-image" src={bgImage} alt="" />

      {/* Role icons (6) */}
      <div className="flex flex-row roles6">
        {players.map((p, i) => (
          <img key={i} id={`role${i + 1}`} src={roleIconPath(p.role)} alt="" />
        ))}
      </div>

      {/* Player cards (6) */}
      {players.map((p, i) => (
        <div key={i} className="font-integral-bold">
          <img
            id={`roster6-img-${i + 1}`}
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
            id={`roster6-name-${i + 1}`}
            style={{
              color: 'white',
              fontSize: 18,
              position: 'absolute',
              height: NAME_HEIGHT[i],
              width: NAME_WIDTH[i],
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
