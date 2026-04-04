"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Search, X, Shield, Wind, Thermometer, Check,
  Camera, MapPinned, Zap, Plane, Tractor, Navigation2,
} from "lucide-react";
import {
  DRONE_DATABASE, searchDrones, applyDroneLimits, getCategoryLabel,
  type DroneModel,
} from "@/lib/drones";

const ONBOARDING_KEY = "skyfe-onboarding-done";

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  try { return localStorage.getItem(ONBOARDING_KEY) === "true"; } catch { return false; }
}

export function markOnboardingDone(): void {
  try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch {}
}

/* ═══ PILOT TYPES ═══ */
const PILOT_TYPES = [
  { value: "hobbyist", label: "Hobbyista", icon: <Plane size={20} />, desc: "Voo recreativo e diversão" },
  { value: "photographer", label: "Fotógrafo / Cinegrafista", icon: <Camera size={20} />, desc: "Fotos e vídeos aéreos" },
  { value: "mapper", label: "Mapeamento / Inspeção", icon: <MapPinned size={20} />, desc: "Topografia, inspeção técnica" },
  { value: "fpv", label: "FPV / Racing", icon: <Zap size={20} />, desc: "Freestyle, racing, cinewhoop" },
  { value: "agricultural", label: "Agrícola", icon: <Tractor size={20} />, desc: "Pulverização e monitoramento" },
  { value: "other", label: "Outro", icon: <Navigation2 size={20} />, desc: "Delivery, pesquisa, outros" },
];

const EXP_OPTIONS = [
  { value: "beginner", label: "Iniciante", desc: "Menos de 20 voos", color: "#94a3b8" },
  { value: "intermediate", label: "Intermediário", desc: "20 a 100 voos", color: "#ffd84d" },
  { value: "advanced", label: "Avançado", desc: "100 a 500 voos", color: "#22d3ee" },
  { value: "pro", label: "Profissional", desc: "500+ voos, opera comercialmente", color: "#2dffb3" },
  { value: "expert", label: "Especialista", desc: "Instrutor ou operador certificado", color: "#a78bfa" },
];

/* ═══ STEP 1 — Welcome ═══ */
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="pointer-events-none fixed inset-0"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.12),_transparent_50%)]" /></div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-8 grid h-24 w-24 place-items-center rounded-[28px] border border-cyan-400/20 bg-white/[0.03] shadow-[0_0_60px_rgba(45,204,255,0.15)]">
          <div className="relative h-[36px] w-[36px]">
            <span className="absolute left-0 top-0 h-[12px] w-[12px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" /><span className="absolute right-0 top-0 h-[12px] w-[12px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.2s" }} /><span className="absolute left-0 bottom-0 h-[12px] w-[12px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.4s" }} /><span className="absolute right-0 bottom-0 h-[12px] w-[12px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.6s" }} /><span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-cyan-400" />
          </div>
        </div>
        <h1 className="mb-3 text-[36px] font-bold tracking-tight">Sky<span className="text-cyan-400">Fe</span></h1>
        <p className="mb-2 text-[18px] font-semibold text-white">É seguro voar agora?</p>
        <p className="mb-10 max-w-[280px] text-center text-[14px] leading-relaxed text-slate-400">
          Seu copiloto inteligente para decisões de voo. Vamos configurar em menos de 1 minuto.
        </p>
        <button onClick={onNext} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 py-4 text-[16px] font-semibold text-slate-950 shadow-[0_0_30px_rgba(45,204,255,0.2)] transition hover:brightness-105">
          Começar <ChevronRight size={20} />
        </button>
      </div>
      <div className="fixed bottom-8 flex gap-2">
        <span className="h-2 w-6 rounded-full bg-cyan-400" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

