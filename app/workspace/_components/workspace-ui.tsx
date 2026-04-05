"use client";

import {
    createTransition,
    fadeUpVariants,
    modalVariants,
    scaleInVariants,
    useMotionPreferences,
    useStableReducedMotion,
} from "@/app/components/ui/motion-system";
import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import React from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function PageFrame({
  eyebrow = "TERMINAL_V1",
  title,
  subtitle,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const reducedMotion = useStableReducedMotion();
  return (
    <motion.section
      className="relative flex min-h-full w-full flex-col gap-6 pb-10 sm:gap-7 lg:gap-8 lg:pb-12"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeUpVariants(reducedMotion, 20)}
    >
      <div className="pointer-events-none absolute -top-20 right-0 h-[240px] w-[240px] rounded-full bg-primary/10 blur-[110px]" />
      <div className="pointer-events-none absolute left-0 top-12 h-[160px] w-[160px] rounded-full bg-primary/6 blur-[90px]" />

      <motion.header
        className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end md:gap-8"
        layout="position"
      >
        <div className="flex max-w-3xl flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </span>
          <h1 className="m-0 text-4xl font-display font-bold tracking-tight text-white md:text-5xl lg:text-[3.6rem] lg:leading-[0.98]">
            {title}
          </h1>
          <p className="m-0 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base lg:text-[1.02rem]">
            {subtitle}
          </p>
        </div>
        {actions ? (
          <div className="mt-1 flex w-full flex-wrap items-center gap-2.5 md:mt-0 md:w-auto md:justify-end">
            {actions}
          </div>
        ) : null}
      </motion.header>

      <div className="h-px w-full bg-gradient-to-r from-primary/50 via-border/15 to-transparent" />

      <motion.div
        className="relative z-10 flex w-full min-w-0 flex-col gap-5 sm:gap-6"
        layout="position"
      >
        {children}
      </motion.div>
    </motion.section>
  );
}

export function DataCard({
  title,
  subtitle,
  accent,
  actions,
  children,
  dense = false,
  className,
}: {
  title?: string;
  subtitle?: string;
  accent?: "primary" | "success" | "warning" | "danger";
  actions?: ReactNode;
  children: ReactNode;
  dense?: boolean;
  className?: string;
}) {
  const { reduced, hoverGlow, transition } = useMotionPreferences();
  let accentClass = "";
  switch (accent) {
    case "primary":
      accentClass = "border-primary/28";
      break;
    case "success":
      accentClass = "border-success/28";
      break;
    case "warning":
      accentClass = "border-warning/32";
      break;
    case "danger":
      accentClass = "border-danger/32";
      break;
  }

  return (
    <motion.article
      layout
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants(reduced, dense ? 12 : 18)}
      whileHover={hoverGlow}
      transition={transition}
      className={cx(
        "workspace-panel workspace-panel--interactive text-left flex flex-col",
        dense ? "gap-3 p-4 sm:p-5" : "gap-5 p-5 sm:p-6 lg:gap-7",
        accentClass,
        className,
      )}
    >
      {(title || subtitle || actions) && (
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex flex-col gap-1.5">
            {title && (
              <h2 className="m-0 text-base font-display font-bold tracking-tight text-white lg:text-[1.18rem]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="m-0 text-xs leading-relaxed text-text-secondary lg:text-sm">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              {actions}
            </div>
          )}
        </header>
      )}
      <div className="min-w-0 flex flex-col gap-4">{children}</div>
    </motion.article>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon?: ReactNode;
}) {
  return (
    <DataCard dense>
      <div className="flex items-start gap-3.5 sm:gap-4">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/18 bg-primary/10 text-primary shadow-[0_0_18px_rgba(129,236,255,0.1)]">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-text-secondary">
            {label}
          </span>
          <strong className="truncate font-display text-2xl text-white lg:text-[1.95rem]">
            {value}
          </strong>
          <span className="text-xs text-text-tertiary truncate">{helper}</span>
        </div>
      </div>
    </DataCard>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
}) {
  let tc = "text-text-secondary border-border/80 bg-white/[0.03]";
  switch (tone) {
    case "primary":
      tc = "text-primary border-primary/30 bg-primary/10";
      break;
    case "success":
      tc = "text-success border-success/30 bg-success/10";
      break;
    case "warning":
      tc = "text-warning border-warning/30 bg-warning/10";
      break;
    case "danger":
      tc = "text-danger border-danger/30 bg-danger/10";
      break;
  }

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[9px] font-bold tracking-[0.18em] uppercase whitespace-nowrap",
        tc,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = "primary",
}: {
  value: number;
  tone?: "primary" | "success" | "warning";
}) {
  const reducedMotion = useStableReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));
  let fillClass =
    "bg-gradient-to-r from-primary via-[#9df0ff] to-[#00e3fd] shadow-[0_0_8px_rgba(129,236,255,0.32)]";
  if (tone === "success") {
    fillClass =
      "bg-gradient-to-r from-success via-[#74e8bc] to-[#b3ffe2] shadow-[0_0_8px_rgba(53,211,154,0.28)]";
  }
  if (tone === "warning") {
    fillClass =
      "bg-gradient-to-r from-warning via-[#ffd28f] to-[#ffe8bf] shadow-[0_0_8px_rgba(255,191,105,0.28)]";
  }

  return (
    <div className="h-2 w-full overflow-hidden rounded-full border border-border/60 bg-surface">
      <motion.div
        className={cx(
          "h-full rounded-full transition-[width,background-color,box-shadow] duration-500 ease-out",
          fillClass,
        )}
        initial={false}
        animate={{ width: `${clamped}%` }}
        transition={createTransition(reducedMotion, 0.48)}
      />
    </div>
  );
}

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  const reducedMotion = useStableReducedMotion();
  return (
    <motion.div
      className="flex w-full flex-col items-center justify-center rounded-[calc(var(--radius-panel)-4px)] border border-dashed border-border/50 bg-white/[0.015] px-6 py-10 text-center sm:px-8 sm:py-12"
      initial="hidden"
      animate="visible"
      variants={scaleInVariants(reducedMotion)}
    >
      <h3 className="mb-2 text-lg font-display font-bold text-white">
        {title}
      </h3>
      <p className="mb-6 max-w-md text-sm leading-relaxed text-text-secondary">
        {subtitle}
      </p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}

