"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search, Settings, Wind, Zap, CloudRain, Thermometer,
  Sun, Map, Clock3, User, Eye, Droplets, MapPin, LocateFixed, X, Star, Activity,
  Sunrise, Sunset, Cloud, Navigation, Mountain,
} from "lucide-react";
import {
  fetchWeather, reverseGeocode, searchCities, fetchKpIndex,
  getSunTimes, windDirectionLabel, windDirectionLabelFull,
  getVisibilityKm, getVisibilityLabel,
  getWindAtAltitude, getGustAtAltitude, WIND_ALTITUDES,
  type WindAltitude, type WeatherData,
} from "@/lib/weather";
import { calculateFlightScore, getRiskNote, getMetricLevel } from "@/lib/score";
import AuthGuard, { useIsLoggedIn, LoginPromptModal } from "@/lib/AuthGuard";
import { useSharedLocation } from "@/lib/useSharedLocation";
import { supabase } from "@/lib/supabase";

type Level = "good" | "warn" | "risk";
type HourlyItem = { time: string; score: number; level: Level; label: string };

const LC: Record<Level, string> = {
  good: "#2dffb3", warn: "#ffd84d", risk: "#ff5a5f",
};

/* ───── Search History ───── */
const HISTORY_KEY = "skyfe-search-history";
const MAX_HISTORY = 10;

