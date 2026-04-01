"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowLeft, Wind, Zap, CloudRain, Thermometer,
  Sun, Clock3, Map, User, ChevronRight,
} from "lucide-react";
import Link from "next/link";

type Level = "good" | "warn" | "risk";

const LC: Record<Level, string> = {
  good: "#2dffb3",
  warn: "#ffd84d",
  risk: "#ff5a5f",
};

function calcScore(wind: number, gust: number, rainProb: number, temp: number) {
  let s = 100;
  if (wind > 8) s -= Math.min(30, Math.round((wind - 8) * 1.5));
  if (gust > 12) s -= Math.min(30, Math.round((gust - 12) * 1.2));
  if (rainProb > 10) s -= Math.min(30, Math.round(rainProb * 0.4));
  if (temp < 5) s -= 10;
  if (temp > 38) s -= 10;
  s = Math.max(0, Math.min(100, s));
  const level: Level = s >= 75 ? "good" : s >= 50 ? "warn" : "risk";
  return { score: s, level };
}

type HourItem = {
  time: string;
  hour: string;
  score: number;
  level: Level;
  wind: number;
  gust: number;
  rainP: number;
  temp: number;
};

type DayItem = {
  date: string;
  dayLabel: string;
  avgScore: number;
  level: Level;
  minTemp: number;
  maxTemp: number;
  maxWind: number;
  maxGust: number;
  maxRain: number;
  hours: HourItem[];
};

