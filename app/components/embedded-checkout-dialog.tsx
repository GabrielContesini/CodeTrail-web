"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/app/workspace/_components/workspace-ui";
import {
  createTransition,
  modalVariants,
  useStableReducedMotion,
} from "@/app/components/ui/motion-system";
import { fetchBillingClientConfig } from "@/utils/workspace/api";
import {
  loadStripe,
  type Stripe,
  type StripeEmbeddedCheckout,
  type StripeEmbeddedCheckoutOptions,
} from "@stripe/stripe-js";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MutableRefObject } from "react";

type EmbeddedCheckoutStage =
  | "booting"
  | "ready"
  | "processing"
  | "complete"
  | "error";

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

type StripeWithEmbeddedCheckout = Stripe & {
  createEmbeddedCheckoutPage: (
    options: StripeEmbeddedCheckoutOptions,
  ) => Promise<StripeEmbeddedCheckout>;
};

export function EmbeddedCheckoutDialog({
  open,
  clientSecret,
  planLabel,
  subtitle,
  successTitle,
  successMessage,
  processingMessage,
  onClose,
  onCheckoutComplete,
  onAfterSuccess,
  successDelayMs = 2400,
}: {
  open: boolean;
  clientSecret: string | null;
  planLabel: string;
  subtitle: string;
  successTitle: string;
  successMessage: string;
  processingMessage: string;
  onClose: () => void;
  onCheckoutComplete: () => Promise<void>;
  onAfterSuccess?: () => void;
  successDelayMs?: number;
}) {
  const router = useRouter();
  const reducedMotion = useStableReducedMotion();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null);
  const onCheckoutCompleteRef = useRef(onCheckoutComplete);
  const onAfterSuccessRef = useRef(onAfterSuccess);
  const [stage, setStage] = useState<EmbeddedCheckoutStage>("booting");
  const [error, setError] = useState("");

  useEffect(() => {
    onCheckoutCompleteRef.current = onCheckoutComplete;
  }, [onCheckoutComplete]);

  useEffect(() => {
    onAfterSuccessRef.current = onAfterSuccess;
  }, [onAfterSuccess]);

  useEffect(() => {
    if (!open || !clientSecret) {
      destroyCheckout(checkoutRef);
      setStage("booting");
      setError("");
      return;
    }

    const resolvedClientSecret = clientSecret;
    let cancelled = false;

    async function bootstrap() {
      setStage("booting");
      setError("");
      destroyCheckout(checkoutRef);

      try {
        const { publishableKey } = await fetchBillingClientConfig();
        const stripe = await getStripe(publishableKey);

        if (!stripe) {
          throw new Error("Nao foi possivel iniciar o Stripe nesta sessao.");
        }

        const checkout = await (stripe as StripeWithEmbeddedCheckout).createEmbeddedCheckoutPage({
          fetchClientSecret: async () => resolvedClientSecret,
          onComplete: async () => {
            if (cancelled) {
              return;
            }

            setStage("processing");
            setError("");

            try {
              await onCheckoutCompleteRef.current();

              if (cancelled) {
                return;
              }

              setStage("complete");
              await sleep(successDelayMs);

              if (cancelled) {
                return;
              }

              onClose();
              onAfterSuccessRef.current?.();
            } catch (nextError) {
              if (cancelled) {
                return;
              }

              setError(
                nextError instanceof Error
                  ? nextError.message
                  : "Nao foi possivel confirmar a assinatura agora.",
              );
              setStage("error");
            }
          },
        });

        if (cancelled) {
          checkout.destroy();
          return;
        }

        if (!mountRef.current) {
          checkout.destroy();
          throw new Error("Checkout mount container is missing.");
        }

        checkoutRef.current = checkout;
        checkout.mount(mountRef.current);
        setStage("ready");
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Nao foi possivel carregar o checkout embutido.",
        );
        setStage("error");
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      destroyCheckout(checkoutRef);
    };
  }, [clientSecret, onClose, open, successDelayMs]);

  if (!open) {
    return null;
  }

  const closeDisabled = stage === "processing" || stage === "complete";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={createTransition(reducedMotion, 0.18)}
      >
        <motion.div
          className="absolute inset-0 bg-background/85 backdrop-blur-md"
          onClick={() => !closeDisabled && onClose()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={createTransition(reducedMotion, 0.18)}
        />
        <motion.div
          className="glass-panel relative z-10 flex h-[min(92vh,860px)] w-full max-w-6xl flex-col overflow-hidden border border-primary/20"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants(reducedMotion)}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border/50 bg-surface/70 px-6 py-5">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="inline-flex w-fit items-center gap-2 border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                <ShieldCheck size={14} />
                Checkout interno
              </span>
              <div>
                <h2 className="m-0 text-xl font-display text-white">
                  {planLabel}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {subtitle}
                </p>
              </div>
            </div>
            <GhostButton type="button" onClick={onClose} disabled={closeDisabled}>
              Fechar
            </GhostButton>
          </header>

          <div className="relative flex min-h-0 flex-1 bg-background/40">
            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
              <motion.div
                ref={mountRef}
                className="min-h-[620px] rounded-[28px] border border-border/40 bg-white"
                layout
              />
            </div>

            <AnimatePresence>
              {stage !== "ready" ? (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-background/88 px-6 text-center backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={createTransition(reducedMotion, 0.18)}
                >
                  <motion.div
                    className="flex max-w-lg flex-col items-center gap-4"
                    initial={{ opacity: 0, y: 10, scale: reducedMotion ? 1 : 0.988 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: reducedMotion ? 1 : 0.992 }}
                    transition={createTransition(reducedMotion, 0.22)}
                  >
                    {stage === "complete" ? (
                      <CheckCircle2 size={44} className="text-success" />
                    ) : (
                      <LoaderCircle
                        size={40}
                        className={`text-primary ${stage === "error" ? "" : "animate-spin"}`}
                      />
                    )}

                    <div className="flex flex-col gap-2">
                      <strong className="text-2xl font-display text-white">
                        {stage === "complete"
                          ? successTitle
                          : stage === "error"
                            ? "Nao foi possivel concluir agora"
                            : stage === "processing"
                              ? "Confirmando sua assinatura"
                              : "Preparando o checkout"}
                      </strong>
                      <p className="text-sm leading-relaxed text-text-secondary">
                        {stage === "complete"
                          ? successMessage
                          : stage === "error"
                            ? error
                            : stage === "processing"
                              ? processingMessage
                              : "Carregando o ambiente seguro de pagamento dentro do sistema."}
                      </p>
                    </div>

                    {stage === "error" ? (
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <SecondaryButton type="button" onClick={onClose}>
                          Fechar
                        </SecondaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={() => {
                            onClose();
                            router.push("/workspace/settings/billing");
                          }}
                        >
                          Ir para billing
                        </PrimaryButton>
                      </div>
                    ) : null}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function destroyCheckout(
  checkoutRef: MutableRefObject<StripeEmbeddedCheckout | null>,
) {
  checkoutRef.current?.destroy();
  checkoutRef.current = null;
}

function getStripe(publishableKey: string) {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }

  return stripePromiseCache.get(publishableKey)!;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
