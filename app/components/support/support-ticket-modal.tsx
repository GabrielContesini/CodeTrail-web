"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, SendHorizonal, X } from "lucide-react";
import { modalVariants } from "@/app/components/ui/motion-system";
import type { SupportFieldErrorMap } from "@/utils/support/shared";
import type { FormEvent } from "react";

interface SupportWidgetFeedback {
  tone: "success" | "error";
  title: string;
  message: string;
}

interface SupportFormState {
  name: string;
  email: string;
  subject: string;
  description: string;
}

export function SupportTicketModal({
  open,
  reducedMotion,
  submitting,
  form,
  fieldErrors,
  feedback,
  chatFallbackNotice,
  onClose,
  onSubmit,
  onUpdateField,
}: {
  open: boolean;
  reducedMotion: boolean;
  submitting: boolean;
  form: SupportFormState;
  fieldErrors: SupportFieldErrorMap;
  feedback: SupportWidgetFeedback | null;
  chatFallbackNotice: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateField: (field: keyof SupportFormState, value: string) => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {open ? (
        <>
          <motion.div
            key="support-backdrop"
            className="fixed inset-0 z-[88] bg-black/55 backdrop-blur-sm"
            onClick={submitting ? undefined : onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
          />

          <motion.div
            key="support-modal"
            className="fixed inset-x-4 bottom-4 z-[90] max-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(14,14,14,0.88)] shadow-[0_30px_80px_rgba(0,0,0,0.62)] backdrop-blur-[20px] sm:left-auto sm:right-8 sm:top-1/2 sm:w-[420px] sm:-translate-y-1/2"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants(reducedMotion)}
          >
            <div className="border-b border-white/10 bg-[rgba(19,19,19,0.82)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#81ecff]">
                    Suporte CodeTrail
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">
                    Abrir ticket
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#adaaaa]">
                    Envie o contexto do problema e o suporte responde por e-mail.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  aria-label="Fechar suporte"
                  className="touch-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#adaaaa] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-11rem)] overflow-y-auto px-6 py-5 sm:max-h-[70vh]">
              {chatFallbackNotice ? (
                <div className="mb-5 rounded-2xl border border-[#81ecff]/20 bg-[#81ecff]/8 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#81ecff]">
                    Chat indisponivel
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#d7f7ff]">
                    {chatFallbackNotice}
                  </p>
                </div>
              ) : null}

              {feedback ? (
                <div
                  className="mb-5 rounded-2xl border px-4 py-4"
                  style={{
                    borderColor:
                      feedback.tone === "success"
                        ? "rgba(53, 211, 154, 0.28)"
                        : "rgba(255, 113, 108, 0.28)",
                    background:
                      feedback.tone === "success"
                        ? "rgba(53, 211, 154, 0.08)"
                        : "rgba(255, 113, 108, 0.08)",
                  }}
                >
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.18em]"
                    style={{
                      color: feedback.tone === "success" ? "#35d39a" : "#ff716c",
                    }}
                  >
                    {feedback.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/90">
                    {feedback.message}
                  </p>
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={onSubmit}>
                <SupportField
                  label="Nome"
                  value={form.name}
                  error={fieldErrors.name}
                  disabled={submitting}
                  onChange={(value) => onUpdateField("name", value)}
                />

                <SupportField
                  label="E-mail"
                  type="email"
                  value={form.email}
                  error={fieldErrors.email}
                  disabled={submitting}
                  onChange={(value) => onUpdateField("email", value)}
                />

                <SupportField
                  label="Assunto"
                  value={form.subject}
                  error={fieldErrors.subject}
                  disabled={submitting}
                  onChange={(value) => onUpdateField("subject", value)}
                />

                <SupportTextarea
                  label="Descreva o problema"
                  value={form.description}
                  error={fieldErrors.description}
                  disabled={submitting}
                  onChange={(value) => onUpdateField("description", value)}
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="workspace-button workspace-button--ghost min-h-[44px] px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="workspace-button workspace-button--primary min-h-[44px] px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle size={14} className="animate-spin" />
                        Enviando
                      </>
                    ) : (
                      <>
                        <SendHorizonal size={14} />
                        Enviar ticket
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function SupportField({
  label,
  value,
  error,
  type = "text",
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  type?: "text" | "email";
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="workspace-label">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="workspace-input"
      />
      {error ? <FieldError message={error} /> : null}
    </label>
  );
}

function SupportTextarea({
  label,
  value,
  error,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="workspace-label">
      <span>{label}</span>
      <textarea
        value={value}
        disabled={disabled}
        rows={6}
        onChange={(event) => onChange(event.target.value)}
        className="workspace-textarea"
      />
      {error ? <FieldError message={error} /> : null}
    </label>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="m-0 text-sm text-[#ff8e88]">{message}</p>;
}
