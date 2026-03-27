"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, CircleAlert, LoaderCircle } from "lucide-react";
import {
  fadeUpVariants,
  scaleInVariants,
  useMotionPreferences,
  useStableReducedMotion,
} from "@/app/components/ui/motion-system";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SurfaceTone = "solid" | "elevated" | "glass" | "soft";
type ButtonVariant = "primary" | "secondary" | "ghost";
type FeedbackTone = "success" | "warning" | "error" | "neutral";

export function Surface({
  children,
  className,
  tone = "solid",
}: {
  children: ReactNode;
  className?: string;
  tone?: SurfaceTone;
}) {
  const reducedMotion = useStableReducedMotion();
  const toneClass =
    tone === "glass"
      ? "glass-panel"
      : tone === "elevated"
        ? "workspace-panel workspace-panel--elevated"
        : tone === "soft"
          ? "rounded-[28px] border border-border/70 bg-white/[0.03]"
          : "workspace-panel workspace-panel--muted";

  return (
    <motion.div
      layout
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants(reducedMotion, 14)}
      className={cx(toneClass, className)}
    >
      {children}
    </motion.div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
  className?: string;
}) {
  const reducedMotion = useStableReducedMotion();
  const toneClass =
    tone === "primary"
      ? "border-primary/25 bg-primary/10 text-primary"
      : tone === "success"
        ? "border-success/25 bg-success/10 text-success"
        : tone === "warning"
          ? "border-warning/25 bg-warning/10 text-warning"
          : tone === "danger"
            ? "border-danger/25 bg-danger/10 text-danger"
            : "border-border/70 bg-white/[0.03] text-text-secondary";

  return (
    <motion.span
      layout
      initial="hidden"
      animate="visible"
      variants={scaleInVariants(reducedMotion)}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
        toneClass,
        className,
      )}
    >
      {children}
    </motion.span>
  );
}

