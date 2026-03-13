import React, { useState, useEffect } from "react";

const DEADLOCK_API = "https://assets.deadlock-api.com/v2/heroes";

function getMatchLogosAndNames() {
  try {
    const raw = localStorage.getItem("prodToolState");
    if (!raw) return {};
    const state = JSON.parse(raw);
    const cm = state.currMatch || "1";
    const match = state.matches?.[cm];
    const gameLogoMap = { ow2: "ow", lol: "lol", val: "val", mr: "mr", dl: "dl" };
    const defaultLogo = `/assets/game_logos/${gameLogoMap[match?.game] || "blank"}.png`;
    return {
      t1logo: match?.team1?.logo || defaultLogo,
      t2logo: match?.team2?.logo || defaultLogo,
      t1name: match?.team1?.name || "Team 1",
      t2name: match?.team2?.name || "Team 2",
      defaultLogo,
    };
  } catch {
    return {};
  }
}

function fmt(val) {
  if (val === null || val === undefined) return "—";
  if (typeof val === "number" && val >= 1000000)
    return (val / 1000000).toFixed(1) + "M";
  if (typeof val === "number" && val >= 1000)
    return (val / 1000).toFixed(1) + "K";
  return val;
}

function wrClass(wr) {
  if (wr >= 55) return "text-green-400";
  if (wr >= 45) return "text-yellow-400";
  return "text-red-400";
}

function barPct(hero, enemy) {
  const total = (hero || 0) + (enemy || 0);
  if (!total) return 50;
  return Math.round((hero / total) * 100);
}

