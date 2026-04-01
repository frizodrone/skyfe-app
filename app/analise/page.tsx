"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ArrowLeft, Wind, Zap, CloudRain, Thermometer, Eye,
  Droplets, ShieldCheck, ShieldAlert, ShieldX, TrendingDown, TrendingUp, Minus,
} from "lucide-react";
import { fetchWeather } from "@/lib/weather";
import { calculateFlightScore, getRiskNote } from "@/lib/score";
import Link from "next/link";

type Level = "good" | "warn" | "risk";

const LC: Record<Level, string> = {
  good: "#2dffb3", warn: "#ffd84d", risk: "#ff5a5f",
};

function ScoreBar({ label, icon, value, max, unit, level }: {
  label: string; icon: React.ReactNode; value: number; max: number; unit: string; level: Level;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const color = LC[level];
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[14px] font-medium text-slate-200">
          {icon}
          {label}
        </div>
        <span className="text-[14px] font-semibold" style={{ color }}>{value} {unit}</span>
      </div>
      <div className="h-[8px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}44` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
        <span>0</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

function FactorCard({ title, icon, note, level, impact }: {
  title: string; icon: React.ReactNode; note: string; level: Level; impact: "positive" | "neutral" | "negative";
}) {
  const color = LC[level];
  const ImpactIcon = impact === "positive" ? TrendingUp : impact === "negative" ? TrendingDown : Minus;
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200">{icon}<span className="text-[14px] font-medium">{title}</span></div>
        <ImpactIcon size={16} style={{ color }} />
      </div>
      <p className="text-[13px] text-slate-400">{note}</p>
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
        <span className="h-[6px] w-[6px] rounded-full" style={{ background: color }} />
        <span className="text-[11px] font-medium" style={{ color }}>{getRiskNote(title.toLowerCase().includes("vento") ? "wind" : title.toLowerCase().includes("rajada") ? "gust" : title.toLowerCase().includes("chuva") ? "rain" : "temp", 0)}</span>
      </div>
    </div>
  );
}

export default function Analise() {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [label, setLabel] = useState("...");
  const [level, setLevel] = useState<Level>("good");

  const load = useCallback(async (lat: number, lon: number) => {
    try {
      const data = await fetchWeather(lat, lon);
      setWeather(data);
      const c = data.current;
      const rp = data.hourly?.precipitation_probability?.[0] ?? 0;
      const res = calculateFlightScore({ wind: c.wind_speed_10m, gust: c.wind_gusts_10m, rainProb: rp, temp: c.temperature_2m });
      setScore(res.score); setLabel(res.label); setLevel(res.level);
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

  const wind = weather ? Math.round(weather.current.wind_speed_10m) : 0;
  const gust = weather ? Math.round(weather.current.wind_gusts_10m) : 0;
  const rainP = weather ? (weather.hourly?.precipitation_probability?.[0] ?? 0) : 0;
  const temp = weather ? Math.round(weather.current.temperature_2m) : 0;

  const windLevel: Level = wind <= 10 ? "good" : wind <= 20 ? "warn" : "risk";
  const gustLevel: Level = gust <= 15 ? "good" : gust <= 25 ? "warn" : "risk";
  const rainLevel: Level = rainP <= 20 ? "good" : rainP <= 50 ? "warn" : "risk";
  const tempLevel: Level = (temp >= 5 && temp <= 35) ? "good" : (temp >= 0 && temp <= 38) ? "warn" : "risk";

  const windImpact = wind <= 10 ? "positive" as const : wind <= 20 ? "neutral" as const : "negative" as const;
  const gustImpact = gust <= 15 ? "positive" as const : gust <= 25 ? "neutral" as const : "negative" as const;
  const rainImpact = rainP <= 20 ? "positive" as const : rainP <= 50 ? "neutral" as const : "negative" as const;
  const tempImpact = (temp >= 5 && temp <= 35) ? "positive" as const : "neutral" as const;

  const ShieldIcon = level === "good" ? ShieldCheck : level === "warn" ? ShieldAlert : ShieldX;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-[3px] border-white/[0.06] border-t-cyan-400 animate-spin-loader" />
          <p className="text-[15px] text-slate-400">Analisando condições...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-5">
        {/* Header */}
        <header className="mb-6 flex items-center gap-4">
          <Link href="/" className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[22px] font-bold tracking-tight">Análise detalhada</h1>
        </header>

        {/* Score summary */}
        <section className="mb-6 rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: `${LC[level]}10`, border: `1px solid ${LC[level]}20` }}>
              <ShieldIcon size={28} style={{ color: LC[level] }} />
            </div>
            <div>
              <div className="flex items-end gap-2">
                <span className="text-[40px] font-bold leading-none" style={{ color: LC[level] }}>{score}</span>
                <span className="mb-1 text-[18px] text-white/40">/100</span>
              </div>
              <p className="mt-1 text-[14px] text-slate-400">{label}</p>
            </div>
          </div>
        </section>

        {/* How score is calculated */}
        <section className="mb-6">
          <h2 className="mb-4 text-[18px] font-bold tracking-tight">Como o score é calculado</h2>
          <p className="mb-5 text-[13px] leading-relaxed text-slate-400">
            O score de voo analisa 4 fatores em tempo real. Cada fator pode reduzir a pontuação proporcionalmente ao risco que representa para a operação do drone.
          </p>

          <ScoreBar label="Vento médio" icon={<Wind size={16} />} value={wind} max={40} unit="km/h" level={windLevel} />
          <ScoreBar label="Rajada máxima" icon={<Zap size={16} />} value={gust} max={50} unit="km/h" level={gustLevel} />
          <ScoreBar label="Probabilidade de chuva" icon={<CloudRain size={16} />} value={rainP} max={100} unit="%" level={rainLevel} />
          <ScoreBar label="Temperatura" icon={<Thermometer size={16} />} value={temp} max={45} unit="°C" level={tempLevel} />
        </section>

        {/* Factor details */}
        <section className="mb-6">
          <h2 className="mb-4 text-[18px] font-bold tracking-tight">Detalhes por fator</h2>
          <div className="grid grid-cols-2 gap-3">
            <FactorCard
              title="Vento"
              icon={<Wind size={16} />}
              note={`${wind} km/h — ${getRiskNote("wind", wind).toLowerCase()}. ${wind <= 10 ? "Condições ideais para voo estável." : wind <= 20 ? "Voo possível com atenção extra." : "Risco alto de instabilidade."}`}
              level={windLevel}
              impact={windImpact}
            />
            <FactorCard
              title="Rajada"
              icon={<Zap size={16} />}
              note={`${gust} km/h — ${getRiskNote("gust", gust).toLowerCase()}. ${gust <= 15 ? "Sem variações bruscas." : gust <= 25 ? "Possíveis oscilações." : "Rajadas podem derrubar o drone."}`}
              level={gustLevel}
              impact={gustImpact}
            />
            <FactorCard
              title="Chuva"
              icon={<CloudRain size={16} />}
              note={`${rainP}% de chance — ${getRiskNote("rain", rainP).toLowerCase()}. ${rainP <= 20 ? "Céu limpo, pode voar." : rainP <= 50 ? "Monitore o céu." : "Alto risco de dano ao equipamento."}`}
              level={rainLevel}
              impact={rainImpact}
            />
            <FactorCard
              title="Temperatura"
              icon={<Thermometer size={16} />}
              note={`${temp}°C — ${getRiskNote("temp", temp).toLowerCase()}. ${temp >= 5 && temp <= 35 ? "Faixa segura para bateria e eletrônicos." : "Temperatura pode afetar performance."}`}
              level={tempLevel}
              impact={tempImpact}
            />
          </div>
        </section>

        {/* Legend */}
        <section className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4">
          <h3 className="mb-3 text-[14px] font-semibold text-slate-200">Legenda</h3>
          <div className="flex flex-col gap-2 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="h-[10px] w-[10px] rounded-full bg-[#2dffb3]" />
              <span className="text-slate-300"><span className="font-medium text-[#2dffb3]">75–100</span> — Condições ideais para voo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-[10px] w-[10px] rounded-full bg-[#ffd84d]" />
              <span className="text-slate-300"><span className="font-medium text-[#ffd84d]">50–74</span> — Voo possível com cautela</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-[10px] w-[10px] rounded-full bg-[#ff5a5f]" />
              <span className="text-slate-300"><span className="font-medium text-[#ff5a5f]">0–49</span> — Voo não recomendado</span>
            </div>
          </div>
        </section>

        {/* Back button */}
        <Link href="/" className="mt-6 flex w-full items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] py-4 text-[15px] font-medium text-slate-300 transition hover:bg-white/[0.05]">
          Voltar para o clima
        </Link>
      </div>
    </main>
  );
}