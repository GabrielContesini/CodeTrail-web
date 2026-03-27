"use client";

import { savePlanIntent } from "@/app/actions/auth";
import { usePlanIntent } from "@/store/plan-intent-store";
import { useEffect, useRef } from "react";

export function IntentProcessor() {
 const { selectedPlan, clearIntent } = usePlanIntent();
 const processed = useRef(false);

 useEffect(() => {
  async function process() {
   if (selectedPlan && !processed.current) {
    processed.current = true;
    // The user just landed here after clicking a plan and being fully authenticated
    // Call server action to securely save that intent
    try {
     await savePlanIntent(selectedPlan);
    } catch (e) {
     console.error("Failed executing intent processing on success page", e);
    } finally {
     // Clear local storage so we don't keep firing it every refresh
     clearIntent();
    }
   }
  }

  process();
 }, [selectedPlan, clearIntent]);

 return null;
}
