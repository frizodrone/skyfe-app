"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/*
  /auth/callback — Callback handler para confirmação de email do Supabase

  IMPORTANTE: No Supabase Dashboard, configure:
  - Authentication > URL Configuration > Site URL: https://app.skyfe.com.br
  - Authentication > URL Configuration > Redirect URLs: 
    https://app.skyfe.com.br/auth/callback
    https://app.skyfe.com.br/

  O Supabase envia um link de confirmação no formato:
  https://app.skyfe.com.br/auth/callback#access_token=...&type=signup

  Esta página processa o token e redireciona o usuário.
*/

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verificando...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // O Supabase coloca o token no hash fragment da URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken && refreshToken) {
          // Definir a sessão com os tokens recebidos
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          if (type === "signup" || type === "email") {
            setStatus("success");
            setMessage("Email confirmado com sucesso!");
          } else if (type === "recovery") {
            setStatus("success");
            setMessage("Acesso recuperado!");
          } else {
            setStatus("success");
            setMessage("Autenticação realizada!");
          }

          // Redirecionar para a home após 2 segundos
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        } else {
          // Tentar processar via exchangeCodeForSession (PKCE flow)
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get("code");

          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;

            setStatus("success");
            setMessage("Email confirmado com sucesso!");

            setTimeout(() => {
              window.location.href = "/";
            }, 2000);
          } else {
            // Nenhum token encontrado — pode ser acesso direto à URL
            setStatus("error");
            setMessage("Link inválido ou expirado. Tente fazer login novamente.");
          }
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Erro ao processar confirmação. Tente novamente.");
      }
    };

    handleCallback();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(45,204,255,0.1),_transparent_50%)]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        {/* Logo */}
        <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-cyan-400/20 bg-white/[0.03] shadow-[0_0_40px_rgba(45,204,255,0.15)]">
          <div className="relative h-[30px] w-[30px]">
            <span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" />
            <span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
            <span className="absolute left-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
            <span className="absolute right-0 bottom-0 h-[10px] w-[10px] rounded-full border-[2px] border-cyan-400/90 animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[4px] bg-cyan-400 animate-pulse-dot" />
          </div>
        </div>

        <h1 className="text-[28px] font-bold tracking-tight text-white">Sky<span className="text-cyan-400">Fe</span></h1>

        {status === "loading" && (
          <>
            <div className="h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-full animate-loading-bar rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
            </div>
            <p className="text-[14px] text-slate-400">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-emerald-400/30 bg-emerald-400/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2dffb3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[16px] font-semibold text-emerald-400">{message}</p>
            <p className="text-[13px] text-slate-500">Redirecionando...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-red-400/30 bg-red-400/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff5a5f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <p className="text-[14px] text-red-300">{message}</p>
            <a href="/login"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3 text-[14px] font-semibold text-slate-950 shadow-[0_0_20px_rgba(45,204,255,0.15)] transition hover:brightness-105">
              Ir para o login
            </a>
          </>
        )}
      </div>
    </main>
  );
}
