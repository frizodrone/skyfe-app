"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft, Wind, Zap, CloudRain, Thermometer, Activity,
  Eye, Cloud, ShieldCheck, ShieldAlert, ShieldX,
  Sunrise, Sunset,
} from "lucide-react";
import {
  fetchWeather, fetchKpIndex, getSunTimes, getVisibilityKm,
  windDirectionLabel,
  type WeatherData,
} from "@/lib/weather";
import { calculateFlightScore, getMetricLevel, loadLimits } from "@/lib/score";
import Link from "next/link";
import AuthGuard from "@/lib/AuthGuard";

type Level = "good" | "warn" | "risk";
const LC: Record<Level, string> = { good: "#2dffb3", warn: "#ffd84d", risk: "#ff5a5f" };

/* ───── Score Breakdown ───── */
function getBreakdown(
  wind: number, gust: number, rainProb: number, temp: number, kp: number,
  visibility: number, cloudCover: number, isRaining: boolean
) {
  const lim = loadLimits();
  const items: { label: string; icon: React.ReactNode; value: string; unit: string; points: number; maxPts: number; level: Level; tip: string }[] = [];

  let wPts = 0;
  const wr = wind / lim.maxWind;
  if (wr > 0.6) { wPts = wr <= 1 ? Math.round(5 + (wr - 0.6) / 0.4 * 10) : Math.round(15 + Math.min(5, (wr - 1) * 10)); }
  else if (wr > 0.3) wPts = Math.round((wr - 0.3) / 0.3 * 5);
  items.push({ label: "Vento", icon: <Wind size={20} />, value: `${Math.round(wind)}`, unit: "km/h", points: wPts, maxPts: 20, level: getMetricLevel("wind", wind), tip: wPts === 0 ? "Dentro do limite ideal" : wPts <= 10 ? "Moderado, voo com atenção" : "Forte, pode causar instabilidade" });

  let gPts = 0;
  const gr = gust / lim.maxGust;
  if (gr > 0.6) { gPts = gr <= 1 ? Math.round(5 + (gr - 0.6) / 0.4 * 12) : Math.round(17 + Math.min(8, (gr - 1) * 15)); }
  else if (gr > 0.3) gPts = Math.round((gr - 0.3) / 0.3 * 5);
  items.push({ label: "Rajada", icon: <Zap size={20} />, value: `${Math.round(gust)}`, unit: "km/h", points: gPts, maxPts: 25, level: getMetricLevel("gust", gust), tip: gPts === 0 ? "Sem rajadas significativas" : gPts <= 12 ? "Oscilações possíveis" : "Risco de perda de controle" });

  let rPts = 0;
  if (isRaining) { rPts = rainProb > 60 ? 25 : 20; }
  else if (rainProb > 10) { rPts = rainProb <= 30 ? Math.round((rainProb - 10) / 20 * 5) : rainProb <= 60 ? Math.round(5 + (rainProb - 30) / 30 * 10) : Math.round(15 + (rainProb - 60) / 40 * 10); }
  items.push({ label: "Chuva", icon: <CloudRain size={20} />, value: isRaining ? "Sim" : `${rainProb}`, unit: isRaining ? "chovendo" : "%", points: rPts, maxPts: 25, level: getMetricLevel("rain", isRaining ? 100 : rainProb), tip: isRaining ? "Chovendo agora — risco ao equipamento" : rPts === 0 ? "Sem previsão de chuva" : "Monitore o céu antes de decolar" });

  let tPts = 0;
  if (temp < lim.minTemp) tPts = Math.min(10, Math.round((lim.minTemp - temp) * 2));
  else if (temp > lim.maxTemp) tPts = Math.min(10, Math.round((temp - lim.maxTemp) * 2));
  items.push({ label: "Temperatura", icon: <Thermometer size={20} />, value: `${Math.round(temp)}`, unit: "°C", points: tPts, maxPts: 10, level: getMetricLevel("temp", temp), tip: tPts === 0 ? "Faixa ideal para baterias LiPo" : "Fora da faixa ideal — performance reduzida" });

  let kPts = 0;
  if (kp >= 7) kPts = 40; else if (kp >= 6) kPts = 35; else if (kp >= 5) kPts = 30; else if (kp >= 4) kPts = 10;
  items.push({ label: "Índice Kp", icon: <Activity size={20} />, value: kp.toFixed(1), unit: "Kp", points: kPts, maxPts: 40, level: getMetricLevel("kp", kp), tip: kPts === 0 ? "GPS estável, sem interferência" : kPts <= 10 ? "Possível lentidão no lock GPS" : "Tempestade geomagnética — risco de flyaway" });

  let vPts = 0;
  const vKm = visibility / 1000;
  if (vKm < 1) vPts = 10; else if (vKm < 2) vPts = 7; else if (vKm < 5) vPts = 3;
  items.push({ label: "Visibilidade", icon: <Eye size={20} />, value: getVisibilityKm(visibility), unit: "", points: vPts, maxPts: 10, level: getMetricLevel("visibility", visibility), tip: vPts === 0 ? "Excelente para manter VLOS" : "Atenção com a linha de visada (ANAC)" });

  let cPts = 0;
  if (cloudCover >= 95) cPts = 5; else if (cloudCover >= 85) cPts = 3; else if (cloudCover >= 75) cPts = 1;
  items.push({ label: "Nuvens", icon: <Cloud size={20} />, value: `${cloudCover}`, unit: "%", points: cPts, maxPts: 5, level: getMetricLevel("cloud", cloudCover), tip: cPts === 0 ? "Cobertura adequada" : "Céu muito encoberto" });

  const totalDed = items.reduce((s, f) => s + f.points, 0);
  return { items, totalDed, finalScore: Math.max(0, 100 - totalDed) };
}

