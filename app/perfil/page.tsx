"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Sun, Map, Clock3, User, Settings, Shield, Globe, Info,
  Edit3, Save, ChevronDown,
} from "lucide-react";
import Link from "next/link";

type Profile = {
  name: string;
  drone: string;
  experience: string;
};

const DRONE_CATEGORIES = [
  {
    category: "DJI Mini",
    items: [
      "DJI Mini 2", "DJI Mini 2 SE", "DJI Mini 3", "DJI Mini 3 Pro",
      "DJI Mini 4 Pro", "DJI Mini 4K", "DJI Mini 5 Pro",
    ],
  },
  {
    category: "DJI Air",
    items: ["DJI Air 2", "DJI Air 2S", "DJI Air 3", "DJI Air 3S"],
  },
  {
    category: "DJI Mavic",
    items: [
      "DJI Mavic Pro", "DJI Mavic 3", "DJI Mavic 3 Classic",
      "DJI Mavic 3 Pro", "DJI Mavic 3 Cine", "DJI Mavic 4 Pro",
    ],
  },
  {
    category: "DJI FPV",
    items: ["DJI Avata", "DJI Avata 2", "DJI Avata 360", "DJI FPV", "DJI Neo", "DJI Neo 2"],
  },
  {
    category: "DJI Clássicos",
    items: ["DJI Phantom 4 Pro", "DJI Spark"],
  },
  {
    category: "DJI Enterprise",
    items: [
      "DJI Matrice 30", "DJI Matrice 30T", "DJI Matrice 300 RTK", "DJI Matrice 350 RTK",
      "DJI Mavic 3 Enterprise", "DJI Mavic 3 Thermal", "DJI Mavic 3 Multispectral",
      "DJI Dock", "DJI Dock 2",
    ],
  },
  {
    category: "DJI Agrícola",
    items: [
      "DJI Agras T10", "DJI Agras T16", "DJI Agras T20",
      "DJI Agras T25", "DJI Agras T30", "DJI Agras T40", "DJI Agras T50",
    ],
  },
  {
    category: "Autel",
    items: [
      "Autel EVO Nano", "Autel EVO Nano+", "Autel EVO Lite", "Autel EVO Lite+",
      "Autel EVO II", "Autel EVO II Pro", "Autel EVO II Dual", "Autel EVO Max 4T",
    ],
  },
  {
    category: "FPV / Outros",
    items: ["FPV Customizado", "Outro"],
  },
];

const EXP_OPTIONS = [
  { value: "beginner", label: "Iniciante", color: "#94a3b8" },
  { value: "intermediate", label: "Intermediário", color: "#ffd84d" },
  { value: "advanced", label: "Avançado", color: "#2dccff" },
  { value: "pro", label: "Profissional", color: "#2dffb3" },
  { value: "expert", label: "Especialista", color: "#c084fc" },
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return "";
}

