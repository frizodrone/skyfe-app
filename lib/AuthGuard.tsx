"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/*
  AuthGuard v2.5.3

  FILOSOFIA: O app NUNCA trava na tela de login.
  
  - Clima, Previsão, Zonas, Busca → sempre livre
  - Favoritos, Análise detalhada, Configurações → precisa de login
  
  Quando o usuário tenta usar uma feature bloqueada sem login,
  aparece um modal convidando a criar conta — mas ele pode fechar
  e continuar navegando normalmente.
*/

// Hook simples para saber se está logado
export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return isLoggedIn;
}

// Modal de convite para login — premium e convincente
export function LoginPromptModal({ onClose, feature }: { onClose: () => void; feature: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md px-0 sm:px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-t-[32px] sm:rounded-[32px] border border-cyan-400/15 bg-[#0a1222] px-7 pt-8 pb-10 shadow-[0_-20px_60px_rgba(0,0,0,0.5),0_0_80px_rgba(45,204,255,0.08)] relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[radial-gradient(ellipse,rgba(34,211,238,0.08),transparent_60%)] pointer-events-none" />

        {/* Close button */}
        <button onClick={onClose} className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-white/[0.04] text-slate-500 transition hover:bg-white/[0.08] hover:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Drag indicator (mobile) */}
        <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/10" />

        {/* Logo */}
        <div className="relative z-10 mb-6 flex justify-center">
          <div className="grid h-[72px] w-[72px] place-items-center rounded-[22px] border border-cyan-400/20 bg-white/[0.03] shadow-[0_0_40px_rgba(45,204,255,0.12)]">
            <div className="relative h-[28px] w-[28px]">
              <span className="absolute left-0 top-0 h-[9px] w-[9px] rounded-full border-[2px] border-cyan-400 animate-pulse" style={{ animationDelay: "0s" }} />
              <span className="absolute right-0 top-0 h-[9px] w-[9px] rounded-full border-[2px] border-cyan-400 animate-pulse" style={{ animationDelay: "0.15s" }} />
              <span className="absolute left-0 bottom-0 h-[9px] w-[9px] rounded-full border-[2px] border-cyan-400 animate-pulse" style={{ animationDelay: "0.3s" }} />
              <span className="absolute right-0 bottom-0 h-[9px] w-[9px] rounded-full border-[2px] border-cyan-400 animate-pulse" style={{ animationDelay: "0.45s" }} />
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-cyan-400" />
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="mb-2 text-center text-[24px] font-bold text-white leading-tight">
            Crie sua conta grátis<br />e desbloqueie tudo
          </h2>
          <p className="mb-6 text-center text-[14px] leading-relaxed text-slate-400">
            Leva menos de 30 segundos. Sem cartão de crédito.
          </p>

          {/* Benefits — visual cards */}
          <div className="mb-7 grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-3">
              <span className="text-[18px]">🗺️</span>
              <span className="text-[12px] font-medium text-slate-300">Mapa de zonas aéreas</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-3">
              <span className="text-[18px]">📊</span>
              <span className="text-[12px] font-medium text-slate-300">Análise detalhada</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-3">
              <span className="text-[18px]">⏱️</span>
              <span className="text-[12px] font-medium text-slate-300">Previsão 16 dias</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-3">
              <span className="text-[18px]">✅</span>
              <span className="text-[12px] font-medium text-slate-300">Checklist pré-voo</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-3">
              <span className="text-[18px]">📱</span>
              <span className="text-[12px] font-medium text-slate-300">Compartilhar score</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-3">
              <span className="text-[18px]">⭐</span>
              <span className="text-[12px] font-medium text-slate-300">Locais favoritos</span>
            </div>
          </div>

          {/* CTA button */}
          <a href="/login"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[16px] font-bold text-slate-950 shadow-[0_4px_30px_rgba(45,204,255,0.25)] transition hover:shadow-[0_4px_50px_rgba(45,204,255,0.35)] hover:brightness-105 active:scale-[0.98]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Criar conta grátis
          </a>

          <a href="/login"
            className="flex w-full items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] py-3.5 text-[14px] font-medium text-slate-300 transition hover:bg-white/[0.06]">
            Já tenho conta — Entrar
          </a>

          <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5"><span className="h-[5px] w-[5px] rounded-full bg-emerald-400/60" />100% gratuito</span>
            <span className="flex items-center gap-1.5"><span className="h-[5px] w-[5px] rounded-full bg-emerald-400/60" />Sem anúncios</span>
            <span className="flex items-center gap-1.5"><span className="h-[5px] w-[5px] rounded-full bg-emerald-400/60" />Sem cartão</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// AuthGuard — onboarding obrigatório na primeira vez + login para páginas além do clima
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      const path = window.location.pathname;

      // Páginas que sempre funcionam sem nada
      if (path === "/login" || path === "/auth/callback" || path === "/privacidade" || path === "/termos") {
        setReady(true);
        return;
      }

      // Onboarding: sempre acessível, é o primeiro passo
      if (path === "/onboarding") {
        setReady(true);
        return;
      }

      // PASSO 1: Verificar se onboarding foi feito (obrigatório antes de tudo)
      try {
        const done = localStorage.getItem("skyfe-onboarding-done") === "true";
        if (!done) {
          window.location.href = "/onboarding";
          return;
        }
      } catch {}

      // PASSO 2: Home/Clima funciona sem login
      if (path === "/") {
        setReady(true);
        return;
      }

      // PASSO 3: Todas as outras páginas exigem login
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }

      setReady(true);
    };
    check();
  }, []);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
