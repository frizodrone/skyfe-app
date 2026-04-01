"use client";

import {
  ArrowLeft, Sun, Map, Clock3, User, Settings, Info, Shield, Globe, Mail,
} from "lucide-react";
import Link from "next/link";

export default function Perfil() {
  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-28 pt-6">

        {/* Header */}
        <header className="mb-8 flex items-center gap-4">
          <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[24px] font-bold tracking-tight">Perfil</h1>
        </header>

        {/* App identity */}
        <section className="mb-8 flex flex-col items-center rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-8">
          <div className="mb-4 grid h-20 w-20 place-items-center rounded-[24px] border border-cyan-400/[0.15] bg-cyan-400/[0.06]">
            <div className="relative h-8 w-8">
              <span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-full border-2 border-cyan-400/90" />
              <span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-full border-2 border-cyan-400/90" />
              <span className="absolute bottom-0 left-0 h-[10px] w-[10px] rounded-full border-2 border-cyan-400/90" />
              <span className="absolute bottom-0 right-0 h-[10px] w-[10px] rounded-full border-2 border-cyan-400/90" />
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-cyan-400" />
            </div>
          </div>
          <h2 className="text-[28px] font-bold tracking-tight">
            Sky<span className="text-cyan-400">Fe</span>
          </h2>
          <p className="mt-2 text-[14px] text-slate-400">
            Decisão inteligente de voo para drones
          </p>
          <span className="mt-3 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[12px] font-medium text-slate-400">
            Versão 1.0.0
          </span>
        </section>

        {/* Quick links */}
        <section className="mb-8">
          <h3 className="mb-4 text-[16px] font-semibold text-slate-200">Acesso rápido</h3>
          <div className="flex flex-col gap-2.5">
            <Link href="/configuracoes" className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-4 transition hover:bg-white/[0.04]">
              <Settings size={20} className="text-cyan-400" />
              <div className="flex-1">
                <p className="text-[15px] font-medium text-slate-200">Configurações de voo</p>
                <p className="mt-0.5 text-[12px] text-slate-500">Limites de vento, rajada, chuva e temperatura</p>
              </div>
            </Link>
            <Link href="/analise" className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-4 transition hover:bg-white/[0.04]">
              <Shield size={20} className="text-emerald-400" />
              <div className="flex-1">
                <p className="text-[15px] font-medium text-slate-200">Análise detalhada</p>
                <p className="mt-0.5 text-[12px] text-slate-500">Entenda como o score é calculado</p>
              </div>
            </Link>
            <Link href="/previsao" className="flex items-center gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-5 py-4 transition hover:bg-white/[0.04]">
              <Clock3 size={20} className="text-amber-400" />
              <div className="flex-1">
                <p className="text-[15px] font-medium text-slate-200">Previsão completa</p>
                <p className="mt-0.5 text-[12px] text-slate-500">Próximas 24h e até 16 dias</p>
              </div>
            </Link>
          </div>
        </section>

        {/* About */}
        <section className="mb-8 rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-6">
          <h3 className="mb-4 text-[16px] font-semibold text-slate-200">Sobre o SkyFe</h3>
          <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-slate-400">
            <p>
              O SkyFe é um sistema de decisão de voo para pilotos de drones.
              Ele analisa condições climáticas em tempo real e calcula um score
              de 0 a 100 indicando se é seguro voar.
            </p>
            <p>
              Os dados meteorológicos são fornecidos pela API Open-Meteo com
              atualização em tempo real. A geolocalização utiliza OpenStreetMap
              para identificação precisa do bairro e região.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="mb-8 rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-6">
          <h3 className="mb-4 text-[16px] font-semibold text-slate-200">Funcionalidades</h3>
          <div className="flex flex-col gap-3 text-[13px] text-slate-400">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-[8px] w-[8px] shrink-0 rounded-full bg-cyan-400" />
              <span>Score inteligente de voo baseado em 4 fatores climáticos</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-[8px] w-[8px] shrink-0 rounded-full bg-cyan-400" />
              <span>Previsão de até 16 dias com detalhamento hora a hora</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-[8px] w-[8px] shrink-0 rounded-full bg-cyan-400" />
              <span>Busca por cidade, bairro ou CEP</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-[8px] w-[8px] shrink-0 rounded-full bg-cyan-400" />
              <span>Limites personalizáveis por tipo de drone e experiência</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-[8px] w-[8px] shrink-0 rounded-full bg-cyan-400" />
              <span>Mapa de zonas com visualização da área de operação</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-[8px] w-[8px] shrink-0 rounded-full bg-cyan-400" />
              <span>Janela de voo recomendada automaticamente</span>
            </div>
          </div>
        </section>

        {/* Credits */}
        <section className="rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-6">
          <h3 className="mb-4 text-[16px] font-semibold text-slate-200">Créditos</h3>
          <div className="flex flex-col gap-3 text-[13px] text-slate-400">
            <div className="flex items-center gap-3">
              <Globe size={16} className="text-slate-500" />
              <span>Dados climáticos: Open-Meteo</span>
            </div>
            <div className="flex items-center gap-3">
              <Map size={16} className="text-slate-500" />
              <span>Mapas: OpenStreetMap / CartoDB</span>
            </div>
            <div className="flex items-center gap-3">
              <Info size={16} className="text-slate-500" />
              <span>Geocodificação: Nominatim</span>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-[12px] text-slate-600">
          Desenvolvido por Frizodrone © 2025
        </p>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#04090f]/75 backdrop-blur-xl">
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