export function WorkspaceModal({
  eyebrow,
  size = "md",
  fullBleed = false,
  hideFooterDecor = fullBleed,
  bodyClassName,
  title,
  subtitle,
  open,
  onClose,
  children,
}: {
  eyebrow?: string;
  size?: "md" | "lg" | "xl" | "2xl";
  fullBleed?: boolean;
  hideFooterDecor?: boolean;
  bodyClassName?: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const reducedMotion = useStableReducedMotion();
  const sizeClass =
    size === "2xl"
      ? "max-w-7xl"
      : size === "xl"
        ? "max-w-6xl"
        : size === "lg"
          ? "max-w-3xl"
          : "max-w-xl";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8"
          role="dialog"
          aria-modal="true"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeUpVariants(reducedMotion, 0)}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Fechar"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: createTransition(reducedMotion, 0.22),
              },
              exit: {
                opacity: 0,
                transition: createTransition(reducedMotion, 0.16),
              },
            }}
          />
          <motion.div
            className={cx(
              "glass-panel relative z-10 flex max-h-[90vh] w-full flex-col rounded-2xl border border-white/10 shadow-[0px_20px_40px_rgba(0,0,0,0.6)]",
              sizeClass,
            )}
            variants={modalVariants(reducedMotion)}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/5 px-8 py-6 sm:px-8">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  {eyebrow ?? "System Request"}
                </span>
                <h2 className="m-0 text-2xl font-black tracking-tighter text-on-surface">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="m-0 text-sm text-on-surface-variant">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="touch-target inline-flex items-center justify-center rounded-full border border-transparent p-2 text-on-surface-variant transition-[color,background-color,border-color] duration-200 hover:text-on-surface"
                onClick={onClose}
              >
                <span className="sr-only">Fechar</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </header>
            <motion.div
              className={cx(
                "overflow-y-auto",
                fullBleed ? "p-0" : "px-8 py-6 sm:px-8 sm:py-6",
                bodyClassName,
              )}
              layout="position"
            >
              {children}
            </motion.div>
            {hideFooterDecor ? null : (
              <div className="border-t border-white/5 bg-surface-container-highest/30 px-8 py-3 flex justify-end">
                <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <motion.label className="flex w-full flex-col gap-2.5" layout="position">
      <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold">
        {label}
      </span>
      {children}
    </motion.label>
  );
}

const baseInput = "input-shell";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(baseInput, props.className)} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cx(baseInput, "min-h-[100px] resize-y", props.className)}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(baseInput, "appearance-none", props.className)}
    />
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: HTMLMotionProps<"button">) {
  const { hoverLift, press } = useMotionPreferences();
  return (
    <motion.button
      {...props}
      type={props.type ?? "button"}
      whileHover={props.disabled ? undefined : hoverLift}
      whileTap={props.disabled ? undefined : press}
      className={cx(
        "workspace-button workspace-button--primary touch-target text-xs uppercase tracking-[0.18em]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function SecondaryButton({
  children,
  className,
  ...props
}: HTMLMotionProps<"button">) {
  const { hoverLift, press } = useMotionPreferences();
  return (
    <motion.button
      {...props}
      type={props.type ?? "button"}
      whileHover={props.disabled ? undefined : hoverLift}
      whileTap={props.disabled ? undefined : press}
      className={cx(
        "workspace-button workspace-button--secondary touch-target text-sm",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: HTMLMotionProps<"button">) {
  const { hoverLift, press } = useMotionPreferences();
  return (
    <motion.button
      {...props}
      type={props.type ?? "button"}
      whileHover={props.disabled ? undefined : hoverLift}
      whileTap={props.disabled ? undefined : press}
      className={cx(
        "workspace-button workspace-button--ghost touch-target px-4 text-sm font-medium",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function IconButton({
  children,
  className,
  ...props
}: HTMLMotionProps<"button">) {
  const { hoverLift, press } = useMotionPreferences();
  return (
    <motion.button
      {...props}
      type={props.type ?? "button"}
      whileHover={props.disabled ? undefined : hoverLift}
      whileTap={props.disabled ? undefined : press}
      className={cx(
        "touch-target inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent text-text-secondary",
        "transition-[color,background-color,border-color,transform] duration-200 hover:border-primary/15 hover:bg-white/[0.05] hover:text-white",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function SectionGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}) {
  const minWidthByColumns: Record<typeof columns, string> = {
    1: "100%",
    2: "280px",
    3: "240px",
    4: "200px",
  };

  return (
    <div
      className="grid auto-rows-max gap-5 sm:gap-6"
      style={
        {
          gridTemplateColumns: `repeat(auto-fit, minmax(min(${minWidthByColumns[columns]}, 100%), 1fr))`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
