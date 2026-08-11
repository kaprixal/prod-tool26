import { useState, useEffect } from 'react';
import { usePolledState } from '../../hooks/usePolledState';
import { asset, fetchTftStats } from '../../api';

/* Riot region routing value used for every stats lookup on this screen.
   Change this if the tournament plays out of a different region. */
const TFT_REGION = 'na1';

/* Re-fetch stats this often (ms) — matches the backend's own cache TTL,
   so this just picks up whatever the backend already has cached/refreshed. */
const REFRESH_INTERVAL = 10 * 60 * 1000;

const TEAM1_KEYS = ['p1', 'p2', 'p3', 'p4'];
const TEAM2_KEYS = ['p6', 'p7', 'p8', 'p9'];

/* Ranked ladder helpers — used to average a team's 4 individual ranks into
   one displayable "team rank". Buckets each tier into a 400-point band (100
   per division below Master; Master+ has no divisions so LP fills the band
   directly) so values stay monotonic and roughly comparable across tiers. */
const TIER_ORDER = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
const DIVISIONS = ['IV', 'III', 'II', 'I'];
const APEX_START_IDX = 7; // MASTER

const rankIconUrl = (tierWord) =>
  `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tierWord.toLowerCase()}.svg`;

function tierToValue(tierText, lp) {
  if (!tierText) return null;
  const [tierWord, division] = tierText.trim().toUpperCase().split(' ');
  const tierIdx = TIER_ORDER.indexOf(tierWord);
  if (tierIdx === -1) return null;
  if (tierIdx >= APEX_START_IDX) return tierIdx * 400 + (lp || 0);
  const divIdx = Math.max(0, DIVISIONS.indexOf(division));
  return tierIdx * 400 + divIdx * 100 + Math.min(lp || 0, 99);
}

function valueToRank(value) {
  if (value == null) return null;
  const tierIdx = Math.max(0, Math.min(TIER_ORDER.length - 1, Math.floor(value / 400)));
  const remainder = value - tierIdx * 400;
  const tierWord = TIER_ORDER[tierIdx];
  if (tierIdx >= APEX_START_IDX) {
    return { tier: tierWord.charAt(0) + tierWord.slice(1).toLowerCase(), lp: Math.round(remainder), icon: rankIconUrl(tierWord) };
  }
  const divIdx = Math.max(0, Math.min(3, Math.floor(remainder / 100)));
  return {
    tier: `${tierWord.charAt(0) + tierWord.slice(1).toLowerCase()} ${DIVISIONS[divIdx]}`,
    lp: Math.round(remainder % 100),
    icon: rankIconUrl(tierWord),
  };
}

function teamAverageRank(playerRows, getRank = (p) => p.stats?.rank) {
  const values = playerRows
    .map((p) => {
      const rank = getRank(p);
      return rank?.tier ? tierToValue(rank.tier, rank.lp) : null;
    })
    .filter((v) => v != null);
  if (!values.length) return null;
  return valueToRank(values.reduce((a, b) => a + b, 0) / values.length);
}

/* True average of raw LP values — unlike teamAverageRank's bucketed value
   (which clamps/derives LP from a 100-point-per-division remainder), this is
   a plain mean of whatever LP each player actually had. */