function getSearchHistory(): { name: string; latitude: number; longitude: number }[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addToSearchHistory(item: { name: string; latitude: number; longitude: number }) {
  try {
    const history = getSearchHistory().filter(h => h.name !== item.name);
    history.unshift(item);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {}
}

function clearSearchHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

/* ───── Search Modal ───── */
function SearchModal({ onSelect, onClose }: { onSelect: (r: any) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [history, setHistory] = useState<{ name: string; latitude: number; longitude: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); setHistory(getSearchHistory()); }, []);

  useEffect(() => {
    const loadFavs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("favorites").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
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

  const handleSelect = (r: any) => {
    if (r) {
      const name = r.name || [r.name, r.admin1, r.country].filter(Boolean).join(", ");
      addToSearchHistory({ name, latitude: r.latitude, longitude: r.longitude });
    }
    onSelect(r);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#04090f]/95 backdrop-blur-xl p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cidade, bairro, CEP..." className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-slate-500" />
        </div>
        <button onClick={onClose} className="grid h-12 w-12 place-items-center rounded-2xl border border-white/8 bg-white/[0.04]"><X size={18} className="text-slate-400" /></button>
      </div>
      <button onClick={() => { onSelect(null); onClose(); }} className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3.5">
        <LocateFixed size={18} className="text-cyan-400" /><span className="text-[15px] font-medium text-cyan-400">Usar minha localização</span>
      </button>

      {/* Search history — shown when no query */}
      {!query && history.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pesquisas recentes</p>
            <button onClick={() => { clearSearchHistory(); setHistory([]); }} className="text-[11px] text-slate-600 transition hover:text-slate-400">Limpar</button>
          </div>
          {history.map((h, i) => (
            <button key={`h-${i}`} onClick={() => handleSelect({ name: h.name, latitude: h.latitude, longitude: h.longitude, id: `hist-${i}` })}
              className="flex w-full items-center gap-3 border-b border-white/[0.04] px-4 py-3 text-left">
              <Clock3 size={14} className="text-slate-600 shrink-0" />
              <span className="text-[14px] font-medium text-slate-300 truncate">{h.name}</span>
            </button>
          ))}
        </div>
      )}

      {!query && favorites.length > 0 && (
        <div className="mb-3">
          <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Locais favoritos</p>
          {favorites.map((fav: any) => (
            <button key={fav.id} onClick={() => handleSelect({ name: fav.name, latitude: fav.latitude, longitude: fav.longitude, id: fav.id })} className="flex w-full items-center gap-3 border-b border-white/[0.04] px-4 py-3 text-left">
              <Star size={14} className="fill-amber-400 text-amber-400 shrink-0" /><span className="text-[15px] font-medium text-white">{fav.name}</span>
            </button>
          ))}
        </div>
      )}
      {searching && <p className="px-2 py-2 text-sm text-slate-500">Buscando...</p>}
      <div className="flex-1 overflow-y-auto">
        {results.map((r: any) => (
          <button key={r.id} onClick={() => handleSelect(r)} className="flex w-full flex-col gap-0.5 border-b border-white/[0.04] px-4 py-3.5 text-left">
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
        <circle cx="110" cy="110" r="76" fill="none" stroke={color} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 110 110)" style={{ filter: `drop-shadow(0 0 14px ${color}66)`, transition: "stroke-dashoffset 1.2s ease-out, stroke 0.6s ease" }} />
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

/* ───── Metric Card ───── */
function MetricCard({ icon, title, value, unit, note, level }: { icon: React.ReactNode; title: string; value: string; unit: string; note: string; level: Level }) {
  const color = LC[level];
  return (
    <div className="relative flex min-h-[165px] flex-col overflow-hidden rounded-[18px] px-2.5 py-4 text-center transition-all duration-300" style={{ background: `linear-gradient(168deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)`, border: `1px solid ${color}20`, boxShadow: `0 0 18px ${color}06, inset 0 1px 0 rgba(255,255,255,0.03)` }}>
      <div className="absolute -top-3 left-1/2 h-6 w-10 -translate-x-1/2 rounded-full opacity-35 blur-lg" style={{ background: color }} />
      <div className="relative z-10 flex h-[24px] items-center justify-center" style={{ color }}>{icon}</div>
      <div className="relative z-10 mt-2 flex h-[32px] items-center justify-center"><p className="whitespace-pre-line text-[9px] uppercase leading-tight tracking-[0.1em] text-slate-500">{title}</p></div>
      <div className="relative z-10 mt-3 flex h-[30px] items-end justify-center"><p className="text-[24px] font-semibold leading-none tracking-tight text-white">{value}</p></div>
      <div className="relative z-10 flex h-[18px] items-center justify-center">{unit ? <p className="text-[11px] text-slate-500">{unit}</p> : <span />}</div>
      <div className="relative z-10 flex h-[16px] items-center justify-center"><p className="text-[10px] font-medium" style={{ color: `${color}bb` }}>{note}</p></div>
    </div>
  );
}

/* ───── Wind Compass ───── */
function WindCompass({ direction, speed, gust }: { direction: number; speed: number; gust: number }) {
  const labels = ["N", "E", "S", "O"];
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-cyan-400/[0.12] bg-[linear-gradient(180deg,rgba(10,18,32,0.98),rgba(4,9,15,1))] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(45,204,255,0.06),_transparent_50%)]" />
      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2"><Navigation size={16} className="text-cyan-400" /><span className="text-[13px] font-semibold text-slate-300">Bússola do Vento</span></div>
        <p className="mb-4 text-center text-[12px] text-cyan-400/80">Vento vindo de {windDirectionLabelFull(direction)} — {direction}° {windDirectionLabel(direction)}</p>
        <div className="relative mx-auto h-[180px] w-[180px]">
          <svg width="180" height="180" viewBox="0 0 180 180" className="absolute inset-0">
            <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <circle cx="90" cy="90" r="60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <circle cx="90" cy="90" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            {Array.from({ length: 36 }, (_, i) => { const angle = (i * 10 * Math.PI) / 180; const isMajor = i % 9 === 0; const r1 = isMajor ? 68 : 74; return (<line key={i} x1={90 + r1 * Math.sin(angle)} y1={90 - r1 * Math.cos(angle)} x2={90 + 80 * Math.sin(angle)} y2={90 - 80 * Math.cos(angle)} stroke={isMajor ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"} strokeWidth={isMajor ? "1.5" : "0.5"} />); })}
            {labels.map((l, i) => { const angle = (i * 90 * Math.PI) / 180; return (<text key={l} x={90 + 62 * Math.sin(angle)} y={90 - 62 * Math.cos(angle)} textAnchor="middle" dominantBaseline="central" fill={l === "N" ? "#ff5a5f" : "rgba(255,255,255,0.5)"} fontSize={l === "N" ? "14" : "12"} fontWeight={l === "N" ? "700" : "500"}>{l}</text>); })}
            <line x1="90" y1="12" x2="90" y2="18" stroke="#ff5a5f" strokeWidth="2.5" strokeLinecap="round" />
            <g transform={`rotate(${direction} 90 90)`}><line x1="90" y1="90" x2="90" y2="24" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" /><polygon points="90,20 84,34 96,34" fill="#22d3ee" /></g>
            <circle cx="90" cy="90" r="4" fill="#22d3ee" opacity="0.8" />
          </svg>
        </div>
        <div className="mt-4 flex items-center justify-around">
          <div className="text-center"><p className="text-[10px] uppercase tracking-wider text-slate-500">Velocidade</p><p className="text-[18px] font-bold text-white">{speed} <span className="text-[12px] text-slate-500">km/h</span></p></div>
          <div className="h-8 w-px bg-white/[0.08]" />
          <div className="text-center"><p className="text-[10px] uppercase tracking-wider text-slate-500">Rajada</p><p className="text-[18px] font-bold text-white">{gust} <span className="text-[12px] text-slate-500">km/h</span></p></div>
        </div>
      </div>
    </div>
  );
}

