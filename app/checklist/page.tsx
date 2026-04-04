"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Check, RotateCcw, Battery, Wifi, HardDrive, Settings2,
  Shield, MapPin, FileText, Eye, Wind, Compass, Sun, Map, Clock3, User,
  CloudRain, Plane, Radio, Navigation,
} from "lucide-react";

type CheckItem = { id: string; label: string; category: string; icon: string };

const CHECKLIST_ITEMS: CheckItem[] = [
  { id: "battery-charged", label: "Baterias carregadas (drone + controle)", category: "Equipamento", icon: "battery" },
  { id: "propellers", label: "Hélices verificadas e sem danos", category: "Equipamento", icon: "settings" },
  { id: "sd-card", label: "Cartão SD inserido e com espaço", category: "Equipamento", icon: "hdd" },
  { id: "firmware", label: "Firmware do drone atualizado", category: "Equipamento", icon: "wifi" },
  { id: "gimbal", label: "Gimbal e câmera funcionando", category: "Equipamento", icon: "eye" },
  { id: "motors", label: "Motores sem obstruções", category: "Equipamento", icon: "settings" },
  { id: "weather-check", label: "Condições climáticas verificadas no SkyFe", category: "Condições", icon: "wind" },
  { id: "wind-ok", label: "Vento dentro dos limites do drone", category: "Condições", icon: "wind" },
  { id: "no-rain", label: "Sem chuva prevista no horário", category: "Condições", icon: "cloud" },
  { id: "daylight", label: "Horário entre nascer e pôr do sol", category: "Condições", icon: "sun" },
  { id: "visibility-ok", label: "Visibilidade adequada para VLOS", category: "Condições", icon: "eye" },
  { id: "sarpas", label: "Acesso solicitado no SARPAS/DECEA", category: "Regulamentação", icon: "shield" },
  { id: "anac", label: "Cadastro SISANT/ANAC em dia", category: "Regulamentação", icon: "file" },
  { id: "no-fly-zone", label: "Local verificado no mapa de zonas", category: "Regulamentação", icon: "map" },
  { id: "distance-people", label: "30m de distância de pessoas não anuentes", category: "Regulamentação", icon: "map" },
  { id: "max-height", label: "Altura máxima de 120m respeitada", category: "Regulamentação", icon: "compass" },
  { id: "home-point", label: "Ponto de retorno (Home) definido", category: "Operacional", icon: "nav" },
  { id: "rth-altitude", label: "Altitude de RTH configurada", category: "Operacional", icon: "compass" },
  { id: "compass-calibrated", label: "Bússola calibrada (se necessário)", category: "Operacional", icon: "compass" },
  { id: "gps-lock", label: "Sinal GPS com lock suficiente", category: "Operacional", icon: "radio" },
  { id: "observer", label: "Observador posicionado (se necessário)", category: "Operacional", icon: "eye" },
];

const CATEGORY_CONFIG: Record<string, { color: string; emoji: string }> = {
  "Equipamento": { color: "#22d3ee", emoji: "🔧" },
  "Condições": { color: "#2dffb3", emoji: "🌤" },
  "Regulamentação": { color: "#ffd84d", emoji: "📋" },
  "Operacional": { color: "#a78bfa", emoji: "🚀" },
};

const STORAGE_KEY = "skyfe-checklist";

function getIcon(type: string, size: number = 16) {
  const map: Record<string, React.ReactNode> = {
    battery: <Battery size={size} />, wifi: <Wifi size={size} />, hdd: <HardDrive size={size} />,
    settings: <Settings2 size={size} />, shield: <Shield size={size} />, map: <MapPin size={size} />,
    file: <FileText size={size} />, eye: <Eye size={size} />, wind: <Wind size={size} />,
    compass: <Compass size={size} />, sun: <Sun size={size} />, cloud: <CloudRain size={size} />,
    plane: <Plane size={size} />, radio: <Radio size={size} />, nav: <Navigation size={size} />,
  };
  return map[type] || <Check size={size} />;
}

