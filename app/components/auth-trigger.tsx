"use client";

import { savePlanIntent } from "@/app/actions/auth";
import { usePlanIntent } from "@/store/plan-intent-store";
import { createClient } from "@/utils/supabase/client";
import type { BillingPlanCode } from "@/utils/workspace/types";
import { useRouter } from "next/navigation";

export function AuthTrigger({
  children,
  className,
  plan,
  target = "workspace",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  plan?: BillingPlanCode;
  target?: "workspace" | "download";
  onClick?: (event: React.MouseEvent) => void;
}) {
  const { setIntent, clearIntent } = usePlanIntent();
  const router = useRouter();

  const handleTrigger = async (event: React.MouseEvent) => {
    event.preventDefault();
    onClick?.(event);

    setIntent(plan ?? null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      if (plan) {
        const intentResult = await savePlanIntent(plan);
        if (intentResult?.error) {
          console.error("Failed to save plan intent:", intentResult.error);
        }

        if (plan === "free") {
          clearIntent();
          router.push("/workspace/dashboard");
          return;
        }

        clearIntent();
        router.push(`/workspace/settings/billing?checkout=${plan}`);
        return;
      }

      router.push(target === "download" ? "/download/windows" : "/workspace/dashboard");
      return;
    }

    const params = new URLSearchParams();
    if (plan) {
      params.set("plan", plan);
    }
    if (target !== "workspace") {
      params.set("target", target);
    }

    router.push(params.size ? `/auth?${params.toString()}` : "/auth");
  };

  return (
    <button onClick={handleTrigger} className={className}>
      {children}
    </button>
  );
}