/* ─── Dropdown ─── */
function Dropdown({ label, value, placeholder, children, open, onToggle }: {
  label: string; value: string; placeholder: string;
  children: React.ReactNode; open: boolean; onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && open) onToggle();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative">
      <label className="mb-2.5 block text-[13px] font-medium uppercase tracking-wider text-slate-500">{label}</label>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-all"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: open ? "1px solid rgba(45,204,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span className={value ? "text-[15px] font-medium text-slate-100" : "text-[15px] text-slate-500"}>
          {value || placeholder}
        </span>
        <ChevronDown size={18} className={`text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[320px] overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0a1220] shadow-[0_12px_40px_rgba(0,0,0,0.5)] no-scrollbar">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Perfil() {
  const [profile, setProfile] = useState<Profile>(DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [droneOpen, setDroneOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);

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
    setTimeout(() => setSaved(false), 2500);
  };

  const expOption = EXP_OPTIONS.find((e) => e.value === profile.experience);
  const initials = getInitials(profile.name);

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
          {!editing && profile.name && (
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
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3.5 text-center text-[14px] font-medium text-emerald-300">
            Perfil salvo com sucesso!
          </div>
        )}

        {/* ═══ VIEWING MODE ═══ */}
        {!editing && profile.name && (
          <section className="relative mb-10 overflow-hidden rounded-[28px] border border-cyan-400/[0.12] bg-[linear-gradient(180deg,rgba(10,18,32,0.98),rgba(4,9,15,1))] shadow-[0_0_40px_rgba(45,204,255,0.06)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_rgba(45,204,255,0.08),_transparent_50%)]" />

            <div className="relative z-10 flex flex-col items-center px-6 py-12">
              {/* avatar with initials */}
              <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2 shadow-[0_0_30px_rgba(45,204,255,0.15)]"
                style={{ borderColor: expOption?.color || "#2dccff", background: `${expOption?.color || "#2dccff"}10` }}>
                <span className="text-[36px] font-bold" style={{ color: expOption?.color || "#2dccff" }}>
                  {initials}
                </span>
              </div>

              {/* name */}
              <h2 className="text-[26px] font-bold text-white">{profile.name}</h2>

              {/* drone */}
              {profile.drone && (
                <p className="mt-2 text-[15px] text-slate-400">{profile.drone}</p>
              )}

              {/* experience badge */}
              {expOption && (
                <div className="mt-5 flex items-center gap-2.5 rounded-full px-6 py-2.5"
                  style={{ background: `${expOption.color}10`, border: `1px solid ${expOption.color}25` }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: expOption.color }} />
                  <span className="text-[14px] font-semibold" style={{ color: expOption.color }}>
                    {expOption.label}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ EDITING MODE ═══ */}
        {editing && (
          <section className="mb-10 overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.02]">
            {/* avatar + name */}
            <div className="flex flex-col items-center border-b border-white/[0.06] bg-gradient-to-b from-cyan-400/[0.04] to-transparent px-6 pt-10 pb-8">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-cyan-400/25 bg-cyan-400/[0.06]">
                {initials ? (
                  <span className="text-[30px] font-bold text-cyan-400">{initials}</span>
                ) : (
                  <User size={32} className="text-cyan-400/50" />
                )}
              </div>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Nome do piloto"
                className="w-full max-w-[280px] rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-4 text-center text-[17px] font-medium text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/30 transition"
              />
            </div>

            {/* fields */}
            <div className="flex flex-col gap-7 p-6">
              {/* Drone dropdown */}
              <Dropdown
                label="Modelo do drone"
                value={profile.drone}
                placeholder="Selecione seu drone"
                open={droneOpen}
                onToggle={() => { setDroneOpen(!droneOpen); setExpOpen(false); }}
              >
                {DRONE_CATEGORIES.map((cat) => (
                  <div key={cat.category}>
                    <p className="sticky top-0 bg-[#0a1220] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-white/[0.04]">
                      {cat.category}
                    </p>
                    {cat.items.map((item) => (
                      <button
                        key={item}
                        onClick={() => { update("drone", item); setDroneOpen(false); }}
                        className="flex w-full items-center px-5 py-3.5 text-[14px] text-left transition hover:bg-white/[0.04]"
                        style={profile.drone === item ? { color: "#2dccff", background: "rgba(45,204,255,0.06)" } : { color: "#cbd5e1" }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ))}
              </Dropdown>

              {/* Experience dropdown */}
              <Dropdown
                label="Nível de experiência"
                value={expOption?.label || ""}
                placeholder="Selecione seu nível"
                open={expOpen}
                onToggle={() => { setExpOpen(!expOpen); setDroneOpen(false); }}
              >
                {EXP_OPTIONS.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => { update("experience", e.value); setExpOpen(false); }}
                    className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-white/[0.04]"
                    style={profile.experience === e.value ? { background: `${e.color}08` } : {}}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ background: e.color }} />
                    <span className="text-[15px] font-medium" style={{ color: profile.experience === e.value ? e.color : "#cbd5e1" }}>
                      {e.label}
                    </span>
                  </button>
                ))}
              </Dropdown>

              {/* save */}
              <button
                onClick={handleSave}
                disabled={!profile.name.trim()}
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[16px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={17} />
                Salvar perfil
              </button>
            </div>
          </section>
        )}

        {/* Quick links */}
        <section className="mb-8">
          <h3 className="mb-4 text-[16px] font-semibold text-slate-300">Acesso rápido</h3>
          <div className="flex flex-col gap-3">
            <Link href="/configuracoes" className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-5 transition hover:bg-white/[0.04]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                <Settings size={18} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-slate-200">Configurações de voo</p>
                <p className="mt-0.5 text-[12px] text-slate-500">Limites personalizados</p>
              </div>
            </Link>
            <Link href="/analise" className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-5 transition hover:bg-white/[0.04]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                <Shield size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-slate-200">Análise detalhada</p>
                <p className="mt-0.5 text-[12px] text-slate-500">Como o score funciona</p>
              </div>
            </Link>
            <Link href="/previsao" className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-5 transition hover:bg-white/[0.04]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
                <Clock3 size={18} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-slate-200">Previsão completa</p>
                <p className="mt-0.5 text-[12px] text-slate-500">Próximas 24h e 16 dias</p>
              </div>
            </Link>
          </div>
        </section>

        {/* About — collapsible */}
        <section className="mb-6">
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="flex w-full items-center justify-between rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-5 text-left transition hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                <Info size={18} className="text-slate-400" />
              </div>
              <span className="text-[15px] font-medium text-slate-200">Sobre o SkyFe</span>
            </div>
            <ChevronDown size={18} className={`text-slate-500 transition-transform duration-200 ${showAbout ? "rotate-180" : ""}`} />
          </button>

          {showAbout && (
            <div className="mt-3 rounded-[18px] border border-white/[0.04] bg-white/[0.02] p-6">
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
                  <h2 className="text-[20px] font-bold">Sky<span className="text-cyan-400">Fe</span></h2>
                  <p className="text-[13px] text-slate-500">Versão 2.0.0</p>
                </div>
              </div>
              <p className="mb-4 text-[14px] leading-relaxed text-slate-400">
                Sistema de decisão de voo para pilotos de drones. Analisa condições climáticas em tempo real e calcula um score de 0 a 100.
              </p>
              <div className="flex flex-col gap-2.5 text-[13px] text-slate-500">
                <div className="flex items-center gap-2.5"><Globe size={14} className="text-slate-600" /><span>Dados: Open-Meteo</span></div>
                <div className="flex items-center gap-2.5"><Map size={14} className="text-slate-600" /><span>Mapas: OpenStreetMap</span></div>
              </div>
              <p className="mt-5 text-[12px] text-slate-600">Desenvolvido por Frizodrone © 2025</p>
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