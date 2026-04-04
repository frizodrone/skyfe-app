"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Check, RotateCcw, Battery, Wifi, HardDrive, Settings2,
  Shield, MapPin, FileText, Eye, Wind, Compass, Sun, Map, Clock3, User,
} from "lucide-react";

type CheckItem = {
  id: string;
  label: string;
  category: string;
  icon: string;
};

const CHECKLIST_ITEMS: CheckItem[] = [
  // Equipamento
  { id: "battery-charged", label: "Baterias carregadas (drone + controle)", category: "Equipamento", icon: "battery" },
  { id: "propellers", label: "Hélices verificadas e sem danos", category: "Equipamento", icon: "settings" },
  { id: "sd-card", label: "Cartão SD inserido e com espaço", category: "Equipamento", icon: "hdd" },
  { id: "firmware", label: "Firmware do drone atualizado", category: "Equipamento", icon: "wifi" },
  { id: "gimbal", label: "Gimbal e câmera funcionando", category: "Equipamento", icon: "eye" },
  { id: "motors", label: "Motores sem obstruções", category: "Equipamento", icon: "settings" },

  // Condições
  { id: "weather-check", label: "Condições climáticas verificadas no SkyFe", category: "Condições", icon: "wind" },
  { id: "wind-ok", label: "Vento dentro dos limites do drone", category: "Condições", icon: "wind" },
  { id: "no-rain", label: "Sem chuva prevista no horário", category: "Condições", icon: "cloud" },
  { id: "daylight", label: "Horário entre nascer e pôr do sol", category: "Condições", icon: "sun" },
  { id: "visibility-ok", label: "Visibilidade adequada para VLOS", category: "Condições", icon: "eye" },

  // Regulamentação
  { id: "sarpas", label: "Acesso solicitado no SARPAS/DECEA", category: "Regulamentação", icon: "shield" },
  { id: "anac", label: "Cadastro SISANT/ANAC em dia", category: "Regulamentação", icon: "file" },
  { id: "no-fly-zone", label: "Local verificado no mapa de zonas", category: "Regulamentação", icon: "map" },
  { id: "distance-people", label: "30m de distância de pessoas não anuentes", category: "Regulamentação", icon: "map" },
  { id: "max-height", label: "Altura máxima de 120m respeitada", category: "Regulamentação", icon: "compass" },

  // Operacional
  { id: "home-point", label: "Ponto de retorno (Home) definido", category: "Operacional", icon: "map" },
  { id: "rth-altitude", label: "Altitude de RTH configurada", category: "Operacional", icon: "compass" },
  { id: "compass-calibrated", label: "Bússola calibrada (se necessário)", category: "Operacional", icon: "compass" },
  { id: "gps-lock", label: "Sinal GPS com lock suficiente", category: "Operacional", icon: "map" },
  { id: "observer", label: "Observador posicionado (se necessário)", category: "Operacional", icon: "eye" },
];

const STORAGE_KEY = "skyfe-checklist";

function getIcon(type: string, size: number = 16) {
  switch (type) {
    case "battery": return <Battery size={size} />;
    case "wifi": return <Wifi size={size} />;
    case "hdd": return <HardDrive size={size} />;
    case "settings": return <Settings2 size={size} />;
    case "shield": return <Shield size={size} />;
    case "map": return <MapPin size={size} />;
    case "file": return <FileText size={size} />;
    case "eye": return <Eye size={size} />;
    case "wind": return <Wind size={size} />;
    case "compass": return <Compass size={size} />;
    case "sun": return <Sun size={size} />;
    case "cloud": return <Wind size={size} />;
    default: return <Check size={size} />;
  }
}

