"use client";

import {
  Pill,
  PrimaryButton,
  SecondaryButton,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import { formatDateTime } from "@/utils/workspace/helpers";

export function BillingCancelModal({
  open,
  planName,
  periodEnd,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  planName: string;
  periodEnd?: string | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <WorkspaceModal
      open={open}
      onClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
      title="Cancelar assinatura"
      subtitle="O cancelamento passa a valer no fim do ciclo atual. Nenhuma cobranca nova sera feita depois disso."
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-[24px] border border-yellow-400/30 bg-yellow-400/10 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Pill tone="warning">Atencao</Pill>
            <strong className="text-sm text-white">{planName}</strong>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Seu acesso premium continua ativo ate o encerramento do periodo atual.
            {periodEnd ? ` O ciclo termina em ${formatDateTime(periodEnd)}.` : ""}
          </p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[20px] border border-border/50 bg-background/40 px-5 py-4">
            <strong className="text-sm text-white">O que acontece depois da confirmacao</strong>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              O sistema agenda o cancelamento, mantem seus recursos premium ate o fim do ciclo e
              atualiza o status do billing na conta.
            </p>
          </div>
          <div className="rounded-[20px] border border-border/50 bg-background/40 px-5 py-4">
            <strong className="text-sm text-white">Voce pode voltar antes do fim do periodo</strong>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Enquanto o ciclo atual estiver vigente, voce ainda consegue gerenciar a assinatura na
              area de billing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/50 pt-5">
          <SecondaryButton type="button" onClick={onClose} disabled={submitting}>
            Voltar
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => void onConfirm()}
            disabled={submitting}
            className="border-red-400/35 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:border-red-400/55"
          >
            {submitting ? "Cancelando..." : "Confirmar cancelamento"}
          </PrimaryButton>
        </div>
      </div>
    </WorkspaceModal>
  );
}
