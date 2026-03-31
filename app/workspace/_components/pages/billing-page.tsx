"use client";

import { BillingCancelModal } from "@/app/workspace/_components/pages/billing-cancel-modal";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { MetricCard } from "@/app/workspace/_components/workspace-ui";
import { fadeUpVariants, useMotionPreferences } from "@/app/components/ui/motion-system";
import { normalizeCheckoutReturnUrl } from "@/utils/auth/oauth";
import { motion } from "framer-motion";
import {
    billingIntervalLabel,
    emptyBillingSnapshot,
    formatCurrencyBrl,
    formatDateTime,
    planCode,
} from "@/utils/workspace/helpers";
import type {
    BillingPayment,
    BillingPlan,
    BillingPlanCode,
    BillingSnapshot,
} from "@/utils/workspace/types";
import { ArrowUpRight, Check, Receipt, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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
  const { reduced } = useMotionPreferences();
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
  const hasPaidPlan =
    currentPlanCode !== "free" && Boolean(billing.subscription);
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
  const checkoutReturnTo = normalizeCheckoutReturnUrl(
    searchParams.get("returnTo"),
  );
  const isRefreshingSnapshot = operation?.key === "billing-refresh";
  const isSyncingStatus = operation?.key === "billing-sync";
  const isOpeningPortal = operation?.key === "billing-portal";
  const isCancellingPlan = operation?.key === "billing-cancel";
  const cancelScheduled = billing.subscription?.cancel_at_period_end ?? false;
  const fallbackFreePlan = emptyBillingSnapshot().current_plan!;
  const freePlan =
    currentPlanCode === "free"
      ? (billing.current_plan ?? fallbackFreePlan)
      : fallbackFreePlan;
  const matrixCurrentPlan = currentPlan ?? fallbackFreePlan;
  const planMatrix = buildPlanMatrix(
    freePlan,
    paidPlans,
    matrixCurrentPlan,
    currentPlanCode,
  );

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
          message:
            "Estamos sincronizando sua assinatura premium com o workspace.",
        });

        try {
          await syncBilling();
          if (cancelled) {
            return;
          }

          setNotice({
            tone: "success",
            title: "Assinatura ativa",
            message:
              "Seu billing foi atualizado e os recursos premium ja estao liberados neste ambiente.",
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
          message:
            "Nenhuma cobranca foi concluida. Quando quiser, voce pode tentar novamente daqui.",
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
      clearTransientParams(router, pathname, searchParams, [
        "checkout",
        "returnTo",
      ]);
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
          clearTransientParams(router, pathname, searchParams, [
            "checkout",
            "returnTo",
          ]);
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
        message:
          "Os dados de billing foram recarregados a partir do banco atual.",
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Falha ao atualizar snapshot",
        message:
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel atualizar o billing agora.",
      });
    }
  }

  async function handleSyncStatus() {
    try {
      await syncBilling();
      setNotice({
        tone: "success",
        title: "Status sincronizado",
        message:
          "O estado da assinatura foi validado novamente com o provider.",
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Falha ao sincronizar status",
        message:
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel sincronizar a assinatura agora.",
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
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel abrir o portal de assinatura agora.",
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
        message:
          "Sua assinatura foi marcada para encerrar no fim do ciclo atual.",
      });
    } catch (nextError) {
      setNotice({
        tone: "error",
        title: "Falha ao cancelar",
        message:
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel cancelar a assinatura agora.",
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
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel abrir o checkout interno agora.",
      });
    }
  }

  return (
    <>
      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reduced, 18)}
        className="w-full max-w-7xl mx-auto space-y-8"
      >
        {/* Page Header */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-8 bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                Faturamento e Planos
              </span>
            </div>
            <h1 className="mb-2 text-5xl font-black tracking-tighter text-on-surface">
              Plano e Cobrança
            </h1>
            <p className="max-w-md text-on-surface-variant text-sm">
              Gerencie sua assinatura, planos disponíveis e histórico de
              pagamentos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleRefreshSnapshot()}
              disabled={refreshing}
              className="rounded-full border border-outline-variant/30 px-6 py-2.5 text-sm font-medium text-on-surface transition-all hover:bg-surface-bright"
            >
              {isRefreshingSnapshot ? "Atualizando..." : "Atualizar"}
            </button>
            <button
              onClick={() => void handleSyncStatus()}
              disabled={refreshing}
              className="rounded-full bg-gradient-to-br from-primary to-primary-container px-6 py-2.5 text-sm font-bold text-on-primary-fixed shadow-[0_0_20px_rgba(129,236,255,0.3)] transition-all hover:scale-102 active:scale-95"
            >
              {isSyncingStatus ? "Sincronizando..." : "Sincronizar"}
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        <div className="mb-8 flex flex-col gap-4">
          {notice && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm font-medium ${notice.tone === "success" ? "border-success/50 bg-success/10 text-success" : notice.tone === "warning" ? "border-warning/50 bg-warning/10 text-warning" : notice.tone === "error" ? "border-error/50 bg-error/10 text-error" : "border-primary/50 bg-primary/10 text-primary"}`}
            >
              <strong>{notice.title}:</strong> {notice.message}
            </div>
          )}
          {error && error !== notice?.message && (
            <div className="rounded-lg border border-error/50 bg-error/10 px-4 py-3 text-sm font-medium text-error">
              <strong>Erro:</strong> {error}
            </div>
          )}
        </div>

        {/* Hero Banner & Status */}
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-surface-container p-8 lg:col-span-7">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-[100px]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-highest px-3 py-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    ELEVE SUA PRODUTIVIDADE
                  </span>
                </div>
                <h2 className="mb-4 text-4xl font-black tracking-tighter sm:text-5xl">
                  Domine a{" "}
                  <span className="bg-gradient-to-r from-primary to-[#00e3fd] bg-clip-text text-transparent">
                    Fronteira Digital
                  </span>
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">
                  Escolha a arquitetura que acompanha sua ambição. O faturamento
                  continua conectado ao mesmo backend, checkout interno e status
                  sincronizado.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-white/5 bg-surface-container p-8 lg:col-span-5">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  Assinatura Ativa
                </p>
                <span
                  className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${currentStatusTone === "success" ? "bg-success/10 text-success" : currentStatusTone === "warning" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}
                >
                  {currentStatusLabel}
                </span>
              </div>
              <h3 className="mt-2 text-3xl font-bold text-white">
                {hasPaidPlan
                  ? (currentPlan?.name ?? "Premium")
                  : "Sem Plano Ativo"}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
                {billing.subscription?.cancel_at_period_end
                  ? `Cancelamento agendado para ${formatDateTime(billing.subscription.current_period_end)}.`
                  : billing.subscription?.current_period_end
                    ? `Ciclo atual vai ate ${formatDateTime(billing.subscription.current_period_end)}.`
                    : "Assine um plano premium para liberar recursos avancados."}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row shadow-sm">
              <button
                onClick={() => void handleOpenPortal()}
                disabled={!hasPaidPlan || refreshing}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-bold transition-all hover:bg-white/10 disabled:opacity-50"
              >
                {isOpeningPortal ? "ABRINDO..." : "GERENCIAR"}
              </button>
              <button
                onClick={() => setCancelModalOpen(true)}
                disabled={!hasPaidPlan || refreshing || cancelScheduled}
                className="flex-1 rounded-lg border border-error/20 bg-error/10 py-2.5 text-xs font-bold text-error transition-all hover:bg-error/20 disabled:opacity-50"
              >
                {cancelScheduled
                  ? "AGENDADO"
                  : isCancellingPlan
                    ? "CANCELANDO"
                    : "CANCELAR"}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            label="Plano Atual"
            value={currentPlan?.name ?? "Free"}
            helper={
              currentPlan
                ? formatCurrencyBrl(currentPlan.price_cents) +
                  billingIntervalLabel(currentPlan.interval)
                : "R$ 0/mês"
            }
          />
          <MetricCard
            label="Status"
            value={currentStatusLabel}
            helper={
              billing.subscription?.status_detail ?? "Sem cobranca recorrente"
            }
          />
          <MetricCard
            label="Próximo Marco"
            value={nextMilestone}
            helper={
              billing.subscription?.current_period_end
                ? "Periodo atual"
                : "Sem ciclo"
            }
          />
          <MetricCard
            label="Último Pgt"
            value={
              latestPayment
                ? formatCurrencyBrl(latestPayment.amount_cents)
                : "Sem registro"
            }
            helper={
              latestPayment?.paid_at
                ? formatDateTime(latestPayment.paid_at)
                : "Nenhum pagamento"
            }
          />
        </div>

        {/* Pricing Tiers */}
        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {paidPlans.map((plan, index) => {
            const isCurrent = plan.code === currentPlanCode;
            const isLoadingThisPlan =
              operation?.key === `billing-checkout:${plan.code}`;
            const actionLabel = isCurrent
              ? "Plano Atual"
              : currentPlanCode === "free"
                ? `Assinar ${plan.name}`
                : `Mudar para ${plan.name}`;

            if (index === 0) {
              // Tier 1 (Pro Access style - 5 cols)
              return (
                <div
                  key={plan.id}
                  className="group relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container p-8 lg:col-span-5"
                >
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10"></div>
                  <div className="mb-8">
                    <h3 className="mb-2 text-2xl font-bold uppercase">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-on-surface-variant font-medium">
                      {plan.description}
                    </p>
                  </div>
                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="text-4xl font-black">
                      {formatCurrencyBrl(plan.price_cents)}
                    </span>
                    <span className="text-sm font-medium uppercase text-on-surface-variant">
                      {billingIntervalLabel(plan.interval)}
                    </span>
                  </div>
                  <ul className="mb-10 space-y-4">
                    {(plan.features ?? []).slice(0, 5).map((feature) => (
                      <li
                        key={feature.feature_key}
                        className="flex items-center gap-3 text-sm text-on-surface"
                      >
                        <Check
                          size={16}
                          className={
                            feature.enabled
                              ? "text-primary"
                              : "text-on-surface-variant/30"
                          }
                        />
                        <span
                          className={
                            feature.enabled
                              ? ""
                              : "text-on-surface-variant/50 line-through"
                          }
                        >
                          {featureLabel(
                            feature.feature_key,
                            feature.limit_value,
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => void handlePlanSelection(plan.code)}
                    disabled={isCurrent || refreshing}
                    className="w-full rounded-full border border-outline-variant bg-surface-container-highest py-4 text-sm font-bold tracking-widest text-on-surface transition-all hover:bg-surface-bright active:scale-95 disabled:opacity-50"
                  >
                    {isLoadingThisPlan && !isCurrent
                      ? "PROCESSANDO..."
                      : actionLabel}
                  </button>
                  {isCurrent && (
                    <div className="absolute right-0 top-0 m-4 rounded bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                      ATUAL
                    </div>
                  )}
                </div>
              );
            } else {
              // Tier 2 (Elite Tier style - 7 cols)
              return (
                <div
                  key={plan.id}
                  className="relative overflow-hidden rounded-xl border border-primary/20 bg-[#1a1a1a] p-10 shadow-[0_0_50px_rgba(129,236,255,0.1)] lg:col-span-7"
                >
                  {!isCurrent && (
                    <div className="absolute right-6 top-6">
                      <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-1 shadow-[0_0_10px_rgba(129,236,255,0.4)]">
                        <span className="text-[10px] font-black tracking-widest text-on-primary-fixed uppercase">
                          PLANO ELITE
                        </span>
                      </div>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute right-6 top-6">
                      <div className="flex items-center gap-2 rounded-full bg-success/20 px-4 py-1 text-success">
                        <span className="text-[10px] font-black tracking-widest">
                          PLANO ATIVO
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mb-10">
                    <div className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-primary">
                      {plan.name}
                    </div>
                    <h3 className="mb-4 text-4xl font-black uppercase">
                      Founding_Member
                    </h3>
                    <p className="max-w-md text-sm text-on-surface-variant font-medium">
                      {plan.description}
                    </p>
                  </div>
                  <div className="mb-12 grid gap-10 md:grid-cols-2">
                    <div className="space-y-6">
                      {(plan.features ?? []).slice(0, 2).map((feature) => (
                        <div
                          key={feature.feature_key}
                          className="flex flex-col gap-1"
                        >
                          <div className="flex items-center gap-2 text-sm font-bold text-primary">
                            <Sparkles size={16} />
                            <span className="uppercase">
                              {featureLabel(
                                feature.feature_key,
                                feature.limit_value,
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col items-end justify-end">
                      <div className="text-right">
                        <div className="mb-1 text-5xl font-black tracking-tighter text-white">
                          {formatCurrencyBrl(plan.price_cents)}
                        </div>
                        <div className="text-[10px] font-bold tracking-widest text-primary uppercase">
                          {billingIntervalLabel(plan.interval).replace(
                            "/",
                            "/POR ",
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => void handlePlanSelection(plan.code)}
                    disabled={isCurrent || refreshing}
                    className="w-full rounded-full bg-gradient-to-r from-primary to-primary-container py-5 text-base font-black tracking-widest text-on-primary-fixed shadow-[0_0_20px_rgba(0,227,253,0.3)] transition-all hover:scale-102 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isLoadingThisPlan && !isCurrent
                      ? "PROCESSANDO..."
                      : actionLabel}
                  </button>
                </div>
              );
            }
          })}
        </div>

        {/* Feature Matrix Table */}
        <section className="mb-24">
          <h2 className="mb-8 text-3xl font-bold text-center">
            Matriz de Funcionalidades
          </h2>
          <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="border-b border-outline-variant/10 p-6 text-xs font-black tracking-widest text-on-surface-variant">
                    Funcionalidade
                  </th>
                  {planMatrix.map((plan) => (
                    <th
                      key={plan.code}
                      className={`border-b border-outline-variant/10 p-6 text-center text-xs font-black tracking-widest uppercase ${
                        plan.code === currentPlanCode
                          ? "text-primary"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {plan.code === "founding" ? (
                        <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                          {plan.name}
                        </span>
                      ) : (
                        plan.name
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                {featureMatrixRows(planMatrix).map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-outline-variant/5"
                  >
                    <td className="p-6 font-medium text-on-surface-variant">
                      {row.label}
                    </td>
                    {row.values.map((value, index) => {
                      const isBloqueado =
                        value === "Bloqueado" || value === "N/A";
                      const isIncluido = value === "Incluido";
                      return (
                        <td
                          key={`${row.key}-${index}`}
                          className="p-6 text-center"
                        >
                          {isBloqueado ? (
                            <span
                              className="material-symbols-outlined text-error/40 flex justify-center"
                              style={{
                                fontVariationSettings:
                                  "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                              }}
                            >
                              close
                            </span>
                          ) : isIncluido ? (
                            <span
                              className="material-symbols-outlined text-primary flex justify-center"
                              style={{
                                fontVariationSettings:
                                  "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                              }}
                            >
                              check_circle
                            </span>
                          ) : (
                            <span className="font-bold text-on-surface-variant">
                              {value}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment History */}
        <section className="mb-24">
          <h2 className="mb-8 text-2xl font-bold">Histórico de Pagamentos</h2>
          <div className="grid gap-3">
            {billing.payments.length ? (
              billing.payments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col items-center justify-between gap-4 rounded-xl border border-white/5 bg-surface-container-low p-4 sm:flex-row transition-colors hover:bg-surface-container"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest">
                      <Receipt size={18} className="text-on-surface-variant" />
                    </div>
                    <div>
                      <strong className="block text-lg">
                        {formatCurrencyBrl(payment.amount_cents)}
                      </strong>
                      <p className="text-xs text-on-surface-variant">
                        {payment.paid_at
                          ? `Pago em ${formatDateTime(payment.paid_at)}`
                          : "Aguardando confirmacao"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${payment.status === "paid" || payment.status === "succeeded" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}
                    >
                      {payment.status}
                    </span>
                    {payment.invoice_url && (
                      <a
                        href={payment.invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-on-surface-variant hover:text-white transition-colors"
                        title="Invoice"
                      >
                        <ArrowUpRight size={16} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-surface-container py-12">
                <Receipt size={32} className="mb-3 opacity-20" />
                <p className="text-sm text-on-surface-variant">
                  Nenhum pagamento registrado ainda.
                </p>
              </div>
            )}
          </div>
        </section>
      </motion.main>

      <BillingCancelModal
        open={cancelModalOpen}
        planName={currentPlan?.name ?? "Plano premium"}
        periodEnd={billing.subscription?.current_period_end}
        submitting={isCancellingPlan}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancel}
      />
    </>
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
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1]"
    >
      {icon}
      {label}
    </a>
  );
}

function HeroStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[24px] border border-border/60 bg-black/10 px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
        {label}
      </p>
      <strong className="mt-3 block font-display text-2xl font-black text-white">
        {value}
      </strong>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {helper}
      </p>
    </div>
  );
}

function buildPlanMatrix(
  freePlan: NonNullable<BillingSnapshot["current_plan"]>,
  paidPlans: BillingSnapshot["available_plans"],
  currentPlan: BillingPlan,
  currentPlanCode: BillingPlanCode,
) {
  const catalog = new Map<
    BillingPlanCode,
    NonNullable<BillingSnapshot["current_plan"]>
  >();
  catalog.set("free", freePlan);

  for (const plan of paidPlans) {
    catalog.set(plan.code, plan);
  }

  if (!catalog.has(currentPlanCode)) {
    catalog.set(currentPlanCode, currentPlan);
  }

  return ["free", "pro", "founding"]
    .map((code) => catalog.get(code as BillingPlanCode))
    .filter((plan): plan is NonNullable<BillingSnapshot["current_plan"]> =>
      Boolean(plan),
    );
}

function featureMatrixRows(
  plans: Array<NonNullable<BillingSnapshot["current_plan"]>>,
) {
  const labels = new Map<string, string>();

  plans.forEach((plan) => {
    (plan.features ?? []).forEach((feature) => {
      if (!labels.has(feature.feature_key)) {
        labels.set(
          feature.feature_key,
          featureLabel(feature.feature_key, null),
        );
      }
    });
  });

  return Array.from(labels.entries()).map(([key, label]) => ({
    key,
    label,
    values: plans.map((plan) => {
      const feature = (plan.features ?? []).find(
        (item) => item.feature_key === key,
      );
      if (!feature) {
        return "N/A";
      }
      if (!feature.enabled) {
        return "Bloqueado";
      }
      if (feature.limit_value !== null && feature.limit_value !== undefined) {
        return String(feature.limit_value);
      }
      return "Incluido";
    }),
  }));
}

function featureLabel(featureKey: string, limitValue: number | null) {
  switch (featureKey) {
    case "notes_access":
      return "Acesso a notas";
    case "flashcards_access":
      return "Acesso a flashcards";
    case "mind_maps_access":
      return "Acesso a mind maps";
    case "analytics_access":
      return "Analytics detalhado";
    case "ai_generation":
      return "Geração com IA";
    case "notes_limit":
      return `Limite de notas${limitValue ? ` (${limitValue})` : ""}`;
    case "projects_limit":
      return `Limite de projetos${limitValue ? ` (${limitValue})` : ""}`;
    case "flashcards_limit":
      return `Limite de flashcards${limitValue ? ` (${limitValue})` : ""}`;
    case "mind_maps_limit":
      return `Limite de mind maps${limitValue ? ` (${limitValue})` : ""}`;
    default:
      return featureKey.replace(/_/g, " ");
  }
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
  const nextHref = nextParams.size
    ? `${pathname}?${nextParams.toString()}`
    : pathname;
  router.replace(nextHref, { scroll: false });
}

function getSubscriptionStatusLabel(
  status?: string | null,
  cancelAtPeriodEnd = false,
) {
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

function getSubscriptionStatusTone(
  status?: string | null,
  cancelAtPeriodEnd = false,
) {
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
  if (
    billing.subscription?.cancel_at_period_end &&
    billing.subscription.current_period_end
  ) {
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
