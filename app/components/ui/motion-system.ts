"use client";

import { useEffect, useState } from "react";
import { useReducedMotion, type Transition, type Variants } from "framer-motion";

export const motionTokens = {
  duration: {
    instant: 0.01,
    fast: 0.18,
    base: 0.26,
    moderate: 0.34,
    slow: 0.46,
  },
  ease: {
    standard: [0.22, 1, 0.36, 1] as const,
    smooth: [0.16, 1, 0.3, 1] as const,
    exit: [0.4, 0, 0.2, 1] as const,
  },
  spring: {
    soft: {
      type: "spring" as const,
      stiffness: 280,
      damping: 28,
      mass: 0.95,
    },
    snappy: {
      type: "spring" as const,
      stiffness: 360,
      damping: 30,
      mass: 0.88,
    },
  },
};

export function useStableReducedMotion() {
  const prefersReducedMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? Boolean(prefersReducedMotion) : false;
}

export function useMotionPreferences() {
  const isReduced = useStableReducedMotion();

  return {
    reduced: isReduced,
    transition: createTransition(isReduced),
    hoverLift: isReduced ? undefined : { y: -2, scale: 1.01 },
    hoverGlow: isReduced
      ? undefined
      : { y: -1.5, boxShadow: "0 18px 42px rgba(6, 13, 19, 0.34)" },
    press: isReduced ? { scale: 1 } : { scale: 0.985, y: 0.5 },
  };
}

export function createTransition(reduced: boolean | null, duration = motionTokens.duration.base): Transition {
  if (reduced) {
    return { duration: motionTokens.duration.instant };
  }

  return {
    duration,
    ease: motionTokens.ease.standard,
  };
}

export function fadeUpVariants(reduced: boolean | null, distance = 18): Variants {
  return {
    hidden: {
      opacity: 0,
      y: reduced ? 0 : distance,
      scale: reduced ? 1 : 0.992,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: createTransition(reduced, motionTokens.duration.moderate),
    },
    exit: {
      opacity: 0,
      y: reduced ? 0 : -12,
      scale: reduced ? 1 : 0.992,
      transition: createTransition(reduced, motionTokens.duration.fast),
    },
  };
}

export function fadeVariants(reduced: boolean | null): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: createTransition(reduced, motionTokens.duration.base),
    },
    exit: {
      opacity: 0,
      transition: createTransition(reduced, motionTokens.duration.fast),
    },
  };
}

export function scaleInVariants(reduced: boolean | null): Variants {
  return {
    hidden: {
      opacity: 0,
      scale: reduced ? 1 : 0.97,
      y: reduced ? 0 : 12,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: createTransition(reduced, motionTokens.duration.moderate),
    },
    exit: {
      opacity: 0,
      scale: reduced ? 1 : 0.985,
      y: reduced ? 0 : 10,
      transition: createTransition(reduced, motionTokens.duration.fast),
    },
  };
}

export function modalVariants(reduced: boolean | null): Variants {
  return {
    hidden: {
      opacity: 0,
      scale: reduced ? 1 : 0.972,
      y: reduced ? 0 : 18,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: createTransition(reduced, motionTokens.duration.moderate),
    },
    exit: {
      opacity: 0,
      scale: reduced ? 1 : 0.986,
      y: reduced ? 0 : 14,
      transition: createTransition(reduced, motionTokens.duration.fast),
    },
  };
}

export function staggerContainerVariants(reduced: boolean | null, stagger = 0.06): Variants {
  return {
    hidden: {},
    visible: {
      transition: reduced
        ? undefined
        : {
            staggerChildren: stagger,
            delayChildren: 0.02,
          },
    },
  };
}

export function listItemVariants(reduced: boolean | null): Variants {
  return {
    hidden: {
      opacity: 0,
      y: reduced ? 0 : 8,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: createTransition(reduced, motionTokens.duration.base),
    },
  };
}
