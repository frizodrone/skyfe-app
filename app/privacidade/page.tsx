"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Privacidade() {
  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pb-12 pt-6">
        <header className="mb-8 flex items-center gap-4">
          <Link href="/perfil" className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[22px] font-bold tracking-tight">Política de Privacidade</h1>
        </header>

        <div className="flex flex-col gap-6 text-[14px] leading-relaxed text-slate-400">
          <p className="text-[12px] text-slate-600">Última atualização: 02 de abril de 2026</p>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">1. Introdução</h2>
            <p>A SkyFe Tecnologia (&ldquo;nós&rdquo;, &ldquo;nosso&rdquo;) opera o aplicativo SkyFe. Esta política descreve como coletamos, usamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">2. Dados que coletamos</h2>
            <p className="mb-2">Coletamos os seguintes dados quando você usa o SkyFe:</p>
            <p><span className="text-slate-300 font-medium">Dados de cadastro:</span> nome, email, telefone (opcional), WhatsApp (opcional).</p>
            <p className="mt-1"><span className="text-slate-300 font-medium">Dados de perfil:</span> modelo do drone, nível de experiência.</p>
            <p className="mt-1"><span className="text-slate-300 font-medium">Dados de localização:</span> coordenadas geográficas (para exibir condições climáticas locais).</p>
            <p className="mt-1"><span className="text-slate-300 font-medium">Dados de uso:</span> páginas visitadas, frequência de uso, configurações salvas, locais favoritos.</p>
            <p className="mt-1"><span className="text-slate-300 font-medium">Dados de autenticação:</span> informações de login via Google ou Apple (quando utilizados).</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">3. Como usamos seus dados</h2>
            <p>Utilizamos seus dados exclusivamente para: fornecer o serviço de análise de condições de voo; personalizar sua experiência (limites de voo, drone cadastrado); exibir condições climáticas baseadas na sua localização; melhorar o aplicativo com base em padrões de uso; e enviar comunicações relevantes sobre o serviço.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">4. Compartilhamento de dados</h2>
            <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Seus dados podem ser compartilhados apenas com: Supabase (infraestrutura de banco de dados); Open-Meteo (dados climáticos — apenas coordenadas, sem dados pessoais); provedores de autenticação (Google, Apple — conforme sua escolha de login).</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">5. Armazenamento e segurança</h2>
            <p>Seus dados são armazenados em servidores seguros (Supabase) com criptografia em trânsito (TLS) e em repouso. Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">6. Seus direitos (LGPD)</h2>
            <p>Conforme a LGPD, você tem direito a: confirmar a existência de tratamento dos seus dados; acessar seus dados; corrigir dados incompletos ou desatualizados; solicitar a exclusão dos seus dados; revogar o consentimento a qualquer momento; e solicitar a portabilidade dos seus dados.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">7. Exclusão de conta</h2>
            <p>Você pode solicitar a exclusão completa da sua conta e dados a qualquer momento entrando em contato pelo email abaixo. A exclusão será processada em até 15 dias úteis.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">8. Cookies e armazenamento local</h2>
            <p>Utilizamos localStorage do navegador para armazenar configurações locais (limites de voo) para performance. Não utilizamos cookies de rastreamento ou publicidade.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">9. Alterações nesta política</h2>
            <p>Podemos atualizar esta política periodicamente. Alterações significativas serão comunicadas pelo aplicativo ou por email.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">10. Contato</h2>
            <p>Para dúvidas, solicitações ou exercício dos seus direitos:</p>
            <p className="mt-1 text-cyan-400">contato@skyfe.com.br</p>
            <p className="mt-1 text-slate-500">SkyFe Tecnologia</p>
          </section>
        </div>
      </div>
    </main>
  );
}
