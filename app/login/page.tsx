"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEmailAuth = async () => {
    if (!email.trim()) { setError("Digite seu email"); return; }
    setLoading(true); setError(""); setSuccess("");

    try {
      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (err) throw err;
        setSuccess("Email de recuperação enviado! Verifique sua caixa de entrada.");
        setLoading(false);
        return;
      }

      if (!password || password.length < 6) {
        setError("Senha deve ter pelo menos 6 caracteres");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name || email.split("@")[0] },
          },
        });
        if (err) throw err;
        setSuccess("Conta criada! Verifique seu email para confirmar.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          if (err.message.includes("Invalid login")) {
            throw new Error("Email ou senha incorretos");
          }
          throw err;
        }
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar. Tente novamente.");
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true); setError("");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || "Erro ao conectar. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">

        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[20px] border border-cyan-400/[0.15] bg-cyan-400/[0.06]">
            <div className="relative h-7 w-7">
              <span className="absolute left-0 top-0 h-[8px] w-[8px] rounded-full border-[1.5px] border-cyan-400/90" />
              <span className="absolute right-0 top-0 h-[8px] w-[8px] rounded-full border-[1.5px] border-cyan-400/90" />
              <span className="absolute bottom-0 left-0 h-[8px] w-[8px] rounded-full border-[1.5px] border-cyan-400/90" />
              <span className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full border-[1.5px] border-cyan-400/90" />
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-cyan-400" />
            </div>
          </div>
          <h1 className="text-[36px] font-bold tracking-tight">
            Sky<span className="text-cyan-400">Fe</span>
          </h1>
          <p className="mt-2 text-[14px] text-slate-500">
            {mode === "login" ? "Entre na sua conta" : mode === "signup" ? "Crie sua conta gratuita" : "Recuperar senha"}
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-center text-[14px] text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-center text-[14px] text-emerald-300">
            {success}
          </div>
        )}

        {/* Name field (signup only) */}
        {mode === "signup" && (
          <div className="mb-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 transition focus-within:border-cyan-400/30">
              <User size={18} className="text-slate-500" />
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>
        )}

        {/* Email field */}
        <div className="mb-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 transition focus-within:border-cyan-400/30">
            <Mail size={18} className="text-slate-500" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-slate-600"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password field (not for forgot) */}
        {mode !== "forgot" && (
          <div className="mb-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 transition focus-within:border-cyan-400/30">
              <Lock size={18} className="text-slate-500" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-slate-600"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button onClick={() => setShowPass(!showPass)} className="text-slate-500 transition hover:text-slate-300">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Forgot password link */}
        {mode === "login" && (
          <div className="mb-6 text-right">
            <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
              className="text-[13px] text-cyan-400/70 transition hover:text-cyan-400">
              Esqueceu a senha?
            </button>
          </div>
        )}

        {mode === "forgot" && <div className="mb-6" />}

        {/* Submit button */}
        <button
          onClick={handleEmailAuth}
          disabled={loading}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 py-4 text-[16px] font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,204,255,0.18)] transition hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="h-5 w-5 rounded-full border-2 border-slate-900/30 border-t-slate-900 animate-spin" />
          ) : (
            <>
              {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar email"}
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Divider */}
        {mode !== "forgot" && (
          <>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1 border-t border-white/[0.06]" />
              <span className="text-[12px] text-slate-600">ou continue com</span>
              <div className="flex-1 border-t border-white/[0.06]" />
            </div>

            {/* OAuth buttons */}
            <div className="mb-8 flex gap-3">
              <button
                onClick={() => handleOAuth("google")}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-4 text-[14px] font-medium text-slate-200 transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>

              <button
                onClick={() => handleOAuth("apple")}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-4 text-[14px] font-medium text-slate-200 transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>
            </div>
          </>
        )}

        {/* Switch mode */}
        <div className="text-center text-[14px] text-slate-500">
          {mode === "login" && (
            <>
              Não tem conta?{" "}
              <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                className="font-medium text-cyan-400 transition hover:text-cyan-300">
                Criar agora
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Já tem conta?{" "}
              <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className="font-medium text-cyan-400 transition hover:text-cyan-300">
                Entrar
              </button>
            </>
          )}
          {mode === "forgot" && (
            <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              className="font-medium text-cyan-400 transition hover:text-cyan-300">
              Voltar para o login
            </button>
          )}
        </div>

        {/* Legal links */}
        <div className="mt-8 flex items-center justify-center gap-4 text-[12px] text-slate-600">
          <a href="/privacidade" className="transition hover:text-slate-400">Privacidade</a>
          <span>•</span>
          <a href="/termos" className="transition hover:text-slate-400">Termos de Uso</a>
        </div>

        {/* Voltar ao app sem login */}
        <a href="/"
          className="mt-6 flex items-center justify-center text-[13px] font-medium text-slate-500 transition hover:text-slate-300">
          Continuar sem conta →
        </a>

      </div>
    </main>
  );
}
