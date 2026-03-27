import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingPlanCode } from "@/utils/workspace/types";

export async function persistPlanIntent(
  supabase: SupabaseClient,
  options: {
    userId: string;
    selectedPlan: BillingPlanCode;
    source?: string;
    platformInterest?: string;
    status?: string;
  },
) {
  const { error } = await supabase.from("plan_intents").insert({
    user_id: options.userId,
    selected_plan: options.selectedPlan,
    source: options.source ?? "landing_page",
    platform_interest: options.platformInterest ?? "windows",
    status: options.status ?? "interested",
  });

  if (error) {
    if (shouldIgnorePlanIntentError(error)) {
      return { success: true, warning: "Table plan_intents not found" };
    }

    throw new Error(error.message);
  }

  return { success: true };
}

export function shouldIgnorePlanIntentError(error: { message?: string; code?: string | null }) {
  return (
    error.message?.includes("Could not find the table") ||
    error.code === "42P01"
  );
}
