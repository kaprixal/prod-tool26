import { useState, useEffect } from 'react';
import { usePolledState } from '../../hooks/usePolledState';
import { fetchTftMatchHistory } from '../../api';

/* Riot region routing value used for lookups. Change if the tournament
   plays out of a different region. */
const TFT_REGION = 'na1';

const QUEUE_LABELS = { 1100: 'Ranked', 1090: 'Normal' };
const STAR_COLORS = { 1: '#8a5a3a', 2: '#9ca3af', 3: '#eab308' };

/* Fixed layout — only ever shows the single most recent game, so there's no
   need for the dynamic multi-card scaling this page used to have. */
const HEADER_H = 44;
const COL_HEADER_H = 28;
const ROW_H = 78;
const UNIT_ICON_SIZE = 54;
const UNIT_GAP = 12;
const TRAIT_ICON_SIZE = 24;
const TRAIT_GAP = 8;
const MAX_UNITS = 11; // TFT board can exceed 10 with certain mechanics (e.g. summons)

const COL = { placement: 28, name: 260, level: 48, gold: 52 };
const ROW_GAP = 20;
const TRAITS_W = 6 * TRAIT_ICON_SIZE + 5 * TRAIT_GAP;
const UNITS_MIN_W = MAX_UNITS * UNIT_ICON_SIZE + (MAX_UNITS - 1) * UNIT_GAP;

const CARD_H = HEADER_H + COL_HEADER_H + ROW_H * 8;

