"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft, Wind, Zap, CloudRain, Thermometer, RotateCcw, Save,
  ChevronDown, Search, X, AlertTriangle, Plane, Check,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { DRONE_DATABASE, searchDrones, getDroneById, applyDroneLimits, getCategoryLabel, type DroneModel } from "@/lib/drones";

type Config = {
  maxWind: number;
  maxGust: number;
  maxRain: number;
  minTemp: number;
  maxTemp: number;
};

const DEFAULTS: Config = { maxWind: 30, maxGust: 40, maxRain: 50, minTemp: 5, maxTemp: 38 };
const STORAGE_KEY = "skyfe-config";

function Configuracoes() {
  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeDrone, setActiveDrone] = useState<{ id: string; brand: string; name: string } | null>(null);
  const [droneSpecs, setDroneSpecs] = useState<DroneModel | null>(null);
  const [showDronePicker, setShowDronePicker] = useState(false);
  const [droneQuery, setDroneQuery] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  // Load config and drone info
  useEffect(() => {
    const loadData = async () => {
      // Load config from localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setConfig(JSON.parse(raw));
      } catch {}

      // Load active drone
      try {
        const droneRaw = localStorage.getItem("skyfe-drone");
        if (droneRaw) {
          const drone = JSON.parse(droneRaw);
          setActiveDrone(drone);
          const specs = getDroneById(drone.id);
          if (specs) setDroneSpecs(specs);
        }
      } catch {}

      // If logged in, sync from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_settings")
          .select("max_wind, max_gust, max_rain, min_temp, max_temp")
          .eq("user_id", user.id)
          .single();
        if (data) {
          const c: Config = { maxWind: data.max_wind, maxGust: data.max_gust, maxRain: data.max_rain, minTemp: data.min_temp, maxTemp: data.max_temp };
          setConfig(c);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
        }
      }

      setLoading(false);
    };
    loadData();
  }, []);

  // Check if config differs from manufacturer specs
  useEffect(() => {
    if (!droneSpecs) { setIsCustom(false); return; }
    setIsCustom(
      config.maxWind !== droneSpecs.maxWind ||
      config.maxGust !== droneSpecs.maxGust ||
      config.maxRain !== droneSpecs.maxRain ||
      config.minTemp !== droneSpecs.minTemp ||
      config.maxTemp !== droneSpecs.maxTemp
    );
  }, [config, droneSpecs]);

  const update = (key: keyof Config, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_settings").update({
        max_wind: config.maxWind, max_gust: config.maxGust, max_rain: config.maxRain,
        min_temp: config.minTemp, max_temp: config.maxTemp, updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetToFactory = () => {
    if (droneSpecs) {
      const c: Config = { maxWind: droneSpecs.maxWind, maxGust: droneSpecs.maxGust, maxRain: droneSpecs.maxRain, minTemp: droneSpecs.minTemp, maxTemp: droneSpecs.maxTemp };
      setConfig(c);
    } else {
      setConfig(DEFAULTS);
    }
    setSaved(false);
  };

  const handleSelectDrone = (drone: DroneModel) => {
    setActiveDrone({ id: drone.id, brand: drone.brand, name: drone.name });
    setDroneSpecs(drone);
    applyDroneLimits(drone);
    setConfig({ maxWind: drone.maxWind, maxGust: drone.maxGust, maxRain: drone.maxRain, minTemp: drone.minTemp, maxTemp: drone.maxTemp });
    setShowDronePicker(false);
    setDroneQuery("");
    setSaved(false);
  };

  const droneResults = useMemo(() => {
    if (droneQuery.length < 2) return [];
    return searchDrones(droneQuery);
  }, [droneQuery]);

  // Group drones by brand for browsing
  const brandGroups = useMemo(() => {
    const brands = ["DJI", "Autel", "Skydio", "Parrot", "FIMI", "Hubsan", "Potensic", "FPV"];
    const groups: { brand: string; drones: DroneModel[] }[] = [];
    for (const brand of brands) {
      const drones = DRONE_DATABASE.filter(d => d.brand === brand && !d.discontinued);
      if (drones.length > 0) groups.push({ brand, drones });
    }
    return groups;
  }, []);

  const hasSpecs = droneSpecs !== null;

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 pt-6">

        <header className="mb-6 flex items-center gap-4">
          <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[22px] font-bold tracking-tight">Configurações</h1>
        </header>

        {/* ─── Drone selector card ─── */}
        <section className="mb-6">
          <button onClick={() => setShowDronePicker(!showDronePicker)}
            className="flex w-full items-center gap-3 rounded-[18px] border border-cyan-400/15 bg-cyan-400/[0.04] p-4 text-left transition hover:bg-cyan-400/[0.06]">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-cyan-400/10 border border-cyan-400/15">
              <Plane size={18} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Drone ativo</p>
              <p className="text-[16px] font-bold text-white truncate">
                {activeDrone ? `${activeDrone.brand} ${activeDrone.name}` : "Nenhum selecionado"}
              </p>
            </div>
            <ChevronDown size={18} className={`text-slate-500 transition-transform ${showDronePicker ? "rotate-180" : ""}`} />
          </button>

          {/* Drone picker */}
          {showDronePicker && (
            <div className="mt-2 rounded-[18px] border border-white/[0.08] bg-[#0b1221] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <Search size={15} className="text-slate-500" />
                <input value={droneQuery} onChange={e => setDroneQuery(e.target.value)}
                  placeholder="Buscar drone..." autoFocus
                  className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-slate-600" />
                {droneQuery && <button onClick={() => setDroneQuery("")}><X size={14} className="text-slate-500" /></button>}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {droneQuery.length >= 2 ? (
                  droneResults.length > 0 ? droneResults.map(d => (
                    <button key={d.id} onClick={() => handleSelectDrone(d)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left border-b border-white/[0.04] transition hover:bg-white/[0.03]">
                      <div className="flex-1">
                        <p className="text-[14px] font-medium text-white">{d.brand} {d.name}</p>
                        <p className="text-[11px] text-slate-500">{getCategoryLabel(d.category)} · Vento máx {d.maxWind} km/h</p>
                      </div>
                      {activeDrone?.id === d.id && <Check size={16} className="text-cyan-400" />}
                    </button>
                  )) : <p className="px-4 py-3 text-[13px] text-slate-500">Nenhum drone encontrado</p>
                ) : (
                  brandGroups.map(({ brand, drones }) => (
                    <div key={brand}>
                      <p className="sticky top-0 bg-[#0b1221] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400/60 border-b border-white/[0.04]">{brand}</p>
                      {drones.slice(0, 6).map(d => (
                        <button key={d.id} onClick={() => handleSelectDrone(d)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left border-b border-white/[0.03] transition hover:bg-white/[0.03]">
                          <p className="flex-1 text-[13px] text-slate-200">{d.name}</p>
                          <span className="text-[11px] text-slate-600">{d.maxWind} km/h</span>
                          {activeDrone?.id === d.id && <Check size={14} className="text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* ─── Manufacturer specs (reference) ─── */}
        {hasSpecs && (
          <section className="mb-6 rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Especificações do fabricante</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Vento máx:</span>
                <span className="font-semibold text-emerald-400">{droneSpecs!.maxWind} km/h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rajada máx:</span>
                <span className="font-semibold text-cyan-400">{droneSpecs!.maxGust} km/h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Temp. mín:</span>
                <span className="font-semibold text-red-400">{droneSpecs!.minTemp}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Temp. máx:</span>
                <span className="font-semibold text-red-400">{droneSpecs!.maxTemp}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">GNSS:</span>
                <span className="font-medium text-slate-300 text-[11px]">{droneSpecs!.gnss.join(", ") || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Peso:</span>
                <span className="font-medium text-slate-300">{droneSpecs!.weight}g</span>
              </div>
            </div>
            {isCustom && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-400/[0.06] border border-amber-400/15 px-3 py-2">
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-400/80">Seus limites estão diferentes dos recomendados pelo fabricante.</p>
              </div>
            )}
          </section>
        )}

        {/* Alert if no specs */}
        {!hasSpecs && activeDrone && (
          <div className="mb-6 flex items-center gap-2 rounded-[14px] bg-amber-400/[0.06] border border-amber-400/15 px-4 py-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <p className="text-[12px] text-amber-400/80">Especificações do fabricante não disponíveis para este modelo. Usando limites padrão.</p>
          </div>
        )}

        {/* ─── Intro text ─── */}
        <div className="mb-6">
          <h2 className="mb-1 text-[16px] font-semibold text-slate-200">Limites personalizados</h2>
          <p className="text-[12px] text-slate-500 leading-relaxed">
            Ajuste os limites máximos para o cálculo do score. Pilotos experientes podem usar valores mais altos.
          </p>
        </div>

        {/* ─── Sliders ─── */}
        <div className="flex flex-col gap-4 mb-6">
          <SliderCard label="Vento máximo" icon={<Wind size={17} />} value={config.maxWind} min={5} max={60} step={1} unit="km/h" color="#2dffb3"
            factoryVal={droneSpecs?.maxWind} onChange={v => update("maxWind", v)} />
          <SliderCard label="Rajada máxima" icon={<Zap size={17} />} value={config.maxGust} min={10} max={70} step={1} unit="km/h" color="#22d3ee"
            factoryVal={droneSpecs?.maxGust} onChange={v => update("maxGust", v)} />
          <SliderCard label="Chuva máxima" icon={<CloudRain size={17} />} value={config.maxRain} min={0} max={100} step={5} unit="%" color="#ffd84d"
            factoryVal={droneSpecs?.maxRain} onChange={v => update("maxRain", v)} />
          <SliderCard label="Temp. mínima" icon={<Thermometer size={17} />} value={config.minTemp} min={-20} max={15} step={1} unit="°C" color="#ff5a5f"
            factoryVal={droneSpecs?.minTemp} onChange={v => update("minTemp", v)} />
          <SliderCard label="Temp. máxima" icon={<Thermometer size={17} />} value={config.maxTemp} min={25} max={55} step={1} unit="°C" color="#ff5a5f"
            factoryVal={droneSpecs?.maxTemp} onChange={v => update("maxTemp", v)} />
        </div>

        {saved && (
          <div className="mb-4 rounded-[14px] border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-center text-[14px] font-medium text-emerald-300">
            Configurações salvas!
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mb-8">
          <button onClick={handleResetToFactory}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-3.5 text-[14px] font-medium text-slate-300 transition hover:bg-white/[0.05]">
            <RotateCcw size={15} />
            {hasSpecs ? "Restaurar fabricante" : "Restaurar padrão"}
          </button>
          <button onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-3.5 text-[14px] font-semibold text-slate-950 shadow-[0_0_20px_rgba(45,204,255,0.15)] transition hover:brightness-105">
            <Save size={15} />
            Salvar
          </button>
        </div>

        {/* Info section */}
        <div className="rounded-[18px] border border-white/[0.05] bg-white/[0.02] p-5">
          <h3 className="mb-3 text-[14px] font-semibold text-slate-300">Sobre os limites</h3>
          <div className="flex flex-col gap-3 text-[12px] leading-relaxed text-slate-500">
            <div className="flex gap-2.5">
              <Wind size={14} className="text-[#2dffb3] shrink-0 mt-0.5" />
              <p><span className="text-slate-300 font-medium">Vento e rajada:</span> Drones menores (Mini, Air) são mais sensíveis. O SkyFe mostra vento em diferentes altitudes.</p>
            </div>
            <div className="flex gap-2.5">
              <CloudRain size={14} className="text-[#ffd84d] shrink-0 mt-0.5" />
              <p><span className="text-slate-300 font-medium">Chuva:</span> Acima de 30% já representa risco para equipamentos não resistentes à água.</p>
            </div>
            <div className="flex gap-2.5">
              <Thermometer size={14} className="text-[#ff5a5f] shrink-0 mt-0.5" />
              <p><span className="text-slate-300 font-medium">Temperatura:</span> Baterias LiPo perdem performance abaixo de 5°C e acima de 38°C.</p>
            </div>
            <div className="flex gap-2.5">
              <span className="text-[#a78bfa] text-[11px] font-bold shrink-0 mt-0.5">Kp</span>
              <p><span className="text-slate-300 font-medium">Índice Kp:</span> Monitora atividade geomagnética via NOAA. Kp acima de 5 causa instabilidade no GPS.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ───── Slider Card with factory reference ───── */
function SliderCard({ label, icon, value, min, max, step, unit, color, factoryVal, onChange }: {
  label: string; icon: React.ReactNode; value: number; min: number; max: number; step: number; unit: string; color: string; factoryVal?: number; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const factoryPct = factoryVal !== undefined ? ((factoryVal - min) / (max - min)) * 100 : undefined;
  const isDifferent = factoryVal !== undefined && value !== factoryVal;

  return (
    <div className="rounded-[16px] border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[14px] font-medium text-slate-200">
          <div style={{ color }}>{icon}</div>
          {label}
        </div>
        <span className="text-[18px] font-bold" style={{ color }}>{value}{unit}</span>
      </div>

      {/* Slider track */}
      <div className="relative mb-1">
        <div className="h-[8px] w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full transition-all duration-150" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}33` }} />
        </div>
        {/* Factory reference marker */}
        {factoryPct !== undefined && (
          <div className="absolute top-0 h-[8px] w-[2px] rounded-full bg-white/40" style={{ left: `${factoryPct}%`, transform: "translateX(-1px)" }}
            title={`Fabricante: ${factoryVal}${unit}`} />
        )}
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 h-[8px] w-full cursor-pointer opacity-0" style={{ marginTop: 0 }} />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-600">
        <span>{min}{unit}</span>
        {isDifferent && factoryVal !== undefined && (
          <span className="text-amber-400/60">fab: {factoryVal}{unit}</span>
        )}
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function ConfiguracoesWrapper() {
  return <Configuracoes />;
}
