"use client";

import {
  createTransition,
  fadeUpVariants,
  useMotionPreferences,
  useStableReducedMotion,
} from "@/app/components/ui/motion-system";
import { FeedbackMessage } from "@/app/components/ui/system-primitives";
import { createClient, hasSupabaseClientEnv } from "@/utils/supabase/client";
import {
  sanitizeSupportInput,
  SUPPORT_LIMITS,
  validateSupportInput,
  type SupportFieldErrorMap,
  type SupportOrigin,
} from "@/utils/support/shared";
import { AnimatePresence, motion } from "framer-motion";
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
        initial="hidden"
        animate="visible"
        whileHover={hoverLift}
        whileTap={press}
        variants={{
          hidden: { y: 20, opacity: 0 },
          visible: { y: 0, opacity: 1, transition: { delay: 0.5, ...transition } }
        }}
        className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1.5rem))] right-[max(1.5rem,calc(env(safe-area-inset-right)+1.5rem))] z-[60] workspace-button workspace-button--secondary !rounded-full !px-2 !py-2 !pr-5 !min-h-[48px] !gap-3 shadow-[0_0_25px_rgba(129,236,255,0.12)] hover:shadow-[0_0_35px_rgba(129,236,255,0.25)] hover:!border-primary/50"
        aria-label="Abrir suporte"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
          <LifeBuoy size={16} />
        </span>
        <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.18em]">Suporte CT</span>
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
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
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
              className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col glass-panel !rounded-2xl overflow-hidden shadow-2xl"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeUpVariants(reducedMotion, 12)}
            >
              <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

              <header className="flex items-start justify-between gap-4 border-b border-outline-variant/10 px-6 py-6 sm:px-8 relative z-10">
                <div className="flex flex-col gap-2">
                  <span className="inline-flex w-fit items-center gap-2 rounded text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
                    <Sparkles size={12} />
                    Central de Atendimento
                  </span>
                  <div>
                    <h2 id="support-modal-title" className="text-2xl font-display font-bold tracking-tight text-white">
                      Suporte CodeTrail
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                      Descreva seu problema e nossa equipe receberá sua mensagem por e-mail.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-full w-9 h-9 flex items-center justify-center border border-outline-variant/10 hover:bg-white/5 text-on-surface-variant hover:text-white transition-colors"
                  onClick={closeModal}
                  disabled={submitting}
                  aria-label="Fechar suporte"
                >
                  <X size={16} />
                </button>
              </header>

              <div className="overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 relative z-10">
                <div className="flex flex-col gap-6">
                  {feedback ? (
                    <FeedbackMessage
                      tone={feedback.tone}
                      title={feedback.title}
                      message={feedback.message}
                    />
                  ) : null}

                  <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    <label className="workspace-label">
                      <span>Seu Nome</span>
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
                        placeholder="Ex: João da Silva"
                        className="input-shell"
                        aria-invalid={Boolean(fieldErrors.name)}
                      />
                      {fieldErrors.name ? (
                        <span className="text-xs text-error font-bold">{fieldErrors.name}</span>
                      ) : null}
                    </label>

                    <label className="workspace-label">
                      <span>Endereço de E-mail</span>
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
                        <span className="text-xs text-error font-bold">{fieldErrors.email}</span>
                      ) : null}
                    </label>

                    <label className="workspace-label">
                      <span>Assunto Principal</span>
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
                        <span className="text-xs text-error font-bold">{fieldErrors.subject}</span>
                      ) : null}
                    </label>

                    <label className="workspace-label">
                      <div className="flex items-center justify-between">
                        <span>Descrição do Problema</span>
                        <span className="text-[10px] text-on-surface-variant">{descriptionRemaining} restantes</span>
                      </div>
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
                        placeholder="Conte o que aconteceu, em qual área do sistema você estava e o que esperava que ocorresse."
                        className="input-shell min-h-[160px] resize-y"
                        aria-invalid={Boolean(fieldErrors.description)}
                      />
                      {fieldErrors.description ? (
                        <span className="text-xs text-error font-bold">{fieldErrors.description}</span>
                      ) : null}
                    </label>

                    <div className="flex flex-col gap-3 border-t border-outline-variant/10 pt-6 sm:flex-row sm:justify-end mt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={submitting}
                        className="workspace-button workspace-button--secondary !rounded-[var(--radius-field)]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="workspace-button workspace-button--primary !rounded-[var(--radius-field)]"
                      >
                        {submitting ? (
                          <>
                            <LoaderCircle size={16} className="animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            Enviar Ticket
                            <SendHorizonal size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-4 text-sm text-on-surface-variant mt-2 flex items-start gap-4">
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                      <MessageSquareText size={14} />
                    </span>
                    <div>
                      <strong className="block text-white mb-1">Rastreamento Técnico Automático</strong>
                      <p className="m-0 text-xs leading-relaxed">
                        Incluímos a área da solicitação e contexto do seu ambiente para agilizar o suporte. Fique tranquilo, não enviamos senhas nem tokens seguros da sua sessão.
                      </p>
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
