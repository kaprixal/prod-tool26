import React, { useState, useEffect } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "") + "/api/hero-counter-stats";
const DEADLOCK_API = "https://assets.deadlock-api.com/v2/heroes";

const SELECT = "w-full bg-gray-800 h-8 rounded-md text-xs px-1 truncate";
const INPUT  = "w-full bg-gray-800 h-8 rounded-md text-xs px-1";
const LABEL  = "text-xs text-gray-400 mb-0.5";

function HeroSelect({ label, name, value, onChange, heroes }) {
  return (
    <div className="flex flex-col">
      <label className={LABEL}>{label}</label>
      <select className={SELECT} name={name} value={value} onChange={onChange}>
        <option value="">Select hero...</option>
        {heroes.map((h) => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </select>
    </div>
  );
}

export default function HeroCounterStatsDashboard() {
  const [params, setParams] = useState({
    hero_id: "",
    enemy_hero_id: "",
    same_lane_filter: true,
    min_unix_timestamp: "",
  });
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(DEADLOCK_API)
      .then((r) => r.json())
      .then((list) =>
        setHeroes(
          list.filter((h) => h.name).sort((a, b) => a.name.localeCompare(b.name))
        )
      )
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = Object.entries(params)
        .filter(([_, v]) => v !== "" && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      const res = await fetch(`${API_URL}?${query}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      localStorage.setItem("heroCounterStats", JSON.stringify(json));
      localStorage.setItem("heroCounterStatsParams", JSON.stringify(params));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setParams((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleReset = () =>
    setParams({ hero_id: "", enemy_hero_id: "", same_lane_filter: true, min_unix_timestamp: "" });

  return (
    <div className="text-sm">

      {/* Hero selection */}
      <div className="mb-2 p-2 bg-gray-900 rounded-lg space-y-2">
        <h2 className="text-gray-400">Hero Counter Stats</h2>

        <div className="grid grid-cols-2 gap-2">
          <HeroSelect label="Hero" name="hero_id" value={params.hero_id} onChange={handleChange} heroes={heroes} />
          <HeroSelect label="Enemy Hero" name="enemy_hero_id" value={params.enemy_hero_id} onChange={handleChange} heroes={heroes} />
        </div>

        {/* From date */}
        <div className="flex flex-col">
          <label className={LABEL}>From date</label>
          <input
            className={INPUT + " [color-scheme:dark]"}
            type="date"
            name="min_unix_timestamp"
            value={
              params.min_unix_timestamp
                ? new Date(params.min_unix_timestamp * 1000).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => {
              const dateStr = e.target.value;
              const unix = dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : "";
              setParams((prev) => ({ ...prev, min_unix_timestamp: unix }));
            }}
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleReset}
          className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-200"
        >
          ✕
        </button>
        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-400 disabled:opacity-60 px-6 py-2 rounded-lg text-white text-sm"
        >
          {loading ? "Loading…" : "Apply"}
        </button>
      </div>

    </div>
  );
}