"use client";

import { login, savePlanIntent, signup } from "@/app/actions/auth";
import { GoogleAuthButton } from "@/app/components/auth/google-auth-button";
import {
  ActionButton,
  FeedbackMessage,
  FormField,
  SectionHeader,
  StatusBadge,
  Surface,
} from "@/app/components/ui/system-primitives";
import { usePlanIntent } from "@/store/plan-intent-store";
import { buildGoogleCallbackUrl, getAuthErrorMessage } from "@/utils/auth/oauth";
import { createClient, hasSupabaseClientEnv } from "@/utils/supabase/client";
import { ArrowRight, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const brandMark = "/design/CodeTrailMainIcon.png";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const { selectedPlan, clearIntent } = usePlanIntent();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  function getSupabaseClient() {
    if (!hasSupabaseClientEnv()) {
      return null;
    }

    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }

    return supabaseRef.current;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData(event.currentTarget);

    try {
      const authResult = isLogin ? await login(formData) : await signup(formData);

      if (authResult.error) {
        setErrorMsg(authResult.error);
        setIsLoading(false);
        return;
      }

      if (selectedPlan) {
        const intentResult = await savePlanIntent(selectedPlan);
        if (intentResult?.error) {
          console.error("Failed to save plan intent:", intentResult.error);
        }
      }

      const nextRoute =
        selectedPlan && !authResult.isSignup && selectedPlan !== "free"
          ? `/workspace/settings/billing?checkout=${selectedPlan}`
          : "/download/windows";

      await maybeSendWelcomeEmail(selectedPlan);
      clearIntent();
      router.push(nextRoute);
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMsg("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setIsGoogleLoading(true);
    setErrorMsg("");

    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMsg("O login com Google ainda nao esta habilitado neste ambiente do CodeTrail.");
      setIsGoogleLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildGoogleCallbackUrl({
            origin: window.location.origin,
            plan: selectedPlan,
            target: "download",
            source: "modal",
          }),
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.url) {
        throw new Error("Nao foi possivel iniciar o login com Google.");
      }
    } catch (error) {
      setErrorMsg(getAuthErrorMessage(error));
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/82 p-4 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <Surface tone="glass" className="relative z-10 w-full max-w-xl p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="touch-target absolute right-4 top-4 inline-flex items-center justify-center rounded-full border border-transparent p-2 text-text-secondary transition-[color,background-color,border-color] duration-200 hover:border-border/80 hover:bg-white/[0.05] hover:text-white"
          aria-label="Fechar modal de autenticação"
        >
          <X size={18} />
        </button>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_18px_rgba(50,208,255,0.16)]">
            <Image src={brandMark} alt="CodeTrail" width={40} height={40} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <strong className="font-display text-base tracking-tight text-white">CodeTrail</strong>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">Acesso ao sistema</span>
          </div>
        </div>

        <SectionHeader
          eyebrow="Entrada rápida"
          title={isLogin ? "Acesse sua conta" : "Crie sua conta"}
          subtitle={
            isLogin
              ? "Continue para o ambiente correto sem quebrar seu contexto de plano ou produto."
              : "Crie seu acesso e siga direto para o fluxo certo do ecossistema CodeTrail."
          }
          actions={selectedPlan ? <StatusBadge tone="primary">Plano {selectedPlan}</StatusBadge> : null}
        />

        {errorMsg ? (
          <FeedbackMessage
            tone="error"
            title="Falha na autenticação"
            message={errorMsg}
            className="mt-6"
          />
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <GoogleAuthButton
            label={isLogin ? "Entrar com Google" : "Criar conta com Google"}
            loading={isGoogleLoading}
            onClick={handleGoogleAuth}
          />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border/60" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
              ou continue com e-mail
            </span>
            <span className="h-px flex-1 bg-border/60" aria-hidden="true" />
          </div>

          <FormField label="E-mail">
            <input
              name="email"
              type="email"
              required
              placeholder="voce@codetrail.site"
              className="input-shell"
            />
          </FormField>

          <FormField label="Senha" helper="Use a mesma credencial do seu ecossistema CodeTrail.">
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Digite sua senha"
              className="input-shell"
            />
          </FormField>

          <ActionButton type="submit" disabled={isLoading || isGoogleLoading} className="mt-2 w-full">
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {isLogin ? "Entrar e continuar" : "Criar conta"}
                <ArrowRight size={16} />
              </>
            )}
          </ActionButton>
        </form>

        <div className="mt-8 border-t border-border/60 pt-6">
          <p className="text-sm text-text-secondary">
            {isLogin ? "Ainda não tem conta?" : "Já possui acesso?"}
          </p>
          <ActionButton
            type="button"
            variant="ghost"
            onClick={() => setIsLogin((value) => !value)}
            className="mt-3 px-0"
          >
            {isLogin ? "Criar conta agora" : "Voltar para login"}
          </ActionButton>
        </div>
      </Surface>
    </div>
  );
}

async function maybeSendWelcomeEmail(planCode?: string | null) {
  if (planCode === "pro" || planCode === "founding") {
    return;
  }

  try {
    await fetch("/api/auth/welcome", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planCode: planCode === "free" ? "free" : null,
      }),
    });
  } catch {
    // O fluxo principal nao deve depender do envio do template.
  }
}
