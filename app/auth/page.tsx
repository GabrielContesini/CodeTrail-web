"use client";

import { GoogleAuthButton } from "@/app/components/auth/google-auth-button";
import { EmbeddedCheckoutDialog } from "@/app/components/embedded-checkout-dialog";
import { FeedbackMessage } from "@/app/components/ui/system-primitives";
import { GhostButton, Pill, PrimaryButton } from "@/app/workspace/_components/workspace-ui";
import { usePlanIntent } from "@/store/plan-intent-store";
import {
  buildGoogleCallbackUrl,
  getAuthErrorMessage,
  normalizeCheckoutReturnUrl,
  normalizeAuthNextPath,
  parseAuthFlowTarget,
  parseAuthPlan,
} from "@/utils/auth/oauth";
import { persistPlanIntent as persistPlanIntentRecord } from "@/utils/auth/plan-intent";
import { createClient, hasSupabaseClientEnv } from "@/utils/supabase/client";
import { createCheckout, waitForBillingActivation } from "@/utils/workspace/api";
import type { BillingPlanCode } from "@/utils/workspace/types";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const brandMark = "/design/CodeTrailMainIcon.png";

const planCatalog: Record<
  BillingPlanCode,
  {
    title: string;
    price: string;
    cadence: string;
    summary: string;
  }
> = {
  free: {
    title: "Plano Free",
    price: "R$ 0",
    cadence: "/mês",
    summary: "Base do workspace para organizar sua rotina e começar com clareza.",
  },
  pro: {
    title: "Plano Pro",
    price: "R$ 25",
    cadence: "/mês",
    summary: "Recursos premium e checkout conectado ao mesmo backend da aplicação.",
  },
  founding: {
    title: "Plano Founding",
    price: "R$ 270",
    cadence: "/ano",
    summary: "Plano anual para usuários iniciais que querem acompanhar a evolução do produto com acesso premium completo.",
  },
};

