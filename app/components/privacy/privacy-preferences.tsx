"use client";

import { ActionButton, StatusBadge } from "@/app/components/ui/system-primitives";
import { WorkspaceModal } from "@/app/workspace/_components/workspace-ui";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import {
  PRIVACY_PREFERENCES_OPEN_EVENT,
  createPrivacyPreferences,
  readPrivacyPreferences,
  savePrivacyPreferences,
} from "@/utils/privacy/preferences";
import {
  ArrowUpRight,
  BarChart3,
  FileText,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

const legalCardClassName =
  "group flex h-full flex-col justify-between rounded-[24px] border border-border/60 bg-background/35 px-5 py-5 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.08]";

export function PrivacyPreferences() {
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [override, setOverride] = useState<{
    analytics: boolean;
    updatedAt: string;
  } | null>(null);

  const preferences =
    override ?? (hydrated ? readPrivacyPreferences() : null);
  const analyticsAllowed = preferences?.analytics ?? false;
  const decisionMade = preferences !== null;
  const currentStatus = !decisionMade
    ? {
        label: "Escolha pendente",
        tone: "warning" as const,
      }
    : analyticsAllowed
      ? {
          label: "Métricas opcionais ativas",
          tone: "success" as const,
        }
      : {
          label: "Somente essenciais",
          tone: "neutral" as const,
        };
  const updatedAtLabel = preferences?.updatedAt
    ? formatPreferenceTimestamp(preferences.updatedAt)
    : null;

  function applyChoice(analytics: boolean) {
    const next = createPrivacyPreferences(analytics);
    savePrivacyPreferences(next);
    setOverride(next);
    setPanelOpen(false);
  }

  useEffect(() => {
    function openPanel() {
      setPanelOpen(true);
    }

    window.addEventListener(PRIVACY_PREFERENCES_OPEN_EVENT, openPanel);
    return () => {
      window.removeEventListener(PRIVACY_PREFERENCES_OPEN_EVENT, openPanel);
    };
  }, []);

  if (!hydrated) {
    return null;
  }

  return (
    <>
      {analyticsAllowed ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}

      <WorkspaceModal
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        size="lg"
        eyebrow="Centro LGPD"
        title="Privacidade, termos e consentimento"
        subtitle="Gerencie a telemetria opcional do produto e consulte os documentos legais sem sair do fluxo atual."
      >
        <section
          id="privacy-preferences-panel"
          className="flex flex-col gap-5"
          aria-live="polite"
        >
          <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="rounded-[24px] border border-primary/20 bg-primary/[0.08] px-5 py-5 shadow-[0_0_24px_rgba(129,236,255,0.08)]">
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusBadge tone={currentStatus.tone}>
                  <ShieldCheck size={12} />
                  {currentStatus.label}
                </StatusBadge>
                {updatedAtLabel ? (
                  <span className="text-[11px] text-text-secondary">
                    Atualizado em {updatedAtLabel}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-4 text-xl font-display font-medium tracking-tight text-white">
                Controle granular sem quebrar autenticação, segurança ou acesso.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Cookies essenciais permanecem ativos para login, estabilidade da
                sessão e proteção do ambiente. As métricas do{" "}
                <strong className="font-semibold text-white">
                  Vercel Analytics
                </strong>{" "}
                e do{" "}
                <strong className="font-semibold text-white">
                  Speed Insights
                </strong>{" "}
                só são habilitadas com sua escolha.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Você pode revisar essa decisão a qualquer momento pelo ícone de
                privacidade no topo do workspace.
              </p>
            </div>

            <div className="rounded-[24px] border border-border/60 bg-background/35 px-5 py-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-white/[0.03] text-primary">
                    <LockKeyhole size={18} />
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-sm font-semibold text-white">
                      Sempre ativos
                    </strong>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      Autenticação, segurança, integridade da sessão e recursos
                      operacionais do workspace.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-white/[0.03] text-primary">
                    <BarChart3 size={18} />
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-sm font-semibold text-white">
                      Opcionais
                    </strong>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      Métricas agregadas de uso e performance para orientar
                      melhorias de produto sem afetar seu acesso principal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Link href="/termos-de-uso" className={legalCardClassName}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-white/[0.03] text-primary transition-colors duration-200 group-hover:border-primary/30 group-hover:bg-primary/10">
                  <FileText size={18} />
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-text-secondary transition-colors duration-200 group-hover:text-primary"
                />
              </div>
              <div className="mt-4">
                <strong className="text-base font-display tracking-tight text-white">
                  Termos de Uso
                </strong>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Consulte regras de acesso, responsabilidades e condições do
                  ecossistema web do CodeTrail.
                </p>
              </div>
            </Link>

            <Link href="/politica-de-privacidade" className={legalCardClassName}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-white/[0.03] text-primary transition-colors duration-200 group-hover:border-primary/30 group-hover:bg-primary/10">
                  <ShieldCheck size={18} />
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-text-secondary transition-colors duration-200 group-hover:text-primary"
                />
              </div>
              <div className="mt-4">
                <strong className="text-base font-display tracking-tight text-white">
                  Política de Privacidade
                </strong>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Veja a base legal, o tratamento de dados e os direitos LGPD
                  disponíveis no produto.
                </p>
              </div>
            </Link>
          </div>

          <div className="flex flex-col gap-4 border-t border-border/50 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-lg text-xs leading-relaxed text-text-secondary">
              Sua escolha vale apenas para a telemetria opcional. O núcleo do
              sistema continua funcionando com os componentes estritamente
              necessários.
            </p>

            <div className="flex flex-col gap-2 sm:items-end">
              {decisionMade ? (
                <ActionButton
                  type="button"
                  variant="ghost"
                  onClick={() => setPanelOpen(false)}
                  className="sm:self-end"
                >
                  Manter escolha atual
                </ActionButton>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <ActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => applyChoice(false)}
                >
                  Somente essenciais
                </ActionButton>
                <ActionButton
                  type="button"
                  onClick={() => applyChoice(true)}
                >
                  Permitir métricas
                </ActionButton>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceModal>
    </>
  );
}

function formatPreferenceTimestamp(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}
