"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft, Sun, Map, Clock3, User, Settings, Shield, Globe, Info,
  Edit3, Save, ChevronDown, Plane,
} from "lucide-react";
import Link from "next/link";

type Profile = {
  name: string;
  drone: string;
  experience: string;
};

const DRONE_OPTIONS = [
  { value: "mini", label: "DJI Mini (Mini 2/3/4)" },
  { value: "air", label: "DJI Air (Air 2/3)" },
  { value: "mavic", label: "DJI Mavic (Mavic 3/Pro)" },
  { value: "avata", label: "DJI Avata / FPV" },
  { value: "matrice", label: "DJI Matrice / Enterprise" },
  { value: "autel", label: "Autel (EVO / Lite)" },
  { value: "fpv_custom", label: "FPV Customizado" },
  { value: "other", label: "Outro" },
];

const EXP_OPTIONS = [
  { value: "beginner", label: "Iniciante", desc: "Menos de 6 meses" },
  { value: "intermediate", label: "Intermediário", desc: "6 meses a 2 anos" },
  { value: "advanced", label: "Avançado", desc: "2 a 5 anos" },
  { value: "pro", label: "Profissional", desc: "Mais de 5 anos" },
];

const STORAGE_KEY = "skyfe-profile";
const DEFAULTS: Profile = { name: "", drone: "", experience: "" };

function loadProfile(): Profile {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULTS;
}

function saveProfile(p: Profile) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

