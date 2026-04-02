"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Termos() {
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
          <h1 className="text-[22px] font-bold tracking-tight">Termos de Uso</h1>
        </header>

        <div className="flex flex-col gap-6 text-[14px] leading-relaxed text-slate-400">
          <p className="text-[12px] text-slate-600">Última atualização: 02 de abril de 2026</p>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">1. Aceitação dos termos</h2>
            <p>Ao usar o aplicativo SkyFe, você concorda com estes Termos de Uso. Se não concordar, não utilize o aplicativo. O SkyFe é operado pela SkyFe Tecnologia.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">2. Descrição do serviço</h2>
            <p>O SkyFe é uma plataforma de apoio à decisão de voo para pilotos de drones. O aplicativo analisa condições climáticas em tempo real e calcula um score de voo (0 a 100) para auxiliar na tomada de decisão sobre operações com drones.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">3. Isenção de responsabilidade</h2>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
              <p className="text-amber-300/90">O SkyFe é uma ferramenta de apoio e NÃO substitui o julgamento do piloto. A decisão final de voar ou não é sempre de responsabilidade exclusiva do piloto. O SkyFe não se responsabiliza por acidentes, danos a equipamentos, multas ou qualquer prejuízo decorrente do uso das informações fornecidas pelo aplicativo.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">4. Regulamentação de drones</h2>
            <p>O usuário é responsável por conhecer e cumprir toda a legislação aplicável a operações com drones no Brasil, incluindo as normas da ANAC (Agência Nacional de Aviação Civil), DECEA (Departamento de Controle do Espaço Aéreo) e ANATEL. O SkyFe não garante conformidade regulatória.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">5. Conta do usuário</h2>
            <p>Você é responsável por manter a segurança da sua conta e senha. Não compartilhe suas credenciais. Cada conta é pessoal e intransferível. Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">6. Precisão dos dados</h2>
            <p>Os dados climáticos são fornecidos por serviços de terceiros (Open-Meteo) e podem conter imprecisões. Os dados de aeroportos e espaço aéreo são informativos e podem não refletir a situação atual. Sempre consulte fontes oficiais (AIS, NOTAM) antes de voar.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">7. Propriedade intelectual</h2>
            <p>O SkyFe, incluindo seu design, código, marca, logotipo e conteúdo, é propriedade da SkyFe Tecnologia. É proibida a reprodução, distribuição ou modificação sem autorização prévia por escrito.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">8. Planos e assinaturas</h2>
            <p>O SkyFe oferece funcionalidades gratuitas e, futuramente, planos pagos com recursos adicionais. Os preços, condições e recursos de cada plano serão informados de forma clara antes da contratação. Cancelamentos seguirão as regras da plataforma de pagamento utilizada.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">9. Uso adequado</h2>
            <p>Você se compromete a não: usar o app para fins ilegais; tentar acessar dados de outros usuários; realizar engenharia reversa do aplicativo; usar bots ou scripts automatizados; ou compartilhar conteúdo ofensivo ou prejudicial.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">10. Disponibilidade</h2>
            <p>Não garantimos disponibilidade ininterrupta do serviço. O SkyFe pode ficar indisponível temporariamente para manutenção ou por motivos técnicos. Faremos nosso melhor para minimizar interrupções.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">11. Alterações nos termos</h2>
            <p>Podemos alterar estes termos a qualquer momento. Alterações significativas serão comunicadas pelo aplicativo. O uso continuado após alterações constitui aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">12. Legislação aplicável</h2>
            <p>Estes termos são regidos pelas leis da República Federativa do Brasil. Eventuais disputas serão resolvidas no foro da comarca de São Paulo/SP.</p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-slate-200">13. Contato</h2>
            <p>Para dúvidas sobre estes termos:</p>
            <p className="mt-1 text-cyan-400">contato@skyfe.com.br</p>
            <p className="mt-1 text-slate-500">SkyFe Tecnologia</p>
          </section>
        </div>
      </div>
    </main>
  );
}
