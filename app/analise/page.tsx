"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft, Wind, Zap, CloudRain, Thermometer, Activity,
  Eye, Cloud, ShieldCheck, ShieldAlert, ShieldX, ChevronRight,
  Sunrise, Sunset,
} from "lucide-react";
import {
  fetchWeather, fetchKpIndex, getSunTimes, getVisibilityKm, getVisibilityLabel,
  windDirectionLabel,
  type WeatherData,
} from "@/lib/weather";
import { calculateFlightScore, getRiskNote, getMetricLevel, loadLimits } from "@/lib/score";
import Link from "next/link";
import AuthGuard from "@/lib/AuthGuard";

type Level = "good" | "warn" | "risk";
const LC: Record<Level, string> = { good: "#2dffb3", warn: "#ffd84d", risk: "#ff5a5f" };

/* ───── Score Breakdown Calculator ───── */
function getScoreBreakdown(
  wind: number, gust: number, rainProb: number, temp: number, kp: number,
  visibility: number, cloudCover: number, isRaining: boolean
) {
  const lim = loadLimits();
  const factors: { label: string; icon: string; value: string; points: number; maxPoints: number; level: Level; explanation: string }[] = [];

  // Wind
  let windPts = 0;
  const windRatio = wind / lim.maxWind;
  if (windRatio > 0.6) {
    if (windRatio <= 1) windPts = Math.round(5 + (windRatio - 0.6) / 0.4 * 10);
    else windPts = Math.round(15 + Math.min(5, (windRatio - 1) * 10));
  } else if (windRatio > 0.3) windPts = Math.round((windRatio - 0.3) / 0.3 * 5);
  factors.push({ label: "Vento", icon: "wind", value: `${Math.round(wind)} km/h`, points: windPts, maxPoints: 20, level: getMetricLevel("wind", wind), explanation: windPts === 0 ? "Vento dentro do limite ideal para seu drone." : windPts <= 10 ? "Vento moderado, voo possível com atenção." : "Vento forte, pode causar instabilidade." });

  // Gust
  let gustPts = 0;
  const gustRatio = gust / lim.maxGust;
  if (gustRatio > 0.6) {
    if (gustRatio <= 1) gustPts = Math.round(5 + (gustRatio - 0.6) / 0.4 * 12);
    else gustPts = Math.round(17 + Math.min(8, (gustRatio - 1) * 15));
  } else if (gustRatio > 0.3) gustPts = Math.round((gustRatio - 0.3) / 0.3 * 5);
  factors.push({ label: "Rajada", icon: "zap", value: `${Math.round(gust)} km/h`, points: gustPts, maxPoints: 25, level: getMetricLevel("gust", gust), explanation: gustPts === 0 ? "Sem rajadas significativas." : gustPts <= 12 ? "Rajadas moderadas podem causar oscilações." : "Rajadas fortes, risco de perda de controle." });

  // Rain
  let rainPts = 0;
  if (isRaining) {
    rainPts = 20;
    if (rainProb > 60) rainPts = 25;
  } else if (rainProb > 10) {
    if (rainProb <= 30) rainPts = Math.round((rainProb - 10) / 20 * 5);
    else if (rainProb <= 60) rainPts = Math.round(5 + (rainProb - 30) / 30 * 10);
    else rainPts = Math.round(15 + (rainProb - 60) / 40 * 10);
  }
  factors.push({ label: "Chuva", icon: "rain", value: isRaining ? "Chovendo" : `${rainProb}%`, points: rainPts, maxPoints: 25, level: getMetricLevel("rain", isRaining ? 100 : rainProb), explanation: isRaining ? "Está chovendo agora. Risco de dano ao equipamento." : rainPts === 0 ? "Sem previsão de chuva." : rainPts <= 10 ? "Possibilidade de chuva, monitore o céu." : "Alta probabilidade de chuva, equipamento em risco." });

  // Temp
  let tempPts = 0;
  if (temp < lim.minTemp) tempPts = Math.min(10, Math.round((lim.minTemp - temp) * 2));
  else if (temp > lim.maxTemp) tempPts = Math.min(10, Math.round((temp - lim.maxTemp) * 2));
  factors.push({ label: "Temperatura", icon: "temp", value: `${Math.round(temp)}°C`, points: tempPts, maxPoints: 10, level: getMetricLevel("temp", temp), explanation: tempPts === 0 ? "Temperatura na faixa ideal para baterias LiPo." : "Temperatura fora da faixa ideal, baterias podem perder performance." });

  // Kp
  let kpPts = 0;
  if (kp >= 7) kpPts = 40;
  else if (kp >= 6) kpPts = 35;
  else if (kp >= 5) kpPts = 30;
  else if (kp >= 4) kpPts = 10;
  factors.push({ label: "Índice Kp", icon: "kp", value: `Kp ${kp.toFixed(1)}`, points: kpPts, maxPoints: 40, level: getMetricLevel("kp", kp), explanation: kpPts === 0 ? "Atividade geomagnética baixa, GPS estável." : kpPts <= 10 ? "Atividade geomagnética elevada, possível lentidão no GPS." : "Tempestade geomagnética, risco de flyaway por instabilidade GPS." });

  // Visibility
  let visPts = 0;
  const visKm = visibility / 1000;
  if (visKm < 1) visPts = 10;
  else if (visKm < 2) visPts = 7;
  else if (visKm < 5) visPts = 3;
  factors.push({ label: "Visibilidade", icon: "eye", value: getVisibilityKm(visibility), points: visPts, maxPoints: 10, level: getMetricLevel("visibility", visibility), explanation: visPts === 0 ? "Visibilidade excelente, VLOS sem dificuldade." : visPts <= 3 ? "Visibilidade moderada, atenção com a linha de visada." : "Visibilidade baixa, difícil manter VLOS conforme ANAC." });

  // Clouds
  let cloudPts = 0;
  if (cloudCover >= 95) cloudPts = 5;
  else if (cloudCover >= 85) cloudPts = 3;
  else if (cloudCover >= 75) cloudPts = 1;
  factors.push({ label: "Nuvens", icon: "cloud", value: `${cloudCover}%`, points: cloudPts, maxPoints: 5, level: getMetricLevel("cloud", cloudCover), explanation: cloudPts === 0 ? "Cobertura de nuvens adequada." : "Céu muito encoberto, pode afetar qualidade de imagem e VLOS." });

  const totalDeducted = factors.reduce((s, f) => s + f.points, 0);
  return { factors, totalDeducted, finalScore: Math.max(0, 100 - totalDeducted) };
}

