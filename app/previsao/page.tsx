"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft, Wind, Zap, CloudRain, Thermometer, Activity,
  Sun, Clock3, Map, User, ChevronDown, MapPin, X,
} from "lucide-react";
import Link from "next/link";
import { calculateFlightScore } from "@/lib/score";
import { fetchKpIndex, fetchKpForecast, getKpForTime, type KpForecastItem } from "@/lib/weather";
import { useSharedLocation } from "@/lib/useSharedLocation";

type Level = "good" | "warn" | "risk";
const LC: Record<Level, string> = { good: "#2dffb3", warn: "#ffd84d", risk: "#ff5a5f" };

type HourItem = { time: string; hour: string; score: number; level: Level; wind: number; gust: number; rainP: number; temp: number; kp: number; };
type DayItem = { date: string; dayLabel: string; avgScore: number; bestScore: number; bestWindow: string; level: Level; minTemp: number; maxTemp: number; maxWind: number; maxGust: number; maxRain: number; hours: HourItem[]; };

export default function PrevisaoPage() {
  const shared = useSharedLocation();
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"hours" | "days">("hours");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [kpIndex, setKpIndex] = useState(0);
  const [kpForecast, setKpForecast] = useState<KpForecastItem[]>([]);

  useEffect(() => {
    if (shared.loading || !shared.location) return;
    const { lat, lon } = shared.location;
    setLoading(true);
    Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max&forecast_days=16&timezone=auto`).then(r => r.json()),
      fetchKpIndex(),
      fetchKpForecast(),
    ]).then(([data, kpData, kpFc]) => {
      setWeather(data);
      setKpIndex(kpData.kp);
      setKpForecast(kpFc);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [shared.location, shared.loading]);

  const hourlyItems: HourItem[] = useMemo(() => {
    if (!weather?.hourly?.time) return [];
    const now = new Date();
    const items: HourItem[] = [];
    for (let i = 0; i < weather.hourly.time.length && items.length < 24; i++) {
      const t = new Date(weather.hourly.time[i]);
      if (t < now) continue;
      const wind = weather.hourly.wind_speed_10m?.[i] ?? 0;
      const gust = weather.hourly.wind_gusts_10m?.[i] ?? 0;
      const rainP = weather.hourly.precipitation_probability?.[i] ?? 0;
      const temp = weather.hourly.temperature_2m?.[i] ?? 20;
      // Kp variável: usa previsão NOAA se disponível, senão usa o atual
      const hourKp = kpForecast.length > 0 ? getKpForTime(kpForecast, weather.hourly.time[i]) : kpIndex;
      const res = calculateFlightScore({ wind, gust, rainProb: rainP, temp, kp: hourKp });
      items.push({ time: weather.hourly.time[i], hour: t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), score: res.score, level: res.level, wind: Math.round(wind), gust: Math.round(gust), rainP: Math.round(rainP), temp: Math.round(temp), kp: parseFloat(hourKp.toFixed(1)) });
    }
    return items;
  }, [weather, kpIndex, kpForecast]);

  const dailyItems: DayItem[] = useMemo(() => {
    if (!weather?.daily?.time) return [];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return weather.daily.time.map((dateStr: string, i: number) => {
      const d = new Date(dateStr + "T12:00:00");
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();
      const dayLabel = isToday ? "Hoje" : isTomorrow ? "Amanhã" : `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
      const minT = Math.round(weather.daily.temperature_2m_min?.[i] ?? 0);
      const maxT = Math.round(weather.daily.temperature_2m_max?.[i] ?? 0);
      const maxW = Math.round(weather.daily.wind_speed_10m_max?.[i] ?? 0);
      const maxG = Math.round(weather.daily.wind_gusts_10m_max?.[i] ?? 0);
      const maxR = Math.round(weather.daily.precipitation_probability_max?.[i] ?? 0);

      const dayHours: HourItem[] = [];
      if (weather.hourly?.time) {
        for (let h = 0; h < weather.hourly.time.length; h++) {
          if (weather.hourly.time[h].startsWith(dateStr)) {
            const t = new Date(weather.hourly.time[h]);
            const hw = weather.hourly.wind_speed_10m?.[h] ?? 0;
            const hg = weather.hourly.wind_gusts_10m?.[h] ?? 0;
            const hr = weather.hourly.precipitation_probability?.[h] ?? 0;
            const ht = weather.hourly.temperature_2m?.[h] ?? 20;
            // Kp variável da previsão NOAA (cobre 3 dias), depois assume 0
            const hkp = kpForecast.length > 0 ? getKpForTime(kpForecast, weather.hourly.time[h]) : ((isToday || isTomorrow) ? kpIndex : 0);
            const hres = calculateFlightScore({ wind: hw, gust: hg, rainProb: hr, temp: ht, kp: hkp });
            dayHours.push({ time: weather.hourly.time[h], hour: t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), score: hres.score, level: hres.level, wind: Math.round(hw), gust: Math.round(hg), rainP: Math.round(hr), temp: Math.round(ht), kp: parseFloat(hkp.toFixed(1)) });
          }
        }
      }

      let bestScore = 0, bestWindow = "";
      if (dayHours.length >= 2) {
        const ws = Math.min(6, dayHours.length);
        let maxAvg = 0, bestIdx = 0;
        for (let s = 0; s <= dayHours.length - ws; s++) {
          const avg = dayHours.slice(s, s + ws).reduce((sum, h) => sum + h.score, 0) / ws;
          if (avg > maxAvg) { maxAvg = avg; bestIdx = s; }
        }
        bestScore = Math.round(maxAvg);
        bestWindow = `${dayHours[bestIdx].hour}–${dayHours[Math.min(bestIdx + ws - 1, dayHours.length - 1)].hour}`;
      }
      const allAvg = dayHours.length > 0 ? dayHours.reduce((s, h) => s + h.score, 0) / dayHours.length : 0;
      const displayScore = dayHours.length > 0 ? Math.round(bestScore * 0.7 + allAvg * 0.3) : 0;
      const displayLevel: Level = displayScore >= 70 ? "good" : displayScore >= 45 ? "warn" : "risk";
      return { date: dateStr, dayLabel, avgScore: displayScore, bestScore, bestWindow, level: displayLevel, minTemp: minT, maxTemp: maxT, maxWind: maxW, maxGust: maxG, maxRain: maxR, hours: dayHours };
    });
  }, [weather, kpIndex, kpForecast]);

  if (loading || shared.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-cyan-400/20 bg-white/[0.03]">
            <div className="relative h-[30px] w-[30px]">
              <span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0s" }} />
              <span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
              <span className="absolute left-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
              <span className="absolute right-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-cyan-400 animate-pulse-dot" />
            </div>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-white">Sky<span className="text-cyan-400">Fe</span></h1>
          <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
          </div>
          <p className="text-[13px] text-slate-500">Carregando previsão...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-28 pt-6">

        <header className="mb-4 flex items-center gap-4">
          <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="flex-1 text-[24px] font-bold tracking-tight">Previsão completa</h1>
        </header>

        {/* Localização + botão (x) */}
        {shared.location && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <MapPin size={14} className="text-cyan-400" />
            <p className="text-[14px] font-medium text-slate-300">{shared.location.name}</p>
            {!shared.location.isGPS && (
              <button onClick={() => shared.clearToGPS()}
                className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-3">
          {(["hours", "days"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 rounded-2xl py-3.5 text-[15px] font-semibold transition-all duration-200"
              style={activeTab === tab ? { background: "linear-gradient(135deg, rgba(45,204,255,0.15) 0%, rgba(45,255,179,0.1) 100%)", border: "1px solid rgba(45,204,255,0.3)", color: "#2dccff", boxShadow: "0 0 20px rgba(45,204,255,0.1)" } : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}
            >{tab === "hours" ? "Próximas 24h" : "16 dias"}</button>
          ))}
        </div>

        <div className="mb-8 flex items-center gap-4 text-[12px]">
          <span className="flex items-center gap-1.5 text-slate-500"><span className="h-[9px] w-[9px] rounded-full bg-[#2dffb3]" /> Seguro</span>
          <span className="flex items-center gap-1.5 text-slate-500"><span className="h-[9px] w-[9px] rounded-full bg-[#ffd84d]" /> Cuidado</span>
          <span className="flex items-center gap-1.5 text-slate-500"><span className="h-[9px] w-[9px] rounded-full bg-[#ff5a5f]" /> Risco</span>
        </div>

        {activeTab === "hours" && (
          <div className="flex flex-col gap-3">
            {hourlyItems.map((h) => (
              <div key={h.time} className="relative flex items-center gap-4 overflow-hidden rounded-[18px] px-5 py-4" style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)`, border: `1px solid ${LC[h.level]}18` }}>
                <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: LC[h.level], opacity: 0.6 }} />
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: `${LC[h.level]}10`, border: `1px solid ${LC[h.level]}20` }}>
                  <span className="text-[16px] font-bold" style={{ color: LC[h.level] }}>{h.score}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-semibold text-slate-100">{h.hour}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><Wind size={11} />{h.wind} km/h</span>
                    <span className="inline-flex items-center gap-1"><Zap size={11} />{h.gust}</span>
                    <span className="inline-flex items-center gap-1"><CloudRain size={11} />{h.rainP}%</span>
                    <span className="inline-flex items-center gap-1"><Thermometer size={11} />{h.temp}°</span>
                    <span className="inline-flex items-center gap-1"><Activity size={11} />Kp {h.kp.toFixed(1)}</span>
                  </div>
                </div>
                <span className="h-[12px] w-[12px] shrink-0 rounded-full" style={{ background: LC[h.level], boxShadow: `0 0 10px ${LC[h.level]}44` }} />
              </div>
            ))}
          </div>
        )}

        {activeTab === "days" && (
          <div className="flex flex-col gap-3">
            {dailyItems.map((day) => (
              <div key={day.date}>
                <button onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                  className="relative flex w-full items-center gap-4 overflow-hidden rounded-[18px] px-5 py-4 text-left" style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)`, border: `1px solid ${LC[day.level]}18` }}>
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: LC[day.level], opacity: 0.6 }} />
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: `${LC[day.level]}10`, border: `1px solid ${LC[day.level]}20` }}>
                    <span className="text-[16px] font-bold" style={{ color: LC[day.level] }}>{day.avgScore}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-semibold text-slate-100">{day.dayLabel}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
                      <span>{day.minTemp}°–{day.maxTemp}°</span>
                      <span className="inline-flex items-center gap-1"><Wind size={11} />{day.maxWind}</span>
                      <span className="inline-flex items-center gap-1"><CloudRain size={11} />{day.maxRain}%</span>
                    </div>
                    {day.bestWindow && day.bestScore > 0 && (
                      <p className="mt-1.5 text-[11px] font-medium text-cyan-400/80">Melhor janela: {day.bestWindow} (score {day.bestScore})</p>
                    )}
                  </div>
                  <ChevronDown size={18} className={`shrink-0 text-slate-500 transition-transform duration-200 ${expandedDay === day.date ? "rotate-180" : ""}`} />
                </button>
                {expandedDay === day.date && day.hours.length > 0 && (
                  <div className="mt-2 ml-2 mr-2 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3">
                    <div className="flex flex-col gap-2">
                      {day.hours.map((h) => (
                        <div key={h.time} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: `${LC[h.level]}06` }}>
                          <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: LC[h.level] }} />
                          <span className="w-[50px] text-[13px] font-medium text-slate-200">{h.hour}</span>
                          <span className="w-[32px] text-[14px] font-bold" style={{ color: LC[h.level] }}>{h.score}</span>
                          <span className="flex-1 text-[11px] text-slate-500">{h.wind}km/h · {h.rainP}% · {h.temp}°</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#04090f]/80 backdrop-blur-2xl">
        <div className="mx-auto grid max-w-md grid-cols-4 px-4 py-2.5 text-center text-[11px]">
          {[
            { icon: <Sun size={21} />, label: "Clima", href: "/", active: false },
            { icon: <Map size={21} />, label: "Zonas", href: "/zonas", active: false },
            { icon: <Clock3 size={21} />, label: "Previsão", href: "/previsao", active: true },
            { icon: <User size={21} />, label: "Perfil", href: "/perfil", active: false },
          ].map((tab) => (
            <Link key={tab.label} href={tab.href} className={`flex flex-col items-center gap-1 transition ${tab.active ? "text-cyan-400" : "text-slate-500"}`}>
              <div className={`grid h-8 w-12 place-items-center rounded-xl transition ${tab.active ? "bg-cyan-400/[0.1]" : ""}`}>{tab.icon}</div>
              <span className={tab.active ? "font-semibold" : ""}>{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
