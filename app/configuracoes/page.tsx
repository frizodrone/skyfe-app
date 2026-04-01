"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft, Wind, Zap, CloudRain, Thermometer, RotateCcw, Save,
} from "lucide-react";
import Link from "next/link";

type Config = {
  maxWind: number;
  maxGust: number;
  maxRain: number;
  minTemp: number;
  maxTemp: number;
};

const DEFAULTS: Config = {
  maxWind: 20,
  maxGust: 30,
  maxRain: 50,
  minTemp: 5,
  maxTemp: 38,
};

const STORAGE_KEY = "skyfe-config";

function loadConfig(): Config {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULTS;
}

function saveConfig(config: Config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

function Slider({ label, icon, value, min, max, step, unit, color, onChange }: {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  color: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-8 rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[15px] font-medium text-slate-200">
          {icon}
          {label}
        </div>
        <span className="text-[18px] font-bold" style={{ color }}>
          {value}{unit}
        </span>
      </div>

      <div className="relative">
        <div className="h-[8px] w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}44` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-[8px] w-full cursor-pointer opacity-0"
          style={{ marginTop: 0 }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}export default function Configuracoes() {
  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  const update = (key: keyof Config, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig(DEFAULTS);
    saveConfig(DEFAULTS);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
          <h1 className="text-[24px] font-bold tracking-tight">Configurações</h1>
        </header>

        {/* Intro */}
        <div className="mb-8 rounded-[20px] border border-cyan-400/[0.12] bg-cyan-400/[0.04] p-5">
          <h2 className="mb-2 text-[16px] font-semibold text-cyan-300">Limites personalizados</h2>
          <p className="text-[13px] leading-relaxed text-slate-400">
            Defina os limites máximos aceitáveis para cada condição climática. O score de voo será calculado com base nesses valores. Pilotos mais experientes podem usar limites mais altos.
          </p>
        </div>

        {/* Sliders */}
        <Slider
          label="Vento máximo"
          icon={<Wind size={18} />}
          value={config.maxWind}
          min={5}
          max={50}
          step={1}
          unit=" km/h"
          color="#2dffb3"
          onChange={(v) => update("maxWind", v)}
        />

        <Slider
          label="Rajada máxima"
          icon={<Zap size={18} />}
          value={config.maxGust}
          min={10}
          max={60}
          step={1}
          unit=" km/h"
          color="#2dccff"
          onChange={(v) => update("maxGust", v)}
        />

        <Slider
          label="Chuva máxima aceitável"
          icon={<CloudRain size={18} />}
          value={config.maxRain}
          min={0}
          max={100}
          step={5}
          unit="%"
          color="#ffd84d"
          onChange={(v) => update("maxRain", v)}
        />

        <Slider
          label="Temperatura mínima"
          icon={<Thermometer size={18} />}
          value={config.minTemp}
          min={-10}
          max={20}
          step={1}
          unit="°C"
          color="#ff5a5f"
          onChange={(v) => update("minTemp", v)}
        />

        <Slider
          label="Temperatura máxima"
          icon={<Thermometer size={18} />}
          value={config.maxTemp}
          min={25}
          max={50}
          step={1}
          unit="°C"
          color="#ff5a5f"
          onChange={(v) => update("maxTemp", v)}
        />

        {/* Saved feedback */}
        {saved && (
          <div className="mb-6 rounded-[16px] border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-center text-[14px] font-medium text-emerald-300">
            Configurações salvas!
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-4 text-[15px] font-medium text-slate-300 transition hover:bg-white/[0.05]"
          >
            <RotateCcw size={16} />
            Restaurar padrão
          </button>
          <button
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105"
          >
            <Save size={16} />
            Salvar
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-5">
          <h3 className="mb-3 text-[15px] font-semibold text-slate-200">Sobre os limites</h3>
          <div className="flex flex-col gap-3 text-[13px] leading-relaxed text-slate-400">
            <p>
              <span className="font-medium text-slate-200">Vento e rajada:</span> Drones menores (Mini, Air) são mais sensíveis. Para drones maiores (Mavic 3, Matrice), você pode aumentar os limites.
            </p>
            <p>
              <span className="font-medium text-slate-200">Chuva:</span> Qualquer probabilidade acima de 30% já representa risco para equipamentos não resistentes à água.
            </p>
            <p>
              <span className="font-medium text-slate-200">Temperatura:</span> Baterias LiPo perdem performance abaixo de 5°C e acima de 38°C. Ajuste conforme seu equipamento.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}