export default function ChecklistPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        // Only restore if saved today
        if (data.date === new Date().toISOString().split("T")[0]) {
          setChecked(new Set(data.items));
        }
      }
    } catch {}
  }, []);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          items: Array.from(next),
        }));
      } catch {}
      return next;
    });
  };

  const resetAll = () => {
    setChecked(new Set());
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const total = CHECKLIST_ITEMS.length;
  const done = checked.size;
  const pct = Math.round((done / total) * 100);
  const allDone = done === total;

  // Group by category
  const categories = Array.from(new Set(CHECKLIST_ITEMS.map(i => i.category)));

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-28 pt-6">
        {/* Header */}
        <header className="mb-6 flex items-center gap-4">
          <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="text-[22px] font-bold tracking-tight">Checklist pré-voo</h1>
            <p className="text-[12px] text-slate-500">Verifique antes de decolar</p>
          </div>
          <button onClick={resetAll} className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.05] hover:text-white" title="Resetar checklist">
            <RotateCcw size={17} />
          </button>
        </header>

        {/* Progress bar */}
        <div className="mb-8 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-slate-200">Progresso</span>
            <span className="text-[14px] font-bold" style={{ color: allDone ? "#2dffb3" : pct > 50 ? "#ffd84d" : "#94a3b8" }}>{done}/{total}</span>
          </div>
          <div className="h-[8px] w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{
              width: `${pct}%`,
              background: allDone ? "linear-gradient(90deg, #2dffb3, #34d399)" : pct > 50 ? "linear-gradient(90deg, #ffd84d, #f59e0b)" : "linear-gradient(90deg, #94a3b8, #64748b)",
              boxShadow: allDone ? "0 0 12px rgba(45,255,179,0.3)" : undefined,
            }} />
          </div>
          {allDone && (
            <div className="mt-3 flex items-center justify-center gap-2 text-[13px] font-semibold text-emerald-400">
              <Check size={16} />
              Checklist completo — pronto para decolar!
            </div>
          )}
        </div>

        {/* Items by category */}
        {categories.map((cat) => {
          const items = CHECKLIST_ITEMS.filter(i => i.category === cat);
          const catDone = items.filter(i => checked.has(i.id)).length;
          const catColor = catDone === items.length ? "#2dffb3" : catDone > 0 ? "#ffd84d" : "#64748b";
          return (
            <div key={cat} className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: catColor }}>{cat}</span>
                <span className="text-[11px] text-slate-600">{catDone}/{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((item) => {
                  const isChecked = checked.has(item.id);
                  return (
                    <button key={item.id} onClick={() => toggle(item.id)}
                      className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-left transition-all duration-200"
                      style={{
                        background: isChecked ? "rgba(45,255,179,0.04)" : "rgba(255,255,255,0.02)",
                        border: isChecked ? "1px solid rgba(45,255,179,0.15)" : "1px solid rgba(255,255,255,0.05)",
                      }}>
                      {/* Checkbox */}
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg transition-all duration-200"
                        style={{
                          background: isChecked ? "#2dffb3" : "transparent",
                          border: isChecked ? "none" : "2px solid rgba(255,255,255,0.15)",
                        }}>
                        {isChecked && <Check size={14} className="text-[#04090f]" strokeWidth={3} />}
                      </div>
                      {/* Icon */}
                      <div className="shrink-0" style={{ color: isChecked ? "#2dffb3" : "#64748b" }}>
                        {getIcon(item.icon, 15)}
                      </div>
                      {/* Label */}
                      <span className="text-[14px] transition-all duration-200" style={{
                        color: isChecked ? "rgba(255,255,255,0.4)" : "#e2e8f0",
                        textDecoration: isChecked ? "line-through" : "none",
                      }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Info */}
        <div className="mt-4 rounded-[16px] border border-cyan-400/10 bg-cyan-400/[0.03] p-4">
          <p className="text-[12px] leading-relaxed text-slate-500">
            Este checklist é baseado nas melhores práticas de operação de drones e na regulamentação da ANAC/DECEA.
            Ele reseta automaticamente a cada novo dia. Sempre verifique todos os itens antes de cada voo.
          </p>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#04090f]/80 backdrop-blur-2xl">
        <div className="mx-auto grid max-w-md grid-cols-4 px-4 py-2.5 text-center text-[11px]">
          {[
            { icon: <Sun size={21} />, label: "Clima", href: "/", active: false },
            { icon: <Map size={21} />, label: "Zonas", href: "/zonas", active: false },
            { icon: <Clock3 size={21} />, label: "Previsão", href: "/previsao", active: false },
            { icon: <User size={21} />, label: "Perfil", href: "/perfil", active: false },
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