/* ═══ STEP 2 — Pilot Info ═══ */
function StepPilotInfo({ onNext }: { onNext: (data: { name: string; pilotType: string; experience: string }) => void }) {
  const [name, setName] = useState("");
  const [pilotType, setPilotType] = useState("");
  const [experience, setExperience] = useState("");
  const canProceed = name.trim().length >= 2 && pilotType && experience;

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <div className="pointer-events-none fixed inset-0"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" /></div>
      <div className="relative z-10 flex-1">
        <h2 className="mb-2 text-[24px] font-bold">Sobre você</h2>
        <p className="mb-6 text-[14px] text-slate-400">Nos ajuda a personalizar a experiência.</p>

        {/* Name */}
        <div className="mb-6">
          <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-slate-500">Seu nome</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Como quer ser chamado?"
            className="w-full rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/30" />
        </div>

        {/* Pilot type */}
        <div className="mb-6">
          <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-slate-500">Tipo de piloto</label>
          <div className="grid grid-cols-2 gap-2">
            {PILOT_TYPES.map(t => (
              <button key={t.value} onClick={() => setPilotType(t.value)}
                className="flex items-center gap-2.5 rounded-[14px] px-3 py-3 text-left transition"
                style={pilotType === t.value ? { background: "rgba(45,204,255,0.08)", border: "1px solid rgba(45,204,255,0.25)", color: "#22d3ee" } : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                <div className="shrink-0">{t.icon}</div>
                <div><p className="text-[12px] font-semibold" style={{ color: pilotType === t.value ? "#fff" : "#cbd5e1" }}>{t.label}</p><p className="text-[10px]" style={{ color: pilotType === t.value ? "#94a3b8" : "#475569" }}>{t.desc}</p></div>
              </button>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="mb-6">
          <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-slate-500">Experiência</label>
          <div className="flex flex-col gap-1.5">
            {EXP_OPTIONS.map(e => (
              <button key={e.value} onClick={() => setExperience(e.value)}
                className="flex items-center gap-3 rounded-[12px] px-4 py-2.5 text-left transition"
                style={experience === e.value ? { background: `${e.color}0d`, border: `1px solid ${e.color}30` } : { background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: experience === e.value ? e.color : "#334155" }} />
                <div><p className="text-[13px] font-medium" style={{ color: experience === e.value ? e.color : "#cbd5e1" }}>{e.label}</p><p className="text-[11px] text-slate-500">{e.desc}</p></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button disabled={!canProceed} onClick={() => canProceed && onNext({ name, pilotType, experience })}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[16px] font-semibold transition disabled:opacity-30"
        style={canProceed ? { background: "linear-gradient(135deg, #22d3ee, #34d399)", color: "#04090f", boxShadow: "0 0 30px rgba(45,204,255,0.2)" } : { background: "rgba(255,255,255,0.06)", color: "#64748b" }}>
        Próximo <ChevronRight size={20} />
      </button>
      <div className="mt-4 flex justify-center gap-2"><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-6 rounded-full bg-cyan-400" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /></div>
    </div>
  );
}

/* ═══ STEP 3 — Drone Selection ═══ */
function StepDrone({ onNext }: { onNext: (drone: DroneModel | null) => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DroneModel | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => query.length >= 2 ? searchDrones(query) : [], [query]);
  const brandGroups = useMemo(() => {
    const brands = ["DJI", "Autel", "Skydio", "Parrot", "FIMI", "Hubsan", "Potensic", "FPV"];
    return brands.map(b => ({ brand: b, drones: DRONE_DATABASE.filter(d => d.brand === b && !d.discontinued) })).filter(g => g.drones.length > 0);
  }, []);

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <div className="pointer-events-none fixed inset-0"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" /></div>
      <div className="relative z-10 flex-1">
        <h2 className="mb-2 text-[24px] font-bold">Qual é o seu drone?</h2>
        <p className="mb-5 text-[14px] text-slate-400">Vamos ajustar os limites de voo automaticamente.</p>

        <div className="mb-4 flex items-center gap-2 rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <Search size={16} className="text-slate-500" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por modelo..."
            className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-slate-600" />
          {query && <button onClick={() => setQuery("")}><X size={14} className="text-slate-500" /></button>}
        </div>

        {selected && (
          <div className="mb-4 flex items-center gap-3 rounded-[14px] border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3">
            <Check size={16} className="text-cyan-400" />
            <span className="text-[14px] font-semibold text-cyan-400">{selected.brand} {selected.name}</span>
            <button onClick={() => setSelected(null)} className="ml-auto"><X size={14} className="text-slate-500" /></button>
          </div>
        )}

        <div className="max-h-[45vh] overflow-y-auto rounded-[16px] border border-white/[0.06] bg-white/[0.02]">
          {query.length >= 2 ? (
            results.length > 0 ? results.map(d => (
              <button key={d.id} onClick={() => { setSelected(d); setQuery(""); }}
                className="flex w-full items-center gap-3 border-b border-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.03]">
                <p className="flex-1 text-[14px] font-medium text-white">{d.brand} {d.name}</p>
                <span className="text-[11px] text-slate-500">{d.maxWind} km/h</span>
              </button>
            )) : <p className="px-4 py-3 text-[13px] text-slate-500">Nenhum drone encontrado</p>
          ) : (
            brandGroups.map(({ brand, drones }) => (
              <div key={brand}>
                <p className="sticky top-0 bg-[#0b1424] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400/60 border-b border-white/[0.04]">{brand}</p>
                {drones.map(d => (
                  <button key={d.id} onClick={() => { setSelected(d); setQuery(""); }}
                    className="flex w-full items-center gap-3 border-b border-white/[0.03] px-4 py-2.5 text-left hover:bg-white/[0.03]">
                    <p className="flex-1 text-[13px] text-slate-200">{d.name}</p>
                    <span className="text-[11px] text-slate-600">{d.maxWind} km/h</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button onClick={() => onNext(selected)}
          className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[16px] font-semibold transition"
          style={selected ? { background: "linear-gradient(135deg, #22d3ee, #34d399)", color: "#04090f", boxShadow: "0 0 30px rgba(45,204,255,0.2)" } : { background: "rgba(255,255,255,0.06)", color: "#64748b" }}>
          {selected ? "Próximo" : "Selecione um drone"} <ChevronRight size={20} />
        </button>
        {!selected && (
          <button onClick={() => onNext(null)} className="py-2 text-[13px] text-slate-500 hover:text-slate-300">Pular — configurar depois</button>
        )}
      </div>
      <div className="mt-4 flex justify-center gap-2"><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-6 rounded-full bg-cyan-400" /><span className="h-2 w-2 rounded-full bg-white/20" /></div>
    </div>
  );
}

/* ═══ STEP 4 — Confirmation ═══ */
function StepConfirm({ name, drone, onFinish }: { name: string; drone: DroneModel | null; onFinish: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="pointer-events-none fixed inset-0"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.12),_transparent_50%)]" /></div>
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-6 text-[48px]">🚀</div>
        <h2 className="mb-2 text-[26px] font-bold">Tudo pronto, {name.split(" ")[0]}!</h2>
        {drone ? (
          <>
            <p className="mb-2 text-[15px] text-slate-300">Limites configurados para o <span className="font-semibold text-cyan-400">{drone.brand} {drone.name}</span></p>
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-[13px] text-slate-400">
              <span className="inline-flex items-center gap-1.5"><Wind size={13} className="text-emerald-400" />{drone.maxWind} km/h</span>
              <span className="inline-flex items-center gap-1.5"><Thermometer size={13} className="text-red-400" />{drone.minTemp}° a {drone.maxTemp}°C</span>
            </div>
          </>
        ) : (
          <p className="mb-6 text-[15px] text-slate-400">Usando limites padrão. Você pode alterar nas configurações.</p>
        )}
        <button onClick={onFinish} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 py-4 text-[16px] font-semibold text-slate-950 shadow-[0_0_30px_rgba(45,204,255,0.2)] transition hover:brightness-105">
          Começar a usar o SkyFe <ChevronRight size={20} />
        </button>
      </div>
      <div className="fixed bottom-8 flex gap-2"><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-6 rounded-full bg-cyan-400" /></div>
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pilotInfo, setPilotInfo] = useState<{ name: string; pilotType: string; experience: string } | null>(null);
  const [selectedDrone, setSelectedDrone] = useState<DroneModel | null>(null);

  useEffect(() => { if (isOnboardingDone()) router.replace("/"); }, [router]);

  const handlePilotInfo = (data: { name: string; pilotType: string; experience: string }) => {
    setPilotInfo(data);
    try {
      localStorage.setItem("skyfe-pilot", JSON.stringify(data));
    } catch {}
    setStep(3);
  };

  const handleDroneSelect = (drone: DroneModel | null) => {
    setSelectedDrone(drone);
    if (drone) {
      applyDroneLimits(drone);
      try {
        localStorage.setItem("skyfe-user-drones", JSON.stringify([`${drone.brand} ${drone.name}`]));
        localStorage.setItem("skyfe-active-drone", `${drone.brand} ${drone.name}`);
      } catch {}
    }
    setStep(4);
  };

  const handleFinish = () => {
    markOnboardingDone();
    router.replace("/");
  };

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
      {step === 2 && <StepPilotInfo onNext={handlePilotInfo} />}
      {step === 3 && <StepDrone onNext={handleDroneSelect} />}
      {step === 4 && <StepConfirm name={pilotInfo?.name || "Piloto"} drone={selectedDrone} onFinish={handleFinish} />}
    </main>
  );
}
