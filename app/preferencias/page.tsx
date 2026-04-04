"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/lib/AuthGuard";
import { ArrowLeft, Globe, Ruler, Check } from "lucide-react";
import Link from "next/link";

const LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

const UNITS = [
  { code: "kmh", label: "km/h e °C", desc: "Sistema métrico" },
  { code: "knots", label: "Nós (kt) e °C", desc: "Aviação" },
  { code: "mph", label: "mph e °F", desc: "Sistema imperial" },
];

const PREFS_KEY = "skyfe-preferences";

function PreferenciasPage() {
  const [lang, setLang] = useState("pt-BR");
  const [unitSystem, setUnitSystem] = useState("kmh");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        if (prefs.lang) setLang(prefs.lang);
        if (prefs.units) setUnitSystem(prefs.units);
      }
    } catch {}
  }, []);

  const save = () => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ lang, units: unitSystem })); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" /></div>
      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 pt-6">

        <header className="mb-6 flex items-center gap-4">
          <Link href="/perfil" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]"><ArrowLeft size={18} /></Link>
          <h1 className="text-[22px] font-bold tracking-tight">Preferências</h1>
        </header>

        {/* Language */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2"><Globe size={16} className="text-cyan-400" /><span className="text-[13px] font-semibold text-slate-300">Idioma</span></div>
          <div className="flex flex-col gap-1.5">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => { setLang(l.code); setSaved(false); }}
                className="flex items-center gap-3 rounded-[12px] px-4 py-3 text-left transition"
                style={lang === l.code ? { background: "rgba(45,204,255,0.06)", border: "1px solid rgba(45,204,255,0.2)" } : { background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="text-[18px]">{l.flag}</span>
                <span className="flex-1 text-[14px]" style={{ color: lang === l.code ? "#fff" : "#94a3b8" }}>{l.label}</span>
                {lang === l.code && <Check size={16} className="text-cyan-400" />}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-600">O idioma será aplicado na próxima versão. Por enquanto, o app está em Português.</p>
        </section>

        {/* Units */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2"><Ruler size={16} className="text-cyan-400" /><span className="text-[13px] font-semibold text-slate-300">Unidades</span></div>
          <div className="flex flex-col gap-1.5">
            {UNITS.map(u => (
              <button key={u.code} onClick={() => { setUnitSystem(u.code); setSaved(false); }}
                className="flex items-center gap-3 rounded-[12px] px-4 py-3 text-left transition"
                style={unitSystem === u.code ? { background: "rgba(45,204,255,0.06)", border: "1px solid rgba(45,204,255,0.2)" } : { background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex-1">
                  <p className="text-[14px]" style={{ color: unitSystem === u.code ? "#fff" : "#94a3b8" }}>{u.label}</p>
                  <p className="text-[11px] text-slate-600">{u.desc}</p>
                </div>
                {unitSystem === u.code && <Check size={16} className="text-cyan-400" />}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-600">As unidades serão aplicadas na próxima versão.</p>
        </section>

        {saved && <div className="mb-4 rounded-[14px] border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-center text-[14px] font-medium text-emerald-300">Preferências salvas!</div>}

        <button onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_0_20px_rgba(45,204,255,0.15)] transition hover:brightness-105">
          Salvar preferências
        </button>
      </div>
    </main>
  );
}
export default function PreferenciasWrapper() { return <AuthGuard><PreferenciasPage /></AuthGuard>; }
