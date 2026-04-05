"use client";

import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import {
  PRIVACY_PREFERENCES_OPEN_EVENT,
  createPrivacyPreferences,
  readPrivacyPreferences,
  savePrivacyPreferences,
} from "@/utils/privacy/preferences";
import { X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

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

      {panelOpen ? (
        <section
          id="privacy-preferences-panel"
          className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 sm:px-6"
          aria-live="polite"
        >
          <div className="glass-panel mx-auto w-full max-w-3xl rounded-[28px] border border-border/70 px-5 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Cookies e telemetria
                </span>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Usamos cookies essenciais para autenticação e segurança. As
                  métricas do Vercel Analytics e do Speed Insights só são
                  ativadas com sua escolha.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Você pode revisar a preferência a qualquer momento pelo botão
                  de privacidade no topo do workspace ou na{" "}
                  <Link
                    href="/politica-de-privacidade"
                    className="font-semibold text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-white"
                  >
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/35 text-text-secondary transition-colors hover:text-white"
                aria-label="Fechar preferências de privacidade"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:min-w-[240px] sm:flex-row sm:justify-end">
              {decisionMade ? (
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="workspace-button workspace-button--secondary min-h-[44px] justify-center px-5 py-3 text-sm normal-case tracking-normal"
                >
                  Manter escolha atual
                </button>
              ) : null}
              <div className="flex flex-col gap-2 sm:min-w-[240px]">
                <button
                  type="button"
                  onClick={() => applyChoice(false)}
                  className="workspace-button workspace-button--secondary min-h-[44px] justify-center px-5 py-3 text-sm normal-case tracking-normal"
                >
                  Somente essenciais
                </button>
                <button
                  type="button"
                  onClick={() => applyChoice(true)}
                  className="workspace-button workspace-button--primary min-h-[44px] justify-center px-5 py-3 text-sm normal-case tracking-normal"
                >
                  Permitir métricas
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