/* ───── Altitude Selector ───── */
function AltitudeSelector({ selected, onChange }: { selected: WindAltitude; onChange: (a: WindAltitude) => void }) {
  const altLabels: Record<WindAltitude, string> = { 0: "Solo", 20: "20m", 40: "40m", 60: "60m", 80: "80m", 100: "100m", 120: "120m" };
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {WIND_ALTITUDES.map((alt) => (
        <button key={alt} onClick={() => onChange(alt)} className="shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all duration-200" style={selected === alt ? { background: "linear-gradient(135deg, rgba(45,204,255,0.15), rgba(45,255,179,0.1))", border: "1px solid rgba(45,204,255,0.3)", color: "#2dccff" } : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}>
          {altLabels[alt]}
        </button>
      ))}
    </div>
  );
}

/* ───── Hourly Mini Card ───── */
function HourlyCard({ item }: { item: HourlyItem }) {
  const color = LC[item.level];
  return (
    <div className="flex flex-shrink-0 flex-col items-center gap-2.5 rounded-2xl px-5 py-4 transition-all duration-200" style={{ background: `linear-gradient(180deg, ${color}0a 0%, transparent 100%)`, border: `1px solid ${color}1a`, minWidth: "80px" }}>
      <span className="h-[12px] w-[12px] rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}55` }} />
      <span className="text-[15px] font-semibold text-slate-100">{item.time}</span>
      <span className="text-[11px] font-medium" style={{ color: `${color}cc` }}>{item.level === "good" ? "Seguro" : item.level === "warn" ? "Cuidado" : "Risco"}</span>
    </div>
  );
}

