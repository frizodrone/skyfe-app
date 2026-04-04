"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Sun, Map, Clock3, User, Settings, Shield, Globe, Info,
  Edit3, Save, ChevronDown, Star, Trash2, MapPin, X,
} from "lucide-react";
import Link from "next/link";
import AuthGuard, { useIsLoggedIn, LoginPromptModal } from "@/lib/AuthGuard";
import { supabase } from "@/lib/supabase";

import { DRONE_DATABASE } from "@/lib/drones";

type Profile = { name: string; drone: string; drones: string[]; experience: string };

// Generate DRONE_CATEGORIES dynamically from the database
const DRONE_CATEGORIES = (() => {
  const groups: Record<string, string[]> = {};
  const brandOrder = ["DJI", "Autel", "Skydio", "Parrot", "FIMI", "Hubsan", "Potensic", "Antigravity", "ZeroZero", "Ryze", "FPV Genérico"];

  for (const drone of DRONE_DATABASE) {
    // Group DJI by sub-category
    let cat = drone.brand;
    if (drone.brand === "DJI") {
      if (drone.name.includes("Mini") || drone.name === "Flip" || drone.name.includes("Neo")) cat = "DJI Mini / Neo / Flip";
      else if (drone.name.includes("Air")) cat = "DJI Air";
      else if (drone.name.includes("Mavic")) cat = "DJI Mavic";
      else if (drone.name.includes("Avata") || drone.name === "FPV") cat = "DJI FPV / Avata";
      else if (drone.name.includes("Phantom") || drone.name === "Spark") cat = "DJI Clássicos";
      else if (drone.name.includes("Inspire")) cat = "DJI Inspire";
      else if (drone.name.includes("Matrice") || drone.name.includes("FlyCart")) cat = "DJI Enterprise";
      else if (drone.name.includes("Agras")) cat = "DJI Agrícola";
      else if (drone.name.includes("Enterprise") || drone.name.includes("Thermal") || drone.name.includes("Multispectral")) cat = "DJI Enterprise";
      else cat = "DJI Outros";
    }
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(`${drone.brand} ${drone.name}`);
  }

  return Object.entries(groups).map(([category, items]) => ({ category, items }));
})();

const EXP_OPTIONS = [
  { value: "beginner", label: "Iniciante", color: "#94a3b8" },
  { value: "intermediate", label: "Intermediário", color: "#ffd84d" },
  { value: "advanced", label: "Avançado", color: "#2dccff" },
  { value: "pro", label: "Profissional", color: "#2dffb3" },
  { value: "expert", label: "Especialista", color: "#c084fc" },
];

const DEFAULTS: Profile = { name: "", drone: "", drones: [], experience: "" };

function getInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  if (p.length === 1) return p[0][0].toUpperCase();
  return "";
}

/* ─── Dropdown ─── */
function Dropdown({ label, value, placeholder, children, open, onToggle }: {
  label: string; value: string; placeholder: string;
  children: React.ReactNode; open: boolean; onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node) && open) onToggle(); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative">
      <label className="mb-2 block text-[13px] font-medium uppercase tracking-wider text-slate-500">{label}</label>
      <button onClick={onToggle}
        className="flex w-full items-center justify-between rounded-2xl border bg-white/[0.03] px-5 py-4 text-left transition-all"
        style={{ borderColor: open ? "rgba(45,204,255,0.3)" : "rgba(255,255,255,0.08)" }}>
        <span className={value ? "text-[15px] font-medium text-white" : "text-[15px] text-slate-500"}>{value || placeholder}</span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[300px] overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0b1424] shadow-[0_12px_40px_rgba(0,0,0,0.6)] no-scrollbar">
          {children}
        </div>
      )}
    </div>
  );
}

export default function PerfilWrapper() {
  return <AuthGuard><Perfil /></AuthGuard>;
}