export default function Perfil() {
  const [profile, setProfile] = useState<Profile>(DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    if (!p.name && !p.drone) setEditing(true);
  }, []);

  const update = (key: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveProfile(profile);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const droneLabel = DRONE_OPTIONS.find((d) => d.value === profile.drone)?.label || "";
  const expOption = EXP_OPTIONS.find((e) => e.value === profile.experience);

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-28 pt-6">

        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-[24px] font-bold tracking-tight">Perfil</h1>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2.5 text-[13px] font-medium text-cyan-400 transition hover:bg-cyan-400/[0.1]"
            >
              <Edit3 size={14} />
              Editar
            </button>
          )}
        </header>

        {/* Saved feedback */}
        {saved && (
          <div className="mb-6 rounded-[16px] border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-center text-[14px] font-medium text-emerald-300">
            Perfil salvo com sucesso!
          </div>
        )}

        {/* Profile card */}
        <section className="mb-8 overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.03]">
          {/* avatar area */}
          <div className="flex flex-col items-center border-b border-white/[0.06] bg-gradient-to-b from-cyan-400/[0.06] to-transparent px-6 py-8">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-cyan-400/30 bg-cyan-400/[0.08]">
              {profile.name ? (
                <span className="text-[32px] font-bold text-cyan-400">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User size={32} className="text-cyan-400/60" />
              )}
            </div>
            {editing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Seu nome de piloto"
                className="w-full max-w-[240px] rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-center text-[16px] font-medium text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/30"
              />
            ) : (
              <h2 className="text-[22px] font-bold text-slate-100">
                {profile.name || "Piloto SkyFe"}
              </h2>
            )}
            {!editing && droneLabel && (
              <p className="mt-2 text-[13px] text-slate-400">{droneLabel}</p>
            )}
            {!editing && expOption && (
              <span
                className="mt-3 rounded-full px-4 py-1.5 text-[12px] font-medium"
                style={{
                  background: profile.experience === "pro" ? "rgba(45,255,179,0.1)" :
                    profile.experience === "advanced" ? "rgba(45,204,255,0.1)" :
                    profile.experience === "intermediate" ? "rgba(255,216,77,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${profile.experience === "pro" ? "rgba(45,255,179,0.2)" :
                    profile.experience === "advanced" ? "rgba(45,204,255,0.2)" :
                    profile.experience === "intermediate" ? "rgba(255,216,77,0.2)" : "rgba(255,255,255,0.08)"}`,
                  color: profile.experience === "pro" ? "#2dffb3" :
                    profile.experience === "advanced" ? "#2dccff" :
                    profile.experience === "intermediate" ? "#ffd84d" : "#94a3b8",
                }}
              >
                {expOption.label} · {expOption.desc}
              </span>
            )}
          </div>

          {/* edit fields */}
          {editing && (
            <div className="flex flex-col gap-5 p-6">
              {/* drone select */}
              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-slate-500">Modelo do drone</label>
                <div className="grid grid-cols-2 gap-2">
                  {DRONE_OPTIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => update("drone", d.value)}
                      className="rounded-xl px-3 py-3 text-left text-[12px] font-medium transition-all duration-150"
                      style={profile.drone === d.value ? {
                        background: "rgba(45,204,255,0.1)",
                        border: "1px solid rgba(45,204,255,0.25)",
                        color: "#2dccff",
                      } : {
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#94a3b8",
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* experience select */}
              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-slate-500">Nível de experiência</label>
                <div className="flex flex-col gap-2">
                  {EXP_OPTIONS.map((e) => (
                    <button
                      key={e.value}
                      onClick={() => update("experience", e.value)}
                      className="flex items-center justify-between rounded-xl px-4 py-3.5 text-left transition-all duration-150"
                      style={profile.experience === e.value ? {
                        background: "rgba(45,204,255,0.1)",
                        border: "1px solid rgba(45,204,255,0.25)",
                        color: "#2dccff",
                      } : {
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#94a3b8",
                      }}
                    >
                      <span className="text-[14px] font-medium">{e.label}</span>
                      <span className="text-[11px] opacity-70">{e.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* save button */}
              <button
                onClick={handleSave}
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105"
              >
                <Save size={16} />
                Salvar perfil
              </button>
            </div>
          )}
        </section>

        {/* Quick links */}
        <section className="mb-8">
          <h3 className="mb-4 text-[15px] font-semibold text-slate-300">Acesso rápido</h3>
          <div className="flex flex-col gap-2.5">
            <Link href="/configuracoes" className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-4 transition hover:bg-white/[0.04]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10">
                <Settings size={17} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-slate-200">Configurações de voo</p>
                <p className="mt-0.5 text-[12px] text-slate-500">Limites personalizados</p>
              </div>
            </Link>
            <Link href="/analise" className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-4 transition hover:bg-white/[0.04]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10">
                <Shield size={17} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-slate-200">Análise detalhada</p>
                <p className="mt-0.5 text-[12px] text-slate-500">Como o score funciona</p>
              </div>
            </Link>
            <Link href="/previsao" className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-4 transition hover:bg-white/[0.04]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10">
                <Clock3 size={17} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-slate-200">Previsão completa</p>
                <p className="mt-0.5 text-[12px] text-slate-500">Próximas 24h e 16 dias</p>
              </div>
            </Link>
          </div>
        </section>

        {/* About — collapsible */}
        <section className="mb-8">
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="flex w-full items-center justify-between rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-4 text-left transition hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06]">
                <Info size={17} className="text-slate-400" />
              </div>
              <span className="text-[14px] font-medium text-slate-200">Sobre o SkyFe</span>
            </div>
            <ChevronDown
              size={18}
              className={`text-slate-500 transition-transform duration-200 ${showAbout ? "rotate-180" : ""}`}
            />
          </button>

          {showAbout && (
            <div className="mt-2 rounded-[18px] border border-white/[0.04] bg-white/[0.02] p-5">
              {/* App identity */}
              <div className="mb-5 flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-[16px] border border-cyan-400/[0.15] bg-cyan-400/[0.06]">
                  <div className="relative h-6 w-6">
                    <span className="absolute left-0 top-0 h-[8px] w-[8px] rounded-full border-[1.5px] border-cyan-400/90" />
                    <span className="absolute right-0 top-0 h-[8px] w-[8px] rounded-full border-[1.5px] border-cyan-400/90" />
                    <span className="absolute bottom-0 left-0 h-[8px] w-[8px] rounded-full border-[1.5px] border-cyan-400/90" />
                    <span className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full border-[1.5px] border-cyan-400/90" />
                    <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-cyan-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-[20px] font-bold tracking-tight">
                    Sky<span className="text-cyan-400">Fe</span>
                  </h2>
                  <p className="text-[12px] text-slate-500">Versão 2.0.0</p>
                </div>
              </div>

              <p className="mb-4 text-[13px] leading-relaxed text-slate-400">
                Sistema de decisão de voo para pilotos de drones. Analisa condições climáticas em tempo real e calcula um score de 0 a 100 indicando se é seguro voar.
              </p>

              <div className="flex flex-col gap-2.5 text-[12px] text-slate-500">
                <div className="flex items-center gap-2.5">
                  <Globe size={14} className="text-slate-600" />
                  <span>Dados climáticos: Open-Meteo</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Map size={14} className="text-slate-600" />
                  <span>Mapas: OpenStreetMap / CartoDB</span>
                </div>
              </div>

              <p className="mt-4 text-[11px] text-slate-600">
                Desenvolvido por Frizodrone © 2025
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#04090f]/80 backdrop-blur-2xl">
        <div className="mx-auto grid max-w-md grid-cols-4 px-4 py-2.5 text-center text-[11px]">
          {[
            { icon: <Sun size={21} />, label: "Clima", active: false, href: "/" },
            { icon: <Map size={21} />, label: "Zonas", active: false, href: "/zonas" },
            { icon: <Clock3 size={21} />, label: "Previsão", active: false, href: "/previsao" },
            { icon: <User size={21} />, label: "Perfil", active: true, href: "/perfil" },
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