/* ───── Share Image Generator (1080x1080) ───── */
async function generateShareImage(
  score: number, level: Level, label: string, location: string,
  wind: number, gust: number, rainP: number, temp: number, kp: number,
  sunTimes: { sunrise: string; sunset: string } | null
) {
  const S = 1080; // 1080x1080
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const color = LC[level];
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Helper: rounded rect fill
  const roundRect = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  };

  // ─── Background ───
  ctx.fillStyle = "#04090f"; ctx.fillRect(0, 0, S, S);

  // Subtle radial glow behind score
  const g1 = ctx.createRadialGradient(S/2, 420, 0, S/2, 420, 350);
  g1.addColorStop(0, `${color}18`); g1.addColorStop(1, "transparent");
  ctx.fillStyle = g1; ctx.fillRect(0, 0, S, S);

  // Top bar gradient line
  const topG = ctx.createLinearGradient(100, 0, S-100, 0);
  topG.addColorStop(0, "transparent"); topG.addColorStop(0.5, `${color}40`); topG.addColorStop(1, "transparent");
  ctx.fillStyle = topG; ctx.fillRect(0, 40, S, 2);

  // ─── Header: Logo + Location + Date ───
  ctx.textAlign = "center";
  ctx.font = "800 38px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#fff"; ctx.fillText("Sky", S/2 - 28, 100);
  ctx.fillStyle = "#22d3ee"; ctx.fillText("Fe", S/2 + 28, 100);

  ctx.font = "600 22px -apple-system, sans-serif";
  ctx.fillStyle = "#94a3b8";
  const loc = location.length > 40 ? location.substring(0, 37) + "..." : location;
  ctx.fillText(loc, S/2, 145);

  ctx.font = "400 18px -apple-system, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText(`${dateStr} · ${timeStr}`, S/2, 178);

  // ─── Score Ring (large, centered) ───
  const cx = S/2, cy = 400, r = 140;
  // Track
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 14; ctx.stroke();
  // Score arc
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + (score/100) * Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.stroke();
  // Inner glow
  ctx.shadowColor = color; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + (score/100) * Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.stroke();
  ctx.shadowBlur = 0;

  // Score number
  ctx.font = "800 110px -apple-system, sans-serif";
  ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.fillText(`${score}`, cx, cy + 15);
  ctx.font = "500 26px -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText("/100", cx, cy + 50);

  // ─── Status badge ───
  roundRect(S/2 - 120, 575, 240, 40, 20, `${color}15`, `${color}30`);
  ctx.font = "700 14px -apple-system, sans-serif";
  ctx.fillStyle = color; ctx.textAlign = "center";
  ctx.fillText(label.toUpperCase(), S/2, 601);

  // ─── Metrics Grid (2 rows x 3 cols) ───
  const metrics = [
    { label: "VENTO", value: `${wind}`, unit: "km/h" },
    { label: "RAJADA", value: `${gust}`, unit: "km/h" },
    { label: "CHUVA", value: `${rainP}`, unit: "%" },
    { label: "TEMP", value: `${temp}`, unit: "°C" },
    { label: "KP", value: `${kp.toFixed(1)}`, unit: "" },
    { label: sunTimes ? "NASCER" : "VISIB.", value: sunTimes ? sunTimes.sunrise : "—", unit: "" },
  ];

  const gCols = 3, gRows = 2;
  const cardW = 300, cardH = 100, gGap = 16;
  const gridW = gCols * cardW + (gCols - 1) * gGap;
  const gridStartX = (S - gridW) / 2;
  const gridStartY = 650;

  metrics.forEach((m, i) => {
    const col = i % gCols, row = Math.floor(i / gCols);
    const x = gridStartX + col * (cardW + gGap);
    const y = gridStartY + row * (cardH + gGap);

    roundRect(x, y, cardW, cardH, 16, "rgba(255,255,255,0.03)", "rgba(255,255,255,0.06)");

    // Label
    ctx.font = "700 12px -apple-system, sans-serif";
    ctx.fillStyle = "#475569"; ctx.textAlign = "left";
    ctx.fillText(m.label, x + 20, y + 32);

    // Value (large, right-aligned)
    ctx.font = "800 36px -apple-system, sans-serif";
    ctx.fillStyle = "#fff"; ctx.textAlign = "right";
    ctx.fillText(m.value, x + cardW - 20, y + 70);

    // Unit
    if (m.unit) {
      ctx.font = "500 16px -apple-system, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(m.unit, x + cardW - 20, y + 92);
    }
  });

  // ─── Footer ───
  const footY = 910;
  // Divider
  const divG = ctx.createLinearGradient(200, 0, S-200, 0);
  divG.addColorStop(0, "transparent"); divG.addColorStop(0.5, "rgba(255,255,255,0.08)"); divG.addColorStop(1, "transparent");
  ctx.fillStyle = divG; ctx.fillRect(0, footY, S, 1);

  // Sunset info
  if (sunTimes) {
    ctx.font = "400 18px -apple-system, sans-serif";
    ctx.fillStyle = "#475569"; ctx.textAlign = "center";
    ctx.fillText(`☀️ ${sunTimes.sunrise}  ·  🌅 ${sunTimes.sunset}`, S/2, footY + 40);
  }

  // App link
  ctx.font = "700 22px -apple-system, sans-serif";
  ctx.fillStyle = "#22d3ee"; ctx.textAlign = "center";
  ctx.fillText("app.skyfe.com.br", S/2, footY + 85);

  ctx.font = "400 15px -apple-system, sans-serif";
  ctx.fillStyle = "#334155";
  ctx.fillText("É seguro voar agora? — Baixe grátis", S/2, footY + 112);

  // Subtle outer border
  ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(16, 16, S-32, S-32, 20); ctx.stroke();

  // Corner accent dots
  [[40, 40], [S-40, 40], [40, S-40], [S-40, S-40]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `${color}30`; ctx.fill();
  });

  // Generate and share/download
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], `skyfe-score-${score}.png`, { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `SkyFe — Score ${score}`, text: `${label} — ${location}` }); return; } catch {}
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `skyfe-score-${score}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, "image/png");
}

/* ═══════════════════════════════════════════ */
/*                   HOME                      */
/* ═══════════════════════════════════════════ */
function HomeContent() {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
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
  const [selectedAltitude, setSelectedAltitude] = useState<WindAltitude>(0);
  const isLoggedIn = useIsLoggedIn();
  const shared = useSharedLocation();

  const loadWeather = useCallback(async (lat: number, lon: number, name?: string) => {
    setLoading(true); setError("");
    setCurrentLat(lat); setCurrentLon(lon);
    try {
      const data = await fetchWeather(lat, lon);
      setWeather(data);
      const c = data.current;
      const rp = data.hourly?.precipitation_probability?.[0] ?? 0;
      const effectiveRain = (c.precipitation ?? 0) > 0 ? Math.max(rp, 80) : rp;
      const kpData = await fetchKpIndex();
      setKpIndex(kpData.kp);
      const res = calculateFlightScore({
        wind: c.wind_speed_10m,
        gust: c.wind_gusts_10m,
        rainProb: effectiveRain,
        temp: c.temperature_2m,
        kp: kpData.kp,
        visibility: data.hourly?.visibility?.[0],
        cloudCover: c.cloud_cover,
        isRaining: (c.precipitation ?? 0) > 0 || (c.rain ?? 0) > 0,
      });
      setScore(res.score); setLabel(res.label); setLevel(res.level);
      if (name) { setPlaceName(name); } else { const geo = await reverseGeocode(lat, lon); setPlaceName(geo); }
      checkFavorite(lat, lon);
    } catch { setError("Erro ao carregar clima."); }
    setLoading(false);
  }, []);

  const checkFavorite = async (lat: number, lon: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).gte("latitude", lat - 0.01).lte("latitude", lat + 0.01).gte("longitude", lon - 0.01).lte("longitude", lon + 0.01).limit(1);
      setIsFavorite((data?.length ?? 0) > 0);
    } catch {}
  };

  const toggleFavorite = async () => {
    if (!isLoggedIn) { setLoginFeature("favoritos"); setShowLoginModal(true); return; }
    setSavingFav(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (isFavorite) {
        await supabase.from("favorites").delete().eq("user_id", user.id).gte("latitude", currentLat - 0.01).lte("latitude", currentLat + 0.01).gte("longitude", currentLon - 0.01).lte("longitude", currentLon + 0.01);
        setIsFavorite(false);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, name: placeName, latitude: currentLat, longitude: currentLon });
        setIsFavorite(true);
      }
    } catch {}
    setSavingFav(false);
  };

  useEffect(() => {
    if (shared.loading || !shared.location) return;
    loadWeather(shared.location.lat, shared.location.lon, shared.location.name);
  }, [shared.location, shared.loading, loadWeather]);

  const handleSearchSelect = useCallback((result: any) => {
    if (!result) { shared.clearToGPS(); return; }
    const name = [result.name, result.admin1, result.country].filter(Boolean).join(", ");
    shared.setSearchLocation(result.latitude, result.longitude, name);
  }, [shared]);

  const hourly: HourlyItem[] = useMemo(() => {
    if (!weather?.hourly?.time) return [];
    const now = new Date();
    const items: HourlyItem[] = [];
    for (let i = 0; i < weather.hourly.time.length && items.length < 8; i++) {
      const t = new Date(weather.hourly.time[i]);
      if (t < now) continue;
      const res = calculateFlightScore({ wind: weather.hourly.wind_speed_10m?.[i] ?? 0, gust: weather.hourly.wind_gusts_10m?.[i] ?? 0, rainProb: weather.hourly.precipitation_probability?.[i] ?? 0, temp: weather.hourly.temperature_2m?.[i] ?? 20, kp: kpIndex, visibility: weather.hourly.visibility?.[i], cloudCover: weather.hourly.cloud_cover?.[i] });
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

  const wind10m = weather ? weather.current.wind_speed_10m : 0;
  const gust10m = weather ? weather.current.wind_gusts_10m : 0;
  const wind80m = weather?.hourly?.wind_speed_80m?.[0] ?? wind10m;
  const wind120m = weather?.hourly?.wind_speed_120m?.[0] ?? wind80m;
  const wind = Math.round(getWindAtAltitude(wind10m, wind80m, wind120m, selectedAltitude));
  const gust = Math.round(getGustAtAltitude(gust10m, wind10m, wind80m, wind120m, selectedAltitude));
  const rainP = weather ? (weather.hourly?.precipitation_probability?.[0] ?? 0) : 0;
  const temp = weather ? Math.round(weather.current.temperature_2m) : 0;
  const windDir = weather?.current?.wind_direction_10m ?? 0;
  const cloudCover = weather?.current?.cloud_cover ?? 0;
  const visibility = weather?.hourly?.visibility?.[0] ?? 24140;
  const rainCurrent = weather?.current?.precipitation ?? 0;
  const rainCurrentRain = weather?.current?.rain ?? 0;
  const recentHourlyPrecip = weather?.hourly?.precipitation?.[0] ?? 0;
  const rainNow = Math.max(rainCurrent, rainCurrentRain, recentHourlyPrecip);
  const rainDisplay = rainNow > 0 ? `${rainNow.toFixed(1)}mm` : `${rainP}%`;
  const rainTitle = rainNow > 0 ? "CHUVA\nAGORA" : "CHUVA\nPROB.";
  const rainUnit = rainNow > 0 ? "agora" : "";
  const rainRiskVal = rainNow > 0 ? 100 : rainP;
  const rainNote = rainNow > 0 ? `Chovendo (${rainP}% prob.)` : getRiskNote("rain", rainP);
  const sunTimes = weather ? getSunTimes(weather) : null;
  const altLabel = selectedAltitude === 0 ? "em solo" : `a ${selectedAltitude}m`;

  const metrics = [
    { icon: <Wind size={20} />, title: `VENTO\n${altLabel.toUpperCase()}`, value: weather ? `${wind}` : "--", unit: "km/h", note: getRiskNote("wind", wind), metricLevel: getMetricLevel("wind", wind) },
    { icon: <Zap size={20} />, title: `RAJADA\n${altLabel.toUpperCase()}`, value: weather ? `${gust}` : "--", unit: "km/h", note: getRiskNote("gust", gust), metricLevel: getMetricLevel("gust", gust) },
    { icon: <CloudRain size={20} />, title: rainTitle, value: weather ? rainDisplay : "--", unit: rainUnit, note: rainNote, metricLevel: getMetricLevel("rain", rainRiskVal) },
    { icon: <Thermometer size={20} />, title: "TEMP", value: weather ? `${temp}°` : "--", unit: "", note: getRiskNote("temp", temp), metricLevel: getMetricLevel("temp", temp) },
    { icon: <Activity size={20} />, title: "ÍNDICE\nKP", value: weather ? `${kpIndex.toFixed(1)}` : "--", unit: "", note: getRiskNote("kp", kpIndex), metricLevel: getMetricLevel("kp", kpIndex) },
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="pointer-events-none fixed inset-0 opacity-80"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.1),_transparent_50%)]" /></div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative"><div className="grid h-20 w-20 place-items-center rounded-[24px] border border-cyan-400/20 bg-white/[0.03] shadow-[0_0_40px_rgba(45,204,255,0.15)]"><div className="relative h-[30px] w-[30px]"><span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0s" }} /><span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.2s" }} /><span className="absolute left-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.4s" }} /><span className="absolute right-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.6s" }} /><span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-cyan-400 animate-pulse-dot" /></div></div></div>
          <h1 className="text-[28px] font-bold tracking-tight">Sky<span className="text-cyan-400">Fe</span></h1>
          <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" /></div>
          <p className="text-[13px] text-slate-500">Carregando condições de voo...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" /></div>
      {showSearch && <SearchModal onSelect={handleSearchSelect} onClose={() => setShowSearch(false)} />}

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-28 pt-6">

        {/* ─── 1. HEADER (Logo + Search + Settings) ─── */}
        <header className="mb-6 flex items-center justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-[20px] border border-cyan-400/[0.12] bg-white/[0.03]">
            <div className="relative h-[18px] w-[18px]">
              <span className="absolute left-0 top-0 h-[6px] w-[6px] rounded-full border-[1.5px] border-cyan-400/90" /><span className="absolute right-0 top-0 h-[6px] w-[6px] rounded-full border-[1.5px] border-cyan-400/90" /><span className="absolute bottom-0 left-0 h-[6px] w-[6px] rounded-full border-[1.5px] border-cyan-400/90" /><span className="absolute bottom-0 right-0 h-[6px] w-[6px] rounded-full border-[1.5px] border-cyan-400/90" /><span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-cyan-400" />
            </div>
          </div>
          <h1 className="text-[34px] font-bold tracking-tight">Sky<span className="text-cyan-400">Fe</span></h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(true)} className="grid h-12 w-12 place-items-center rounded-[20px] border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]"><Search size={19} /></button>
            <button onClick={() => { if (!isLoggedIn) { setLoginFeature("configurações"); setShowLoginModal(true); } else { window.location.href = "/configuracoes"; } }} className="grid h-12 w-12 place-items-center rounded-[20px] border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]"><Settings size={19} /></button>
          </div>
        </header>

        {/* ─── 2. ENDEREÇO + dados em tempo real ─── */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2">
            <p className="inline-flex items-center gap-1.5 text-[15px] font-medium text-slate-100 leading-snug max-w-[320px]">
              <MapPin size={14} className="text-cyan-400 shrink-0" /><span className="truncate">{placeName}</span>
            </p>
            {shared.location && !shared.location.isGPS && (
              <button onClick={() => shared.clearToGPS()} className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"><X size={12} /></button>
            )}
            <button onClick={toggleFavorite} disabled={savingFav} className="transition hover:scale-110 disabled:opacity-50"><Star size={16} className={isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-600"} /></button>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">é seguro voar agora?</p>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3 text-[14px] text-red-200">{error}</div>}

        {/* ─── 3. NASCER / PÔR / VISIBILIDADE / NUVENS ─── */}
        <section className="mb-6 grid grid-cols-4 gap-2">
          {sunTimes && (
            <>
              <div className="flex flex-col items-center gap-1.5 rounded-[16px] border border-amber-400/15 bg-amber-400/[0.04] px-2 py-3.5">
                <Sunrise size={16} className="text-amber-400" /><span className="text-[9px] uppercase tracking-wider text-slate-500">Nascer</span><span className="text-[16px] font-bold text-white">{sunTimes.sunrise}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-[16px] border border-orange-400/15 bg-orange-400/[0.04] px-2 py-3.5">
                <Sunset size={16} className="text-orange-400" /><span className="text-[9px] uppercase tracking-wider text-slate-500">Pôr</span><span className="text-[16px] font-bold text-white">{sunTimes.sunset}</span>
              </div>
            </>
          )}
          <div className="flex flex-col items-center gap-1.5 rounded-[16px] border border-blue-400/15 bg-blue-400/[0.04] px-2 py-3.5">
            <Eye size={16} className="text-blue-400" /><span className="text-[9px] uppercase tracking-wider text-slate-500">Visib.</span><span className="text-[14px] font-bold text-white">{getVisibilityKm(visibility)}</span><span className="text-[9px] text-slate-500">{getVisibilityLabel(visibility)}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-[16px] border border-slate-400/15 bg-slate-400/[0.04] px-2 py-3.5">
            <Cloud size={16} className="text-slate-400" /><span className="text-[9px] uppercase tracking-wider text-slate-500">Nuvens</span><span className="text-[16px] font-bold text-white">{cloudCover}%</span>
          </div>
        </section>

        {/* ─── 4. SCORE / RADAR (card completo) ─── */}
        <section className="relative mb-8 overflow-hidden rounded-[28px] border border-cyan-400/[0.12] bg-[linear-gradient(180deg,rgba(10,18,32,0.98),rgba(4,9,15,1))] px-5 py-8 shadow-[0_0_50px_rgba(45,204,255,0.06)]">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-cyan-400/[0.06]" style={{ margin: "3px" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(45,204,255,0.1),_transparent_50%)]" />
          <div className="pointer-events-none absolute left-1/2 top-[33%] h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 rounded-full border border-cyan-300/[0.08]" /><div className="absolute inset-[22px] rounded-full border border-cyan-300/[0.06]" /><div className="absolute inset-[44px] rounded-full border border-cyan-300/[0.06]" /><div className="absolute inset-[66px] rounded-full border border-cyan-300/[0.06]" />
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-300/[0.06]" /><div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan-300/[0.06]" />
            <div className="absolute inset-[18px] rounded-full animate-radar-spin" style={{ background: `conic-gradient(from 310deg, rgba(255,255,255,0.1), ${LC[level]}12, transparent 20%)`, filter: "blur(3px)" }} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <button onClick={() => {
              if (!isLoggedIn) { setLoginFeature("análise detalhada"); setShowLoginModal(true); }
              else { window.location.href = `/analise?lat=${currentLat}&lon=${currentLon}&name=${encodeURIComponent(placeName)}`; }
            }} className="cursor-pointer transition hover:scale-[1.02]">
              <Radar score={score} level={level} />
            </button>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: `${LC[level]}10`, border: `1px solid ${LC[level]}20` }}>
              <span className="h-[7px] w-[7px] rounded-full animate-pulse-dot" style={{ background: LC[level] }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: LC[level] }}>{level === "good" ? "condição ideal" : level === "warn" ? "atenção requerida" : "condição adversa"}</span>
            </div>
            <h2 className="mt-3 text-center text-[28px] font-bold uppercase tracking-tight" style={{ color: LC[level], textShadow: `0 0 24px ${LC[level]}20` }}>{label}</h2>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[13px] text-slate-300">
              <span className="inline-flex items-center gap-1.5"><Wind size={13} style={{ color: LC[getMetricLevel("wind", Math.round(wind10m))] }} />{Math.round(wind10m) <= 15 ? "Vento ideal" : Math.round(wind10m) <= 29 ? "Vento moderado" : "Vento forte"}</span>
              <span className="inline-flex items-center gap-1.5"><Zap size={13} style={{ color: LC[getMetricLevel("gust", Math.round(gust10m))] }} />{Math.round(gust10m) <= 20 ? "Rajadas calmas" : Math.round(gust10m) <= 34 ? "Rajadas moderadas" : "Rajadas fortes"}</span>
              <span className="inline-flex items-center gap-1.5"><Droplets size={13} style={{ color: LC[getMetricLevel("rain", rainRiskVal)] }} />{rainNow > 0 ? "Chovendo agora" : rainP <= 20 ? "Sem chuva" : rainP <= 50 ? "Chuva possível" : "Chuva provável"}</span>
              <span className="inline-flex items-center gap-1.5"><Activity size={13} style={{ color: LC[getMetricLevel("kp", kpIndex)] }} />{kpIndex <= 3 ? "GPS estável" : kpIndex <= 4 ? "GPS com atenção" : "GPS instável"}</span>
            </div>
          </div>
        </section>

        {/* ─── 5. ALTITUDE DO VENTO ─── */}
        <section className="mb-4">
          <div className="mb-2.5 flex items-center gap-2"><Mountain size={14} className="text-cyan-400" /><span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">Altitude do vento</span></div>
          <AltitudeSelector selected={selectedAltitude} onChange={setSelectedAltitude} />
        </section>

        {/* ─── 6. 5 METRIC CARDS ─── */}
        <section className="mb-8 grid grid-cols-5 gap-2">
          {metrics.map((m) => (<MetricCard key={m.title} icon={m.icon} title={m.title} value={m.value} unit={m.unit} note={m.note} level={m.metricLevel} />))}
        </section>

        {/* ─── 7. PREVISÃO POR HORA ─── */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[20px] font-bold tracking-tight">Previsão por hora</h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-500"><span className="h-[8px] w-[8px] rounded-full bg-[#2dffb3]" />Seguro</span>
              <span className="flex items-center gap-1 text-slate-500"><span className="h-[8px] w-[8px] rounded-full bg-[#ffd84d]" />Cuidado</span>
              <span className="flex items-center gap-1 text-slate-500"><span className="h-[8px] w-[8px] rounded-full bg-[#ff5a5f]" />Risco</span>
            </div>
          </div>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
            {hourly.map((h) => (<HourlyCard key={h.time} item={h} />))}
          </div>
          {bestWindow && (
            <div className="mt-6 rounded-2xl border border-cyan-400/[0.1] bg-cyan-400/[0.04] px-4 py-3.5 text-center">
              <p className="inline-flex items-center gap-2 text-[13px] text-cyan-300"><LocateFixed size={13} />Próxima janela recomendada entre <span className="font-semibold">{bestWindow}</span></p>
            </div>
          )}
        </section>

        {/* ─── 8. BÚSSOLA DE VENTO ─── */}
        <section className="mb-8">
          <WindCompass direction={windDir} speed={Math.round(wind10m)} gust={Math.round(gust10m)} />
        </section>

        {/* ─── 9. CHECKLIST + ANÁLISE + COMPARTILHAR ─── */}
        <div className="mb-3 flex gap-3">
          <button onClick={() => {
            if (!isLoggedIn) { setLoginFeature("checklist"); setShowLoginModal(true); }
            else { window.location.href = "/checklist"; }
          }}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-4 text-[14px] font-medium text-slate-300 transition hover:bg-white/[0.05]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Checklist
          </button>
          <button onClick={() => {
            if (!isLoggedIn) { setLoginFeature("análise detalhada"); setShowLoginModal(true); }
            else { window.location.href = `/analise?lat=${currentLat}&lon=${currentLon}&name=${encodeURIComponent(placeName)}`; }
          }} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[14px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105">
            Ver análise
          </button>
        </div>

        {/* Share button */}
        <button onClick={() => {
          if (!isLoggedIn) { setLoginFeature("compartilhar"); setShowLoginModal(true); }
          else { generateShareImage(score, level, label, placeName, Math.round(wind10m), Math.round(gust10m), rainP, temp, kpIndex, sunTimes); }
        }}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.04] py-3.5 text-[14px] font-medium text-cyan-400 transition hover:bg-cyan-400/[0.06]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Compartilhar condições
        </button>

        {showLoginModal && (<LoginPromptModal feature={loginFeature} onClose={() => setShowLoginModal(false)} />)}

        {/* ─── BOTTOM NAV ─── */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#04090f]/80 backdrop-blur-2xl">
          <div className="mx-auto grid max-w-md grid-cols-4 px-4 py-2.5 text-center text-[11px]">
            {[
              { icon: <Sun size={21} />, label: "Clima", active: true, href: "/", needsLogin: false },
              { icon: <Map size={21} />, label: "Zonas", active: false, href: "/zonas", needsLogin: true },
              { icon: <Clock3 size={21} />, label: "Previsão", active: false, href: `/previsao?lat=${currentLat}&lon=${currentLon}&name=${encodeURIComponent(placeName)}`, needsLogin: true },
              { icon: <User size={21} />, label: "Perfil", active: false, href: "/perfil", needsLogin: true },
            ].map((tab) => (
              tab.needsLogin && !isLoggedIn ? (
                <button key={tab.label} onClick={() => { setLoginFeature(tab.label.toLowerCase()); setShowLoginModal(true); }}
                  className={`flex flex-col items-center gap-1 transition ${tab.active ? "text-cyan-400" : "text-slate-500"}`}>
                  <div className="grid h-8 w-12 place-items-center rounded-xl">{tab.icon}</div>
                  <span>{tab.label}</span>
                </button>
              ) : (
                <Link key={tab.label} href={tab.href} className={`flex flex-col items-center gap-1 transition ${tab.active ? "text-cyan-400" : "text-slate-500"}`}>
                  <div className={`grid h-8 w-12 place-items-center rounded-xl transition ${tab.active ? "bg-cyan-400/[0.1]" : ""}`}>{tab.icon}</div>
                  <span className={tab.active ? "font-semibold" : ""}>{tab.label}</span>
                </Link>
              )
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