/* ───── Factor Icon ───── */
function FactorIcon({ type, size = 18 }: { type: string; size?: number }) {
  switch (type) {
    case "wind": return <Wind size={size} />;
    case "zap": return <Zap size={size} />;
    case "rain": return <CloudRain size={size} />;
    case "temp": return <Thermometer size={size} />;
    case "kp": return <Activity size={size} />;
    case "eye": return <Eye size={size} />;
    case "cloud": return <Cloud size={size} />;
    default: return <Wind size={size} />;
  }
}

/* ───── Breakdown Bar ───── */
function BreakdownBar({ factor }: { factor: { label: string; icon: string; value: string; points: number; maxPoints: number; level: Level; explanation: string } }) {
  const color = LC[factor.level];
  const pct = factor.maxPoints > 0 ? Math.min(100, (factor.points / factor.maxPoints) * 100) : 0;
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${color}12`, color }}>
            <FactorIcon type={factor.icon} size={17} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-200">{factor.label}</p>
            <p className="text-[12px] text-slate-500">{factor.value}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-bold" style={{ color }}>
            {factor.points === 0 ? "0" : `-${factor.points}`}
          </p>
          <p className="text-[10px] text-slate-600">de -{factor.maxPoints}</p>
        </div>
      </div>
      {/* Bar */}
      <div className="mb-2 h-[6px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}44` }} />
      </div>
      <p className="text-[12px] leading-relaxed text-slate-500">{factor.explanation}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*              ANÁLISE DETALHADA              */
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
      setWeather(data);
      setKpIndex(kpData.kp);
      const c = data.current;
      const rp = data.hourly?.precipitation_probability?.[0] ?? 0;
      const effectiveRain = (c.precipitation ?? 0) > 0 ? Math.max(rp, 80) : rp;
      const res = calculateFlightScore({
        wind: c.wind_speed_10m, gust: c.wind_gusts_10m, rainProb: effectiveRain,
        temp: c.temperature_2m, kp: kpData.kp,
        visibility: data.hourly?.visibility?.[0],
        cloudCover: c.cloud_cover,
        isRaining: (c.precipitation ?? 0) > 0 || (c.rain ?? 0) > 0,
      });
      setScore(res.score); setLabel(res.label); setLevel(res.level);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const paramLat = searchParams.get("lat");
    const paramLon = searchParams.get("lon");
    const paramName = searchParams.get("name");
    if (paramName) setLocationName(decodeURIComponent(paramName));
    if (paramLat && paramLon) load(parseFloat(paramLat), parseFloat(paramLon));
    else {
      if (!navigator.geolocation) { load(-23.55, -46.63); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        () => load(-23.55, -46.63), { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [load, searchParams]);

  const wind = weather ? weather.current.wind_speed_10m : 0;
  const gust = weather ? weather.current.wind_gusts_10m : 0;
  const rainP = weather ? (weather.hourly?.precipitation_probability?.[0] ?? 0) : 0;
  const temp = weather ? weather.current.temperature_2m : 0;
  const cloudCover = weather?.current?.cloud_cover ?? 0;
  const visibility = weather?.hourly?.visibility?.[0] ?? 24140;
  const isRaining = (weather?.current?.precipitation ?? 0) > 0 || (weather?.current?.rain ?? 0) > 0;
  const sunTimes = weather ? getSunTimes(weather) : null;
  const windDir = weather?.current?.wind_direction_10m ?? 0;

  const breakdown = getScoreBreakdown(wind, gust, rainP, temp, kpIndex, visibility, cloudCover, isRaining);
  const ShieldIcon = level === "good" ? ShieldCheck : level === "warn" ? ShieldAlert : ShieldX;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="pointer-events-none fixed inset-0 opacity-80"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.1),_transparent_50%)]" /></div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-cyan-400/20 bg-white/[0.03] shadow-[0_0_40px_rgba(45,204,255,0.15)]">
            <div className="relative h-[30px] w-[30px]">
              <span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0s" }} />
              <span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
              <span className="absolute left-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
              <span className="absolute right-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-cyan-400 animate-pulse-dot" />
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-12 pt-6">

        {/* Header */}
        <header className="mb-6 flex items-center gap-4">
          <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">Análise detalhada</h1>
            {locationName && <p className="text-[12px] text-slate-500 mt-0.5 truncate max-w-[250px]">{locationName}</p>}
          </div>
        </header>

        {/* Score Hero Card */}
        <section className="mb-8 relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,18,32,0.98),rgba(4,9,15,1))] p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(45,204,255,0.06),_transparent_50%)]" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="grid h-[80px] w-[80px] shrink-0 place-items-center rounded-[20px]" style={{ background: `${LC[level]}10`, border: `1px solid ${LC[level]}20` }}>
              <span className="text-[38px] font-bold leading-none" style={{ color: LC[level] }}>{score}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ShieldIcon size={18} style={{ color: LC[level] }} />
                <span className="text-[18px] font-bold" style={{ color: LC[level] }}>{label}</span>
              </div>
              <p className="text-[13px] text-slate-500">
                {breakdown.totalDeducted === 0 ? "Todas as condições estão ideais." : `${breakdown.totalDeducted} pontos deduzidos de 100.`}
              </p>
              {/* Sun times */}
              {sunTimes && (
                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1"><Sunrise size={12} className="text-amber-400" />{sunTimes.sunrise}</span>
                  <span className="inline-flex items-center gap-1"><Sunset size={12} className="text-orange-400" />{sunTimes.sunset}</span>
                  <span>Vento {windDirectionLabel(windDir)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Score formula summary */}
          <div className="relative z-10 mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="shrink-0 rounded-xl bg-white/[0.06] px-3 py-2 text-center">
              <p className="text-[16px] font-bold text-white">100</p>
              <p className="text-[9px] text-slate-500">Base</p>
            </div>
            {breakdown.factors.filter(f => f.points > 0).map((f, i) => (
              <div key={f.label} className="flex items-center gap-2">
                <span className="text-[14px] text-slate-600">−</span>
                <div className="shrink-0 rounded-xl px-3 py-2 text-center" style={{ background: `${LC[f.level]}08`, border: `1px solid ${LC[f.level]}15` }}>
                  <p className="text-[14px] font-bold" style={{ color: LC[f.level] }}>{f.points}</p>
                  <p className="text-[9px] text-slate-500">{f.label}</p>
                </div>
              </div>
            ))}
            <span className="text-[14px] text-slate-600">=</span>
            <div className="shrink-0 rounded-xl px-3 py-2 text-center" style={{ background: `${LC[level]}10`, border: `1px solid ${LC[level]}25` }}>
              <p className="text-[18px] font-bold" style={{ color: LC[level] }}>{score}</p>
              <p className="text-[9px] text-slate-500">Final</p>
            </div>
          </div>
        </section>

        {/* Breakdown by factor */}
        <section className="mb-8">
          <h2 className="mb-4 text-[18px] font-bold tracking-tight">Impacto por fator</h2>
          <div className="flex flex-col gap-3">
            {breakdown.factors.map((f) => (
              <BreakdownBar key={f.label} factor={f} />
            ))}
          </div>
        </section>

        {/* Legend */}
        <section className="mb-8 rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-3 text-[14px] font-semibold text-slate-300">Como ler o score</h3>
          <div className="flex flex-col gap-2.5 text-[13px]">
            <div className="flex items-center gap-3">
              <span className="h-[10px] w-[10px] rounded-full bg-[#2dffb3]" />
              <span className="text-slate-400"><span className="font-semibold text-[#2dffb3]">70–100</span> — Condições ideais para voo</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-[10px] w-[10px] rounded-full bg-[#ffd84d]" />
              <span className="text-slate-400"><span className="font-semibold text-[#ffd84d]">45–69</span> — Voo possível com cautela</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-[10px] w-[10px] rounded-full bg-[#ff5a5f]" />
              <span className="text-slate-400"><span className="font-semibold text-[#ff5a5f]">0–44</span> — Voo não recomendado</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-600 leading-relaxed">
            O score inicia em 100 e cada fator deduz pontos proporcionalmente ao risco. Os limites são personalizados de acordo com o modelo do seu drone.
          </p>
        </section>

        {/* Back button */}
        <Link href="/" className="flex w-full items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] py-4 text-[15px] font-medium text-slate-300 transition hover:bg-white/[0.05]">
          Voltar para o clima
        </Link>
      </div>
    </main>
  );
}

export default function AnaliseWrapper() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-[3px] border-white/[0.06] border-t-cyan-400 animate-spin-loader" />
          </div>
        </main>
      }>
        <AnaliseContent />
      </Suspense>
    </AuthGuard>
  );
}
