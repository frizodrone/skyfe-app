"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Sun, Map, Clock3, User, Shield, Globe, Info,
  Edit3, Save, ChevronDown, X, Plane, Camera, MapPinned, Zap,
  Tractor, Navigation2, Plus, Check,
} from "lucide-react";
import Link from "next/link";
import AuthGuard, { useIsLoggedIn, LoginPromptModal } from "@/lib/AuthGuard";
import { supabase } from "@/lib/supabase";
import { DRONE_DATABASE, searchDrones, getDroneById, type DroneModel } from "@/lib/drones";

type Profile = {
  name: string;
  pilotTypes: string[];
  experience: string;
  drone: string;
  drones: string[];
};

const DEFAULTS: Profile = { name: "", pilotTypes: [], experience: "", drone: "", drones: [] };

const PILOT_TYPES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  recreational: { label: "Recreativo", icon: <Plane size={14} />, color: "#22d3ee" },
  photo_video: { label: "Foto e Vídeo", icon: <Camera size={14} />, color: "#a78bfa" },
  fpv: { label: "FPV / Freestyle", icon: <Zap size={14} />, color: "#ff5a5f" },
  mapping: { label: "Mapeamento", icon: <MapPinned size={14} />, color: "#2dffb3" },
  agricultural: { label: "Agrícola", icon: <Tractor size={14} />, color: "#ffd84d" },
  commercial: { label: "Comercial", icon: <Navigation2 size={14} />, color: "#94a3b8" },
};

const EXP_OPTIONS: Record<string, { label: string; color: string }> = {
  beginner: { label: "Iniciante", color: "#94a3b8" },
  intermediate: { label: "Intermediário", color: "#ffd84d" },
  advanced: { label: "Avançado", color: "#22d3ee" },
  pro: { label: "Profissional", color: "#2dffb3" },
  expert: { label: "Especialista", color: "#a78bfa" },
};

function getInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  if (p.length === 1) return p[0][0].toUpperCase();
  return "P";
}

export default function PerfilWrapper() {
  return <AuthGuard><Perfil /></AuthGuard>;
}