export function ActionButton({
  children,
  className,
  variant = "primary",
  ...props
}: HTMLMotionProps<"button"> & {
  variant?: ButtonVariant;
}) {
  const { hoverLift, press } = useMotionPreferences();
  const variantClass =
    variant === "secondary"
      ? "workspace-button workspace-button--secondary"
      : variant === "ghost"
        ? "workspace-button workspace-button--ghost"
        : "workspace-button workspace-button--primary";

  return (
    <motion.button
      {...props}
      type={props.type ?? "button"}
      whileHover={props.disabled ? undefined : hoverLift}
      whileTap={props.disabled ? undefined : press}
      className={cx(
        "touch-target min-h-[48px] text-sm disabled:cursor-not-allowed disabled:opacity-60",
        variantClass,
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function ActionLink({
  children,
  href,
  className,
  variant = "primary",
  external = false,
  download = false,
}: {
  children: ReactNode;
  href: string;
  className?: string;
  variant?: ButtonVariant;
  external?: boolean;
  download?: boolean;
}) {
  const { hoverLift, press, transition } = useMotionPreferences();
  const variantClass =
    variant === "secondary"
      ? "workspace-button workspace-button--secondary"
      : variant === "ghost"
        ? "workspace-button workspace-button--ghost"
        : "workspace-button workspace-button--primary";
  const sharedClass = cx(
    "touch-target inline-flex min-h-[48px] items-center justify-center gap-2.5 text-sm",
    variantClass,
    className,
  );

  if (external || download) {
    return (
      <motion.a
        href={href}
        className={sharedClass}
        download={download || undefined}
        whileHover={hoverLift}
        whileTap={press}
        transition={transition}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.div whileHover={hoverLift} whileTap={press} transition={transition} className="inline-flex">
      <Link href={href} className={sharedClass}>
        {children}
      </Link>
    </motion.div>
  );
}

export function FormField({
  label,
  helper,
  children,
  className,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.label className={cx("flex flex-col gap-2.5", className)} layout="position">
      <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">{label}</span>
      {children}
      {helper ? <span className="text-xs leading-relaxed text-text-tertiary">{helper}</span> : null}
    </motion.label>
  );
}

export function FeedbackMessage({
  tone,
  title,
  message,
  className,
}: {
  tone: FeedbackTone;
  title?: string;
  message: string;
  className?: string;
}) {
  const reducedMotion = useStableReducedMotion();
  const styles = toneStyles(tone);
  return (
    <motion.div
      className={cx("rounded-[24px] border px-5 py-4", styles.panel, className)}
      initial="hidden"
      animate="visible"
      variants={scaleInVariants(reducedMotion)}
    >
      <div className="flex items-start gap-3.5">
        <div className={cx("mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border", styles.iconWrap)}>
          {tone === "success" ? <BadgeCheck size={18} /> : <CircleAlert size={18} />}
        </div>
        <div className="min-w-0">
          {title ? <strong className="block text-sm font-semibold text-white">{title}</strong> : null}
          <p className={cx("m-0 text-sm leading-relaxed", title ? "mt-1" : "", styles.copy)}>{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const reducedMotion = useStableReducedMotion();
  return (
    <motion.div
      className={cx("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5", className)}
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants(reducedMotion, 14)}
    >
      <div className="flex max-w-2xl flex-col gap-2.5">
        {eyebrow ? (
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="m-0 text-3xl font-display font-medium text-white">{title}</h2>
        {subtitle ? <p className="m-0 text-sm leading-relaxed text-text-secondary sm:text-base">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </motion.div>
  );
}

export function LoadingState({
  title,
  message,
  className,
}: {
  title: string;
  message?: string;
  className?: string;
}) {
  const reducedMotion = useStableReducedMotion();
  return (
    <motion.div
      className={cx("flex flex-col items-center justify-center gap-4 py-10 text-center sm:py-12", className)}
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants(reducedMotion, 12)}
    >
      <motion.div
        className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"
        animate={
          reducedMotion
            ? undefined
            : {
                boxShadow: [
                  "0 0 0 rgba(50,208,255,0)",
                  "0 0 0 10px rgba(50,208,255,0.08)",
                  "0 0 0 rgba(50,208,255,0)",
                ],
              }
        }
        transition={{
          duration: reducedMotion ? 0.01 : 2.2,
          repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY,
          ease: "easeOut",
        }}
      >
        <LoaderCircle size={22} className="animate-spin" />
      </motion.div>
      <div className="flex flex-col gap-1">
        <strong className="font-display text-xl text-white">{title}</strong>
        {message ? <p className="m-0 text-sm leading-relaxed text-text-secondary">{message}</p> : null}
      </div>
      <motion.div
        className="h-1.5 w-28 overflow-hidden rounded-full border border-border/60 bg-white/[0.03]"
        initial={false}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary via-[#7de7ff] to-accent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: reducedMotion ? 0.01 : 1.2,
            repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

function toneStyles(tone: FeedbackTone) {
  switch (tone) {
    case "success":
      return {
        panel: "border-emerald-400/25 bg-emerald-400/8",
        iconWrap: "border-emerald-400/30 bg-emerald-400/14 text-emerald-300",
        copy: "text-[#b8f3da]",
      };
    case "warning":
      return {
        panel: "border-amber-400/25 bg-amber-400/8",
        iconWrap: "border-amber-400/30 bg-amber-400/14 text-amber-300",
        copy: "text-[#f8ddb1]",
      };
    case "error":
      return {
        panel: "border-rose-400/25 bg-rose-400/8",
        iconWrap: "border-rose-400/30 bg-rose-400/14 text-rose-300",
        copy: "text-[#ffb7c0]",
      };
    case "neutral":
    default:
      return {
        panel: "border-border/70 bg-white/[0.03]",
        iconWrap: "border-border/70 bg-white/[0.05] text-white",
        copy: "text-text-secondary",
      };
  }
}
