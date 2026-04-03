"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const VISIT_KEY = "skyfe-visits";
const MAX_FREE_VISITS = 3;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      // 1. Verificar se está logado
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAllowed(true);
        setChecked(true);
        return;
      }

      // 2. Não logado — verificar contador de visitas
      let visits = 1;
      try {
        const stored = localStorage.getItem(VISIT_KEY);
        if (stored) {
          visits = parseInt(stored, 10) + 1;
        }
        localStorage.setItem(VISIT_KEY, String(visits));
      } catch {}

      if (visits <= MAX_FREE_VISITS) {
        // Permitir uso sem login
        setAllowed(true);
        // Mostrar prompt gentil a partir da 2ª visita
        if (visits >= 2) {
          setShowLoginPrompt(true);
        }
      } else {
        // Após 3 visitas, redirecionar para login
        router.replace("/login");
      }
      setChecked(true);
    };

    checkAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && checked) {
        // Se deslogou, verificar se ainda tem visitas grátis
        try {
          const visits = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10);
          if (visits > MAX_FREE_VISITS) {
            router.replace("/login");
          }
        } catch {
          router.replace("/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router, checked]);

  if (!checked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="pointer-events-none fixed inset-0 opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.1),_transparent_50%)]" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-cyan-400/20 bg-white/[0.03] shadow-[0_0_40px_rgba(45,204,255,0.15)]">
            <div className="relative h-[30px] w-[30px]">
              <span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0s" }} />
              <span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
              <span className="absolute left-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
              <span className="absolute right-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-cyan-400 animate-pulse-dot" />
            </div>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-white">Sky<span className="text-cyan-400">Fe</span></h1>
          <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
          </div>
          <p className="text-[13px] text-slate-500">Verificando acesso...</p>
        </div>
      </main>
    );
  }

  if (!allowed) return null;

  return (
    <>
      {children}

      {/* Banner gentil de login — aparece a partir da 2ª visita */}
      {showLoginPrompt && (
        <div className="fixed top-0 left-0 right-0 z-[9999] animate-slide-down">
          <div className="mx-auto max-w-md px-4 pt-2">
            <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-[#0a1222]/95 px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-slate-200">
                  Crie sua conta grátis
                </p>
                <p className="text-[11px] text-slate-500">
                  Salve favoritos e personalize seus limites
                </p>
              </div>
              <a href="/login" className="shrink-0 rounded-full bg-cyan-400 px-4 py-2 text-[12px] font-semibold text-slate-950">
                Entrar
              </a>
              <button onClick={() => setShowLoginPrompt(false)}
                className="shrink-0 text-[18px] text-slate-500 hover:text-slate-300 px-1">
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
