"use server";

import { redirect } from "next/navigation";
import { persistPlanIntent as persistPlanIntentRecord } from "@/utils/auth/plan-intent";
import { getAuthErrorMessage } from "@/utils/auth/oauth";
import { createClient } from "@/utils/supabase/server";
import type { BillingPlanCode } from "@/utils/workspace/types";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  return { success: true, isSignup: false };
}

export async function loginAndContinue(
  formData: FormData,
  options?: {
    selectedPlan?: string | null;
    target?: "workspace" | "download";
  },
) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  const selectedPlan = parsePlanCode(options?.selectedPlan ?? null);
  const target = options?.target === "download" ? "download" : "workspace";

  if (selectedPlan) {
    const intentResult = await persistPlanIntent(supabase, selectedPlan);
    if (intentResult?.error) {
      return intentResult;
    }
  }

  if (selectedPlan === "pro" || selectedPlan === "founding") {
    redirect(`/workspace/settings/billing?checkout=${selectedPlan}`);
  }

  if (selectedPlan === "free") {
    redirect(target === "download" ? "/download/windows" : "/workspace/dashboard");
  }

  redirect(target === "download" ? "/download/windows" : "/workspace/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  if (data?.user && !data?.session) {
    return { success: true, isSignup: true };
  }

  return { success: true, isSignup: true };
}

export async function savePlanIntent(selectedPlan: string) {
  const supabase = await createClient();
  return await persistPlanIntent(supabase, selectedPlan);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

async function persistPlanIntent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  selectedPlan: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  const planCode = parsePlanCode(selectedPlan);
  if (!planCode) {
    return { success: true };
  }

  try {
    await persistPlanIntentRecord(supabase, {
      userId: user.id,
      selectedPlan: planCode,
      source: "landing_page",
      platformInterest: "windows",
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Falha ao registrar o plano selecionado.",
    };
  }

  return { success: true };
}

function parsePlanCode(selectedPlan: string | null): BillingPlanCode | null {
  if (selectedPlan === "free" || selectedPlan === "pro" || selectedPlan === "founding") {
    return selectedPlan;
  }

  return null;
}
