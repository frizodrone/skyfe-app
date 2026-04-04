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

// Modal de convite para login
export function LoginPromptModal({ onClose, feature }: { onClose: () => void; feature: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-[28px] border border-cyan-400/20 bg-[#0b1221] p-7 shadow-[0_0_60px_rgba(45,204,255,0.1)]">
        {/* Logo */}
        <div className="mb-5 flex justify-center">
          <div className="grid h-16 w-16 place-items-center rounded-[20px] border border-cyan-400/20 bg-white/[0.03]">
            <div className="relative h-[24px] w-[24px]">
              <span className="absolute left-0 top-0 h-[8px] w-[8px] rounded-full border-[2px] border-cyan-400/90" />
              <span className="absolute right-0 top-0 h-[8px] w-[8px] rounded-full border-[2px] border-cyan-400/90" />
              <span className="absolute left-0 bottom-0 h-[8px] w-[8px] rounded-full border-[2px] border-cyan-400/90" />
              <span className="absolute right-0 bottom-0 h-[8px] w-[8px] rounded-full border-[2px] border-cyan-400/90" />
              <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-cyan-400" />
            </div>
          </div>
        </div>

        <h2 className="mb-3 text-center text-[20px] font-bold text-white">
          Desbloqueie todo o SkyFe
        </h2>
        <p className="mb-5 text-center text-[14px] leading-relaxed text-slate-400">
          Crie sua conta grátis e aproveite o aplicativo em sua <span className="text-white font-medium">total funcionalidade</span>:
        </p>

        {/* Benefits list */}
        <div className="mb-6 flex flex-col gap-2.5 text-[13px] text-slate-300">
          <div className="flex items-center gap-2.5">
            <span className="h-[6px] w-[6px] rounded-full bg-cyan-400 shrink-0" />
            Análise detalhada por fator de risco
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-[6px] w-[6px] rounded-full bg-emerald-400 shrink-0" />
            Salvar locais favoritos
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-[6px] w-[6px] rounded-full bg-amber-400 shrink-0" />
            Personalizar limites do seu drone
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-[6px] w-[6px] rounded-full bg-purple-400 shrink-0" />
            Perfil com dados salvos na nuvem
          </div>
        </div>

        <a href="/login"
          className="mb-3 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-3.5 text-[15px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105">
          Criar conta grátis
        </a>

        <button onClick={onClose}
          className="flex w-full items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] py-3.5 text-[14px] font-medium text-slate-400 transition hover:bg-white/[0.05]">
          Continuar sem conta
        </button>

        <p className="mt-4 text-center text-[11px] text-slate-600">
          100% gratuito — sem cartão de crédito
        </p>
      </div>
    </div>
  );
}

// AuthGuard — login obrigatório + onboarding no primeiro uso
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      // Páginas que não exigem login
      const path = window.location.pathname;
      if (path === "/" || path === "/login" || path === "/auth/callback" || path === "/privacidade" || path === "/termos" || path === "/onboarding") {
        // Home (clima) funciona sem login, mas verifica onboarding
        if (path === "/") {
          try {
            const done = localStorage.getItem("skyfe-onboarding-done") === "true";
            if (!done) {
              window.location.href = "/onboarding";
              return;
            }
          } catch {}
        }
        setReady(true);
        return;
      }

      // Todas as outras páginas exigem login
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }

      // Verificar se onboarding foi concluído
      try {
        const done = localStorage.getItem("skyfe-onboarding-done") === "true";
        if (!done && path !== "/onboarding") {
          window.location.href = "/onboarding";
          return;
        }
      } catch {}

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
