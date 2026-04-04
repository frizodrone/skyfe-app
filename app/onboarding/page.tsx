"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Search, X, Shield, MapPin, Plane,
  Wind, Thermometer, Navigation2, Check,
} from "lucide-react";
import {
  DRONE_DATABASE, searchDrones, applyDroneLimits, getCategoryLabel,
  type DroneModel,
} from "@/lib/drones";

const ONBOARDING_KEY = "skyfe-onboarding-done";

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {}
}

/* ═══════════════════════════════════════════
   STEP 1 — BEM-VINDO
   ═══════════════════════════════════════════ */
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.12),_transparent_50%)]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm">
        {/* Logo */}
        <div className="grid h-24 w-24 place-items-center rounded-[28px] border border-cyan-400/20 bg-white/[0.03] shadow-[0_0_50px_rgba(45,204,255,0.2)]">
          <div className="relative h-[36px] w-[36px]">
            <span className="absolute left-0 top-0 h-[12px] w-[12px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0s" }} />
            <span className="absolute right-0 top-0 h-[12px] w-[12px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
            <span className="absolute left-0 bottom-0 h-[12px] w-[12px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
            <span className="absolute right-0 bottom-0 h-[12px] w-[12px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
            <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-[5px] bg-cyan-400 animate-pulse-dot" />
          </div>
        </div>

        <div>
          <h1 className="text-[36px] font-bold tracking-tight text-white">Sky<span className="text-cyan-400">Fe</span></h1>
          <p className="mt-2 text-[18px] font-medium text-cyan-400/80">Voe com Confiança</p>
        </div>

        <div className="flex flex-col gap-3 text-[14px] text-slate-400 leading-relaxed">
          <p>Encontre as melhores condições de voo para seu drone com dados meteorológicos em tempo real.</p>
          <p>Score inteligente, mapa de zonas aéreas e previsão de 16 dias.</p>
        </div>

        <button onClick={onNext}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[16px] font-semibold text-slate-950 shadow-[0_0_30px_rgba(45,204,255,0.2)] transition hover:brightness-105">
          Começar agora
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots */}
      <div className="fixed bottom-10 flex gap-2">
        <span className="h-2 w-6 rounded-full bg-cyan-400" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 2 — TERMOS E PRIVACIDADE
   ═══════════════════════════════════════════ */
function StepTerms({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.08),_transparent_50%)]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm">
        <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-cyan-400/15 bg-white/[0.03]">
          <Shield size={36} className="text-cyan-400" />
        </div>

        <h2 className="text-[24px] font-bold tracking-tight text-white">Termos e Privacidade</h2>

        <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-6 text-left">
          <p className="text-[14px] leading-relaxed text-slate-400">
            Levamos sua privacidade a sério. Ao continuar, você concorda com nossa{" "}
            <a href="/privacidade" target="_blank" className="text-cyan-400 underline">Política de Privacidade</a>
            {" "}e{" "}
            <a href="/termos" target="_blank" className="text-cyan-400 underline">Termos de Uso</a>.
          </p>
          <p className="mt-4 text-[13px] font-semibold leading-relaxed text-amber-400/80">
            Não somos responsáveis por quaisquer danos, violações legais ou acidentes resultantes do uso deste aplicativo.
            Consulte sempre a regulamentação da ANAC/DECEA antes de voar.
          </p>
        </div>

        <button onClick={onNext}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[16px] font-semibold text-slate-950 shadow-[0_0_30px_rgba(45,204,255,0.2)] transition hover:brightness-105">
          Aceitar e continuar
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="fixed bottom-10 flex gap-2">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-6 rounded-full bg-cyan-400" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 3 — MODELO DO DRONE
   ═══════════════════════════════════════════ */