/* ═══════════════════════════════════════════ */
function AnaliseContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [score, setScore] = useState(0);
  const [label, setLabel] = useState("...");
  const [level, setLevel] = useState<Level>("good");
  const [kpIndex, setKpIndex] = useState(0);
  const [locationName, setLocationName] = useState("");

  const load = useCallback(async (lat: number, lon: number) => {
    try {
      const [data, kpData] = await Promise.all([fetchWeather(lat, lon), fetchKpIndex()]);
      setWeather(data); setKpIndex(kpData.kp);
      const c = data.current;
      const rp = data.hourly?.precipitation_probability?.[0] ?? 0;
      const res = calculateFlightScore({
        wind: c.wind_speed_10m, gust: c.wind_gusts_10m,
        rainProb: (c.precipitation ?? 0) > 0 ? Math.max(rp, 80) : rp,
        temp: c.temperature_2m, kp: kpData.kp,
        visibility: data.hourly?.visibility?.[0], cloudCover: c.cloud_cover,
        isRaining: (c.precipitation ?? 0) > 0 || (c.rain ?? 0) > 0,
      });
      setScore(res.score); setLabel(res.label); setLevel(res.level);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const lat = searchParams.get("lat"), lon = searchParams.get("lon"), name = searchParams.get("name");
    if (name) setLocationName(decodeURIComponent(name));
    if (lat && lon) load(parseFloat(lat), parseFloat(lon));
    else {
      if (!navigator.geolocation) { load(-23.55, -46.63); return; }
      navigator.geolocation.getCurrentPosition(p => load(p.coords.latitude, p.coords.longitude), () => load(-23.55, -46.63), { enableHighAccuracy: true, timeout: 8000 });
    }
  }, [load, searchParams]);

  const wind = weather?.current.wind_speed_10m ?? 0;
  const gust = weather?.current.wind_gusts_10m ?? 0;
  const rainP = weather?.hourly?.precipitation_probability?.[0] ?? 0;
  const temp = weather?.current.temperature_2m ?? 0;
  const cloudCover = weather?.current?.cloud_cover ?? 0;
  const visibility = weather?.hourly?.visibility?.[0] ?? 24140;
  const isRaining = (weather?.current?.precipitation ?? 0) > 0 || (weather?.current?.rain ?? 0) > 0;
  const sunTimes = weather ? getSunTimes(weather) : null;
  const windDir = weather?.current?.wind_direction_10m ?? 0;
  const bd = getBreakdown(wind, gust, rainP, temp, kpIndex, visibility, cloudCover, isRaining);
  const ShieldIcon = level === "good" ? ShieldCheck : level === "warn" ? ShieldAlert : ShieldX;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="pointer-events-none fixed inset-0 opacity-80"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.1),_transparent_50%)]" /></div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-cyan-400/20 bg-white/[0.03] shadow-[0_0_40px_rgba(45,204,255,0.15)]">
            <div className="relative h-[30px] w-[30px]">
              <span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0s" }} /><span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.2s" }} /><span className="absolute left-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.4s" }} /><span className="absolute right-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.6s" }} /><span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-cyan-400 animate-pulse-dot" />
            </div>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight">Sky<span className="text-cyan-400">Fe</span></h1>
          <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" /></div>
          <p className="text-[13px] text-slate-500">Analisando condições...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" /></div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 pt-6">

        {/* Header */}
        <header className="mb-6 flex items-center gap-4">
          <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">Análise detalhada</h1>
            {locationName && <p className="text-[12px] text-slate-500 mt-0.5 truncate max-w-[250px]">{locationName}</p>}
          </div>
        </header>

        {/* Score Hero */}
        <section className="mb-6 relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,18,32,0.98),rgba(4,9,15,1))] p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(45,204,255,0.06),_transparent_50%)]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <ShieldIcon size={24} style={{ color: LC[level] }} />
              <span className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: LC[level] }}>{label}</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-[72px] font-bold leading-none" style={{ color: LC[level], textShadow: `0 0 30px ${LC[level]}22` }}>{score}</span>
              <span className="mb-3 text-[24px] text-white/30">/100</span>
            </div>
            <p className="mt-2 text-[13px] text-slate-500">
              {bd.totalDed === 0 ? "Nenhum fator impactando o score" : `${bd.totalDed} pontos deduzidos`}
            </p>
            {sunTimes && (
              <div className="mt-3 flex items-center gap-4 text-[12px] text-slate-500">
                <span className="inline-flex items-center gap-1"><Sunrise size={13} className="text-amber-400" />{sunTimes.sunrise}</span>
                <span className="inline-flex items-center gap-1"><Sunset size={13} className="text-orange-400" />{sunTimes.sunset}</span>
                <span>Vento {windDirectionLabel(windDir)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Score formula */}
        <section className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="shrink-0 rounded-xl bg-white/[0.06] px-3 py-2 text-center">
              <p className="text-[15px] font-bold text-white">100</p>
              <p className="text-[9px] text-slate-500">Base</p>
            </div>
            {bd.items.filter(f => f.points > 0).map((f) => (
              <div key={f.label} className="flex items-center gap-1.5">
                <span className="text-[13px] text-slate-600">−</span>
                <div className="shrink-0 rounded-xl px-3 py-2 text-center" style={{ background: `${LC[f.level]}08`, border: `1px solid ${LC[f.level]}15` }}>
                  <p className="text-[14px] font-bold" style={{ color: LC[f.level] }}>{f.points}</p>
                  <p className="text-[9px] text-slate-500">{f.label}</p>
                </div>
              </div>
            ))}
            <span className="text-[13px] text-slate-600">=</span>
            <div className="shrink-0 rounded-xl px-3 py-2 text-center" style={{ background: `${LC[level]}10`, border: `1px solid ${LC[level]}25` }}>
              <p className="text-[17px] font-bold" style={{ color: LC[level] }}>{score}</p>
              <p className="text-[9px] text-slate-500">Final</p>
            </div>
          </div>
        </section>

        {/* Factor cards — data shown LARGE */}
        <section className="mb-8">
          <h2 className="mb-4 text-[18px] font-bold tracking-tight">Fatores analisados</h2>
          <div className="flex flex-col gap-3">
            {bd.items.map((f) => {
              const color = LC[f.level];
              const barPct = f.maxPts > 0 ? Math.min(100, (f.points / f.maxPts) * 100) : 0;
              return (
                <div key={f.label} className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-4">
                  {/* Top row: icon + label + LARGE value */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px]" style={{ background: `${color}10`, color }}>
                      {f.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-slate-200">{f.label}</p>
                      <p className="text-[11px] text-slate-500">{f.tip}</p>
                    </div>
                    {/* LARGE data value */}
                    <div className="text-right">
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-[28px] font-bold leading-none" style={{ color }}>{f.value}</span>
                        {f.unit && <span className="text-[12px] text-slate-500">{f.unit}</span>}
                      </div>
                    </div>
                  </div>
                  {/* Impact bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-[5px] overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${barPct}%`, background: color }} />
                    </div>
                    <span className="text-[12px] font-semibold min-w-[40px] text-right" style={{ color }}>
                      {f.points === 0 ? "0 pts" : `−${f.points}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Legend */}
        <section className="mb-8 rounded-[16px] border border-white/[0.04] bg-white/[0.015] p-4">
          <div className="flex items-center gap-4 text-[12px]">
            <span className="flex items-center gap-1.5 text-slate-400"><span className="h-[8px] w-[8px] rounded-full bg-[#2dffb3]" /><span className="font-semibold text-[#2dffb3]">70–100</span> Ideal</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="h-[8px] w-[8px] rounded-full bg-[#ffd84d]" /><span className="font-semibold text-[#ffd84d]">45–69</span> Cautela</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="h-[8px] w-[8px] rounded-full bg-[#ff5a5f]" /><span className="font-semibold text-[#ff5a5f]">0–44</span> Risco</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-600">Score inicia em 100. Cada fator deduz pontos conforme os limites do seu drone.</p>
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/checklist" className="flex flex-1 items-center justify-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.04] py-4 text-[14px] font-medium text-emerald-400 transition hover:bg-emerald-400/[0.08]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Checklist
          </Link>
          <Link href="/" className="flex flex-1 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] py-4 text-[14px] font-medium text-slate-300 transition hover:bg-white/[0.05]">
            Voltar
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function AnaliseWrapper() {
  return (
    <AuthGuard>
      <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#04090f]"><div className="mx-auto h-12 w-12 rounded-full border-[3px] border-white/[0.06] border-t-cyan-400 animate-spin-loader" /></main>}>
        <AnaliseContent />
      </Suspense>
    </AuthGuard>
  );
}