export default function AuthPage() {
  const { selectedPlan, clearIntent } = usePlanIntent();
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [queryPlan, setQueryPlan] = useState<BillingPlanCode | null>(null);
  const [target, setTarget] = useState<"workspace" | "download">("workspace");
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [checkoutReturnTo, setCheckoutReturnTo] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [embeddedCheckout, setEmbeddedCheckout] = useState<{
    clientSecret: string;
    planCode: BillingPlanCode;
    planTitle: string;
  } | null>(null);

  const activePlan = queryPlan ?? selectedPlan;
  const activePlanMeta = activePlan ? planCatalog[activePlan] : null;

  function getSupabaseClient() {
    if (!hasSupabaseClientEnv()) {
      return null;
    }

    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }

    return supabaseRef.current;
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQueryPlan(parseAuthPlan(params.get("plan")));
    setTarget(parseAuthFlowTarget(params.get("target")));
    setNextPath(normalizeAuthNextPath(params.get("next")));
    setCheckoutReturnTo(normalizeCheckoutReturnUrl(params.get("returnTo")));
    setErrorMsg(params.get("auth_error") ?? params.get("billing_error") ?? "");
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMsg("A autenticacao do Supabase ainda nao esta configurada neste ambiente.");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(getAuthErrorMessage(error));
          setIsLoading(false);
          return;
        }

        if (activePlan) {
          await persistPlanIntent(supabase, activePlan, target, data.user?.id ?? null);
        }

        if (activePlan === "pro" || activePlan === "founding") {
          await startPaidCheckout(activePlan, data.session?.access_token ?? null);
          return;
        }

        await maybeSendWelcomeEmail(activePlan);
        clearIntent();
        enterWorkspace();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(getAuthErrorMessage(error));
        setIsLoading(false);
        return;
      }

      if (activePlan && data.user?.id) {
        await persistPlanIntent(supabase, activePlan, target, data.user.id);
      }

      if (data?.session) {
        if (activePlan === "pro" || activePlan === "founding") {
          await startPaidCheckout(activePlan, data.session.access_token ?? null);
          return;
        }

        await maybeSendWelcomeEmail(activePlan);
        clearIntent();
        enterWorkspace();
        return;
      }

      if (data?.user && !data?.session) {
        setSuccessMsg(
          activePlan && activePlan !== "free"
            ? "Conta criada. Confirme seu e-mail e depois faça login para concluir o checkout do plano."
            : "Conta criada. Confirme seu e-mail e depois faça login para acessar o workspace.",
        );
        setIsLogin(true);
        setIsLoading(false);
        return;
      }

      clearIntent();
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function startPaidCheckout(
    planCode: BillingPlanCode,
    accessToken?: string | null,
  ) {
    const supabase = getSupabaseClient();

    if (!supabase) {
      throw new Error("A autenticacao do Supabase ainda nao esta configurada neste ambiente.");
    }

    const checkout = await createCheckout(
      supabase,
      planCode,
      accessToken ?? null,
      buildBillingReturnUrl(checkoutReturnTo),
      "embedded",
    );

    if (checkout.clientSecret) {
      clearIntent();
      setEmbeddedCheckout({
        clientSecret: checkout.clientSecret,
        planCode,
        planTitle: planCatalog[planCode].title,
      });
      return;
    }

    throw new Error("Nao foi possivel abrir o checkout interno agora.");
  }

  async function handleGoogleAuth() {
    setIsGoogleLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

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
            plan: activePlan,
            target,
            nextPath,
            checkoutReturnTo,
            source: "page",
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

  async function confirmEmbeddedCheckout() {
    if (!embeddedCheckout) {
      throw new Error("Nao foi possivel localizar a sessao de checkout.");
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      throw new Error("A autenticacao do Supabase ainda nao esta configurada neste ambiente.");
    }

    await waitForBillingActivation(supabase, embeddedCheckout.planCode);
  }

  function enterWorkspace() {
    if (nextPath) {
      router.push(nextPath);
      router.refresh();
      return;
    }

    router.push(target === "download" ? "/download/windows" : "/workspace/dashboard");
    router.refresh();
  }

  return (
    <>
      <main className="relative min-h-screen overflow-hidden bg-background font-ui">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(50,208,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(159,232,112,0.08),transparent_24%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60 [mask-image:radial-gradient(circle_at_center,black_44%,transparent_88%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1320px] items-center px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="glass-panel grid w-full overflow-hidden rounded-[30px] lg:grid-cols-[1.08fr_0.92fr]">
            <section className="relative flex flex-col justify-center gap-8 border-b border-border/60 px-6 py-8 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r lg:px-11 lg:py-11 xl:px-12 xl:py-12">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 rounded-full border border-border/70 bg-white/[0.04] px-3 py-2">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_18px_rgba(50,208,255,0.16)]">
                    <Image
                      src={brandMark}
                      alt="CodeTrail"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                  <div className="flex flex-col">
                    <strong className="font-display text-base tracking-tight text-white">CodeTrail</strong>
                    <span className="text-[10px] uppercase tracking-[0.24em] text-primary/80">Acesso web</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  <ShieldCheck size={13} />
                  Conta unificada
                </span>
              </div>

              <div className="flex max-w-2xl flex-col gap-6">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
                  Autenticação do workspace
                </span>
                <h1 className="m-0 max-w-2xl text-4xl font-display font-medium tracking-tight text-white sm:text-5xl lg:text-[3.45rem] lg:leading-[1.02]">
                  Entre no CodeTrail com a mesma conta que move seu billing, progresso e rotina.
                </h1>
                <p className="m-0 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
                  A autenticação conecta assinatura, trilhas, histórico e ambiente operacional. Sem telas paralelas, sem produto quebrado em partes.
                </p>
                {activePlanMeta ? (
                  <div className="workspace-panel workspace-panel--muted flex max-w-xl flex-col gap-3 border-primary/18 p-5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Pill tone="primary">{activePlanMeta.title}</Pill>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                        Checkout interno preservado
                      </span>
                    </div>
                    <p className="m-0 text-sm leading-relaxed text-text-secondary">
                      {activePlanMeta.summary}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="flex flex-col justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-6 py-8 sm:px-8 sm:py-10 lg:px-11 lg:py-11 xl:px-12 xl:py-12">
              <div className="mx-auto flex w-full max-w-xl flex-col gap-7 sm:gap-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                  <div className="flex flex-col gap-2">
                    <h2 className="m-0 text-3xl font-display font-medium text-white">
                      {isLogin ? "Acesse sua conta" : "Crie sua conta"}
                    </h2>
                    <p className="m-0 text-sm leading-relaxed text-text-secondary sm:text-base">
                      {isLogin
                        ? "Continue de onde parou e recupere seu ambiente de estudo."
                        : "Entre no ecossistema CodeTrail com onboarding direto para o workspace."}
                    </p>
                  </div>
                  {activePlanMeta ? <Pill tone="primary">{activePlanMeta.title}</Pill> : null}
                </header>

                {errorMsg ? (
                  <FeedbackMessage
                    tone="error"
                    title="Falha na autenticação"
                    message={errorMsg}
                  />
                ) : null}

                {successMsg ? (
                  <FeedbackMessage
                    tone="success"
                    title="Conta criada"
                    message={successMsg}
                  />
                ) : null}

                <div className="flex flex-col gap-4">
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
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <label className="workspace-label">
                    <span>E-mail</span>
                    <div className="relative flex items-center">
                      <UserRound size={16} className="pointer-events-none absolute left-4 text-text-secondary" />
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="voce@codetrail.site"
                        className="input-shell pl-11"
                      />
                    </div>
                  </label>

                  <label className="workspace-label">
                    <span>Senha</span>
                    <div className="relative flex items-center">
                      <KeyRound size={16} className="pointer-events-none absolute left-4 text-text-secondary" />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Digite sua senha"
                        className="input-shell pl-11 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="touch-target absolute right-2 inline-flex items-center justify-center rounded-full border border-transparent px-3 text-text-secondary transition-[color,background-color,border-color] duration-200 hover:border-border/70 hover:bg-white/[0.04] hover:text-white"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  <PrimaryButton type="submit" disabled={isLoading || isGoogleLoading} className="mt-2 w-full !min-h-[52px] text-sm">
                    {isLoading ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        {isLogin ? "Entrar no sistema" : "Criar acesso"}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </PrimaryButton>
                </form>

                <div className="workspace-panel workspace-panel--muted flex flex-wrap items-center justify-between gap-4 rounded-[26px] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">1</div>
                    <div className="flex flex-col">
                      <strong className="text-sm font-display text-white">Login e verificação</strong>
                      <span className="text-xs text-text-secondary">Entrada segura na mesma conta do ecossistema.</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Fluxo único</span>
                </div>

                <footer className="flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-text-secondary">
                    {isLogin ? "Ainda não tem conta?" : "Já possui acesso?"}
                  </span>
                  <GhostButton type="button" onClick={() => setIsLogin((v) => !v)}>
                    {isLogin ? "Criar conta" : "Voltar para login"}
                  </GhostButton>
                </footer>
              </div>
            </section>
          </div>
        </div>
      </main>

      <EmbeddedCheckoutDialog
        open={Boolean(embeddedCheckout)}
        clientSecret={embeddedCheckout?.clientSecret ?? null}
        planLabel={embeddedCheckout?.planTitle ?? "Plano premium"}
        subtitle="Pagamento seguro, sem sair do CodeTrail."
        processingMessage="Aguardando a confirmação do pagamento e a sincronização final da sua assinatura."
        successTitle="Assinatura confirmada"
        successMessage="Obrigado por assinar o CodeTrail. Estamos finalizando seu acesso premium e entrando no sistema."
        onClose={() => setEmbeddedCheckout(null)}
        onCheckoutComplete={confirmEmbeddedCheckout}
        onAfterSuccess={enterWorkspace}
      />
    </>
  );
}

function buildBillingReturnUrl(checkoutReturnTo?: string | null) {
  if (checkoutReturnTo) {
    return checkoutReturnTo;
  }

  return `${window.location.origin}/workspace/settings/billing`;
}

async function persistPlanIntent(
  supabase: ReturnType<typeof createClient>,
  selectedPlan: BillingPlanCode,
  target: "workspace" | "download",
  userId?: string | null,
) {
  const resolvedUserId = userId ?? (await supabase.auth.getUser()).data.user?.id ?? null;

  if (!resolvedUserId) {
    return;
  }

  await persistPlanIntentRecord(supabase, {
    userId: resolvedUserId,
    selectedPlan,
    source: "web_auth",
    platformInterest: target === "download" ? "windows" : "web",
  });
}

async function maybeSendWelcomeEmail(planCode?: BillingPlanCode | null) {
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
    // O login nao depende desse envio; a falha nao deve bloquear o fluxo.
  }
}
