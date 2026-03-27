import { create } from "zustand"
import { persist } from "zustand/middleware"

type PlanType = "free" | "pro" | "founding" | null

interface PlanIntentState {
 selectedPlan: PlanType
 setIntent: (plan: PlanType) => void
 clearIntent: () => void
}

export const usePlanIntent = create<PlanIntentState>()(
 persist(
  (set) => ({
   selectedPlan: null,
   setIntent: (plan) => set({ selectedPlan: plan }),
   clearIntent: () => set({ selectedPlan: null }),
  }),
  {
   name: "codetrail-plan-intent", // name of item in storage
  }
 )
)