/* ───── Circular Progress ───── */
function CircularProgress({ pct, done, total, allDone }: { pct: number; done: number; total: number; allDone: boolean }) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = allDone ? "#2dffb3" : pct > 60 ? "#ffd84d" : pct > 30 ? "#22d3ee" : "#64748b";

  return (
    <div className="relative h-[150px] w-[150px]">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="75" cy="75" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 75 75)"
          style={{ filter: `drop-shadow(0 0 10px ${color}44)`, transition: "stroke-dashoffset 0.8s ease-out, stroke 0.5s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {allDone ? (
          <>
            <span className="text-[28px]">✈️</span>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mt-1">Pronto!</span>
          </>
        ) : (
          <>
            <span className="text-[32px] font-bold text-white">{done}</span>
            <span className="text-[12px] text-slate-500">de {total}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function ChecklistPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.date === new Date().toISOString().split("T")[0]) {
          setChecked(new Set(data.items));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}
  }, []);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          items: Array.from(next),
        }));
      } catch {}
      if (next.size === CHECKLIST_ITEMS.length && !prev.has(id)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      return next;
    });
  };

  const resetAll = () => {
    setChecked(new Set());
    setShowConfetti(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const total = CHECKLIST_ITEMS.length;
  const done = checked.size;
  const pct = Math.round((done / total) * 100);
  const allDone = done === total;
  const categories = Array.from(new Set(CHECKLIST_ITEMS.map(i => i.category)));

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      {/* Confetti */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
          {Array.from({ length: 40 }, (_, i) => {
            const colors = ["#2dffb3", "#22d3ee", "#ffd84d", "#a78bfa", "#ff5a5f", "#34d399"];
            const c = colors[i % colors.length];
            const left = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = 2 + Math.random() * 2;
            const size = 4 + Math.random() * 8;
            return (
              <div key={i} className="absolute" style={{
                left: `${left}%`, top: "-10px",
                width: `${size}px`, height: `${size}px`,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                background: c,
                animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
              }} />
            );
          })}
          <style>{`
            @keyframes confettiFall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

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
        </header>

        {/* Circular progress hero */}
        <div className="mb-8 flex flex-col items-center">
          <CircularProgress pct={pct} done={done} total={total} allDone={allDone} />
          {allDone ? (
            <div className="mt-4 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-5 py-2.5">
              <p className="text-[14px] font-semibold text-emerald-400">Checklist completo — pronto para decolar!</p>
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-slate-500">{total - done} {total - done === 1 ? "item restante" : "itens restantes"}</p>
          )}
        </div>

        {/* Categories */}
        {categories.map((cat) => {
          const items = CHECKLIST_ITEMS.filter(i => i.category === cat);
          const catDone = items.filter(i => checked.has(i.id)).length;
          const catComplete = catDone === items.length;
          const cfg = CATEGORY_CONFIG[cat] || { color: "#64748b", emoji: "📌" };

          return (
            <div key={cat} className="mb-6">
              {/* Category header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-[16px]">{cfg.emoji}</span>
                  <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: catComplete ? "#2dffb3" : cfg.color }}>{cat}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold" style={{ color: catComplete ? "#2dffb3" : "#64748b" }}>{catDone}/{items.length}</span>
                  {catComplete && <Check size={14} className="text-emerald-400" />}
                </div>
              </div>

              {/* Category progress bar (thin) */}
              <div className="mb-3 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${(catDone / items.length) * 100}%`,
                  background: catComplete ? "#2dffb3" : cfg.color,
                }} />
              </div>

              {/* Items */}
              <div className="flex flex-col gap-1.5">
                {items.map((item) => {
                  const isChecked = checked.has(item.id);
                  return (
                    <button key={item.id} onClick={() => toggle(item.id)}
                      className="group flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left transition-all duration-300 active:scale-[0.98]"
                      style={{
                        background: isChecked ? "rgba(45,255,179,0.05)" : "rgba(255,255,255,0.015)",
                        border: isChecked ? "1px solid rgba(45,255,179,0.12)" : "1px solid rgba(255,255,255,0.04)",
                      }}>
                      {/* Animated checkbox */}
                      <div className="relative grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md transition-all duration-300"
                        style={{
                          background: isChecked ? cfg.color : "transparent",
                          border: isChecked ? "none" : "2px solid rgba(255,255,255,0.12)",
                          transform: isChecked ? "scale(1)" : "scale(1)",
                          boxShadow: isChecked ? `0 0 12px ${cfg.color}33` : "none",
                        }}>
                        {isChecked && <Check size={13} className="text-[#04090f]" strokeWidth={3} />}
                      </div>
                      {/* Icon */}
                      <div className="shrink-0 transition-all duration-300" style={{ color: isChecked ? "#2dffb3" : "#475569", opacity: isChecked ? 0.5 : 0.7 }}>
                        {getIcon(item.icon, 14)}
                      </div>
                      {/* Label */}
                      <span className="flex-1 text-[13px] leading-snug transition-all duration-300" style={{
                        color: isChecked ? "rgba(255,255,255,0.35)" : "#cbd5e1",
                        textDecorationLine: isChecked ? "line-through" : "none",
                        textDecorationColor: "rgba(255,255,255,0.15)",
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

        {/* Reset + Info */}
        <div className="mt-4 flex flex-col gap-4">
          <button onClick={resetAll}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-3.5 text-[14px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200">
            <RotateCcw size={15} />
            Resetar checklist
          </button>

          <div className="rounded-[14px] border border-white/[0.04] bg-white/[0.015] p-4">
            <p className="text-[11px] leading-relaxed text-slate-600">
              Baseado nas melhores práticas de operação e na regulamentação ANAC/DECEA.
              O checklist reseta automaticamente a cada novo dia.
            </p>
          </div>
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