export default function Previsao() {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"hours" | "days">("hours");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const load = useCallback(async (lat: number, lon: number) => {
    try {
      const params = [
        `latitude=${lat}`,
        `longitude=${lon}`,
        `hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation_probability`,
        `daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max`,
        `forecast_days=16`,
        `timezone=auto`,
      ].join("&");
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      const data = await res.json();
      setWeather(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { load(-23.55, -46.63); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude),
      () => load(-23.55, -46.63),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [load]);

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
      const res = calcScore(wind, gust, rainP, temp);
      items.push({
        time: weather.hourly.time[i],
        hour: t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        score: res.score,
        level: res.level,
        wind: Math.round(wind),
        gust: Math.round(gust),
        rainP: Math.round(rainP),
        temp: Math.round(temp),
      });
    }
    return items;
  }, [weather]);

  const dailyItems: DayItem[] = useMemo(() => {
    if (!weather?.daily?.time) return [];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

    return weather.daily.time.map((dateStr: string, i: number) => {
      const d = new Date(dateStr + "T12:00:00");
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();

      const dayLabel = isToday ? "Hoje" : isTomorrow ? "Amanhã" : `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;

      const maxW = weather.daily.wind_speed_10m_max?.[i] ?? 0;
      const maxG = weather.daily.wind_gusts_10m_max?.[i] ?? 0;
      const maxR = weather.daily.precipitation_probability_max?.[i] ?? 0;
      const minT = Math.round(weather.daily.temperature_2m_min?.[i] ?? 0);
      const maxT = Math.round(weather.daily.temperature_2m_max?.[i] ?? 0);
      const avgT = (minT + maxT) / 2;

      const res = calcScore(maxW, maxG, maxR, avgT);

      const dayHours: HourItem[] = [];
      if (weather.hourly?.time) {
        for (let h = 0; h < weather.hourly.time.length; h++) {
          if (weather.hourly.time[h].startsWith(dateStr)) {
            const t = new Date(weather.hourly.time[h]);
            const hw = weather.hourly.wind_speed_10m?.[h] ?? 0;
            const hg = weather.hourly.wind_gusts_10m?.[h] ?? 0;
            const hr = weather.hourly.precipitation_probability?.[h] ?? 0;
            const ht = weather.hourly.temperature_2m?.[h] ?? 20;
            const hres = calcScore(hw, hg, hr, ht);
            dayHours.push({
              time: weather.hourly.time[h],
              hour: t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              score: hres.score, level: hres.level,
              wind: Math.round(hw), gust: Math.round(hg),
              rainP: Math.round(hr), temp: Math.round(ht),
            });
          }
        }
      }

      return {
        date: dateStr,
        dayLabel,
        avgScore: res.score,
        level: res.level,
        minTemp: minT,
        maxTemp: maxT,
        maxWind: Math.round(maxW),
        maxGust: Math.round(maxG),
        maxRain: Math.round(maxR),
        hours: dayHours,
      };
    });
  }, [weather]);
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-[3px] border-white/[0.06] border-t-cyan-400 animate-spin-loader" />
          <p className="text-[15px] text-slate-400">Carregando previsão...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-28 pt-6">

        {/* Header */}
        <header className="mb-8 flex items-center gap-4">
          <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[24px] font-bold tracking-tight">Previsão completa</h1>
        </header>

        {/* Tabs */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setActiveTab("hours")}
            className={`flex-1 rounded-2xl py-3 text-[14px] font-semibold transition ${activeTab === "hours" ? "bg-cyan-400/[0.12] text-cyan-400 border border-cyan-400/20" : "bg-white/[0.03] text-slate-400 border border-white/[0.06]"}`}
          >
            Próximas 24h
          </button>
          <button
            onClick={() => setActiveTab("days")}
            className={`flex-1 rounded-2xl py-3 text-[14px] font-semibold transition ${activeTab === "days" ? "bg-cyan-400/[0.12] text-cyan-400 border border-cyan-400/20" : "bg-white/[0.03] text-slate-400 border border-white/[0.06]"}`}
          >
            16 dias
          </button>
        </div>

        {/* Legend */}
        <div className="mb-6 flex items-center gap-4 text-[12px]">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-[9px] w-[9px] rounded-full bg-[#2dffb3]" /> Seguro
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-[9px] w-[9px] rounded-full bg-[#ffd84d]" /> Cuidado
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-[9px] w-[9px] rounded-full bg-[#ff5a5f]" /> Risco
          </span>
        </div>

        {/* HOURLY VIEW */}
        {activeTab === "hours" && (
          <div className="flex flex-col gap-3">
            {hourlyItems.map((h) => (
              <div
                key={h.time}
                className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-4"
              >
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{ background: `${LC[h.level]}12`, border: `1px solid ${LC[h.level]}20` }}
                >
                  <span className="text-[15px] font-bold" style={{ color: LC[h.level] }}>
                    {h.score}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-slate-100">{h.hour}</p>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {h.wind} km/h · rajada {h.gust} · chuva {h.rainP}% · {h.temp}°C
                  </p>
                </div>

                <span
                  className="h-[12px] w-[12px] shrink-0 rounded-full"
                  style={{ background: LC[h.level], boxShadow: `0 0 8px ${LC[h.level]}33` }}
                />
              </div>
            ))}
          </div>
        )}

        {/* DAILY VIEW */}
        {activeTab === "days" && (
          <div className="flex flex-col gap-3">
            {dailyItems.map((day) => (
              <div key={day.date}>
                <button
                  onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                  className="flex w-full items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-4 text-left transition hover:bg-white/[0.04]"
                >
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{ background: `${LC[day.level]}12`, border: `1px solid ${LC[day.level]}20` }}
                  >
                    <span className="text-[15px] font-bold" style={{ color: LC[day.level] }}>
                      {day.avgScore}
                    </span>
                  </div>

                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-slate-100">{day.dayLabel}</p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {day.minTemp}°–{day.maxTemp}° · vento {day.maxWind} · chuva {day.maxRain}%
                    </p>
                  </div>

                  <ChevronRight
                    size={18}
                    className={`shrink-0 text-slate-500 transition ${expandedDay === day.date ? "rotate-90" : ""}`}
                  />
                </button>

                {expandedDay === day.date && day.hours.length > 0 && (
                  <div className="ml-4 mt-2 flex flex-col gap-2 border-l-2 border-white/[0.06] pl-4">
                    {day.hours.map((h) => (
                      <div key={h.time} className="flex items-center gap-3 py-1.5">
                        <span
                          className="h-[10px] w-[10px] shrink-0 rounded-full"
                          style={{ background: LC[h.level] }}
                        />
                        <span className="w-[52px] text-[13px] font-medium text-slate-200">{h.hour}</span>
                        <span className="text-[13px] font-semibold" style={{ color: LC[h.level] }}>{h.score}</span>
                        <span className="flex-1 text-[11px] text-slate-500">
                          {h.wind}km/h · {h.rainP}% · {h.temp}°
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#04090f]/75 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 px-4 py-2.5 text-center text-[11px]">
          {[
            { icon: <Sun size={21} />, label: "Clima", href: "/", active: false },
            { icon: <Map size={21} />, label: "Zonas", href: "#", active: false },
            { icon: <Clock3 size={21} />, label: "Previsão", href: "/previsao", active: true },
            { icon: <User size={21} />, label: "Perfil", href: "#", active: false },
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