function Perfil() {
  const [profile, setProfile] = useState<Profile>(DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDroneAdd, setShowDroneAdd] = useState(false);
  const [droneQuery, setDroneQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isLoggedIn = useIsLoggedIn();

  useEffect(() => {
    const loadData = async () => {
      // Load from localStorage first (works without login)
      try {
        const pilot = localStorage.getItem("skyfe-pilot");
        if (pilot) {
          const p = JSON.parse(pilot);
          setProfile(prev => ({ ...prev, name: p.name || prev.name, pilotTypes: p.pilotTypes || (p.pilotType ? [p.pilotType] : prev.pilotTypes), experience: p.experience || prev.experience }));
        }
        const dronesRaw = localStorage.getItem("skyfe-user-drones");
        const activeDrone = localStorage.getItem("skyfe-active-drone");
        if (dronesRaw) {
          const drones = JSON.parse(dronesRaw);
          setProfile(prev => ({ ...prev, drones, drone: activeDrone || drones[0] || "" }));
        }
      } catch {}

      // Sync from Supabase if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("name, drone_model, experience_level").eq("id", user.id).single();
        if (data) {
          setProfile(prev => ({
            ...prev,
            name: data.name || prev.name,
            drone: data.drone_model || prev.drone,
            experience: data.experience_level || prev.experience,
          }));
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      localStorage.setItem("skyfe-pilot", JSON.stringify({ name: profile.name, pilotTypes: profile.pilotTypes, experience: profile.experience }));
      localStorage.setItem("skyfe-user-drones", JSON.stringify(profile.drones));
      localStorage.setItem("skyfe-active-drone", profile.drone);
    } catch {}
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ name: profile.name, drone_model: profile.drone, experience_level: profile.experience }).eq("id", user.id);
    }
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addDrone = (name: string) => {
    if (!profile.drones.includes(name)) {
      const newDrones = [...profile.drones, name];
      setProfile(prev => ({ ...prev, drones: newDrones, drone: prev.drone || name }));
    }
    setShowDroneAdd(false);
    setDroneQuery("");
  };

  const removeDrone = (name: string) => {
    const newDrones = profile.drones.filter(d => d !== name);
    setProfile(prev => ({ ...prev, drones: newDrones, drone: prev.drone === name ? (newDrones[0] || "") : prev.drone }));
  };

  const setActiveDrone = (name: string) => {
    setProfile(prev => ({ ...prev, drone: name }));
  };

  const expInfo = EXP_OPTIONS[profile.experience];
  const initials = getInitials(profile.name);

  const droneResults = useMemo(() => droneQuery.length >= 2 ? searchDrones(droneQuery) : [], [droneQuery]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#04090f]"><div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" /></div></main>;

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" /></div>
      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-28 pt-6">

        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]"><ArrowLeft size={18} /></Link>
            <h1 className="text-[22px] font-bold tracking-tight">Perfil do Piloto</h1>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-[12px] font-medium text-cyan-400"><Edit3 size={13} /> Editar</button>
          )}
        </header>

        {/* ─── Profile Hero ─── */}
        <section className="mb-6 relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,18,32,0.98),rgba(4,9,15,1))] p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_rgba(45,204,255,0.06),_transparent_50%)]" />
          <div className="relative z-10 flex flex-col items-center">
            {/* Avatar */}
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-[0_0_30px_rgba(45,204,255,0.12)]"
              style={{ borderColor: expInfo?.color || "#334155", background: "rgba(255,255,255,0.03)" }}>
              <span className="text-[28px] font-bold" style={{ color: expInfo?.color || "#94a3b8" }}>{initials}</span>
            </div>

            {/* Name */}
            {editing ? (
              <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Seu nome"
                className="mb-3 w-full rounded-[12px] border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-center text-[18px] font-bold text-white outline-none focus:border-cyan-400/30" />
            ) : (
              <h2 className="mb-1 text-[22px] font-bold text-white">{profile.name || "Piloto"}</h2>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              {profile.pilotTypes.map(pt => {
                const info = PILOT_TYPES[pt];
                if (!info) return null;
                return (
                  <div key={pt} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: `${info.color}0d`, border: `1px solid ${info.color}22` }}>
                    <span style={{ color: info.color }}>{info.icon}</span>
                    <span className="text-[11px] font-semibold" style={{ color: info.color }}>{info.label}</span>
                  </div>
                );
              })}
              {expInfo && (
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: `${expInfo.color}0d`, border: `1px solid ${expInfo.color}22` }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: expInfo.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: expInfo.color }}>{expInfo.label}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Edit fields (pilot types + exp) ─── */}
        {editing && (
          <section className="mb-6 rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">O que você faz com drone? <span className="text-slate-600">(selecione quantos quiser)</span></label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PILOT_TYPES).map(([k, v]) => {
                  const sel = profile.pilotTypes.includes(k);
                  return (
                    <button key={k} onClick={() => setProfile(p => ({ ...p, pilotTypes: sel ? p.pilotTypes.filter(t => t !== k) : [...p.pilotTypes, k] }))}
                      className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-left transition"
                      style={sel ? { background: `${v.color}0d`, border: `1px solid ${v.color}25` } : { background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ color: sel ? v.color : "#64748b" }}>{v.icon}</span>
                      <span className="text-[11px] font-medium" style={{ color: sel ? "#fff" : "#94a3b8" }}>{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Experiência</label>
              <div className="flex flex-col gap-1">
                {Object.entries(EXP_OPTIONS).map(([k, v]) => (
                  <button key={k} onClick={() => setProfile(p => ({ ...p, experience: k }))}
                    className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-left transition"
                    style={profile.experience === k ? { background: `${v.color}0d`, border: `1px solid ${v.color}25` } : { background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: profile.experience === k ? v.color : "#334155" }} />
                    <span className="text-[12px] font-medium" style={{ color: profile.experience === k ? v.color : "#94a3b8" }}>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Drones section ─── */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-slate-200">Meus drones</h3>
            <button onClick={() => setShowDroneAdd(true)} className="flex items-center gap-1 text-[12px] font-medium text-cyan-400 transition hover:text-cyan-300">
              <Plus size={14} /> Adicionar
            </button>
          </div>

          {profile.drones.length === 0 ? (
            <button onClick={() => setShowDroneAdd(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-white/[0.1] bg-white/[0.015] py-6 text-[13px] text-slate-500 transition hover:border-cyan-400/20 hover:text-slate-400">
              <Plus size={16} /> Adicionar seu primeiro drone
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {profile.drones.map(d => {
                const isActive = d === profile.drone;
                return (
                  <div key={d} className="flex items-center gap-3 rounded-[14px] px-4 py-3"
                    style={isActive ? { background: "rgba(45,204,255,0.06)", border: "1px solid rgba(45,204,255,0.2)" } : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <button onClick={() => setActiveDrone(d)} className="flex-1 text-left">
                      <p className="text-[14px] font-medium" style={{ color: isActive ? "#22d3ee" : "#e2e8f0" }}>{d}</p>
                      {isActive && <p className="text-[10px] uppercase tracking-wider text-cyan-400/60 mt-0.5">Drone ativo</p>}
                    </button>
                    {editing && (
                      <button onClick={() => removeDrone(d)} className="text-slate-600 hover:text-red-400 transition"><X size={14} /></button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add drone modal */}
          {showDroneAdd && (
            <div className="mt-3 rounded-[16px] border border-white/[0.08] bg-[#0b1221] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <input value={droneQuery} onChange={e => setDroneQuery(e.target.value)} placeholder="Buscar drone..."
                  autoFocus className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-slate-600" />
                <button onClick={() => { setShowDroneAdd(false); setDroneQuery(""); }}><X size={14} className="text-slate-500" /></button>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {droneQuery.length >= 2 ? (
                  droneResults.length > 0 ? droneResults.slice(0, 10).map(d => (
                    <button key={d.id} onClick={() => addDrone(`${d.brand} ${d.name}`)}
                      className="flex w-full items-center px-4 py-2.5 text-left border-b border-white/[0.03] hover:bg-white/[0.03]">
                      <span className="flex-1 text-[13px] text-slate-200">{d.brand} {d.name}</span>
                      <span className="text-[10px] text-slate-600">{d.maxWind} km/h</span>
                    </button>
                  )) : <p className="px-4 py-3 text-[12px] text-slate-500">Nenhum encontrado</p>
                ) : <p className="px-4 py-3 text-[12px] text-slate-500">Digite para buscar...</p>}
              </div>
            </div>
          )}
        </section>

        {/* Save button (when editing) */}
        {editing && (
          <button onClick={handleSave}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105">
            <Save size={16} /> Salvar perfil
          </button>
        )}

        {saved && (
          <div className="mb-4 rounded-[14px] border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-center text-[14px] font-medium text-emerald-300">Perfil salvo!</div>
        )}

        {/* ─── Menu items ─── */}
        <section className="mb-6 flex flex-col gap-2">
          <Link href="/preferencias" className="flex items-center gap-3 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-3.5 transition hover:bg-white/[0.04]">
            <Globe size={18} className="text-slate-400" /><span className="flex-1 text-[14px] text-slate-200">Preferências do app</span><ChevronDown size={16} className="text-slate-600 -rotate-90" />
          </Link>
          <Link href="/configuracoes" className="flex items-center gap-3 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-3.5 transition hover:bg-white/[0.04]">
            <Shield size={18} className="text-slate-400" /><span className="flex-1 text-[14px] text-slate-200">Limites de voo</span><ChevronDown size={16} className="text-slate-600 -rotate-90" />
          </Link>
          <button onClick={() => setShowAbout(!showAbout)} className="flex items-center gap-3 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-3.5 text-left transition hover:bg-white/[0.04]">
            <Info size={18} className="text-slate-400" /><span className="flex-1 text-[14px] text-slate-200">Sobre o SkyFe</span><ChevronDown size={16} className={`text-slate-600 transition-transform ${showAbout ? "rotate-0" : "-rotate-90"}`} />
          </button>
          {showAbout && (
            <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative grid h-12 w-12 place-items-center rounded-[14px] border border-cyan-400/20 bg-white/[0.03]">
                  <div className="h-2.5 w-2.5 rounded-[3px] bg-cyan-400" />
                </div>
                <div><h2 className="text-[18px] font-bold">Sky<span className="text-cyan-400">Fe</span></h2><p className="text-[12px] text-slate-500">Versão 2.5.3</p></div>
              </div>
              <div className="rounded-[12px] border border-cyan-400/10 bg-cyan-400/[0.03] p-3 mb-3">
                <p className="text-[12px] leading-relaxed text-slate-400">
                  O SkyFe cruza dados meteorológicos de múltiplas fontes internacionais com algoritmos proprietários para transformar informações complexas em uma resposta simples e visual. Combinamos previsões atmosféricas em tempo real, monitoramento geomagnético via satélites da NOAA, mapeamento de espaço aéreo com dados oficiais e inteligência de altitude de vento — tudo processado instantaneamente para oferecer a pilotos de drone a melhor tomada de decisão antes de cada voo.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 text-[12px] text-slate-500">
                <div className="flex items-center gap-2"><Globe size={13} className="text-slate-600" /><span>Dados: Open-Meteo & NOAA</span></div>
                <div className="flex items-center gap-2"><Map size={13} className="text-slate-600" /><span>Mapas: OpenStreetMap & OurAirports</span></div>
              </div>
              <p className="mt-3 text-[11px] text-slate-600">Desenvolvido por SkyFe Tecnologia © 2025–2026</p>
            </div>
          )}
        </section>

        {/* Auth */}
        {!isLoggedIn ? (
          <Link href="/login" className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105">
            <User size={18} /> Criar conta / Entrar
          </Link>
        ) : (
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-red-400/15 bg-red-400/[0.04] py-3.5 text-[14px] font-medium text-red-300 transition hover:bg-red-400/[0.08]">
            Sair da conta
          </button>
        )}
      </div>

      {/* Bottom Nav */}
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

      {showLoginModal && <LoginPromptModal feature="perfil" onClose={() => setShowLoginModal(false)} />}
    </main>
  );
}