function Perfil() {
  const [profile, setProfile] = useState<Profile>(DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [droneOpen, setDroneOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isLoggedIn = useIsLoggedIn();

  useEffect(() => {
    const loadFromDB = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Não logado — carregar dados do localStorage (onboarding)
        try {
          const droneRaw = localStorage.getItem("skyfe-drone");
          const dronesRaw = localStorage.getItem("skyfe-user-drones");
          const activeDrone = localStorage.getItem("skyfe-active-drone");
          if (droneRaw) {
            const drone = JSON.parse(droneRaw);
            const drones = dronesRaw ? JSON.parse(dronesRaw) : [];
            const droneName = `${drone.brand} ${drone.name}`;
            if (!drones.includes(droneName)) drones.unshift(droneName);
            setProfile(prev => ({
              ...prev,
              drone: activeDrone || droneName,
              drones: drones.length > 0 ? drones : [droneName],
            }));
          }
        } catch {}
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("name, drone_model, experience_level")
        .eq("id", user.id)
        .single();

      if (data) {
        // Load drones list from localStorage (not in Supabase)
        let savedDrones: string[] = [];
        try {
          const raw = localStorage.getItem("skyfe-user-drones");
          if (raw) savedDrones = JSON.parse(raw);
        } catch {}

        const activeDrone = data.drone_model || "";
        // Ensure active drone is in the list
        if (activeDrone && !savedDrones.includes(activeDrone)) {
          savedDrones = [activeDrone, ...savedDrones];
        }

        const p: Profile = {
          name: data.name || "",
          drone: activeDrone,
          drones: savedDrones,
          experience: data.experience_level || "",
        };
        setProfile(p);
        if (!p.name && !p.drone) setEditing(true);
      } else {
        setEditing(true);
      }

      // Load favorites
      const { data: favs } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (favs) setFavorites(favs);

      setLoading(false);
    };
    loadFromDB();
  }, []);

  const update = (key: keyof Profile, value: string) => setProfile((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    // Save drones list to localStorage (works without login)
    try {
      localStorage.setItem("skyfe-user-drones", JSON.stringify(profile.drones));
      localStorage.setItem("skyfe-active-drone", profile.drone);
    } catch {}

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          name: profile.name,
          drone_model: profile.drone,
          experience_level: profile.experience,
        })
        .eq("id", user.id);
    }

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
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2.5 text-[13px] font-medium text-cyan-400 transition hover:bg-cyan-400/[0.1]">
              <Edit3 size={14} /> Editar
            </button>
          )}
        </header>

        {saved && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3.5 text-center text-[14px] font-medium text-emerald-300">
            Perfil salvo com sucesso!
          </div>
        )}

        {/* ═══ VIEWING MODE — flat layout, no container box ═══ */}
        {!editing && profile.name && (
          <section className="mb-10">
            {/* avatar */}
            <div className="mb-5 flex justify-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 shadow-[0_0_30px_rgba(45,204,255,0.12)]"
                style={{ borderColor: expOption?.color || "#2dccff", background: `${expOption?.color || "#2dccff"}0a` }}>
                <span className="text-[36px] font-bold" style={{ color: expOption?.color || "#2dccff" }}>{initials}</span>
              </div>
            </div>

            {/* name */}
            <h2 className="mb-2 text-center text-[26px] font-bold text-white">{profile.name}</h2>

            {/* drones */}
            {profile.drone && (
              <div className="mb-3 text-center">
                <p className="text-[15px] text-slate-400">{profile.drone}</p>
                {profile.drones.length > 1 && (
                  <p className="text-[11px] text-slate-600 mt-0.5">+{profile.drones.length - 1} {profile.drones.length === 2 ? "outro drone" : "outros drones"}</p>
                )}
              </div>
            )}

            {/* experience badge */}
            {expOption && (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5"
                  style={{ background: `${expOption.color}0d`, border: `1px solid ${expOption.color}22` }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: expOption.color }} />
                  <span className="text-[14px] font-semibold" style={{ color: expOption.color }}>{expOption.label}</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ═══ EDITING MODE — flat layout ═══ */}
        {editing && (
          <section className="mb-10">
            {/* avatar */}
            <div className="mb-5 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-cyan-400/25 bg-cyan-400/[0.06]">
                {initials ? (
                  <span className="text-[30px] font-bold text-cyan-400">{initials}</span>
                ) : (
                  <User size={32} className="text-cyan-400/50" />
                )}
              </div>
            </div>

            {/* name input */}
            <div className="mb-8">
              <input
                type="text"
                value={profile.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Nome do piloto"
                className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-4 text-center text-[17px] font-medium text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/30 transition"
              />
            </div>

            {/* Drones — multiple selection */}
            <div className="mb-6">
              <p className="mb-2 text-[13px] font-medium text-slate-400">Meus drones</p>

              {/* Currently selected drones */}
              {profile.drones.length > 0 && (
                <div className="mb-3 flex flex-col gap-2">
                  {profile.drones.map((d, i) => (
                    <div key={d} className="flex items-center gap-2 rounded-[14px] px-4 py-3"
                      style={d === profile.drone ? { background: "rgba(45,204,255,0.08)", border: "1px solid rgba(45,204,255,0.25)" } : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <button onClick={() => update("drone", d)} className="flex-1 text-left text-[14px] font-medium" style={{ color: d === profile.drone ? "#2dccff" : "#e2e8f0" }}>
                        {d}
                        {d === profile.drone && <span className="ml-2 text-[10px] uppercase tracking-wider text-cyan-400/60">ativo</span>}
                      </button>
                      <button onClick={() => {
                        const newDrones = profile.drones.filter(dr => dr !== d);
                        setProfile(prev => ({ ...prev, drones: newDrones, drone: prev.drone === d ? (newDrones[0] || "") : prev.drone }));
                        setSaved(false);
                      }} className="text-slate-600 transition hover:text-red-400"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add drone dropdown */}
              <Dropdown
                label="Adicionar drone"
                value=""
                placeholder="+ Adicionar outro drone"
                open={droneOpen}
                onToggle={() => { setDroneOpen(!droneOpen); setExpOpen(false); }}
              >
                {DRONE_CATEGORIES.map((cat) => (
                  <div key={cat.category}>
                    <p className="sticky top-0 bg-[#0b1424] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-400/70 border-b border-white/[0.04]">
                      {cat.category}
                    </p>
                    {cat.items.map((item) => {
                      const alreadyAdded = profile.drones.includes(item);
                      return (
                        <button key={item}
                          onClick={() => {
                            if (!alreadyAdded) {
                              const newDrones = [...profile.drones, item];
                              setProfile(prev => ({ ...prev, drones: newDrones, drone: prev.drone || item }));
                              setSaved(false);
                            }
                            setDroneOpen(false);
                          }}
                          disabled={alreadyAdded}
                          className="flex w-full items-center px-5 py-3.5 text-[15px] text-left transition hover:bg-white/[0.04] disabled:opacity-30"
                          style={alreadyAdded ? { color: "#64748b" } : { color: "#e2e8f0" }}>
                          {item} {alreadyAdded && <span className="ml-auto text-[10px] text-slate-600">adicionado</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </Dropdown>
            </div>

            {/* Experience dropdown */}
            <div className="mb-8">
              <Dropdown
                label="Nível de experiência"
                value={expOption?.label || ""}
                placeholder="Selecione seu nível"
                open={expOpen}
                onToggle={() => { setExpOpen(!expOpen); setDroneOpen(false); }}
              >
                {EXP_OPTIONS.map((e) => (
                  <button key={e.value}
                    onClick={() => { update("experience", e.value); setExpOpen(false); }}
                    className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-white/[0.04]"
                    style={profile.experience === e.value ? { background: `${e.color}0a` } : {}}>
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: e.color }} />
                    <span className="text-[15px] font-medium" style={{ color: profile.experience === e.value ? e.color : "#e2e8f0" }}>
                      {e.label}
                    </span>
                  </button>
                ))}
              </Dropdown>
            </div>

            {/* save */}
            <button onClick={handleSave} disabled={!profile.name.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[16px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed">
              <Save size={17} /> Salvar perfil
            </button>
          </section>
        )}

        {/* Favorites */}
        {favorites.length > 0 && (
          <section className="mb-8">
            <h3 className="mb-4 text-[16px] font-semibold text-slate-300">Locais favoritos</h3>
            <div className="flex flex-col gap-2.5">
              {favorites.map((fav: any) => (
                <div key={fav.id}
                  className="flex items-center gap-3 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-4 transition hover:bg-white/[0.04]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                  </div>
                  <Link href={`/?lat=${fav.latitude}&lon=${fav.longitude}&name=${encodeURIComponent(fav.name)}`} className="flex-1">
                    <p className="text-[15px] font-medium text-slate-200">{fav.name}</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      <MapPin size={10} className="inline mr-1" />
                      {fav.latitude.toFixed(2)}, {fav.longitude.toFixed(2)}
                    </p>
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.from("favorites").delete().eq("id", fav.id);
                      setFavorites(favorites.filter((f: any) => f.id !== fav.id));
                    }}
                    className="grid h-9 w-9 place-items-center rounded-xl text-slate-600 transition hover:bg-red-400/10 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick links */}
        <section className="mb-8">
          <h3 className="mb-4 text-[16px] font-semibold text-slate-300">Acesso rápido</h3>
          <div className="flex flex-col gap-3">
            {[
              { href: "/configuracoes", icon: <Settings size={18} className="text-cyan-400" />, bg: "bg-cyan-400/10", title: "Configurações de voo", sub: "Limites personalizados", needsLogin: true },
              { href: "/analise", icon: <Shield size={18} className="text-emerald-400" />, bg: "bg-emerald-400/10", title: "Análise detalhada", sub: "Como o score funciona", needsLogin: true },
              { href: "/previsao", icon: <Clock3 size={18} className="text-amber-400" />, bg: "bg-amber-400/10", title: "Previsão completa", sub: "Próximas 24h e 16 dias", needsLogin: false },
              { href: "/privacidade", icon: <Shield size={18} className="text-slate-400" />, bg: "bg-white/[0.04]", title: "Política de Privacidade", sub: "Como protegemos seus dados", needsLogin: false },
              { href: "/termos", icon: <Globe size={18} className="text-slate-400" />, bg: "bg-white/[0.04]", title: "Termos de Uso", sub: "Regras de utilização", needsLogin: false },
            ].map((link) => (
              link.needsLogin && !isLoggedIn ? (
                <button key={link.href} onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-5 transition hover:bg-white/[0.04] text-left w-full">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.bg}`}>{link.icon}</div>
                  <div className="flex-1">
                    <p className="text-[15px] font-medium text-slate-200">{link.title}</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">{link.sub}</p>
                  </div>
                </button>
              ) : (
                <Link key={link.href} href={link.href} className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-5 transition hover:bg-white/[0.04]">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.bg}`}>{link.icon}</div>
                  <div className="flex-1">
                    <p className="text-[15px] font-medium text-slate-200">{link.title}</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">{link.sub}</p>
                  </div>
                </Link>
              )
            ))}
          </div>
        </section>

        {/* About */}
        <section className="mb-6">
          <button onClick={() => setShowAbout(!showAbout)}
            className="flex w-full items-center justify-between rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-5 text-left transition hover:bg-white/[0.04]">
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
                  <p className="text-[13px] text-slate-500">Versão 2.5.3</p>
                </div>
              </div>
              <div className="mt-1 rounded-[16px] border border-cyan-400/10 bg-cyan-400/[0.03] p-4 mb-4">
                <p className="text-[13px] leading-relaxed text-slate-400">
                  O SkyFe cruza dados meteorológicos de múltiplas fontes internacionais com algoritmos proprietários para transformar informações complexas em uma resposta simples e visual. Combinamos previsões atmosféricas em tempo real, monitoramento geomagnético via satélites da NOAA, mapeamento de espaço aéreo com dados oficiais e inteligência de altitude de vento — tudo processado instantaneamente para oferecer a pilotos de drone a melhor tomada de decisão antes de cada voo.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 text-[13px] text-slate-500">
                <div className="flex items-center gap-2.5"><Globe size={14} className="text-slate-600" /><span>Dados: Open-Meteo & NOAA</span></div>
                <div className="flex items-center gap-2.5"><Map size={14} className="text-slate-600" /><span>Mapas: OpenStreetMap & OurAirports</span></div>
              </div>
              <p className="mt-5 text-[12px] text-slate-600">Desenvolvido por SkyFe Tecnologia © 2025–2026</p>
            </div>
          )}
        </section>

        {/* Auth action */}
        <section className="mb-6">
          {isLoggedIn ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-red-400/15 bg-red-400/[0.04] px-5 py-4 text-[15px] font-medium text-red-400 transition hover:bg-red-400/[0.08]"
            >
              Sair da conta
            </button>
          ) : (
            <a
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105"
            >
              Entrar / Criar conta grátis
            </a>
          )}
        </section>
      </div>

      {/* Login Prompt Modal */}
      {showLoginModal && (
        <LoginPromptModal feature="" onClose={() => setShowLoginModal(false)} />
      )}

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