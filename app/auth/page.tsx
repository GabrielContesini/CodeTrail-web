"use client";

import { EmbeddedCheckoutDialog } from "@/app/components/embedded-checkout-dialog";
import { usePlanIntent } from "@/store/plan-intent-store";
import {
  buildGoogleCallbackUrl,
  getAuthErrorMessage,
  normalizeAuthNextPath,
  normalizeCheckoutReturnUrl,
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
  LoaderCircle,
  Mail,
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
    title: "Plano Gratuito",
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
      setErrorMsg("A autenticação do Supabase ainda não está configurada neste ambiente.");
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
          await persistPlanIntent(supabase, activePlan, data.user?.id ?? null);
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
        await persistPlanIntent(supabase, activePlan, data.user.id);
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
      throw new Error("A autenticação do Supabase ainda não está configurada neste ambiente.");
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

    throw new Error("Não foi possível abrir o checkout interno agora.");
  }

  async function handleGoogleAuth() {
    setIsGoogleLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMsg("O login com Google ainda não está habilitado neste ambiente do CodeTrail.");
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
        throw new Error("Não foi possível iniciar o login com Google.");
      }
    } catch (error) {
      setErrorMsg(getAuthErrorMessage(error));
      setIsGoogleLoading(false);
    }
  }

  async function confirmEmbeddedCheckout() {
    if (!embeddedCheckout) {
      throw new Error("Não foi possível localizar a sessão de checkout.");
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      throw new Error("A autenticação do Supabase ainda não está configurada neste ambiente.");
    }

    await waitForBillingActivation(supabase, embeddedCheckout.planCode);
  }

  function enterWorkspace() {
    if (nextPath) {
      router.push(nextPath);
      router.refresh();
      return;
    }

    router.push("/workspace/dashboard");
    router.refresh();
  }

  return (
    <>
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-transparent text-on-surface font-ui selection:bg-primary/30">

        {/* Decorative Light Source */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]"></div>

        {/* Header — matches workspace sidebar logo block */}
        <header className="fixed top-0 w-full z-50 flex justify-center items-center h-20 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10 shadow-[0_0_18px_rgba(50,208,255,0.14)] shrink-0">
              <Image
                src={brandMark}
                alt="CodeTrail Logo"
                width={34}
                height={34}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <strong className="text-xl font-bold text-primary tracking-tight uppercase">CodeTrail</strong>
              <span className="text-[10px] text-on-surface-variant tracking-[0.2em] font-bold mt-0.5 uppercase">Terminal de Acesso</span>
            </div>
          </div>
        </header>

        {/* Auth Form Canvas */}
        <div className="relative z-10 w-full max-w-[440px] px-6 py-28 mb-10">

          {/* Page Header — PageFrame eyebrow pattern */}
          <div className="mb-8 flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              TERMINAL_V1
            </span>
            <h1 className="m-0 text-3xl font-display font-bold tracking-tight text-white sm:text-4xl">
              {isLogin ? "Acesso ao Workspace" : "Cadastro de Operador"}
            </h1>
            <p className="m-0 text-sm leading-relaxed text-text-secondary">
              {isLogin ? "Insira suas credenciais para acessar o terminal de operação." : "Crie sua conta para iniciar sua jornada no sistema."}
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-primary/50 via-border/15 to-transparent mb-8" />

          <section className="glass-panel p-7 sm:p-8 mb-8 w-full">

            {errorMsg ? (
              <div className="mb-6 rounded-[calc(var(--radius-field)-4px)] border border-error/50 bg-error/10 px-4 py-3 text-sm font-medium text-error">
                {errorMsg}
              </div>
            ) : null}

            {successMsg ? (
              <div className="mb-6 rounded-[calc(var(--radius-field)-4px)] border border-success/50 bg-success/10 px-4 py-3 text-sm font-medium text-success shadow-[0_0_15px_rgba(53,211,154,0.1)]">
                {successMsg}
              </div>
            ) : null}

            {activePlanMeta && !isLogin ? (
              <div className="mb-6 rounded-[calc(var(--radius-field)-4px)] border border-primary/20 bg-primary/10 p-4 shadow-[0_0_15px_rgba(129,236,255,0.05)]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] uppercase text-primary">{activePlanMeta.title}</span>
                  <span className="text-xs font-bold text-white">{activePlanMeta.price}{activePlanMeta.cadence}</span>
                </div>
                <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                  Conclua seu cadastro inicial para carregar o módulo de checkout.
                </p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Email — workspace-label + input-shell */}
              <label className="workspace-label group/field">
                <span className="group-focus-within/field:text-primary transition-colors">
                  Endereço de E-mail
                </span>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="operador@codetrail.site"
                    className="input-shell w-full pr-11"
                  />
                  <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 text-text-secondary group-focus-within/field:text-primary transition-colors pointer-events-none">
                    <Mail size={16} />
                  </div>
                </div>
              </label>

              {/* Password — workspace-label + input-shell */}
              <label className="workspace-label group/field">
                <div className="flex justify-between items-center">
                  <span className="group-focus-within/field:text-primary transition-colors">
                    Senha de Acesso
                  </span>
                  {isLogin && (
                    <a className="text-[10px] uppercase font-bold text-text-secondary hover:text-primary transition-colors tracking-widest" href="#">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    className="input-shell w-full pr-11 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-0 bottom-0 flex items-center pr-4 text-text-secondary group-focus-within/field:text-primary hover:!text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength — registration only */}
                {!isLogin && (
                  <div className="mt-1 space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-text-secondary">
                      <span>Força da Senha</span>
                      <span className="text-primary">Ótima</span>
                    </div>
                    <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden flex gap-1">
                      <div className="h-full w-1/4 bg-primary rounded-full shadow-[0_0_15px_rgba(129,236,255,0.4)]"></div>
                      <div className="h-full w-1/4 bg-primary rounded-full shadow-[0_0_15px_rgba(129,236,255,0.4)]"></div>
                      <div className="h-full w-1/4 bg-primary rounded-full shadow-[0_0_15px_rgba(129,236,255,0.4)]"></div>
                      <div className="h-full w-1/4 bg-surface-container-highest rounded-full"></div>
                    </div>
                  </div>
                )}
              </label>

              {/* Submit — workspace-button--primary */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="workspace-button workspace-button--primary w-full !rounded-[var(--radius-field)] text-xs uppercase tracking-[0.18em] mt-2 group/btn"
              >
                {isLoading ? (
                  <LoaderCircle size={18} className="animate-spin text-on-primary-fixed" />
                ) : (
                  <>
                    {isLogin ? "Autorizar Acesso" : "Criar Conta"}
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-7">
              <div className="flex-grow h-px bg-outline-variant/30"></div>
              <span className="px-4 text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em]">Conexão Externa</span>
              <div className="flex-grow h-px bg-outline-variant/30"></div>
            </div>

            {/* Google — workspace-button--secondary */}
            <button
              type="button"
              disabled={isGoogleLoading || isLoading}
              onClick={handleGoogleAuth}
              className="workspace-button workspace-button--secondary w-full !rounded-[var(--radius-field)] group"
            >
              {isGoogleLoading ? (
                <LoaderCircle size={18} className="animate-spin text-on-surface" />
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:opacity-100 opacity-90 transition-opacity" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span className="text-[11px] uppercase font-bold tracking-[0.18em] text-on-surface group-hover:text-primary transition-colors">
                    {isLogin ? "Continuar com Google" : "Cadastrar com Google"}
                  </span>
                </>
              )}
            </button>

            {/* Toggle login/register */}
            <div className="mt-7 text-center">
              <p className="text-text-secondary text-sm font-medium">
                {isLogin ? "Ainda não possui conta?" : "Já possui uma conta?"}
                <button type="button" onClick={() => setIsLogin((v) => !v)} className="text-primary hover:underline underline-offset-4 ml-2 font-bold uppercase tracking-widest text-[10px] hover:text-primary-strong transition-colors">
                  {isLogin ? "Cadastre-se" : "Fazer Login"}
                </button>
              </p>
            </div>
          </section>

          {/* Trust Metrics — workspace-panel pattern */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="workspace-panel workspace-panel--interactive p-4 pb-5 flex flex-col justify-center">
                <div className="text-primary font-black font-display text-2xl tracking-tighter drop-shadow-[0_0_12px_rgba(129,236,255,0.4)]">99.9%</div>
                <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mt-0.5">SLA do Sistema</div>
              </div>
              <div className="workspace-panel workspace-panel--interactive p-4 pb-5 flex flex-col justify-center">
                <div className="text-primary font-black font-display text-2xl tracking-tighter drop-shadow-[0_0_12px_rgba(129,236,255,0.4)]">AES-256</div>
                <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mt-0.5">Criptografia Local</div>
              </div>
            </div>
          )}

        </div>

        <footer className="w-full py-8 px-12 flex flex-col md:flex-row justify-between items-center bg-transparent relative z-20">
          <span className="text-[10px] uppercase tracking-widest text-text-secondary mb-4 md:mb-0 font-bold opacity-60">
            © 2025 CodeTrail Lab. Acesso Exclusivo.
          </span>
          <div className="flex gap-6 opacity-60">
            <a className="text-[10px] uppercase tracking-widest font-bold text-text-secondary hover:text-primary transition-all duration-200 hover:opacity-100" href="#">Política de Privacidade</a>
            <a className="text-[10px] uppercase tracking-widest font-bold text-text-secondary hover:text-primary transition-all duration-200 hover:opacity-100" href="#">Termos de Uso</a>
            <a className="text-[10px] uppercase tracking-widest font-bold text-text-secondary hover:text-primary transition-all duration-200 hover:opacity-100" href="#">Status da API</a>
          </div>
        </footer>
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
    platformInterest: "web",
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