function StepDrone({ onNext }: { onNext: (drone: DroneModel) => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DroneModel | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return searchDrones(query);
  }, [query]);

  // Agrupar por marca para navegação quando sem query
  const brandGroups = useMemo(() => {
    const brands = ["DJI", "Autel", "Skydio", "Parrot", "FIMI", "Hubsan", "Potensic", "Antigravity", "ZeroZero", "Ryze", "FPV Genérico"];
    const groups: { brand: string; drones: DroneModel[] }[] = [];
    for (const brand of brands) {
      const drones = DRONE_DATABASE.filter(d => d.brand === brand && !d.discontinued);
      if (drones.length > 0) groups.push({ brand, drones });
    }
    return groups;
  }, []);

  return (
    <div className="flex min-h-screen flex-col px-5 pt-6 pb-24">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Plane size={24} className="text-cyan-400" />
          <h2 className="text-[24px] font-bold tracking-tight text-white">Modelo do Drone</h2>
        </div>

        <p className="mb-6 text-[14px] text-slate-400 leading-relaxed">
          Insira o modelo do drone para personalizar as configurações de voo e obter um score mais preciso.
        </p>

        {/* Search */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5">
          <Search size={18} className="text-slate-400" />
          <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Buscar drone... (ex: Mavic 3, Mini 4)"
            className="flex-1 bg-transparent text-white text-[15px] outline-none placeholder:text-slate-500" />
          {query && (
            <button onClick={() => { setQuery(""); setSelected(null); }}>
              <X size={16} className="text-slate-500" />
            </button>
          )}
        </div>

        {/* Search results */}
        {query.length >= 2 && results.length > 0 && !selected && (
          <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] overflow-hidden">
            {results.map((d) => (
              <button key={d.id} onClick={() => { setSelected(d); setQuery(`${d.brand} ${d.name}`); }}
                className="flex w-full items-center gap-3 border-b border-white/[0.04] px-4 py-3.5 text-left last:border-b-0 transition hover:bg-white/[0.03]">
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-white">{d.brand} {d.name}</p>
                  <p className="text-[12px] text-slate-500">{getCategoryLabel(d.category)} · {d.weight}g · {d.maxFlightTime}min</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <p className="mb-4 text-[13px] text-slate-500 text-center">Nenhum drone encontrado. Tente outro nome.</p>
        )}

        {/* Selected drone card */}
        {selected && (
          <div className="mb-6 rounded-[20px] border border-cyan-400/20 bg-cyan-400/[0.04] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-white">{selected.brand} {selected.name}</h3>
              <span className="rounded-lg bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-400">{getCategoryLabel(selected.category)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="flex items-center gap-2 text-slate-400">
                <Wind size={14} className="text-emerald-400" />
                <span>Vento máx: <strong className="text-white">{selected.maxWind} km/h</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Thermometer size={14} className="text-red-400" />
                <span>Temp: <strong className="text-white">{selected.minTemp}° a {selected.maxTemp}°</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Navigation2 size={14} className="text-blue-400" />
                <span>GNSS: <strong className="text-white">{selected.gnss.length > 0 ? selected.gnss.join(", ") : "Nenhum"}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Plane size={14} className="text-cyan-400" />
                <span>Voo: <strong className="text-white">{selected.maxFlightTime} min</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Brand groups when no search */}
        {!query && !selected && (
          <div className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto no-scrollbar">
            {brandGroups.map(({ brand, drones }) => (
              <div key={brand}>
                <p className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{brand}</p>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] overflow-hidden">
                  {drones.slice(0, 8).map((d) => (
                    <button key={d.id} onClick={() => { setSelected(d); setQuery(`${d.brand} ${d.name}`); }}
                      className="flex w-full items-center gap-3 border-b border-white/[0.04] px-4 py-3 text-left last:border-b-0 transition hover:bg-white/[0.03]">
                      <p className="flex-1 text-[14px] font-medium text-white">{d.name}</p>
                      <span className="text-[11px] text-slate-500">{d.maxWind} km/h</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Next button */}
        <button
          disabled={!selected}
          onClick={() => selected && onNext(selected)}
          className="fixed bottom-8 left-5 right-5 mx-auto max-w-md flex items-center justify-center gap-2 rounded-full py-4 text-[16px] font-semibold transition disabled:opacity-30"
          style={selected ? {
            background: "linear-gradient(135deg, #22d3ee, #34d399)",
            color: "#04090f",
            boxShadow: "0 0 30px rgba(45,204,255,0.2)",
          } : {
            background: "rgba(255,255,255,0.06)",
            color: "#64748b",
          }}>
          Próximo
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-6 rounded-full bg-cyan-400" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 4 — CONFIRMAÇÃO DOS LIMITES
   ═══════════════════════════════════════════ */
function StepConfirm({ drone, onFinish }: { drone: DroneModel; onFinish: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,255,179,0.08),_transparent_50%)]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm">
        <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-emerald-400/30 bg-emerald-400/10">
          <Check size={36} className="text-emerald-400" />
        </div>

        <h2 className="text-[24px] font-bold tracking-tight text-white">{drone.brand} {drone.name}</h2>
        <p className="text-[14px] text-slate-400">Limiares de voo recomendados pelo fabricante</p>

        <div className="w-full rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-6">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-slate-400">Velocidade máxima do vento</span>
              <span className="text-[16px] font-bold text-white">{drone.maxWind} km/h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-slate-400">Rajada máxima</span>
              <span className="text-[16px] font-bold text-white">{drone.maxGust} km/h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-slate-400">Temperatura máxima</span>
              <span className="text-[16px] font-bold text-white">{drone.maxTemp} °C</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-slate-400">Temperatura mínima</span>
              <span className="text-[16px] font-bold text-white">{drone.minTemp} °C</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-slate-400">Sistemas de posicionamento</span>
              <span className="text-[14px] font-bold text-white">{drone.gnss.length > 0 ? drone.gnss.join(", ") : "—"}</span>
            </div>
          </div>
        </div>

        <p className="text-[12px] italic text-slate-500">Configurações podem ser alteradas a qualquer momento nas configurações do app.</p>

        <button onClick={onFinish}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[16px] font-semibold text-slate-950 shadow-[0_0_30px_rgba(45,204,255,0.2)] transition hover:brightness-105">
          Vamos começar!
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="fixed bottom-10 flex gap-2">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-6 rounded-full bg-cyan-400" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ONBOARDING PAGE
   ═══════════════════════════════════════════ */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedDrone, setSelectedDrone] = useState<DroneModel | null>(null);

  // Redirecionar se já fez onboarding
  useEffect(() => {
    if (isOnboardingDone()) {
      router.replace("/");
    }
  }, [router]);

  const handleDroneSelect = (drone: DroneModel) => {
    setSelectedDrone(drone);
    setStep(4);
  };

  const handleFinish = () => {
    if (selectedDrone) {
      applyDroneLimits(selectedDrone);
    }
    markOnboardingDone();
    router.replace("/");
  };

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
      {step === 2 && <StepTerms onNext={() => setStep(3)} />}
      {step === 3 && <StepDrone onNext={handleDroneSelect} />}
      {step === 4 && selectedDrone && <StepConfirm drone={selectedDrone} onFinish={handleFinish} />}
    </main>
  );
}