function StatCol({ label, heroVal, enemyVal }) {
  const pct = barPct(heroVal, enemyVal);
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-2 px-4 py-3 border-r border-white/5 last:border-r-0">
      <span className="text-sm font-bold uppercase tracking-widest text-white/40">{label}</span>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-blue-300">{fmt(heroVal)}</span>
        <span className="text-xs font-semibold text-white/20">vs</span>
        <span className="text-3xl font-bold text-red-300">{fmt(enemyVal)}</span>
      </div>
      <div className="w-4/5 h-1 rounded-full bg-red-400/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-400/70"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HeroCard({ heroData, side, heroId, teamLogo, defaultLogo, teamName }) {
  const isEnemy = side === "enemy";
  return (
    <div
      className={`flex items-center gap-5 flex-1 rounded-2xl px-7 py-4 bg-black/10 backdrop-blur border border-white/8
        ${isEnemy
          ? "flex-row-reverse text-right border-l-0 border-r-[3px] border-r-red-500"
          : "border-l-[3px] border-l-blue-500"
        }`}
    >
      {/* Hero icon */}
      {heroData?.images?.icon_hero_card_webp ? (
        <img
          className="rounded-xl object-cover flex-shrink-0"
          style={{ width: 72, height: 72 }}
          src={heroData.images.icon_hero_card_webp}
          alt={heroData.name}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-xl bg-white/5 text-white/20 text-2xl flex-shrink-0"
          style={{ width: 72, height: 72 }}
        >
          ?
        </div>
      )}

      {/* Hero info */}
      <div className="flex flex-col gap-1 flex-1">
        <span className={`text-xs font-bold uppercase tracking-widest ${isEnemy ? "text-red-500" : "text-blue-500"}`}>
          {isEnemy ? "Enemy Hero" : "Hero"}
        </span>
        <span className="text-4xl font-bold text-white leading-none">
          {heroData?.name ?? "Unknown"}
        </span>
        {/* Team name */}
        <span className="text-xs font-bold text-white/60">{teamName}</span>
        <span className="text-xs text-white/25">ID {heroId}</span>
      </div>

      {/* Team logo — inside the card, on the far side */}
      {teamLogo && (
        <img
          src={teamLogo}
          onError={e => { if (defaultLogo) e.target.src = defaultLogo; }}
          alt={isEnemy ? "Team 2 Logo" : "Team 1 Logo"}
          className="w-16 h-16 object-contain rounded-xl border border-white/10 bg-black/20 flex-shrink-0"
        />
      )}
    </div>
  );
}

export default function HeroCounterStatsTable() {
  const [data, setData] = useState([]);
  const [heroes, setHeroes] = useState({});
  const [heroId, setHeroId] = useState(null);
  const [enemyHeroId, setEnemyHeroId] = useState(null);
  const [logos, setLogos] = useState({ t1logo: '', t2logo: '', t1name: '', t2name: '', defaultLogo: '' });

  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem("heroCounterStats");
      if (stored) setData(JSON.parse(stored));

      const storedParams = localStorage.getItem("heroCounterStatsParams");
      if (storedParams) {
        const p = JSON.parse(storedParams);
        if (p.hero_id) setHeroId(Number(p.hero_id));
        if (p.enemy_hero_id) setEnemyHeroId(Number(p.enemy_hero_id));
      }

      // Always update logos from match state
      setLogos(getMatchLogosAndNames());
    };

    load(); // load on mount
    window.addEventListener("storage", load); // reload when dashboard writes
    return () => window.removeEventListener("storage", load);
  }, []);

  useEffect(() => {
    fetch(DEADLOCK_API)
      .then((r) => r.json())
      .then((list) => {
        const map = {};
        list.forEach((h) => { map[h.id] = h; });
        setHeroes(map);
      })
      .catch(() => {});
  }, []);

  const row = data[0] ?? null;
  const wr = row?.matches_played > 0
    ? ((row.wins / row.matches_played) * 100).toFixed(1)
    : null;
  const winPct = wr ? parseFloat(wr) : 50;

  return (
    <div className="w-[1920px] h-[1080px] flex items-center justify-center bg-transparent">
    <div className="w-[1600px] h-[900px] flex flex-col gap-5 px-12 py-8 bg-transparent overflow-hidden">

      {/* Hero header */}
      <div className="flex items-stretch gap-5 flex-shrink-0 h-28">
        <HeroCard
          heroData={heroes[heroId]}
          side="hero"
          heroId={heroId}
          teamLogo={logos.t1logo}
          defaultLogo={logos.defaultLogo}
          teamName={logos.t1name}
        />
        <span className="flex items-center text-2xl font-bold text-white/20 tracking-widest flex-shrink-0">VS</span>
        <HeroCard
          heroData={heroes[enemyHeroId]}
          side="enemy"
          heroId={enemyHeroId}
          teamLogo={logos.t2logo}
          defaultLogo={logos.defaultLogo}
          teamName={logos.t2name}
        />
      </div>

      {!row ? (
        <div className="flex-1 flex items-center justify-center text-sm font-bold uppercase tracking-widest text-white/20">
          No data — apply filters in the dashboard
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-4 flex-shrink-0 h-16 px-7 rounded-2xl bg-black/10 backdrop-blur border border-white/8">
            <div className="flex flex-col items-center min-w-[80px] gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Matches</span>
              <span className="text-xl font-bold text-white">{fmt(row.matches_played)}</span>
            </div>
            <div className="w-px h-8 bg-white/10 flex-shrink-0" />
            <div className="flex flex-col items-center min-w-[80px] gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Wins</span>
              <span className="text-xl font-bold text-white">{fmt(row.wins)}</span>
            </div>
            <div className="w-px h-8 bg-white/10 flex-shrink-0" />
            <div className="flex flex-col items-center min-w-[80px] gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Win Rate</span>
              <span className={`text-xl font-bold ${wr ? wrClass(winPct) : "text-white"}`}>
                {wr ? `${wr}%` : "—"}
              </span>
            </div>
            <div className="w-px h-8 bg-white/10 flex-shrink-0" />
            <div className="flex flex-col items-center min-w-[160px] gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Based on</span>
              <span className="text-sm font-bold text-white/60">Ascendant 1+ Ranks</span>
            </div>
            <div className="w-px h-8 bg-white/10 flex-shrink-0" />
            <div className="flex flex-col flex-1 gap-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-blue-300">{heroes[heroId]?.name ?? `Hero ${heroId}`}</span>
                <span className="text-red-300">{heroes[enemyHeroId]?.name ?? `Hero ${enemyHeroId}`}</span>
              </div>
              <div className="h-1.5 rounded-full bg-red-400/25 overflow-hidden">
                <div className="h-full rounded-full bg-blue-400" style={{ width: `${winPct}%` }} />
              </div>
            </div>
          </div>

          {/* Stat sections */}
          <div className="flex flex-col flex-1 gap-3 overflow-hidden">

            {/* Combat */}
            <div className="flex flex-col flex-1 rounded-2xl bg-black/10 backdrop-blur border border-white/8 overflow-hidden">
              <div className="px-6 py-2.5 border-b border-white/6 flex-shrink-0">
                <span className="text-base font-bold uppercase tracking-widest text-white/40">Combat</span>
              </div>
              <div className="flex flex-1">
                <StatCol label="Kills"   heroVal={row.kills}      enemyVal={row.enemy_kills} />
                <StatCol label="Deaths"  heroVal={row.deaths}     enemyVal={row.enemy_deaths} />
                <StatCol label="Assists" heroVal={row.assists}    enemyVal={row.enemy_assists} />
                <StatCol label="Obj Dmg" heroVal={row.obj_damage} enemyVal={row.enemy_obj_damage} />
              </div>
            </div>

            {/* Economy */}
            <div className="flex flex-col flex-1 rounded-2xl bg-black/10 backdrop-blur border border-white/8 overflow-hidden">
              <div className="px-6 py-2.5 border-b border-white/6 flex-shrink-0">
                <span className="text-base font-bold uppercase tracking-widest text-white/40">Economy</span>
              </div>
              <div className="flex flex-1">
                <StatCol label="Networth"  heroVal={row.networth}  enemyVal={row.enemy_networth} />
                <StatCol label="Last Hits" heroVal={row.last_hits} enemyVal={row.enemy_last_hits} />
                <StatCol label="Creeps"    heroVal={row.creeps}    enemyVal={row.enemy_creeps} />
                <StatCol label="Denies"    heroVal={row.denies}    enemyVal={row.enemy_denies} />
              </div>
            </div>

          </div>
        </>
      )}
    </div>
    </div>
  );
}