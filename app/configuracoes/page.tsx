"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Wind, Zap, CloudRain, Thermometer, RotateCcw, Save, AlertTriangle, Plane } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getDroneById, type DroneModel } from "@/lib/drones";

type Config = { maxWind: number; maxGust: number; maxRain: number; minTemp: number; maxTemp: number };
const DEFAULTS: Config = { maxWind: 30, maxGust: 40, maxRain: 50, minTemp: 5, maxTemp: 38 };
const STORAGE_KEY = "skyfe-config";

function SliderCard({ label, icon, value, min, max, step, unit, color, factoryVal, onChange }: {
  label: string; icon: React.ReactNode; value: number; min: number; max: number; step: number; unit: string; color: string; factoryVal?: number; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const factoryPct = factoryVal !== undefined ? ((factoryVal - min) / (max - min)) * 100 : undefined;
  const isDiff = factoryVal !== undefined && value !== factoryVal;
  return (
    <div className="rounded-[16px] border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[14px] font-medium text-slate-200"><div style={{ color }}>{icon}</div>{label}</div>
        <span className="text-[18px] font-bold" style={{ color }}>{value}{unit}</span>
      </div>
      <div className="relative mb-1">
        <div className="h-[8px] w-full overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full transition-all duration-150" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}33` }} /></div>
        {factoryPct !== undefined && <div className="absolute top-0 h-[8px] w-[2px] rounded-full bg-white/40" style={{ left: `${factoryPct}%`, transform: "translateX(-1px)" }} title={`Fabricante: ${factoryVal}${unit}`} />}
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="absolute inset-0 h-[8px] w-full cursor-pointer opacity-0" />
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-600">
        <span>{min}{unit}</span>
        {isDiff && factoryVal !== undefined && <span className="text-amber-400/60">fab: {factoryVal}{unit}</span>}
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function Configuracoes() {
  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [droneSpecs, setDroneSpecs] = useState<DroneModel | null>(null);
  const [droneName, setDroneName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConfig(JSON.parse(raw));
      const droneRaw = localStorage.getItem("skyfe-drone");
      if (droneRaw) {
        const drone = JSON.parse(droneRaw);
        setDroneName(`${drone.brand} ${drone.name}`);
        const specs = getDroneById(drone.id);
        if (specs) setDroneSpecs(specs);
      } else {
        const activeName = localStorage.getItem("skyfe-active-drone");
        if (activeName) setDroneName(activeName);
      }
    } catch {}
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_settings").select("max_wind, max_gust, max_rain, min_temp, max_temp").eq("user_id", user.id).single();
      if (data) {
        const c: Config = { maxWind: data.max_wind, maxGust: data.max_gust, maxRain: data.max_rain, minTemp: data.min_temp, maxTemp: data.max_temp };
        setConfig(c);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
      }
    })();
  }, []);

  const update = (key: keyof Config, value: number) => { setConfig(prev => ({ ...prev, [key]: value })); setSaved(false); };

  const handleSave = async () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { await supabase.from("user_settings").update({ max_wind: config.maxWind, max_gust: config.maxGust, max_rain: config.maxRain, min_temp: config.minTemp, max_temp: config.maxTemp, updated_at: new Date().toISOString() }).eq("user_id", user.id); }
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (droneSpecs) setConfig({ maxWind: droneSpecs.maxWind, maxGust: droneSpecs.maxGust, maxRain: droneSpecs.maxRain, minTemp: droneSpecs.minTemp, maxTemp: droneSpecs.maxTemp });
    else setConfig(DEFAULTS);
    setSaved(false);
  };

  const isCustom = droneSpecs && (config.maxWind !== droneSpecs.maxWind || config.maxGust !== droneSpecs.maxGust || config.maxRain !== droneSpecs.maxRain || config.minTemp !== droneSpecs.minTemp || config.maxTemp !== droneSpecs.maxTemp);

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" /></div>
      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 pt-6">

        <header className="mb-6 flex items-center gap-4">
          <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]"><ArrowLeft size={18} /></Link>
          <h1 className="text-[22px] font-bold tracking-tight">Limites de voo</h1>
        </header>

        {/* Drone reference */}
        <Link href="/perfil" className="mb-6 flex items-center gap-3 rounded-[16px] border border-cyan-400/15 bg-cyan-400/[0.04] p-4 transition hover:bg-cyan-400/[0.06]">
          <Plane size={18} className="text-cyan-400" />
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Baseado no drone</p>
            <p className="text-[15px] font-semibold text-white">{droneName || "Nenhum selecionado"}</p>
          </div>
          <span className="text-[11px] text-cyan-400/60">Alterar ›</span>
        </Link>

        {/* Specs summary */}
        {droneSpecs && (
          <div className="mb-6 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-[12px] border border-white/[0.05] bg-white/[0.02] py-2.5"><p className="text-[14px] font-bold text-emerald-400">{droneSpecs.maxWind}</p><p className="text-[9px] text-slate-500">Vento km/h</p></div>
            <div className="rounded-[12px] border border-white/[0.05] bg-white/[0.02] py-2.5"><p className="text-[14px] font-bold text-cyan-400">{droneSpecs.maxGust}</p><p className="text-[9px] text-slate-500">Rajada km/h</p></div>
            <div className="rounded-[12px] border border-white/[0.05] bg-white/[0.02] py-2.5"><p className="text-[14px] font-bold text-red-400">{droneSpecs.minTemp}°</p><p className="text-[9px] text-slate-500">Min °C</p></div>
            <div className="rounded-[12px] border border-white/[0.05] bg-white/[0.02] py-2.5"><p className="text-[14px] font-bold text-red-400">{droneSpecs.maxTemp}°</p><p className="text-[9px] text-slate-500">Max °C</p></div>
          </div>
        )}

        {!droneSpecs && droneName && (
          <div className="mb-6 flex items-center gap-2 rounded-[14px] bg-amber-400/[0.06] border border-amber-400/15 px-4 py-3">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-400/80">Specs do fabricante não disponíveis. Usando limites padrão.</p>
          </div>
        )}

        {isCustom && (
          <div className="mb-4 flex items-center gap-2 rounded-[14px] bg-amber-400/[0.06] border border-amber-400/15 px-4 py-2.5">
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-400/80">Limites personalizados — diferentes do fabricante.</p>
          </div>
        )}

        <p className="mb-4 text-[12px] text-slate-500">Ajuste os limites máximos aceitáveis. O score é calculado com base nesses valores.</p>

        <div className="flex flex-col gap-3 mb-6">
          <SliderCard label="Vento máximo" icon={<Wind size={17} />} value={config.maxWind} min={5} max={60} step={1} unit=" km/h" color="#2dffb3" factoryVal={droneSpecs?.maxWind} onChange={v => update("maxWind", v)} />
          <SliderCard label="Rajada máxima" icon={<Zap size={17} />} value={config.maxGust} min={10} max={70} step={1} unit=" km/h" color="#22d3ee" factoryVal={droneSpecs?.maxGust} onChange={v => update("maxGust", v)} />
          <SliderCard label="Chuva máxima" icon={<CloudRain size={17} />} value={config.maxRain} min={0} max={100} step={5} unit="%" color="#ffd84d" factoryVal={droneSpecs?.maxRain} onChange={v => update("maxRain", v)} />
          <SliderCard label="Temp. mínima" icon={<Thermometer size={17} />} value={config.minTemp} min={-20} max={15} step={1} unit="°C" color="#ff5a5f" factoryVal={droneSpecs?.minTemp} onChange={v => update("minTemp", v)} />
          <SliderCard label="Temp. máxima" icon={<Thermometer size={17} />} value={config.maxTemp} min={25} max={55} step={1} unit="°C" color="#ff5a5f" factoryVal={droneSpecs?.maxTemp} onChange={v => update("maxTemp", v)} />
        </div>

        {saved && <div className="mb-4 rounded-[14px] border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-center text-[14px] font-medium text-emerald-300">Salvo!</div>}

        <div className="flex gap-3">
          <button onClick={handleReset} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-3.5 text-[14px] font-medium text-slate-300 transition hover:bg-white/[0.05]"><RotateCcw size={15} />{droneSpecs ? "Restaurar fabricante" : "Restaurar padrão"}</button>
          <button onClick={handleSave} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-3.5 text-[14px] font-semibold text-slate-950 shadow-[0_0_20px_rgba(45,204,255,0.15)] transition hover:brightness-105"><Save size={15} />Salvar</button>
        </div>
      </div>
    </main>
  );
}

export default function ConfiguracoesWrapper() { return <Configuracoes />; }
