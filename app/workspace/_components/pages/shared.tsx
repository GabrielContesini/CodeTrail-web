"use client";

import { motion } from "framer-motion";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { createTransition, useMotionPreferences } from "@/app/components/ui/motion-system";
import {
  EmptyState,
  PageFrame,
  PrimaryButton,
  ProgressBar,
} from "@/app/workspace/_components/workspace-ui";
import { LoaderCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function QuickAction({
  title,
  subtitle,
  href,
  icon,
  className,
}: {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  className?: string;
}) {
  const { reduced, hoverLift, press, transition } = useMotionPreferences();
  return (
    <motion.div whileHover={hoverLift} whileTap={press} transition={transition} className={className}>
      <Link
        href={href}
        className="workspace-panel workspace-panel--interactive group flex h-full items-start gap-4 p-5 text-left lg:p-6"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-white/[0.03] text-primary transition-[background-color,border-color,color] duration-200 group-hover:border-primary/30 group-hover:bg-primary/10">
          {icon}
        </div>
        <div className="min-w-0 flex flex-col gap-1.5">
          <strong className="m-0 font-display text-base tracking-tight text-white">{title}</strong>
          <span className="m-0 text-sm leading-relaxed text-text-secondary">{subtitle}</span>
        </div>
      </Link>
    </motion.div>
  );
}

export function PriorityRow({
  icon,
  title,
  subtitle,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div className="workspace-row-card items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex flex-1 flex-col gap-0.5">
        <strong className="text-white font-display text-sm tracking-tight">{title}</strong>
        <span className="text-text-secondary text-xs truncate">{subtitle}</span>
      </div>
      <div className="shrink-0 rounded-full border border-border/70 bg-white/[0.03] px-3 py-1.5 text-sm font-sans text-white">{value}</div>
    </div>
  );
}

export function SnapshotTile({
  title,
  value,
  helper,
}: {
  title: string;
  value: number;
  helper?: string;
}) {
  return (
    <div className="workspace-list-item gap-3">
      <div className="flex items-center justify-between gap-4">
        <strong className="text-white font-display tracking-tight text-sm truncate">{title}</strong>
        <span className="text-text-secondary text-xs font-sans whitespace-nowrap">{helper || `${value.toFixed(0)}%`}</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

export function QueuePanel({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: Array<{ title: string; subtitle: string }>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <strong className="text-white font-display tracking-tight text-base">{title}</strong>
      {items.length ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={`${item.title}-${item.subtitle}`} className="workspace-list-item gap-1.5">
              <strong className="text-white text-sm tracking-tight">{item.title}</strong>
              <span className="text-text-secondary text-xs">{item.subtitle}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text-secondary text-sm italic py-4">{emptyLabel}</p>
      )}
    </div>
  );
}

export function MiniChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return data.length ? (
    <div className="flex items-end justify-between h-[120px] gap-2 pt-6">
      {data.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 flex-1 group">
            <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold opacity-0 group-hover:opacity-100 transition-opacity">{item.value.toFixed(1)}h</span>
          <div className="relative flex h-full w-full max-w-[24px] items-end overflow-hidden rounded-full border border-border/50 bg-surface">
            <i
              className="w-full bg-primary/80 transition-[height,background-color,box-shadow] duration-700 ease-out"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-text-secondary font-sans truncate w-full text-center">{item.label}</span>
        </div>
      ))}
    </div>
  ) : (
    <EmptyState
      title="Sem amostras suficientes"
      subtitle="Registre mais sessões para liberar estes gráficos."
    />
  );
}

export function LockedFeaturePage({
  title,
  feature,
}: {
  title: string;
  feature: string;
}) {
  const { createCheckout } = useWorkspace();
  return (
    <PageFrame
      title={feature}
      subtitle="Este módulo está conectado ao billing do produto principal."
    >
      <EmptyState
        title={title}
        subtitle="Faça upgrade para o plano Pro para liberar esse recurso também na web."
        action={
          <PrimaryButton onClick={() => void createCheckout("pro")}>
            <Sparkles size={16} />
            Fazer upgrade
          </PrimaryButton>
        }
      />
    </PageFrame>
  );
}

export function ModalForm({
  children,
  onSubmit,
}: {
  children: React.ReactNode;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
          await onSubmit(new FormData(event.currentTarget));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {children}
      <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/50 pt-5">
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <motion.span
                className="inline-flex"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
              >
                <LoaderCircle size={14} />
              </motion.span>
              Salvando...
            </>
          ) : (
            "Salvar Dados"
          )}
        </PrimaryButton>
      </div>
    </form>
  );
}

export function nullable(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}

export function nullableDate(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? new Date(normalized).toISOString() : null;
}

export function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function toDateInput(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}