function teamAverageLP(playerRows, getRank) {
  const values = playerRows.map((p) => getRank(p)?.lp).filter((v) => v != null);
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function PlayerRow({ name, stats, loading, error, align }) {
  const reversed = align === 'right';
  return (
    <div className={`flex-1 flex flex-row items-center gap-4 px-6 border-b border-white/10 last:border-b-0 ${reversed ? 'flex-row-reverse' : ''}`}>
      <div className={`w-72 shrink-0 flex flex-col gap-1 ${reversed ? 'items-end' : 'items-start'}`}>
        <div
          className={`font-integral-regular text-white text-2xl leading-tight ${reversed ? 'text-right' : ''}`}
          style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}
        >
          {name || '—'}
        </div>
        {!loading && !error && stats?.topTraits?.length > 0 && (
          <div className={`flex flex-row items-center gap-2 ${reversed ? 'flex-row-reverse' : ''}`}>
            {stats.topTraits.map((t) => (
              t.icon && <img key={t.id} src={t.icon} alt="" title={t.name} style={{ width: 26, height: 26, flexShrink: 0 }} />
            ))}
          </div>
        )}
      </div>

      {loading && <div className="text-white/50 text-sm">Loading…</div>}
      {!loading && error && <div className="text-white/40 text-sm italic">Stats unavailable</div>}

      {!loading && !error && stats && (
        <>
          <div className={`flex flex-row items-center gap-2 w-56 shrink-0 ${reversed ? 'flex-row-reverse' : ''}`}>
            {stats.rank?.icon && <img src={stats.rank.icon} alt="" style={{ width: 34, height: 34, flexShrink: 0 }} />}
            <div className={`font-integral-regular text-white text-base leading-tight ${reversed ? 'text-right' : ''}`}>
              <div>{stats.rank?.tier || 'Unranked'}</div>
              {stats.rank?.lp != null && <div className="text-white/50 text-lg">{stats.rank.lp} LP</div>}
              {stats.previousSet?.rank?.tier && (
                <div className="text-white/60 text-sm">
                  Set {stats.previousSet.setNumber}: {stats.previousSet.rank.tier}
                  {stats.previousSet.rank.lp != null && ` (${stats.previousSet.rank.lp} LP)`}
                </div>
              )}
            </div>
          </div>

          <div className="text-white w-28 shrink-0 text-center">
            <div className="text-white/50 text-xs">AVP</div>
            <div className="font-integral-regular text-4xl">{stats.avgPlace ?? '—'}</div>
            {stats.previousSet?.avgPlace != null && (
              <div className="text-white/60 text-sm whitespace-nowrap">Set {stats.previousSet.setNumber}: {stats.previousSet.avgPlace}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TeamColumn({ teamData, defaultLogo, playerKeys, players, align }) {
  const reversed = align === 'right';
  const avgRank = teamAverageRank(players);
  const avgPrevRank = teamAverageRank(players, (p) => p.stats?.previousSet?.rank);
  const avgPrevLP = teamAverageLP(players, (p) => p.stats?.previousSet?.rank);
  const prevSetNumber = players.find((p) => p.stats?.previousSet?.setNumber)?.stats?.previousSet?.setNumber;

  return (
    <div className="flex-1 h-full flex flex-col bg-black/60 rounded-xl overflow-hidden">
      <div className={`flex flex-row items-center justify-between gap-4 px-6 py-6 bg-black/40 ${reversed ? 'flex-row-reverse' : ''}`}>
        <div className={`flex flex-row items-center gap-4 min-w-0 ${reversed ? 'flex-row-reverse text-right' : ''}`}>
          <img
            src={teamData?.logo || defaultLogo}
            onError={(e) => { e.target.src = defaultLogo; }}
            alt=""
            style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }}
          />
          <div className="font-integral-bold text-white text-4xl uppercase truncate">{teamData?.name || 'TBD'}</div>
        </div>

        {avgRank && (
          <div className={`flex flex-row items-center gap-3 shrink-0 ${reversed ? '' : 'flex-row-reverse'}`}>
            <img src={avgRank.icon} alt="" style={{ width: 56, height: 56, flexShrink: 0 }} />
            <div className={`leading-tight ${reversed ? 'text-left' : 'text-right'}`}>
              <div className="text-white/50 text-xs uppercase">Team Avg</div>
              <div className="font-integral-regular text-white text-2xl uppercase">{avgRank.tier}</div>
              <div className="text-white/50 text-sm">{avgRank.lp} LP</div>
              {avgPrevRank && (
                <div className="text-white/60 text-sm">
                  Set {prevSetNumber}: {avgPrevRank.tier}
                  {avgPrevLP != null && ` (${avgPrevLP} LP)`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col">
        {playerKeys.map((key, i) => (
          <PlayerRow key={key} {...players[i]} align={align} />
        ))}
      </div>
    </div>
  );
}

/**
 * Pre-match "team screen" for TFT — event logo + subtitle up top, then
 * Team 1 vs Team 2 side by side, 4 players each, with their tactics.tools
 * rank, average placement, and most-used traits.
 *
 * Reads Riot IDs (gameName#tagLine) straight from each player's name field
 * in the match data, so no extra dashboard input is needed beyond what's
 * already there. Players whose name isn't in that format are shown with
 * "Stats unavailable" rather than erroring the whole screen.
 */
export default function TFTTeamScreen() {
  const { state } = usePolledState(1000);
  const [statsByKey, setStatsByKey] = useState({});

  const cm = state?.currMatch || '1';
  const match = state?.matches?.[cm];
  const players = match?.players || {};

  const allKeys = [...TEAM1_KEYS, ...TEAM2_KEYS];
  const riotIds = allKeys.map((k) => players[k]?.name || '').join('|');

  useEffect(() => {
    if (!match) return;
    let cancelled = false;

    const load = () => {
      allKeys.forEach((key) => {
        const riotId = players[key]?.name;
        if (!riotId || !riotId.includes('#')) return;
        setStatsByKey((prev) => ({ ...prev, [key]: { ...prev[key], loading: true, error: null } }));
        fetchTftStats(riotId, TFT_REGION)
          .then((stats) => {
            if (cancelled) return;
            setStatsByKey((prev) => ({ ...prev, [key]: { stats, loading: false, error: null } }));
          })
          .catch((err) => {
            if (cancelled) return;
            setStatsByKey((prev) => ({ ...prev, [key]: { stats: null, loading: false, error: err.message } }));
          });
      });
    };

    load();
    const id = setInterval(load, REFRESH_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riotIds]);

  if (!state || !match) return null;

  const rowFor = (key) => ({
    name: players[key]?.name || '',
    stats: statsByKey[key]?.stats,
    loading: statsByKey[key]?.loading,
    error: statsByKey[key]?.error,
  });

  const defaultLogo = asset('/assets/game_logos/tft.png');

  return (
    <div className="stack-container" style={{ background: 'rgba(0,0,0,0.2)' }}>
      <div
        className="flex flex-col gap-6"
        style={{ position: 'absolute', top: '3%', bottom: '3%', left: '10%', right: '10%' }}
      >
        {/* Header — stream title + subtitle */}
        <div className="flex flex-col items-center gap-2">
          {state.streamTitle && (
            <div className="font-integral-bold text-white text-6xl uppercase text-center">{state.streamTitle}</div>
          )}
          {state.subtitle && (
            <div className="font-integral-bold text-white/80 text-lg uppercase tracking-wide mt-10">{state.subtitle}</div>
          )}
        </div>

        <div className="flex flex-row gap-6 flex-1 min-h-0">
          <TeamColumn teamData={match.team1} defaultLogo={defaultLogo} playerKeys={TEAM1_KEYS} players={TEAM1_KEYS.map(rowFor)} align="left" />
          <TeamColumn teamData={match.team2} defaultLogo={defaultLogo} playerKeys={TEAM2_KEYS} players={TEAM2_KEYS.map(rowFor)} align="right" />
        </div>
      </div>
    </div>
  );
}
