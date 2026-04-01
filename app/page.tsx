"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Search, Settings, Wind, Zap, CloudRain, Thermometer,
  Sun, Map, Clock3, User, Eye, Droplets, MapPin, LocateFixed, X,
} from "lucide-react";
import { fetchWeather, reverseGeocode, searchCities } from "@/lib/weather";
import { calculateFlightScore, getRiskNote } from "@/lib/score";

type Level = "good" | "warn" | "risk";
type HourlyItem = { time: string; score: number; level: Level; label: string };

const LC: Record<Level, string> = {
  good: "#2dffb3", warn: "#ffd84d", risk: "#ff5a5f",
};

function SearchModal({ onSelect, onClose }: { onSelect: (r: any) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
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
            placeholder="Buscar cidade, bairro..."
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

function Radar({ score, level }: { score: number; level: Level }) {
  const color = LC[level];
  const circ = 2 * Math.PI * 62;
  const off = circ - (score / 100) * circ;
  return (
    <div className="relative h-[180px] w-[180px] animate-float">
      <svg width="180" height="180" viewBox="0 0 180 180" className="absolute inset-0 opacity-20">
        {[70, 56, 42, 28].map((r) => (<circle key={r} cx="90" cy="90" r={r} fill="none" stroke="#2dccff" strokeWidth="0.5" />))}
        <line x1="20" y1="90" x2="160" y2="90" stroke="#2dccff" strokeWidth="0.4" />
        <line x1="90" y1="20" x2="90" y2="160" stroke="#2dccff" strokeWidth="0.4" />
      </svg>
      <div className="absolute inset-4 overflow-hidden rounded-full animate-radar-spin opacity-30">
        <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(from 300deg, ${color}33, transparent 20%)` }} />
      </div>
      <svg width="180" height="180" viewBox="0 0 180 180" className="absolute inset-0">
        <circle cx="90" cy="90" r="62" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
        <circle cx="90" cy="90" r="62" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 90 90)"
          style={{ filter: `drop-shadow(0 0 12px ${color}66)`, transition: "stroke-dashoffset 1.2s ease-out, stroke 0.6s ease" }} />
      </svg>
      <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full border border-white/5 bg-[#04090f]/85">
        <div className="flex items-end justify-center gap-1">
          <span className="text-[48px] font-bold leading-none tracking-[-0.04em]" style={{ textShadow: `0 0 20px ${color}22` }}>{score}</span>
          <span className="mb-1.5 text-[18px] text-white/45">/100</span>
        </div>
        <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-white/40">Pontuação de voo</p>
      </div>
    </div>
  );
}export default function Home() {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [label, setLabel] = useState("...");
  const [level, setLevel] = useState<Level>("good");
  const [placeName, setPlaceName] = useState("Detectando...");
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState("");

  const loadWeather = useCallback(async (lat: number, lon: number, name?: string) => {
    setLoading(true); setError("");
    try {
      const data = await fetchWeather(lat, lon);
      setWeather(data);
      const c = data.current;
      const rp = data.hourly?.precipitation_probability?.[0] ?? 0;
      const res = calculateFlightScore({ wind: c.wind_speed_10m, gust: c.wind_gusts_10m, rainProb: rp, temp: c.temperature_2m });
      setScore(res.score); setLabel(res.label); setLevel(res.level);
      if (name) { setPlaceName(name); } else { const geo = await reverseGeocode(lat, lon); setPlaceName(geo); }
    } catch { setError("Erro ao carregar clima."); }
    setLoading(false);
  }, []);

  const loadFromGeo = useCallback(() => {
    if (!navigator.geolocation) { loadWeather(-23.55, -46.63, "São Paulo, BR"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
      () => loadWeather(-23.55, -46.63, "São Paulo, BR"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [loadWeather]);

  useEffect(() => { loadFromGeo(); }, [loadFromGeo]);

  const handleSearchSelect = useCallback((result: any) => {
    if (!result) { loadFromGeo(); return; }
    const name = [result.name, result.admin1, result.country].filter(Boolean).join(", ");
    loadWeather(result.latitude, result.longitude, name);
  }, [loadWeather, loadFromGeo]);

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

  const wind = weather ? Math.round(weather.current.wind_speed_10m) : 0;
  const gust = weather ? Math.round(weather.current.wind_gusts_10m) : 0;
  const rainP = weather ? (weather.hourly?.precipitation_probability?.[0] ?? 0) : 0;
  const temp = weather ? Math.round(weather.current.temperature_2m) : 0;

  const metrics = [
    { icon: <Wind size={20} />, title: "VENTO\nMÉDIO", value: weather ? `${wind}` : "--", unit: "km/h", note: getRiskNote("wind", wind) },
    { icon: <Zap size={20} />, title: "RAJADA\nMÁX", value: weather ? `${gust}` : "--", unit: "km/h", note: getRiskNote("gust", gust) },
    { icon: <CloudRain size={20} />, title: "CHUVA", value: weather ? `${rainP}%` : "--", unit: "", note: getRiskNote("rain", rainP) },
    { icon: <Thermometer size={20} />, title: "TEMP", value: weather ? `${temp}°` : "--", unit: "", note: getRiskNote("temp", temp) },
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-[3px] border-white/[0.06] border-t-cyan-400 animate-spin-loader" />
          <p className="text-[15px] text-slate-400">Carregando clima...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>
      {showSearch && <SearchModal onSelect={handleSearchSelect} onClose={() => setShowSearch(false)} />}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
        <header className="mb-5 flex items-center justify-between">
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
            <button className="grid h-12 w-12 place-items-center rounded-[20px] border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
              <Settings size={19} />
            </button>
          </div>
        </header>

        <div className="mb-6 text-center">
          <p className="inline-flex items-center gap-1.5 text-[17px] font-medium text-slate-100">{placeName} <MapPin size={14} className="text-cyan-400" /></p>
          <p className="mt-1 text-[12px] text-slate-500">dados em tempo real</p>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3 text-[14px] text-red-200">{error}</div>}

        <section className="relative mb-5 overflow-hidden rounded-[28px] border border-cyan-400/[0.15] bg-[linear-gradient(180deg,rgba(10,18,32,0.98),rgba(4,9,15,1))] px-5 py-6 shadow-[0_0_36px_rgba(45,204,255,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_26%)]" />
          <div className="pointer-events-none absolute left-1/2 top-[33%] h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 rounded-full border border-cyan-300/[0.1]" />
            <div className="absolute inset-[22px] rounded-full border border-cyan-300/[0.08]" />
            <div className="absolute inset-[44px] rounded-full border border-cyan-300/[0.08]" />
            <div className="absolute inset-[66px] rounded-full border border-cyan-300/[0.08]" />
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-300/[0.08]" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan-300/[0.08]" />
            <div className="absolute inset-[18px] rounded-full animate-radar-spin" style={{ background: `conic-gradient(from 310deg, rgba(255,255,255,0.12), ${LC[level]}15, transparent 22%)`, filter: "blur(2px)" }} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <Radar score={score} level={level} />
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: `${LC[level]}10`, border: `1px solid ${LC[level]}18` }}>
              <span className="h-[7px] w-[7px] rounded-full animate-pulse-dot" style={{ background: LC[level] }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: LC[level] }}>
                {level === "good" ? "condição ideal" : level === "warn" ? "atenção requerida" : "condição adversa"}
              </span>
            </div>
            <h2 className="mt-3 text-center text-[28px] font-bold uppercase tracking-tight" style={{ color: LC[level], textShadow: `0 0 20px ${LC[level]}25` }}>{label}</h2>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[13px] text-slate-300">
              <span className="inline-flex items-center gap-1.5"><Wind size={13} className="text-slate-400" />{wind <= 15 ? "Vento ideal" : "Vento forte"}</span>
              <span className="inline-flex items-center gap-1.5"><Droplets size={13} className="text-slate-400" />{rainP <= 20 ? "Sem chuva" : "Chuva provável"}</span>
              <span className="inline-flex items-center gap-1.5"><Eye size={13} className="text-slate-400" />Boa visibilidade</span>
            </div>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-4 gap-2.5">
          {metrics.map((m) => (
            <div key={m.title} className="flex min-h-[156px] flex-col rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-3 py-4 text-center">
              <div className="mb-2 flex justify-center text-slate-300">{m.icon}</div>
              <p className="min-h-[28px] whitespace-pre-line text-[9px] uppercase leading-tight tracking-[0.1em] text-slate-500">{m.title}</p>
              <div className="mt-3 flex flex-1 flex-col items-center">
                <p className="text-[24px] font-semibold leading-none tracking-tight text-white">{m.value}</p>
                {m.unit && <p className="mt-1 text-[11px] text-slate-500">{m.unit}</p>}
                <p className="mt-2 text-[11px] text-slate-500">{m.note}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[20px] font-bold tracking-tight">Previsão por hora</h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-500"><span className="h-[9px] w-[9px] rounded-full bg-[#2dffb3]" />Seguro</span>
              <span className="flex items-center gap-1 text-slate-500"><span className="h-[9px] w-[9px] rounded-full bg-[#ffd84d]" />Cuidado</span>
              <span className="flex items-center gap-1 text-slate-500"><span className="h-[9px] w-[9px] rounded-full bg-[#ff5a5f]" />Risco</span>
            </div>
          </div>
          <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.025] px-4 py-5">
            <div className="relative grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(hourly.length || 5, 8)}, 1fr)` }}>
              <div className="absolute left-[8%] right-[8%] top-[6px] h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
              {hourly.map((h) => (
                <div key={h.time} className="relative z-10 flex flex-col items-center">
                  <span className="h-[13px] w-[13px] rounded-full" style={{ background: LC[h.level], boxShadow: `0 0 8px ${LC[h.level]}33` }} />
                  <span className="mt-2.5 text-[13px] font-medium text-slate-200">{h.time}</span>
                  <span className="mt-0.5 text-[10px] text-slate-500">{h.level === "good" ? "Seguro" : h.level === "warn" ? "Cuidado" : "Risco"}</span>
                </div>
              ))}
            </div>
            {bestWindow && (
              <div className="mt-4 rounded-[14px] border border-cyan-400/[0.1] bg-cyan-400/[0.04] px-3 py-3 text-center">
                <p className="inline-flex items-center gap-2 text-[13px] text-cyan-300"><LocateFixed size={13} />Próxima janela recomendada entre <span className="font-semibold">{bestWindow}</span></p>
              </div>
            )}
          </div>
        </section>

        <a href="/analise" className="block w-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-4 text-center text-[16px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105">
          Ver análise detalhada
        </a>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#04090f]/75 backdrop-blur-xl">
          <div className="mx-auto grid max-w-md grid-cols-4 px-4 py-2.5 text-center text-[11px]">
            {[
              { icon: <Sun size={21} />, label: "Clima", active: true },
              { icon: <Map size={21} />, label: "Zonas", active: false },
              { icon: <Clock3 size={21} />, label: "Previsão", active: false },
              { icon: <User size={21} />, label: "Perfil", active: false },
            ].map((tab) => (
              <button key={tab.label} className={`flex flex-col items-center gap-1 transition ${tab.active ? "text-cyan-400" : "text-slate-500"}`}>
                <div className={`grid h-8 w-12 place-items-center rounded-xl transition ${tab.active ? "bg-cyan-400/[0.1]" : ""}`}>{tab.icon}</div>
                <span className={tab.active ? "font-semibold" : ""}>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}