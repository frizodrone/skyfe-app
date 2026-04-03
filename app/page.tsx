"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search, Settings, Wind, Zap, CloudRain, Thermometer,
  Sun, Map, Clock3, User, Eye, Droplets, MapPin, LocateFixed, X, Star, Activity,
} from "lucide-react";
import { fetchWeather, reverseGeocode, searchCities, fetchKpIndex } from "@/lib/weather";
import { calculateFlightScore, getRiskNote, getMetricLevel } from "@/lib/score";
import AuthGuard, { useIsLoggedIn, LoginPromptModal } from "@/lib/AuthGuard";
import { supabase } from "@/lib/supabase";

type Level = "good" | "warn" | "risk";
type HourlyItem = { time: string; score: number; level: Level; label: string };

const LC: Record<Level, string> = {
  good: "#2dffb3", warn: "#ffd84d", risk: "#ff5a5f",
};

/* ───── Search Modal ───── */
function SearchModal({ onSelect, onClose }: { onSelect: (r: any) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Load favorites
  useEffect(() => {
    const loadFavs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setFavorites(data);
    };
    loadFavs();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.length < 2) { setResults([]); return; }
      setSearching(true);
      const d = await searchCities(query);
      setResults(d);
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#04090f]/95 backdrop-blur-xl p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cidade, bairro, CEP..."
            className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-slate-500" />
        </div>
        <button onClick={onClose} className="grid h-12 w-12 place-items-center rounded-2xl border border-white/8 bg-white/[0.04]">
          <X size={18} className="text-slate-400" />
        </button>
      </div>
      <button onClick={() => { onSelect(null); onClose(); }}
        className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3.5">
        <LocateFixed size={18} className="text-cyan-400" />
        <span className="text-[15px] font-medium text-cyan-400">Usar minha localização</span>
      </button>

      {/* Favorites */}
      {!query && favorites.length > 0 && (
        <div className="mb-3">
          <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Locais favoritos</p>
          {favorites.map((fav: any) => (
            <button key={fav.id} onClick={() => {
              onSelect({ name: fav.name, latitude: fav.latitude, longitude: fav.longitude, id: fav.id });
              onClose();
            }}
              className="flex w-full items-center gap-3 border-b border-white/[0.04] px-4 py-3 text-left">
              <Star size={14} className="fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-[15px] font-medium text-white">{fav.name}</span>
            </button>
          ))}
        </div>
      )}

      {searching && <p className="px-2 py-2 text-sm text-slate-500">Buscando...</p>}
      <div className="flex-1 overflow-y-auto">
        {results.map((r: any) => (
          <button key={r.id} onClick={() => { onSelect(r); onClose(); }}
            className="flex w-full flex-col gap-0.5 border-b border-white/[0.04] px-4 py-3.5 text-left">
            <span className="text-[15px] font-medium text-white">{r.name}</span>
            <span className="text-[13px] text-slate-400">{[r.admin1, r.country].filter(Boolean).join(", ")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───── Radar ───── */
function Radar({ score, level }: { score: number; level: Level }) {
  const color = LC[level];
  const circ = 2 * Math.PI * 76;
  const off = circ - (score / 100) * circ;
  return (
    <div className="relative h-[220px] w-[220px] animate-float">
      <svg width="220" height="220" viewBox="0 0 220 220" className="absolute inset-0 opacity-20">
        {[86, 68, 52, 36].map((r) => (<circle key={r} cx="110" cy="110" r={r} fill="none" stroke="#2dccff" strokeWidth="0.5" />))}
        <line x1="24" y1="110" x2="196" y2="110" stroke="#2dccff" strokeWidth="0.4" />
        <line x1="110" y1="24" x2="110" y2="196" stroke="#2dccff" strokeWidth="0.4" />
      </svg>
      <div className="absolute inset-4 overflow-hidden rounded-full animate-radar-spin opacity-30">
        <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(from 300deg, ${color}33, transparent 20%)` }} />
      </div>
      <svg width="220" height="220" viewBox="0 0 220 220" className="absolute inset-0">
        <circle cx="110" cy="110" r="76" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
        <circle cx="110" cy="110" r="76" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 110 110)"
          style={{ filter: `drop-shadow(0 0 14px ${color}66)`, transition: "stroke-dashoffset 1.2s ease-out, stroke 0.6s ease" }} />
      </svg>
      <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full border border-white/5 bg-[#04090f]/85">
        <div className="flex items-end justify-center gap-1">
          <span className="text-[56px] font-bold leading-none tracking-[-0.04em]" style={{ textShadow: `0 0 20px ${color}22` }}>{score}</span>
          <span className="mb-2 text-[20px] text-white/45">/100</span>
        </div>
        <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/40">Pontuação de voo</p>
      </div>
    </div>
  );
}

/* ───── Metric Card v2 ───── */
function MetricCard({ icon, title, value, unit, note, level }: {
  icon: React.ReactNode; title: string; value: string; unit: string; note: string; level: Level;
}) {
  const color = LC[level];
  return (
    <div
      className="relative flex min-h-[165px] flex-col overflow-hidden rounded-[18px] px-2.5 py-4 text-center transition-all duration-300"
      style={{
        background: `linear-gradient(168deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)`,
        border: `1px solid ${color}20`,
        boxShadow: `0 0 18px ${color}06, inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      {/* subtle top glow */}
      <div className="absolute -top-3 left-1/2 h-6 w-10 -translate-x-1/2 rounded-full opacity-35 blur-lg" style={{ background: color }} />

      {/* icon — fixed height */}
      <div className="relative z-10 flex h-[24px] items-center justify-center" style={{ color }}>
        {icon}
      </div>

      {/* title — fixed height to align across cards */}
      <div className="relative z-10 mt-2 flex h-[32px] items-center justify-center">
        <p className="whitespace-pre-line text-[9px] uppercase leading-tight tracking-[0.1em] text-slate-500">{title}</p>
      </div>

      {/* value — fixed height to align across cards */}
      <div className="relative z-10 mt-3 flex h-[30px] items-end justify-center">
        <p className="text-[24px] font-semibold leading-none tracking-tight text-white">{value}</p>
      </div>

      {/* unit — fixed height */}
      <div className="relative z-10 flex h-[18px] items-center justify-center">
        {unit ? <p className="text-[11px] text-slate-500">{unit}</p> : <span />}
      </div>

      {/* note — fixed height to align across cards */}
      <div className="relative z-10 flex h-[16px] items-center justify-center">
        <p className="text-[10px] font-medium" style={{ color: `${color}bb` }}>{note}</p>
      </div>
    </div>
  );
}

/* ───── Hourly Mini Card ───── */
function HourlyCard({ item }: { item: HourlyItem }) {
  const color = LC[item.level];
  return (
    <div
      className="flex flex-shrink-0 flex-col items-center gap-2.5 rounded-2xl px-5 py-4 transition-all duration-200"
      style={{
        background: `linear-gradient(180deg, ${color}0a 0%, transparent 100%)`,
        border: `1px solid ${color}1a`,
        minWidth: "80px",
      }}
    >
      <span
        className="h-[12px] w-[12px] rounded-full"
        style={{ background: color, boxShadow: `0 0 12px ${color}55` }}
      />
      <span className="text-[15px] font-semibold text-slate-100">{item.time}</span>
      <span className="text-[11px] font-medium" style={{ color: `${color}cc` }}>
        {item.level === "good" ? "Seguro" : item.level === "warn" ? "Cuidado" : "Risco"}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*                   HOME                      */
/* ═══════════════════════════════════════════ */
function HomeContent() {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [label, setLabel] = useState("...");
  const [level, setLevel] = useState<Level>("good");
  const [placeName, setPlaceName] = useState("Detectando...");
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState("");
  const [currentLat, setCurrentLat] = useState(-23.55);
  const [currentLon, setCurrentLon] = useState(-46.63);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [kpIndex, setKpIndex] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginFeature, setLoginFeature] = useState("");
  const isLoggedIn = useIsLoggedIn();

  const loadWeather = useCallback(async (lat: number, lon: number, name?: string) => {
    setLoading(true); setError("");
    setCurrentLat(lat); setCurrentLon(lon);
    try {
      const data = await fetchWeather(lat, lon);
      setWeather(data);
      const c = data.current;
      const rp = data.hourly?.precipitation_probability?.[0] ?? 0;
      // If actually raining, use 100% as rain probability for score
      const effectiveRain = (c.precipitation ?? 0) > 0 ? Math.max(rp, 80) : rp;
      // Fetch Kp index in parallel
      const kpData = await fetchKpIndex();
      setKpIndex(kpData.kp);
      const res = calculateFlightScore({ wind: c.wind_speed_10m, gust: c.wind_gusts_10m, rainProb: effectiveRain, temp: c.temperature_2m, kp: kpData.kp });
      setScore(res.score); setLabel(res.label); setLevel(res.level);
      if (name) { setPlaceName(name); } else { const geo = await reverseGeocode(lat, lon); setPlaceName(geo); }
      // Check if this location is a favorite
      checkFavorite(lat, lon);
    } catch { setError("Erro ao carregar clima."); }
    setLoading(false);
  }, []);

  const checkFavorite = async (lat: number, lon: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .gte("latitude", lat - 0.01)
        .lte("latitude", lat + 0.01)
        .gte("longitude", lon - 0.01)
        .lte("longitude", lon + 0.01)
        .limit(1);
      setIsFavorite((data?.length ?? 0) > 0);
    } catch { /* silent */ }
  };

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      setLoginFeature("favoritos");
      setShowLoginModal(true);
      return;
    }
    setSavingFav(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .gte("latitude", currentLat - 0.01)
          .lte("latitude", currentLat + 0.01)
          .gte("longitude", currentLon - 0.01)
          .lte("longitude", currentLon + 0.01);
        setIsFavorite(false);
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, name: placeName, latitude: currentLat, longitude: currentLon });
        setIsFavorite(true);
      }
    } catch { /* silent */ }
    setSavingFav(false);
  };

  const loadFromGeo = useCallback(() => {
    if (!navigator.geolocation) { loadWeather(-23.55, -46.63, "São Paulo, BR"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
      () => loadWeather(-23.55, -46.63, "São Paulo, BR"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [loadWeather]);

  useEffect(() => {
    // Verificar se veio coordenadas via URL (do mapa de zonas)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlLat = params.get("lat");
      const urlLon = params.get("lon");
      if (urlLat && urlLon) {
        loadWeather(parseFloat(urlLat), parseFloat(urlLon));
        // Limpar URL sem recarregar
        window.history.replaceState({}, "", "/");
        return;
      }
    }
    loadFromGeo();
  }, [loadFromGeo, loadWeather]);

  const handleSearchSelect = useCallback((result: any) => {
    if (!result) { loadFromGeo(); return; }
    const name = [result.name, result.admin1, result.country].filter(Boolean).join(", ");
    loadWeather(result.latitude, result.longitude, name);
  }, [loadWeather, loadFromGeo]);

  /* ── hourly data ── */
  const hourly: HourlyItem[] = useMemo(() => {
    if (!weather?.hourly?.time) return [];
    const now = new Date();
    const items: HourlyItem[] = [];
    for (let i = 0; i < weather.hourly.time.length && items.length < 8; i++) {
      const t = new Date(weather.hourly.time[i]);
      if (t < now) continue;
      const res = calculateFlightScore({
        wind: weather.hourly.wind_speed_10m?.[i] ?? 0,
        gust: weather.hourly.wind_gusts_10m?.[i] ?? 0,
        rainProb: weather.hourly.precipitation_probability?.[i] ?? 0,
        temp: weather.hourly.temperature_2m?.[i] ?? 20,
      });
      items.push({ time: t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), ...res });
    }
    return items;
  }, [weather]);

  const bestWindow = useMemo(() => {
    const good = hourly.filter((h) => h.level === "good");
    if (good.length >= 2) return `${good[0].time} e ${good[good.length - 1].time}`;
    if (good.length === 1) return good[0].time;
    return null;
  }, [hourly]);

  /* ── derived values ── */
  const wind = weather ? Math.round(weather.current.wind_speed_10m) : 0;
  const gust = weather ? Math.round(weather.current.wind_gusts_10m) : 0;
  const rainP = weather ? (weather.hourly?.precipitation_probability?.[0] ?? 0) : 0;
  const temp = weather ? Math.round(weather.current.temperature_2m) : 0;

  // Check real precipitation from multiple sources for accuracy
  const rainCurrent = weather?.current?.precipitation ?? 0;
  const rainCurrentRain = weather?.current?.rain ?? 0;
  // Check most recent hourly precipitation
  const recentHourlyPrecip = weather?.hourly?.precipitation?.[0] ?? 0;
  // Use the highest value from all sources
  const rainNow = Math.max(rainCurrent, rainCurrentRain, recentHourlyPrecip);

  const rainDisplay = rainNow > 0 ? `${rainNow.toFixed(1)}mm` : `${rainP}%`;
  const rainTitle = rainNow > 0 ? "CHUVA\nAGORA" : "CHUVA\nPROB.";
  const rainUnit = rainNow > 0 ? "agora" : "";
  const rainRiskVal = rainNow > 0 ? 100 : rainP;
  const rainNote = rainNow > 0 ? `Chovendo (${rainP}% prob.)` : getRiskNote("rain", rainP);

  /* ── per-metric risk level ── */
  const metrics = [
    { icon: <Wind size={20} />, title: "VENTO\nMÉDIO", value: weather ? `${wind}` : "--", unit: "km/h", note: getRiskNote("wind", wind), metricLevel: getMetricLevel("wind", wind) },
    { icon: <Zap size={20} />, title: "RAJADA\nMÁX", value: weather ? `${gust}` : "--", unit: "km/h", note: getRiskNote("gust", gust), metricLevel: getMetricLevel("gust", gust) },
    { icon: <CloudRain size={20} />, title: rainTitle, value: weather ? rainDisplay : "--", unit: rainUnit, note: rainNote, metricLevel: getMetricLevel("rain", rainRiskVal) },
    { icon: <Thermometer size={20} />, title: "TEMP", value: weather ? `${temp}°` : "--", unit: "", note: getRiskNote("temp", temp), metricLevel: getMetricLevel("temp", temp) },
    { icon: <Activity size={20} />, title: "ÍNDICE\nKP", value: weather ? `${kpIndex.toFixed(1)}` : "--", unit: "", note: getRiskNote("kp", kpIndex), metricLevel: getMetricLevel("kp", kpIndex) },
  ];

  /* ── Splash Screen SkyFe branded ── */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="pointer-events-none fixed inset-0 opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.1),_transparent_50%)]" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo animada */}
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-cyan-400/20 bg-white/[0.03] shadow-[0_0_40px_rgba(45,204,255,0.15)]">
              <div className="relative h-[30px] w-[30px]">
                <span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0s" }} />
                <span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
                <span className="absolute left-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
                <span className="absolute right-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
                <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-cyan-400 animate-pulse-dot" />
              </div>
            </div>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight">Sky<span className="text-cyan-400">Fe</span></h1>
          {/* Loading bar */}
          <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
          </div>
          <p className="text-[13px] text-slate-500">Carregando condições de voo...</p>
        </div>
      </main>
    );
  }

  /* ═══ RENDER ═══ */
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#04090f] text-white">
      {/* ambient bg glow */}
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      {showSearch && <SearchModal onSelect={handleSearchSelect} onClose={() => setShowSearch(false)} />}

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-28 pt-6">
        {/* ─── Header ─── */}
        <header className="mb-6 flex items-center justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-[20px] border border-cyan-400/[0.12] bg-white/[0.03]">
            <div className="relative h-[18px] w-[18px]">
              <span className="absolute left-0 top-0 h-[6px] w-[6px] rounded-full border-[1.5px] border-cyan-400/90" />
              <span className="absolute right-0 top-0 h-[6px] w-[6px] rounded-full border-[1.5px] border-cyan-400/90" />
              <span className="absolute bottom-0 left-0 h-[6px] w-[6px] rounded-full border-[1.5px] border-cyan-400/90" />
              <span className="absolute bottom-0 right-0 h-[6px] w-[6px] rounded-full border-[1.5px] border-cyan-400/90" />
              <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-cyan-400" />
            </div>
          </div>
          <h1 className="text-[34px] font-bold tracking-tight">Sky<span className="text-cyan-400">Fe</span></h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(true)} className="grid h-12 w-12 place-items-center rounded-[20px] border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
              <Search size={19} />
            </button>
            <button onClick={() => {
              if (!isLoggedIn) { setLoginFeature("configurações de limites"); setShowLoginModal(true); }
              else { window.location.href = "/configuracoes"; }
            }} className="grid h-12 w-12 place-items-center rounded-[20px] border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
              <Settings size={19} />
            </button>
          </div>
        </header>

        {/* ─── Location ─── */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <p className="inline-flex items-center gap-1.5 text-[17px] font-medium text-slate-100">{placeName} <MapPin size={14} className="text-cyan-400" /></p>
            <button onClick={toggleFavorite} disabled={savingFav}
              className="transition hover:scale-110 disabled:opacity-50">
              <Star size={16} className={isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-600"} />
            </button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">dados em tempo real</p>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3 text-[14px] text-red-200">{error}</div>}

        {/* ─── Metric Cards (PRIMEIRO) ─── */}
        <section className="mb-6 grid grid-cols-5 gap-2">
          {metrics.map((m) => (
            <MetricCard
              key={m.title}
              icon={m.icon}
              title={m.title}
              value={m.value}
              unit={m.unit}
              note={m.note}
              level={m.metricLevel}
            />
          ))}
        </section>

        {/* ─── Score / Radar Section ─── */}
        <section className="relative mb-10 overflow-hidden rounded-[28px] border border-cyan-400/[0.12] bg-[linear-gradient(180deg,rgba(10,18,32,0.98),rgba(4,9,15,1))] px-5 py-8 shadow-[0_0_50px_rgba(45,204,255,0.06)]">
          {/* double border glow */}
          <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-cyan-400/[0.06]" style={{ margin: "3px" }} />
          {/* radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(45,204,255,0.1),_transparent_50%)]" />
          {/* radar rings background */}
          <div className="pointer-events-none absolute left-1/2 top-[33%] h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 rounded-full border border-cyan-300/[0.08]" />
            <div className="absolute inset-[22px] rounded-full border border-cyan-300/[0.06]" />
            <div className="absolute inset-[44px] rounded-full border border-cyan-300/[0.06]" />
            <div className="absolute inset-[66px] rounded-full border border-cyan-300/[0.06]" />
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-300/[0.06]" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan-300/[0.06]" />
            <div className="absolute inset-[18px] rounded-full animate-radar-spin" style={{ background: `conic-gradient(from 310deg, rgba(255,255,255,0.1), ${LC[level]}12, transparent 20%)`, filter: "blur(3px)" }} />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <Radar score={score} level={level} />

            {/* status badge */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ background: `${LC[level]}10`, border: `1px solid ${LC[level]}20` }}>
              <span className="h-[7px] w-[7px] rounded-full animate-pulse-dot" style={{ background: LC[level] }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: LC[level] }}>
                {level === "good" ? "condição ideal" : level === "warn" ? "atenção requerida" : "condição adversa"}
              </span>
            </div>

            {/* main label */}
            <h2 className="mt-3 text-center text-[28px] font-bold uppercase tracking-tight"
              style={{ color: LC[level], textShadow: `0 0 24px ${LC[level]}20` }}>
              {label}
            </h2>

            {/* quick summary */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[13px] text-slate-300">
              <span className="inline-flex items-center gap-1.5"><Wind size={13} className="text-slate-400" />{wind <= 15 ? "Vento ideal" : "Vento forte"}</span>
              <span className="inline-flex items-center gap-1.5"><Droplets size={13} className="text-slate-400" />{rainNow > 0 ? "Chovendo agora" : rainP <= 20 ? "Sem chuva" : "Chuva provável"}</span>
              <span className="inline-flex items-center gap-1.5"><Eye size={13} className="text-slate-400" />Boa visibilidade</span>
            </div>
          </div>
        </section>

        {/* ─── Hourly Forecast v2 (mini cards, horizontal scroll) ─── */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[20px] font-bold tracking-tight">Previsão por hora</h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-500"><span className="h-[8px] w-[8px] rounded-full bg-[#2dffb3]" />Seguro</span>
              <span className="flex items-center gap-1 text-slate-500"><span className="h-[8px] w-[8px] rounded-full bg-[#ffd84d]" />Cuidado</span>
              <span className="flex items-center gap-1 text-slate-500"><span className="h-[8px] w-[8px] rounded-full bg-[#ff5a5f]" />Risco</span>
            </div>
          </div>

          {/* scrollable mini cards */}
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
            {hourly.map((h) => (
              <HourlyCard key={h.time} item={h} />
            ))}
          </div>

          {/* best window */}
          {bestWindow && (
            <div className="mt-6 rounded-2xl border border-cyan-400/[0.1] bg-cyan-400/[0.04] px-4 py-3.5 text-center">
              <p className="inline-flex items-center gap-2 text-[13px] text-cyan-300">
                <LocateFixed size={13} />
                Próxima janela recomendada entre <span className="font-semibold">{bestWindow}</span>
              </p>
            </div>
          )}
        </section>

        {/* ─── CTA Button ─── */}
        <button onClick={() => {
          if (!isLoggedIn) {
            setLoginFeature("análise detalhada");
            setShowLoginModal(true);
          } else {
            window.location.href = `/analise?lat=${currentLat}&lon=${currentLon}&name=${encodeURIComponent(placeName)}`;
          }
        }}
          className="mb-6 block w-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-4 text-center text-[16px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105">
          Ver análise detalhada
        </button>

        {/* Login Prompt Modal */}
        {showLoginModal && (
          <LoginPromptModal feature={loginFeature} onClose={() => setShowLoginModal(false)} />
        )}

        {/* ─── Bottom Nav ─── */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#04090f]/80 backdrop-blur-2xl">
          <div className="mx-auto grid max-w-md grid-cols-4 px-4 py-2.5 text-center text-[11px]">
            {[
              { icon: <Sun size={21} />, label: "Clima", active: true, href: "/" },
              { icon: <Map size={21} />, label: "Zonas", active: false, href: "/zonas" },
              { icon: <Clock3 size={21} />, label: "Previsão", active: false, href: `/previsao?lat=${currentLat}&lon=${currentLon}&name=${encodeURIComponent(placeName)}` },
              { icon: <User size={21} />, label: "Perfil", active: false, href: "/perfil" },
            ].map((tab) => (
              <Link key={tab.label} href={tab.href}
                className={`flex flex-col items-center gap-1 transition ${tab.active ? "text-cyan-400" : "text-slate-500"}`}>
                <div className={`grid h-8 w-12 place-items-center rounded-xl transition ${tab.active ? "bg-cyan-400/[0.1]" : ""}`}>
                  {tab.icon}
                </div>
                <span className={tab.active ? "font-semibold" : ""}>{tab.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}

export default function Home() {
  return <AuthGuard><HomeContent /></AuthGuard>;
}