function formatTimestamp(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* Item icons sit as a strip along the bottom-left of the unit's portrait;
   star badge sits top-right — unit icon itself was enlarged so both are more
   visible than the original size. */
const ITEM_ICON_SIZE = Math.round(UNIT_ICON_SIZE * 0.34);

function UnitIcon({ u }) {
  const badgeSize = Math.round(UNIT_ICON_SIZE * 0.44);
  return (
    <div
      className="relative shrink-0"
      style={{ width: UNIT_ICON_SIZE, height: UNIT_ICON_SIZE, marginBottom: ITEM_ICON_SIZE * 0.6 }}
      title={`${u.name} ${u.starLevel}★${u.items?.length ? ' — ' + u.items.map((i) => i.name).join(', ') : ''}`}
    >
      {u.icon
        ? <img src={u.icon} alt="" style={{ width: UNIT_ICON_SIZE, height: UNIT_ICON_SIZE, borderRadius: 3 }} />
        : <div className="rounded bg-white/10" style={{ width: UNIT_ICON_SIZE, height: UNIT_ICON_SIZE }} />}
      <div
        className="absolute flex items-center justify-center font-integral-bold text-white"
        style={{
          top: -3, right: -3, width: badgeSize, height: badgeSize, borderRadius: '50%',
          background: STAR_COLORS[u.starLevel] || '#555',
          fontSize: Math.max(7, Math.round(badgeSize * 0.62)),
          lineHeight: `${badgeSize}px`,
        }}
      >
        {u.starLevel}
      </div>
      {u.items?.length > 0 && (
        <div className="absolute flex flex-row" style={{ left: 0, bottom: -ITEM_ICON_SIZE * 0.6, gap: 1 }}>
          {u.items.slice(0, 3).map((it, i) => (
            it.icon
              ? <img key={i} src={it.icon} alt="" title={it.name} style={{ width: ITEM_ICON_SIZE, height: ITEM_ICON_SIZE, borderRadius: 2, border: '1px solid rgba(0,0,0,0.6)' }} />
              : <div key={i} className="bg-white/20" style={{ width: ITEM_ICON_SIZE, height: ITEM_ICON_SIZE, borderRadius: 2 }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ColumnHeader() {
  return (
    <div
      className="flex flex-row items-center px-4 border-b border-white/10 font-integral-regular text-white/40 uppercase text-sm"
      style={{ height: COL_HEADER_H, gap: ROW_GAP }}
    >
      <div className="shrink-0 text-center" style={{ width: COL.placement }}>#</div>
      <div className="shrink-0" style={{ width: COL.name }}>Player</div>
      <div className="shrink-0 text-center" style={{ width: COL.level }}>Lvl</div>
      <div className="shrink-0 text-center" style={{ width: COL.gold }}>Gold</div>
      <div className="flex-1" style={{ minWidth: UNITS_MIN_W }}>Units</div>
      <div className="shrink-0" style={{ width: TRAITS_W }}>Traits</div>
    </div>
  );
}

function ParticipantRow({ p, highlighted }) {
  return (
    <div
      className={`flex flex-row items-center px-4 ${highlighted ? 'bg-blue-500/20' : ''}`}
      style={{ height: ROW_H, gap: ROW_GAP }}
    >
      <div className="font-integral-bold text-white shrink-0 text-center text-xl" style={{ width: COL.placement }}>{p.placement}</div>
      <div className="font-integral-regular text-white shrink-0 truncate text-lg" style={{ width: COL.name }}>{p.riotId}</div>
      <div className="font-integral-regular text-white/70 shrink-0 text-center text-base" style={{ width: COL.level }}>{p.level}</div>
      <div className="font-integral-regular text-white/70 shrink-0 text-center text-base" style={{ width: COL.gold }}>{p.goldLeft}g</div>
      <div className="flex flex-row items-center flex-1 overflow-hidden" style={{ gap: UNIT_GAP, minWidth: UNITS_MIN_W }}>
        {p.units.map((u) => (
          <UnitIcon key={u.id} u={u} />
        ))}
      </div>
      <div className="flex flex-row items-center shrink-0 overflow-hidden" style={{ width: TRAITS_W, gap: TRAIT_GAP }}>
        {p.traits.slice(0, 6).map((t) => (
          t.icon
            ? <img key={t.id} src={t.icon} alt="" title={`${t.name} ${t.tier}`} style={{ width: TRAIT_ICON_SIZE, height: TRAIT_ICON_SIZE, flexShrink: 0 }} />
            : <div key={t.id} className="rounded-full bg-white/10" style={{ width: TRAIT_ICON_SIZE, height: TRAIT_ICON_SIZE, flexShrink: 0 }} title={t.name} />
        ))}
      </div>
    </div>
  );
}

function LobbyCard({ match, highlightRiotId }) {
  return (
    <div className="bg-black/60 rounded-lg overflow-hidden" style={{ height: CARD_H }}>
      <div className="flex flex-row items-center justify-between px-4 bg-black/40" style={{ height: HEADER_H }}>
        <div className="font-integral-bold text-white uppercase text-lg">{formatTimestamp(match.timestamp)}</div>
        <div className="font-integral-regular text-white/60 uppercase text-base">
          {QUEUE_LABELS[match.queueId] || `Queue ${match.queueId}`} · {match.patch} · {formatDuration(match.gameDuration)}
        </div>
      </div>
      <ColumnHeader />
      {match.participants.map((p) => (
        <ParticipantRow key={p.riotId} p={p} highlighted={p.riotId === highlightRiotId} />
      ))}
    </div>
  );
}

/**
 * Lobby review page — shows the full 8-player lobby breakdown (placement,
 * level, gold left, units + star levels, traits) for a player's
 * most recent normal game. Which player is controlled from the
 * dashboard's Live tab (per-match "Lobby History Player" selector, replacing
 * the SWAP button for TFT matches), not here, so this page stays a clean
 * display when pulled up as an OBS source.
 * Sourced from metatft's match-file mirror of Riot's official match data.
 */
export default function TFTLobbyHistory() {
  const { state } = usePolledState(1000);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cm = state?.currMatch || '1';
  const match = state?.matches?.[cm];
  const players = match?.players || {};

  const selectedKey = state?.tftLobbyHistoryPlayerKey || 'p1';
  const selectedRiotId = players[selectedKey]?.name || '';

  useEffect(() => {
    if (!selectedRiotId || !selectedRiotId.includes('#')) {
      setMatches([]);
      setError(selectedRiotId ? `"${selectedRiotId}" isn't a Riot ID (expected Name#Tag)` : null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTftMatchHistory(selectedRiotId, TFT_REGION, 1)
      .then((data) => { if (!cancelled) setMatches(data.matches || []); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRiotId]);

  if (!state) return null;

  const lastGame = matches[0];

  return (
    <div className="stack-container">
      <div
        className="flex flex-col justify-end"
        style={{ position: 'absolute', top: '3%', bottom: '4%', left: '10%', right: '10%' }}
      >
        <div className="flex flex-row items-center justify-between px-2 mb-3">
          <div className="font-built-bold text-white text-2xl uppercase">TFT Lobby History</div>
          {selectedRiotId && <div className="font-integral-regular text-white/60 text-base uppercase">{selectedRiotId}</div>}
        </div>

        {loading && <div className="font-integral-regular text-white/60 px-2">Loading…</div>}
        {!loading && error && <div className="font-integral-regular text-red-400 px-2">{error}</div>}
        {!loading && !error && !lastGame && (
          <div className="font-integral-regular text-white/60 px-2">No recent normal games found.</div>
        )}
        {!loading && !error && lastGame && (
          <LobbyCard match={lastGame} highlightRiotId={selectedRiotId} />
        )}
      </div>
    </div>
  );
}
