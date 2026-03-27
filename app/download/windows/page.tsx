import { logout } from "@/app/actions/auth";
import {
  ActionLink,
  SectionHeader,
  StatusBadge,
  Surface,
} from "@/app/components/ui/system-primitives";
import { createClient } from "@/utils/supabase/server";
import { Download, LogOut, ShieldCheck, Terminal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CyberTrailScene } from "../../components/cyber-trail-scene";
import { LandingMotion } from "../../components/landing-motion";
import { IntentProcessor } from "./intent-processor";

const brandMark = "/design/CodeTrailMainIcon.png";

export default async function DownloadWindows() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/");
  }

  const { data: intents } = await supabase
    .from("plan_intents")
    .select("selected_plan")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const currentPlan = intents?.[0]?.selected_plan || null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-ui text-text-primary">
      <LandingMotion />
      <CyberTrailScene />
      <IntentProcessor />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(50,208,255,0.1),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(159,232,112,0.08),transparent_25%)]" />

      <nav className="relative z-10 border-b border-border/50 bg-background/78 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 text-white decoration-transparent">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_18px_rgba(50,208,255,0.16)]">
              <Image src={brandMark} alt="CodeTrail Logo" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <strong className="text-base font-display tracking-tight leading-none">CodeTrail</strong>
              <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-primary/80">Entrega Windows</span>
            </div>
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-transparent px-4 text-xs font-bold uppercase tracking-[0.18em] text-text-secondary transition-[color,background-color,border-color] duration-200 hover:border-border/70 hover:bg-white/[0.04] hover:text-white"
            >
              <LogOut size={14} />
              Sair
            </button>
          </form>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-[1180px] items-center px-4 py-12 sm:px-6">
        <Surface tone="glass" className="w-full p-6 sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-6">
              <StatusBadge tone="success">Autenticação concluída</StatusBadge>
              <SectionHeader
                eyebrow="Download liberado"
                title="Seu acesso ao instalador Windows já está pronto."
                subtitle="A conta foi validada com sucesso. Agora é só baixar o instalador, entrar com a mesma credencial e continuar no ecossistema CodeTrail."
              />

              <Surface tone="soft" className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <strong className="font-display text-lg text-white">Identidade confirmada</strong>
                      <p className="m-0 text-sm leading-relaxed text-text-secondary">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  {currentPlan ? (
                    <div className="rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm leading-relaxed text-text-secondary">
                      Interesse registrado: <span className="font-semibold text-white">Plano {currentPlan}</span>.
                    </div>
                  ) : null}
                </div>
              </Surface>

              <Surface tone="soft" className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-white/[0.03] text-primary">
                    <Terminal size={18} />
                  </div>
                  <div>
                    <strong className="font-display text-lg text-white">Obrigado por confiar no CodeTrail</strong>
                    <p className="m-0 text-sm leading-relaxed text-text-secondary">
                      A proposta aqui é simples: reduzir o caos operacional do aprendizado e transformar sua rotina em um sistema mais claro, rastreável e consistente.
                    </p>
                  </div>
                </div>
              </Surface>
            </div>

            <div className="flex flex-col gap-5">
              <Surface tone="soft" className="p-5">
                <div className="flex flex-col gap-4">
                  <strong className="font-display text-xl text-white">Próximos passos</strong>
                  <ol className="flex flex-col gap-3 text-sm leading-relaxed text-text-secondary">
                    <li>1. Baixe o instalador pelo botão abaixo.</li>
                    <li>2. Execute o arquivo `CodeTrail Setup.exe` no seu Windows.</li>
                    <li>3. Entre com a mesma conta autenticada agora.</li>
                    <li>4. Continue a rotina com os mesmos dados, billing e contexto do sistema.</li>
                  </ol>
                </div>
              </Surface>

              <div className="flex flex-col gap-3 sm:flex-row">
                <ActionLink
                  href="/api/download/windows"
                  download
                  variant="primary"
                  className="w-full sm:flex-1"
                >
                  <Download size={16} />
                  Baixar para Windows
                </ActionLink>
                <ActionLink href="/" variant="secondary" className="w-full sm:flex-1">
                  Voltar para a base
                </ActionLink>
              </div>

              <div className="flex items-center gap-2 border-t border-border/50 pt-4 text-xs uppercase tracking-[0.18em] text-text-secondary">
                <span>Status</span>
                <span className="inline-flex items-center gap-2 text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(50,208,255,0.9)]" />
                  Ambiente disponível
                </span>
              </div>
            </div>
          </div>
        </Surface>
      </main>
    </div>
  );
}
