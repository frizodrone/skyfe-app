"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft, Wind, Zap, CloudRain, Thermometer, Activity,
  ShieldCheck, ShieldAlert, ShieldX, TrendingDown, TrendingUp, Minus,
} from "lucide-react";
import { fetchWeather, fetchKpIndex } from "@/lib/weather";
import { calculateFlightScore, getRiskNote, getMetricLevel } from "@/lib/score";
import Link from "next/link";
import AuthGuard from "@/lib/AuthGuard";

type Level = "good" | "warn" | "risk";

const LC: Record<Level, string> = {
  good: "#2dffb3",
  warn: "#ffd84d",
  risk: "#ff5a5f",
};

function ScoreBar({ label, icon, value, max, unit, level }: {
  label: string;
  icon: React.ReactNode;
  value: number;
  max: number;
  unit: string;
  level: Level;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const color = LC[level];
  return (
    <div className="mb-8">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[15px] font-medium text-slate-200">
          {icon}
          {label}
        </div>
        <span className="text-[15px] font-semibold" style={{ color }}>
          {value} {unit}
        </span>
      </div>
      <div className="h-[10px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}44` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>0</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

function FactorCard({ title, icon, note, level, impact, riskLabel }: {
  title: string;
  icon: React.ReactNode;
  note: string;
  level: Level;
  impact: "positive" | "neutral" | "negative";
  riskLabel: string;
}) {
  const color = LC[level];
  const ImpactIcon = impact === "positive" ? TrendingUp : impact === "negative" ? TrendingDown : Minus;
  return (
    <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-slate-200">
          {icon}
          <span className="text-[15px] font-medium">{title}</span>
        </div>
        <ImpactIcon size={16} style={{ color }} />
      </div>
      <p className="text-[13px] leading-relaxed text-slate-400">{note}</p>
      <div
        className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1"
        style={{ background: `${color}12`, border: `1px solid ${color}20` }}
      >
        <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
        <span className="text-[12px] font-medium" style={{ color }}>{riskLabel}</span>
      </div>
    </div>
  );
}

function AnaliseContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [label, setLabel] = useState("...");
  const [level, setLevel] = useState<Level>("good");
  const [kpIndex, setKpIndex] = useState(0);
  const [locationName, setLocationName] = useState("");

  const load = useCallback(async (lat: number, lon: number) => {
    try {
      const [data, kpData] = await Promise.all([
        fetchWeather(lat, lon),
        fetchKpIndex(),
      ]);
      setWeather(data);
      setKpIndex(kpData.kp);
      const c = data.current;
      const rp = data.hourly?.precipitation_probability?.[0] ?? 0;
      const effectiveRain = (c.precipitation ?? 0) > 0 ? Math.max(rp, 80) : rp;
      const res = calculateFlightScore({
        wind: c.wind_speed_10m,
        gust: c.wind_gusts_10m,
        rainProb: effectiveRain,
        temp: c.temperature_2m,
        kp: kpData.kp,
      });
      setScore(res.score);
      setLabel(res.label);
      setLevel(res.level);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    // BUG FIX: Usar coordenadas da URL (passadas da busca) em vez de sempre usar GPS
    const paramLat = searchParams.get("lat");
    const paramLon = searchParams.get("lon");
    const paramName = searchParams.get("name");

    if (paramName) setLocationName(decodeURIComponent(paramName));

    if (paramLat && paramLon) {
      load(parseFloat(paramLat), parseFloat(paramLon));
    } else {
      // Fallback para GPS
      if (!navigator.geolocation) {
        load(-23.55, -46.63);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        () => load(-23.55, -46.63),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [load, searchParams]);

  const wind = weather ? Math.round(weather.current.wind_speed_10m) : 0;
  const gust = weather ? Math.round(weather.current.wind_gusts_10m) : 0;
  const rainP = weather ? (weather.hourly?.precipitation_probability?.[0] ?? 0) : 0;
  const temp = weather ? Math.round(weather.current.temperature_2m) : 0;

  // Usar getMetricLevel centralizado
  const windLevel = getMetricLevel("wind", wind);
  const gustLevel = getMetricLevel("gust", gust);
  const rainLevel = getMetricLevel("rain", rainP);
  const tempLevel = getMetricLevel("temp", temp);
  const kpLevel = getMetricLevel("kp", kpIndex);

  const getImpact = (lvl: Level) => lvl === "good" ? "positive" as const : lvl === "risk" ? "negative" as const : "neutral" as const;

  const ShieldIcon = level === "good" ? ShieldCheck : level === "warn" ? ShieldAlert : ShieldX;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="pointer-events-none fixed inset-0 opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.1),_transparent_50%)]" />
        </div>
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
          <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
          </div>
          <p className="text-[13px] text-slate-500">Analisando condições...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-12 pt-6">

        {/* Header */}
        <header className="mb-8 flex items-center gap-4">
          <Link
            href="/"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-[24px] font-bold tracking-tight">Análise detalhada</h1>
            {locationName && (
              <p className="text-[12px] text-slate-500 mt-0.5">{locationName}</p>
            )}
          </div>
        </header>

        {/* Score summary */}
        <section className="mb-10 rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
          <div className="flex items-center gap-5">
            <div
              className="grid h-[72px] w-[72px] place-items-center rounded-2xl"
              style={{ background: `${LC[level]}10`, border: `1px solid ${LC[level]}20` }}
            >
              <ShieldIcon size={30} style={{ color: LC[level] }} />
            </div>
            <div>
              <div className="flex items-end gap-2">
                <span className="text-[44px] font-bold leading-none" style={{ color: LC[level] }}>
                  {score}
                </span>
                <span className="mb-1.5 text-[20px] text-white/40">/100</span>
              </div>
              <p className="mt-2 text-[15px] text-slate-400">{label}</p>
            </div>
          </div>
        </section>

        {/* How score is calculated */}
        <section className="mb-10">
          <h2 className="mb-5 text-[20px] font-bold tracking-tight">Como o score é calculado</h2>
          <p className="mb-7 text-[14px] leading-relaxed text-slate-400">
            O score de voo analisa 5 fatores em tempo real. Cada fator pode reduzir a
            pontuação proporcionalmente ao risco que representa para a operação do drone.
          </p>

          <ScoreBar label="Vento médio" icon={<Wind size={17} />} value={wind} max={50} unit="km/h" level={windLevel} />
          <ScoreBar label="Rajada máxima" icon={<Zap size={17} />} value={gust} max={60} unit="km/h" level={gustLevel} />
          <ScoreBar label="Probabilidade de chuva" icon={<CloudRain size={17} />} value={rainP} max={100} unit="%" level={rainLevel} />
          <ScoreBar label="Temperatura" icon={<Thermometer size={17} />} value={temp} max={45} unit="°C" level={tempLevel} />
          <ScoreBar label="Índice Kp (GPS)" icon={<Activity size={17} />} value={parseFloat(kpIndex.toFixed(1))} max={9} unit="" level={kpLevel} />
        </section>

        {/* Factor details */}
        <section className="mb-10">
          <h2 className="mb-5 text-[20px] font-bold tracking-tight">Detalhes por fator</h2>
          <div className="grid grid-cols-2 gap-4">
            <FactorCard
              title="Vento"
              icon={<Wind size={17} />}
              note={`${wind} km/h — ${getRiskNote("wind", wind).toLowerCase()}. ${wind <= 15 ? "Condições ideais para voo estável." : wind <= 29 ? "Voo possível com atenção." : "Vento forte, avalie o risco."}`}
              level={windLevel}
              impact={getImpact(windLevel)}
              riskLabel={getRiskNote("wind", wind)}
            />
            <FactorCard
              title="Rajada"
              icon={<Zap size={17} />}
              note={`${gust} km/h — ${getRiskNote("gust", gust).toLowerCase()}. ${gust <= 20 ? "Sem variações bruscas." : gust <= 34 ? "Possíveis oscilações." : "Rajadas podem causar instabilidade."}`}
              level={gustLevel}
              impact={getImpact(gustLevel)}
              riskLabel={getRiskNote("gust", gust)}
            />
            <FactorCard
              title="Chuva"
              icon={<CloudRain size={17} />}
              note={`${rainP}% de chance — ${getRiskNote("rain", rainP).toLowerCase()}. ${rainP <= 20 ? "Céu limpo, pode voar." : rainP <= 50 ? "Monitore o céu." : "Alto risco de dano ao equipamento."}`}
              level={rainLevel}
              impact={getImpact(rainLevel)}
              riskLabel={getRiskNote("rain", rainP)}
            />
            <FactorCard
              title="Temperatura"
              icon={<Thermometer size={17} />}
              note={`${temp}°C — ${getRiskNote("temp", temp).toLowerCase()}. ${temp >= 5 && temp <= 35 ? "Faixa segura para bateria e eletrônicos." : "Temperatura pode afetar performance."}`}
              level={tempLevel}
              impact={getImpact(tempLevel)}
              riskLabel={getRiskNote("temp", temp)}
            />
            <FactorCard
              title="Índice Kp"
              icon={<Activity size={17} />}
              note={`Kp ${kpIndex.toFixed(1)} — ${getRiskNote("kp", kpIndex).toLowerCase()}. ${kpIndex <= 3 ? "GPS estável, sem interferência." : kpIndex <= 4 ? "Possível lentidão no lock GPS." : "Tempestade geomagnética pode afetar GPS."}`}
              level={kpLevel}
              impact={getImpact(kpLevel)}
              riskLabel={getRiskNote("kp", kpIndex)}
            />
          </div>
        </section>

        {/* Legend */}
        <section className="mb-8 rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-6">
          <h3 className="mb-4 text-[16px] font-semibold text-slate-200">Legenda</h3>
          <div className="flex flex-col gap-3.5 text-[14px]">
            <div className="flex items-center gap-3">
              <span className="h-[11px] w-[11px] rounded-full bg-[#2dffb3]" />
              <span className="text-slate-300">
                <span className="font-medium text-[#2dffb3]">70–100</span> — Condições ideais para voo
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-[11px] w-[11px] rounded-full bg-[#ffd84d]" />
              <span className="text-slate-300">
                <span className="font-medium text-[#ffd84d]">45–69</span> — Voo possível com cautela
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-[11px] w-[11px] rounded-full bg-[#ff5a5f]" />
              <span className="text-slate-300">
                <span className="font-medium text-[#ff5a5f]">0–44</span> — Voo não recomendado
              </span>
            </div>
          </div>
        </section>

        {/* Back button */}
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] py-4 text-[16px] font-medium text-slate-300 transition hover:bg-white/[0.05]"
        >
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
