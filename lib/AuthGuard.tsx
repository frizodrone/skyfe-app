"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthed(true);
      } else {
        router.replace("/login");
      }
      setChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!checked || !authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04090f]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-[3px] border-white/[0.06] border-t-cyan-400 animate-spin-loader" />
          <p className="text-[15px] text-slate-400">Verificando acesso...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
