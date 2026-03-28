"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Clock3,
  CreditCard,
  Receipt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { BillingCancelModal } from "@/app/workspace/_components/pages/billing-cancel-modal";
import {
  DataCard,
  MetricCard,
  PageFrame,
  Pill,
  PrimaryButton,
  SecondaryButton,
  SectionGrid,
} from "@/app/workspace/_components/workspace-ui";
import { FeedbackMessage } from "@/app/components/ui/system-primitives";
import { normalizeCheckoutReturnUrl } from "@/utils/auth/oauth";
import {
  billingIntervalLabel,
  formatCurrencyBrl,
  formatDateTime,
  planCode,
} from "@/utils/workspace/helpers";
import type { BillingPayment, BillingPlanCode, BillingSnapshot } from "@/utils/workspace/types";

type NoticeTone = "success" | "warning" | "error" | "neutral";

interface BillingNotice {
  tone: NoticeTone;
  title: string;
  message: string;
}

export function BillingPage() {
  const {
    data,
    refreshing,
    operation,
    error,
    refreshBilling,
    createCheckout,
    openPortal,
    cancelSubscription,
    syncBilling,
  } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState<BillingNotice | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const handledFeedbackRef = useRef("");
  const handledCheckoutRef = useRef("");
  const billing = data!.billing;
  const currentPlanCode = planCode(billing);
  const currentPlan = billing.current_plan;
  const hasPaidPlan = currentPlanCode !== "free" && Boolean(billing.subscription);
  const currentStatusLabel = getSubscriptionStatusLabel(
    billing.subscription?.status,
    billing.subscription?.cancel_at_period_end ?? false,
  );
  const currentStatusTone = getSubscriptionStatusTone(
    billing.subscription?.status,
    billing.subscription?.cancel_at_period_end ?? false,
  );
  const nextMilestone = getNextMilestoneLabel(billing);
  const paidPlans = useMemo(
    () =>
      billing.available_plans.filter(
        (plan) => plan.is_active && plan.is_public && plan.code !== "free",
      ),
    [billing.available_plans],
  );
  const latestPayment = billing.payments[0] ?? null;
  const searchKey = searchParams.toString();
  const checkoutReturnTo = normalizeCheckoutReturnUrl(searchParams.get("returnTo"));
  const isRefreshingSnapshot = operation?.key === "billing-refresh";
  const isSyncingStatus = operation?.key === "billing-sync";
  const isOpeningPortal = operation?.key === "billing-portal";
  const isCancellingPlan = operation?.key === "billing-cancel";
  const cancelScheduled = billing.subscription?.cancel_at_period_end ?? false;

  useEffect(() => {
    const billingState = searchParams.get("billing");
    const billingError = searchParams.get("billing_error");
    const sessionId = searchParams.get("session_id");

    if (!billingState && !billingError) {
      return;
    }

    const feedbackKey = `${billingState ?? ""}|${billingError ?? ""}|${sessionId ?? ""}`;
    if (handledFeedbackRef.current === feedbackKey) {
      return;
    }
    handledFeedbackRef.current = feedbackKey;

    let cancelled = false;

    async function handleFeedback() {
      if (billingState === "success") {
        setNotice({
          tone: "success",
          title: "Pagamento confirmado",
          message: "Estamos sincronizando sua assinatura premium com o workspace.",
        });

        try {
          await syncBilling();
          if (cancelled) {
            return;
          }

          setNotice({
            tone: "success",
            title: "Assinatura ativa",
            message: "Seu billing foi atualizado e os recursos premium ja estao liberados neste ambiente.",
          });
        } catch (nextError) {
          if (cancelled) {
            return;
          }

          setNotice({
            tone: "error",
            title: "Pagamento recebido, sincronizacao pendente",
            message:
              nextError instanceof Error
                ? nextError.message
                : "Nao foi possivel sincronizar a assinatura agora.",
          });
        } finally {
          if (!cancelled) {
            clearTransientParams(router, pathname, searchParams, [
              "billing",
              "session_id",
              "billing_error",
            ]);
          }
        }

        return;
      }

      if (billingState === "cancel") {
        setNotice({
          tone: "warning",
          title: "Checkout interrompido",
          message: "Nenhuma cobranca foi concluida. Quando quiser, voce pode tentar novamente daqui.",
        });
        clearTransientParams(router, pathname, searchParams, [
          "billing",
          "session_id",
          "billing_error",
        ]);
        return;
      }

      if (billingError) {
        setNotice({
          tone: "error",
          title: "Falha no billing",
          message: billingError,
        });
        clearTransientParams(router, pathname, searchParams, [
          "billing",
          "session_id",
          "billing_error",
        ]);
      }
    }

    void handleFeedback();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, searchKey, searchParams, syncBilling]);

  useEffect(() => {
    const checkoutIntent = parseCheckoutParam(searchParams.get("checkout"));
    if (!checkoutIntent) {
      return;
    }
    const resolvedCheckoutIntent = checkoutIntent;

    if (handledCheckoutRef.current === resolvedCheckoutIntent) {
      return;
    }
    handledCheckoutRef.current = resolvedCheckoutIntent;

    if (resolvedCheckoutIntent === currentPlanCode && hasPaidPlan) {
      setNotice({
        tone: "neutral",
        title: "Plano ja ativo",
        message: `O plano ${currentPlan?.name ?? resolvedCheckoutIntent.toUpperCase()} ja esta ativo nesta conta.`,
      });
      clearTransientParams(router, pathname, searchParams, ["checkout", "returnTo"]);
      return;
    }

    let cancelled = false;

    async function handleCheckoutIntent() {
      try {
        await createCheckout(resolvedCheckoutIntent, checkoutReturnTo);
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setNotice({
          tone: "error",
          title: "Falha ao abrir checkout",
          message:
            nextError instanceof Error
              ? nextError.message
              : "Nao foi possivel abrir o checkout interno agora.",
        });
      } finally {
        if (!cancelled) {
          clearTransientParams(router, pathname, searchParams, ["checkout", "returnTo"]);
        }
      }
    }

    void handleCheckoutIntent();

    return () => {
      cancelled = true;
    };
  }, [
    createCheckout,
    currentPlan?.name,
    currentPlanCode,
    hasPaidPlan,
    pathname,
    router,
    searchKey,
    searchParams,
    checkoutReturnTo,
  ]);

  async function handleRefreshSnapshot() {
    try {
      await refreshBilling();
      setNotice({
        tone: "neutral",
        title: "Snapshot atualizado",
        message: "Os dados de billing foram recarregados a partir do banco atual.",
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Falha ao atualizar snapshot",
        message:
          nextError instanceof Error ? nextError.message : "Nao foi possivel atualizar o billing agora.",
      });
    }
  }

  async function handleSyncStatus() {
    try {
      await syncBilling();
      setNotice({
        tone: "success",
        title: "Status sincronizado",
        message: "O estado da assinatura foi validado novamente com o provider.",
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Falha ao sincronizar status",
        message:
          nextError instanceof Error ? nextError.message : "Nao foi possivel sincronizar a assinatura agora.",
      });
    }
  }

  async function handleOpenPortal() {
    try {
      await openPortal();
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Falha ao abrir portal",
        message:
          nextError instanceof Error ? nextError.message : "Nao foi possivel abrir o portal de assinatura agora.",
      });
    }
  }

  async function handleCancel() {
    if (!hasPaidPlan) {
      return;
    }

    try {
      await cancelSubscription();
      setCancelModalOpen(false);
      setNotice({
        tone: "warning",
        title: "Cancelamento agendado",
        message: "Sua assinatura foi marcada para encerrar no fim do ciclo atual.",
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Falha ao cancelar",
        message:
          nextError instanceof Error ? nextError.message : "Nao foi possivel cancelar a assinatura agora.",
      });
    }
  }

  async function handlePlanSelection(planId: BillingPlanCode) {
    try {
      await createCheckout(planId);
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Falha ao abrir checkout",
        message:
          nextError instanceof Error ? nextError.message : "Nao foi possivel abrir o checkout interno agora.",
      });
    }
  }

  return (
    <PageFrame
      title="Plano e cobrança"
      subtitle="Assinatura, portal, sincronizacao e checkout premium dentro do proprio CodeTrail Web."
      actions={
        <>
          <SecondaryButton onClick={() => void handleRefreshSnapshot()} disabled={refreshing}>
            {isRefreshingSnapshot ? "Atualizando..." : "Atualizar snapshot"}
          </SecondaryButton>
          <PrimaryButton onClick={() => void handleSyncStatus()} disabled={refreshing}>
            {isSyncingStatus ? "Sincronizando..." : "Sincronizar status"}
          </PrimaryButton>
        </>
      }
    >
      <div className="workspace-stack">
        {notice ? (
          <FeedbackMessage
            tone={notice.tone}
            title={notice.title}
            message={notice.message}
            className="sm:px-5"
          />
        ) : null}

        {error && error !== notice?.message ? (
          <FeedbackMessage
            tone="error"
            title="Erro operacional"
            message={error}
            className="sm:px-5"
          />
        ) : null}

        <SectionGrid columns={4}>
          <MetricCard
            label="Plano atual"
            value={currentPlan?.name ?? "Free"}
            helper={currentPlan ? formatCurrencyBrl(currentPlan.price_cents) + billingIntervalLabel(currentPlan.interval) : "R$ 0/mês"}
            icon={<Sparkles size={16} />}
          />
          <MetricCard
            label="Status"
            value={currentStatusLabel}
            helper={billing.subscription?.status_detail ?? "Sem cobranca recorrente"}
            icon={<ShieldCheck size={16} />}
          />
          <MetricCard
            label="Proximo marco"
            value={nextMilestone}
            helper={billing.subscription?.current_period_end ? "Periodo atual" : "Sem ciclo premium"}
            icon={<Clock3 size={16} />}
          />
          <MetricCard
            label="Ultimo pagamento"
            value={latestPayment ? formatCurrencyBrl(latestPayment.amount_cents) : "Sem registro"}
            helper={latestPayment?.paid_at ? formatDateTime(latestPayment.paid_at) : "Nenhum pagamento recente"}
            icon={<CreditCard size={16} />}
          />
        </SectionGrid>

        <DataCard title="Status da assinatura" subtitle="Estado atual do provider e os proximos passos da sua conta.">
          <div className="workspace-stack">
            <div className="workspace-inline-banner">
              <div>
                <strong>
                  {hasPaidPlan
                    ? `${currentPlan?.name ?? "Plano premium"} • ${currentStatusLabel}`
                    : "Sem assinatura premium ativa"}
                </strong>
                <p>
                  {billing.subscription?.cancel_at_period_end
                    ? `O cancelamento ja esta agendado para ${formatDateTime(billing.subscription.current_period_end)}.`
                    : billing.subscription?.current_period_end
                      ? `Seu ciclo atual vai ate ${formatDateTime(billing.subscription.current_period_end)}.`
                      : "Assine um plano premium para liberar billing recorrente e recursos avancados."}
                </p>
              </div>
              <Pill tone={currentStatusTone}>{currentStatusLabel}</Pill>
            </div>

            <div className="workspace-inline-actions">
              <SecondaryButton onClick={() => void handleOpenPortal()} disabled={!hasPaidPlan || refreshing}>
                {isOpeningPortal ? "Abrindo..." : "Gerenciar assinatura"}
              </SecondaryButton>
              <SecondaryButton
                onClick={() => setCancelModalOpen(true)}
                disabled={!hasPaidPlan || refreshing || cancelScheduled}
              >
                {cancelScheduled
                  ? "Cancelamento agendado"
                  : isCancellingPlan
                    ? "Cancelando..."
                    : "Cancelar no fim do ciclo"}
              </SecondaryButton>
            </div>
          </div>
        </DataCard>

        <DataCard title="Planos premium" subtitle="Assine ou troque de plano sem sair do workspace.">
          <SectionGrid columns={2}>
            {paidPlans.map((plan) => {
              const isCurrent = plan.code === currentPlanCode;
              const isLoadingThisPlan = operation?.key === `billing-checkout:${plan.code}`;
              const actionLabel = isCurrent
                ? "Plano atual"
                : currentPlanCode === "free"
                  ? `Assinar ${plan.name}`
                  : `Trocar para ${plan.name}`;

              return (
                <DataCard
                  key={plan.id}
                  title={plan.name}
                  subtitle={plan.description}
                  accent={isCurrent ? "primary" : undefined}
                >
                  <div className="workspace-stack">
                    <strong className="workspace-plan-price">
                      {formatCurrencyBrl(plan.price_cents)}
                      <span>{billingIntervalLabel(plan.interval)}</span>
                    </strong>
                    <div className="workspace-inline-actions">
                      {(plan.features ?? []).slice(0, 5).map((feature) => (
                        <Pill key={feature.feature_key} tone={feature.enabled ? "success" : "neutral"}>
                          {feature.feature_key}
                        </Pill>
                      ))}
                    </div>
                    <PrimaryButton
                      disabled={isCurrent || refreshing}
                      onClick={() => void handlePlanSelection(plan.code)}
                    >
                      {isLoadingThisPlan && !isCurrent ? "Abrindo checkout..." : actionLabel}
                    </PrimaryButton>
                  </div>
                </DataCard>
              );
            })}
          </SectionGrid>
        </DataCard>

        <DataCard title="Historico de pagamentos" subtitle="Ultimas cobrancas confirmadas e links do Stripe quando disponiveis.">
          <div className="workspace-stack">
            {billing.payments.length ? (
              billing.payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="workspace-row-card">
                  <div>
                    <strong>{formatCurrencyBrl(payment.amount_cents)}</strong>
                    <p>
                      {payment.paid_at
                        ? `Pago em ${formatDateTime(payment.paid_at)}`
                        : "Pagamento ainda sem confirmacao final."}
                    </p>
                  </div>
                  <div className="workspace-inline-actions">
                    <Pill tone={getPaymentTone(payment)}>{payment.status}</Pill>
                    {payment.invoice_url ? (
                      <BillingLink href={payment.invoice_url} label="Fatura" icon={<Receipt size={14} />} />
                    ) : null}
                    {payment.receipt_url ? (
                      <BillingLink href={payment.receipt_url} label="Recibo" icon={<ArrowUpRight size={14} />} />
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="workspace-inline-banner">
                <div>
                  <strong>Nenhum pagamento registrado ainda</strong>
                  <p>Quando houver uma cobranca aprovada, ela aparece aqui com links de comprovacao.</p>
                </div>
                <Pill tone="neutral">Aguardando</Pill>
              </div>
            )}
          </div>
        </DataCard>
      </div>

      <BillingCancelModal
        open={cancelModalOpen}
        planName={currentPlan?.name ?? "Plano premium"}
        periodEnd={billing.subscription?.current_period_end}
        submitting={isCancellingPlan}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancel}
      />
    </PageFrame>
  );
}

function BillingLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
    >
      {icon}
      {label}
    </a>
  );
}

function parseCheckoutParam(value: string | null): BillingPlanCode | null {
  if (value === "pro" || value === "founding") {
    return value;
  }

  return null;
}

function clearTransientParams(
  router: { replace: (href: string, options?: { scroll?: boolean }) => void },
  pathname: string,
  searchParams: { toString: () => string },
  keys: string[],
) {
  const nextParams = new URLSearchParams(searchParams.toString());
  keys.forEach((key) => nextParams.delete(key));
  const nextHref = nextParams.size ? `${pathname}?${nextParams.toString()}` : pathname;
  router.replace(nextHref, { scroll: false });
}

function getSubscriptionStatusLabel(status?: string | null, cancelAtPeriodEnd = false) {
  if (!status) {
    return "Sem plano";
  }

  if (cancelAtPeriodEnd) {
    return "Cancelamento agendado";
  }

  switch (status) {
    case "trialing":
      return "Trial ativo";
    case "active":
      return "Ativa";
    case "past_due":
      return "Pagamento pendente";
    case "unpaid":
      return "Nao paga";
    case "canceled":
      return "Cancelada";
    case "expired":
      return "Expirada";
    case "incomplete":
    default:
      return "Em configuracao";
  }
}

function getSubscriptionStatusTone(status?: string | null, cancelAtPeriodEnd = false) {
  if (cancelAtPeriodEnd) {
    return "warning" as const;
  }

  switch (status) {
    case "trialing":
    case "active":
      return "success" as const;
    case "past_due":
    case "incomplete":
      return "warning" as const;
    case "unpaid":
    case "canceled":
    case "expired":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function getNextMilestoneLabel(billing: BillingSnapshot) {
  if (billing.subscription?.cancel_at_period_end && billing.subscription.current_period_end) {
    return formatDateTime(billing.subscription.current_period_end);
  }

  if (billing.subscription?.trial_ends_at) {
    return formatDateTime(billing.subscription.trial_ends_at);
  }

  if (billing.subscription?.current_period_end) {
    return formatDateTime(billing.subscription.current_period_end);
  }

  return "Sem data";
}

function getPaymentTone(payment: BillingPayment) {
  switch (payment.status) {
    case "paid":
      return "success" as const;
    case "open":
    case "draft":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}
