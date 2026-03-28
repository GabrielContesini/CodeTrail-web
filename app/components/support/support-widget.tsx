"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FeedbackMessage, ActionButton, FormField } from "@/app/components/ui/system-primitives";
import {
  createTransition,
  modalVariants,
  useMotionPreferences,
  useStableReducedMotion,
} from "@/app/components/ui/motion-system";
import { createClient, hasSupabaseClientEnv } from "@/utils/supabase/client";
import {
  sanitizeSupportInput,
  SUPPORT_LIMITS,
  validateSupportInput,
  type SupportFieldErrorMap,
  type SupportOrigin,
} from "@/utils/support/shared";
import {
  LifeBuoy,
  LoaderCircle,
  MessageSquareText,
  SendHorizonal,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function SupportWidget({
  origin,
  prefillAuthenticatedUser = false,
}: {
  origin: SupportOrigin;
  prefillAuthenticatedUser?: boolean;
}) {
  const reducedMotion = useStableReducedMotion();
  const { hoverLift, press, transition } = useMotionPreferences();
  const prefillAttemptedRef = useRef(false);
  const initialFocusRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SupportFieldErrorMap>({});
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    title: string;
    message: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    description: "",
  });

  const descriptionRemaining = useMemo(
    () => SUPPORT_LIMITS.description - form.description.length,
    [form.description.length],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget = window.setTimeout(() => {
      initialFocusRef.current?.focus();
    }, 40);

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(focusTarget);
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, submitting]);

  useEffect(() => {
    if (!prefillAuthenticatedUser || prefillAttemptedRef.current || !hasSupabaseClientEnv()) {
      return;
    }

    prefillAttemptedRef.current = true;

    async function loadPrefill() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      let fullName =
        typeof user.user_metadata.full_name === "string"
          ? user.user_metadata.full_name
          : "";

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.full_name) {
          fullName = profile.full_name;
        }
      } catch {
        // Mantem fallback de metadata quando o perfil não estiver disponível.
      }

      setAuthenticated(true);
      setForm((current) => ({
        ...current,
        name: current.name || fullName || "",
        email: current.email || user.email || "",
      }));
    }

    void loadPrefill();
  }, [prefillAuthenticatedUser]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const payload = sanitizeSupportInput({
      ...form,
      origin,
      authenticated,
      pageUrl: window.location.href,
    });
    const validation = validateSupportInput(payload);

    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      setFeedback({
        tone: "error",
        title: "Revise os dados",
        message: "Preencha os campos obrigatórios para enviar sua mensagem.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            error?: string;
            fieldErrors?: SupportFieldErrorMap;
            message?: string;
          }
        | null;

      if (!response.ok) {
        setFieldErrors(result?.fieldErrors ?? {});
        setFeedback({
          tone: "error",
          title: "Não foi possível enviar",
          message:
            result?.error ??
            "O suporte não pôde receber sua mensagem agora. Tente novamente em instantes.",
        });
        return;
      }

      setFieldErrors({});
      setFeedback({
        tone: "success",
        title: "Mensagem enviada",
        message:
          result?.message ??
          "Sua mensagem foi enviada com sucesso. Nosso suporte retornará em breve.",
      });
      setForm((current) => ({
        ...current,
        subject: "",
        description: "",
      }));
    } catch {
      setFeedback({
        tone: "error",
        title: "Falha de conexão",
        message: "Não foi possível conectar ao suporte agora. Tente novamente em instantes.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    if (!submitting) {
      setOpen(false);
    }
  }

  const firstInputKey = form.name ? (form.email ? (form.subject ? "description" : "subject") : "email") : "name";

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={hoverLift}
        whileTap={press}
        transition={transition}
        className="fixed bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-[max(1rem,calc(env(safe-area-inset-right)+0.5rem))] z-[60] inline-flex min-h-[56px] items-center gap-3 rounded-full border border-primary/24 bg-[rgba(9,17,24,0.92)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/40 hover:bg-[rgba(12,22,31,0.96)] hover:shadow-[0_22px_46px_rgba(0,0,0,0.34)]"
        aria-label="Abrir suporte"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/16 bg-primary/12 text-primary">
          <LifeBuoy size={18} />
        </span>
        <span className="hidden sm:inline">Suporte</span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={createTransition(reducedMotion, 0.18)}
          >
            <motion.button
              type="button"
              aria-label="Fechar modal de suporte"
              className="absolute inset-0 bg-background/86 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={createTransition(reducedMotion, 0.18)}
              onClick={closeModal}
            />

            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="support-modal-title"
              className="glass-panel relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden border border-primary/20"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants(reducedMotion)}
            >
              <header className="flex items-start justify-between gap-4 border-b border-border/50 bg-surface/72 px-6 py-5 sm:px-7">
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/24 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    <Sparkles size={13} />
                    Suporte CodeTrail
                  </span>
                  <div>
                    <h2 id="support-modal-title" className="m-0 text-2xl font-display text-white">
                      Fale com o suporte
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      Descreva seu problema e nossa equipe receberá sua mensagem por e-mail.
                    </p>
                  </div>
                </div>

                <ActionButton
                  type="button"
                  variant="ghost"
                  className="!min-h-[40px] !px-3"
                  onClick={closeModal}
                  disabled={submitting}
                  aria-label="Fechar suporte"
                >
                  <X size={16} />
                </ActionButton>
              </header>

              <div className="overflow-y-auto px-6 py-6 sm:px-7 sm:py-7">
                <div className="flex flex-col gap-5">
                  {feedback ? (
                    <FeedbackMessage
                      tone={feedback.tone}
                      title={feedback.title}
                      message={feedback.message}
                    />
                  ) : null}

                  <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                    <FormField label="Nome">
                      <input
                        ref={
                          firstInputKey === "name"
                            ? (node) => {
                                initialFocusRef.current = node;
                              }
                            : undefined
                        }
                        name="name"
                        value={form.name}
                        onChange={(event) => updateField("name", event.target.value)}
                        maxLength={SUPPORT_LIMITS.name}
                        placeholder="Seu nome"
                        className="input-shell"
                        aria-invalid={Boolean(fieldErrors.name)}
                      />
                      {fieldErrors.name ? (
                        <span className="text-xs text-danger">{fieldErrors.name}</span>
                      ) : null}
                    </FormField>

                    <FormField label="E-mail">
                      <input
                        ref={
                          firstInputKey === "email"
                            ? (node) => {
                                initialFocusRef.current = node;
                              }
                            : undefined
                        }
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        maxLength={SUPPORT_LIMITS.email}
                        placeholder="voce@codetrail.site"
                        className="input-shell"
                        aria-invalid={Boolean(fieldErrors.email)}
                      />
                      {fieldErrors.email ? (
                        <span className="text-xs text-danger">{fieldErrors.email}</span>
                      ) : null}
                    </FormField>

                    <FormField label="Assunto">
                      <input
                        ref={
                          firstInputKey === "subject"
                            ? (node) => {
                                initialFocusRef.current = node;
                              }
                            : undefined
                        }
                        name="subject"
                        value={form.subject}
                        onChange={(event) => updateField("subject", event.target.value)}
                        maxLength={SUPPORT_LIMITS.subject}
                        placeholder="Ex.: problema no checkout, erro no login, bug visual"
                        className="input-shell"
                        aria-invalid={Boolean(fieldErrors.subject)}
                      />
                      {fieldErrors.subject ? (
                        <span className="text-xs text-danger">{fieldErrors.subject}</span>
                      ) : null}
                    </FormField>

                    <FormField
                      label="Descrição do problema"
                      helper={`${descriptionRemaining} caracteres restantes.`}
                    >
                      <textarea
                        ref={
                          firstInputKey === "description"
                            ? (node) => {
                                initialFocusRef.current = node;
                              }
                            : undefined
                        }
                        name="description"
                        value={form.description}
                        onChange={(event) => updateField("description", event.target.value)}
                        maxLength={SUPPORT_LIMITS.description}
                        placeholder="Conte o que aconteceu, onde estava na interface e o que esperava que acontecesse."
                        className="input-shell min-h-[160px] resize-y"
                        aria-invalid={Boolean(fieldErrors.description)}
                      />
                      {fieldErrors.description ? (
                        <span className="text-xs text-danger">{fieldErrors.description}</span>
                      ) : null}
                    </FormField>

                    <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
                      <ActionButton
                        type="button"
                        variant="ghost"
                        onClick={closeModal}
                        disabled={submitting}
                      >
                        Fechar
                      </ActionButton>
                      <ActionButton type="submit" disabled={submitting}>
                        {submitting ? (
                          <>
                            <LoaderCircle size={16} className="animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            Enviar mensagem
                            <SendHorizonal size={16} />
                          </>
                        )}
                      </ActionButton>
                    </div>
                  </form>

                  <div className="rounded-[22px] border border-border/70 bg-white/[0.03] px-4 py-4 text-sm leading-relaxed text-text-secondary">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-primary/16 bg-primary/10 text-primary">
                        <MessageSquareText size={16} />
                      </span>
                      <div>
                        <strong className="block text-white">Sua mensagem vai direto para o suporte oficial</strong>
                        <p className="m-0 mt-1">
                          Incluímos origem da solicitação, página atual, data/hora e contexto técnico básico para agilizar o atendimento.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
