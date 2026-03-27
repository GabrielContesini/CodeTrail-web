"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { IconButton, Pill, PrimaryButton } from "@/app/workspace/_components/workspace-ui";
import {
  createTransition,
  fadeUpVariants,
  listItemVariants,
  modalVariants,
  motionTokens,
  staggerContainerVariants,
  useMotionPreferences,
} from "@/app/components/ui/motion-system";
import {
  getInitials,
  navigationItems,
  planCode,
  resolveSection,
  routeMetaBySection,
} from "@/utils/workspace/helpers";
import {
  Activity,
  BookOpen,
  ChartSpline,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Layers3,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Map,
  Menu,
  NotepadText,
  RefreshCcw,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const brandMark = "/design/CodeTrailMainIcon.png";

const icons = {
  dashboard: LayoutDashboard,
  layers: Layers3,
  timer: Activity,
  checklist: CheckSquare,
  rotate: RefreshCcw,
  folder: FolderKanban,
  notes: NotepadText,
  cards: Sparkles,
  mindmap: Map,
  analytics: ChartSpline,
  settings: Settings,
} as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, user, refreshing, operation, reload, signOut } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState("Sincronizando horario");
  const { reduced, hoverLift, press, transition } = useMotionPreferences();
  const section = resolveSection(pathname.split("/").filter(Boolean).slice(1));
  const meta = routeMetaBySection[section];

  const initials = getInitials(data?.profile?.full_name || user.fullName || user.email);
  const displayName = data?.profile?.full_name || user.fullName || "Seu workspace";
  const currentPlan = planCode(data?.billing ?? null);
  const summary = data?.dashboardSummary;
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const syncDateLabel = () => {
      setDateLabel(formatter.format(new Date()));
    };

    syncDateLabel();

    const intervalId = window.setInterval(syncDateLabel, 60_000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const sidebarStats = [
    { label: "Horas semana", value: `${summary?.hoursThisWeek.toFixed(1) ?? "0.0"}h` },
    { label: "Pendências", value: `${summary?.pendingTasks ?? 0}` },
  ];
  const iconLinkClass =
    "touch-target inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent text-text-secondary transition-[color,background-color,border-color,transform] duration-200 hover:border-border/80 hover:bg-white/[0.05] hover:text-white";

  return (
    <LayoutGroup id="workspace-shell">
      <motion.div
        className={cx(
          "h-[100dvh] w-full overflow-hidden bg-background font-ui text-text-primary",
          "flex flex-col gap-4 p-0 md:flex-row md:gap-5 md:p-4 lg:gap-6 lg:p-5",
        )}
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants(reduced, 18)}
      >
        <AnimatePresence>
          {mobileNavOpen ? (
            <motion.div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileNavOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={createTransition(reduced, motionTokens.duration.fast)}
            />
          ) : null}
        </AnimatePresence>

        <motion.aside
          layout
          transition={transition}
          initial={reduced ? false : { x: -22, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          data-testid="workspace-sidebar"
          data-state={collapsed ? "collapsed" : "expanded"}
          className={cx(
            "workspace-panel workspace-panel--elevated z-50 shrink-0",
            "fixed inset-y-0 left-0 flex flex-col gap-6 border-y-0 border-l-0 rounded-none md:relative md:rounded-2xl md:border-y md:border-l",
            "w-[280px] -translate-x-full md:translate-x-0",
            mobileNavOpen && "translate-x-0 border-r",
            collapsed ? "md:w-[88px] items-center px-3 py-5" : "md:w-[280px] p-5 lg:p-6",
          )}
        >
          <motion.div
            layout
            transition={transition}
            className={cx(
              "w-full",
              collapsed ? "flex flex-col items-center gap-3" : "relative flex items-center justify-between",
            )}
          >
            <motion.div layout className={cx("flex items-center gap-3", collapsed && "justify-center")}>
              <motion.div
                whileHover={hoverLift}
                transition={transition}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_18px_rgba(50,208,255,0.14)]"
              >
                <Image
                  src={brandMark}
                  alt="CodeTrail"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  priority
                />
              </motion.div>
              <AnimatePresence initial={false}>
                {!collapsed ? (
                  <motion.div
                    className="flex flex-col"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={createTransition(reduced, motionTokens.duration.fast)}
                  >
                    <strong className="font-display text-base leading-none tracking-tight text-white">CodeTrail</strong>
                    <span className="mt-1 text-[10px] uppercase tracking-widest text-primary/80">Sistema do workspace</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>

            <div className={cx("flex items-center gap-2", collapsed && "w-full justify-center")}>
              <IconButton
                className="hidden opacity-0 md:flex md:opacity-100"
                onClick={() => setCollapsed((value) => !value)}
                aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
                title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
              >
                <motion.span
                  animate={{ rotate: collapsed ? 0 : 0 }}
                  transition={transition}
                  className="inline-flex"
                >
                  {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </motion.span>
              </IconButton>
              <IconButton
                className="md:hidden"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Fechar sidebar"
                title="Fechar sidebar"
              >
                <X size={18} />
              </IconButton>
            </div>
          </motion.div>

          <AnimatePresence initial={false}>
            {!collapsed ? (
              <motion.div
                className="mt-1 grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={createTransition(reduced, motionTokens.duration.fast)}
              >
                {sidebarStats.map((item) => (
                  <motion.div
                    key={item.label}
                    whileHover={hoverLift}
                    transition={transition}
                    className="flex flex-col rounded-2xl border border-border/60 bg-white/[0.03] p-3"
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary">{item.label}</span>
                    <strong className="mt-1 font-display text-lg text-white">{item.value}</strong>
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div className="w-full" layout>
            <motion.div whileHover={hoverLift} whileTap={press} transition={transition}>
              <Link
                href="/workspace/sessions"
                onClick={() => setMobileNavOpen(false)}
                className="workspace-button workspace-button--primary touch-target w-full text-xs uppercase tracking-widest"
              >
                <BookOpen size={16} className={collapsed ? "mx-auto" : ""} />
                <AnimatePresence initial={false}>
                  {!collapsed ? (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={createTransition(reduced, motionTokens.duration.fast)}
                    >
                      Nova sessão
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </Link>
            </motion.div>
          </motion.div>

          <motion.nav
            className="scrollbar-hide -mx-2 flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-3"
            aria-label="Navegação principal do workspace"
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants(reduced, 0.045)}
          >
            <AnimatePresence initial={false}>
              {!collapsed ? (
                <motion.span
                  className="mb-2 mt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={createTransition(reduced, motionTokens.duration.fast)}
                >
                  Sistemas
                </motion.span>
              ) : null}
            </AnimatePresence>

            {navigationItems.map((item) => {
              const Icon = icons[item.icon as keyof typeof icons];
              const active = section === item.section || (item.section === "settings" && section === "settings-billing");

              return (
                <motion.div
                  key={item.href}
                  layout
                  variants={listItemVariants(reduced)}
                  whileHover={reduced ? undefined : { x: collapsed ? 0 : 2 }}
                  whileTap={press}
                  transition={transition}
                >
                  <Link
                    href={item.href}
                    data-testid={`workspace-nav-${item.section}`}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileNavOpen(false)}
                  className={cx(
                      "relative flex items-center overflow-hidden border border-transparent px-3 py-3.5 text-sm font-medium transition-[color,border-color,background-color] duration-200",
                      collapsed ? "justify-center rounded-2xl" : "gap-3 rounded-[20px]",
                      active
                        ? "border-primary/20 text-white"
                        : "text-text-secondary hover:border-border/70 hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="workspace-nav-active"
                        className="absolute inset-0 rounded-[20px] border border-primary/18 bg-primary/10 shadow-[inset_2px_0_0_#32d0ff]"
                        transition={motionTokens.spring.soft}
                      />
                    ) : null}
                    <motion.span
                      className={cx("relative z-10", active ? "text-primary" : "")}
                      animate={active && !reduced ? { scale: [1, 1.06, 1] } : undefined}
                      transition={createTransition(reduced, motionTokens.duration.fast)}
                    >
                      <Icon size={18} />
                    </motion.span>
                    <AnimatePresence initial={false}>
                      {!collapsed ? (
                        <motion.span
                          className="relative z-10"
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={createTransition(reduced, motionTokens.duration.fast)}
                        >
                          {item.label}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>

          <motion.div layout className="mt-auto flex flex-col gap-4 border-t border-border pt-5">
            <motion.div layout className={cx("flex items-center gap-3", collapsed && "justify-center")}>
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-white/[0.03] font-display text-text-secondary"
                whileHover={hoverLift}
                transition={transition}
              >
                {initials}
              </motion.div>
              <AnimatePresence initial={false}>
                {!collapsed ? (
                  <motion.div
                    className="min-w-0 flex flex-col"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={createTransition(reduced, motionTokens.duration.fast)}
                  >
                    <strong className="truncate text-sm font-display text-white">{displayName}</strong>
                    <span className="truncate text-xs text-text-secondary">{user.email}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence initial={false}>
              {!collapsed ? (
                <motion.div
                  className="flex flex-col gap-4"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={createTransition(reduced, motionTokens.duration.fast)}
                >
                  <div className="flex items-center justify-between">
                    <motion.div whileHover={hoverLift} whileTap={press} transition={transition}>
                      <Link
                        href="/workspace/settings"
                        onClick={() => setMobileNavOpen(false)}
                        className="rounded-full transition-[opacity,color] duration-200 hover:opacity-100"
                        title="Abrir opções da conta"
                      >
                        <Pill tone={currentPlan === "free" ? "neutral" : "primary"}>
                          {currentPlan}
                        </Pill>
                      </Link>
                    </motion.div>

                    <div className="mr-1 flex items-center gap-1">
                      <motion.div whileHover={hoverLift} whileTap={press} transition={transition}>
                        <Link
                          href="/workspace/settings/billing"
                          aria-label="Abrir billing"
                          title="Abrir billing"
                          onClick={() => setMobileNavOpen(false)}
                          className={iconLinkClass}
                        >
                          <Sparkles size={14} />
                        </Link>
                      </motion.div>
                      <motion.div whileHover={hoverLift} whileTap={press} transition={transition}>
                        <Link
                          href="/workspace/settings"
                          aria-label="Abrir configurações"
                          title="Abrir configurações"
                          onClick={() => setMobileNavOpen(false)}
                          className={iconLinkClass}
                        >
                          <Settings size={14} />
                        </Link>
                      </motion.div>
                      <IconButton aria-label="Sair da conta" title="Sair da conta" onClick={() => void signOut()}>
                        <LogOut size={14} />
                      </IconButton>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={createTransition(reduced, motionTokens.duration.fast)}
                >
                  <motion.div whileHover={hoverLift} whileTap={press} transition={transition}>
                    <Link
                      href="/workspace/settings/billing"
                      aria-label="Abrir billing"
                      title="Abrir billing"
                      className={cx(iconLinkClass, "w-10")}
                    >
                      <Sparkles size={16} />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={hoverLift} whileTap={press} transition={transition}>
                    <Link
                      href="/workspace/settings"
                      aria-label="Abrir configurações"
                      title="Abrir configurações"
                      className={cx(iconLinkClass, "w-10")}
                    >
                      <Settings size={16} />
                    </Link>
                  </motion.div>
                  <IconButton aria-label="Sair da conta" title="Sair da conta" className="w-10" onClick={() => void signOut()}>
                    <LogOut size={16} />
                  </IconButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.aside>

        <motion.main layout className="flex h-full min-w-0 flex-1 flex-col">
          <motion.header
            layout
            className="workspace-panel workspace-panel--muted z-20 mb-5 grid shrink-0 grid-cols-1 items-start gap-5 rounded-none border-x-0 border-t-0 p-5 md:rounded-2xl md:border-x md:border-t md:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8"
          >
            <motion.div className="flex min-w-0 items-start gap-4 sm:gap-5" variants={fadeUpVariants(reduced, 12)}>
              <IconButton
                className="mt-0.5 shrink-0 md:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Abrir sidebar"
                title="Abrir sidebar"
              >
                <Menu size={18} />
              </IconButton>
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">{dateLabel}</span>
                  <motion.span
                    className="h-1 w-1 rounded-full bg-primary/50"
                    animate={reduced ? undefined : { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                  <motion.h2
                    key={meta.title}
                    className="m-0 text-lg font-display font-medium leading-none text-white"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={createTransition(reduced, motionTokens.duration.fast)}
                  >
                    {meta.title}
                  </motion.h2>
                </div>
                <motion.p
                  key={meta.subtitle}
                  className="m-0 max-w-xl text-sm leading-relaxed text-text-secondary xl:max-w-2xl"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={createTransition(reduced, motionTokens.duration.fast)}
                >
                  {meta.subtitle}
                </motion.p>
              </div>
            </motion.div>

            <motion.div
              layout
              className="flex w-full flex-wrap items-center gap-2.5 overflow-x-auto pb-1 lg:w-auto lg:justify-self-end lg:pb-0"
            >
              <motion.div
                whileHover={hoverLift}
                transition={transition}
                className="flex min-w-[152px] flex-col gap-1 rounded-2xl border border-border/70 bg-white/[0.03] px-4 py-3"
              >
                <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Consistência</span>
                <div className="flex items-baseline">
                  <strong className="font-display text-base leading-none text-white">{summary?.streakDays ?? 0} dias</strong>
                </div>
              </motion.div>
              <motion.div whileHover={hoverLift} whileTap={press} transition={transition}>
                <Link
                  href="/workspace/settings"
                  className="workspace-button workspace-button--secondary touch-target text-sm"
                >
                  <Settings size={14} />
                  Ajustes
                </Link>
              </motion.div>

              <PrimaryButton disabled={refreshing} onClick={() => void reload()}>
                <motion.span
                  animate={refreshing && !reduced ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    refreshing && !reduced
                      ? { duration: 1, ease: "linear", repeat: Number.POSITIVE_INFINITY }
                      : createTransition(reduced, motionTokens.duration.fast)
                  }
                  className="inline-flex"
                >
                  <RefreshCcw size={14} />
                </motion.span>
                {operation?.key === "workspace-reload" ? "Sincronizando..." : "Sincronizar"}
              </PrimaryButton>
            </motion.div>
          </motion.header>

          <div className="relative flex-1 overflow-y-auto px-4 pb-10 sm:px-5 md:px-0 md:pb-0">
            <motion.div layout className="relative">
              {children}
            </motion.div>
          </div>
        </motion.main>

        <AnimatePresence>
          {operation ? (
            <motion.div
              data-testid="workspace-operation-modal"
              className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={createTransition(reduced, motionTokens.duration.fast)}
            >
              <motion.div
                className="absolute inset-0 bg-background/82 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={createTransition(reduced, motionTokens.duration.fast)}
              />
              <motion.div
                className="glass-panel relative z-10 flex w-full max-w-lg flex-col gap-5 border border-primary/20 px-6 py-7 text-center shadow-[0_32px_80px_rgba(0,0,0,0.35)]"
                variants={modalVariants(reduced)}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10"
                  animate={
                    reduced
                      ? undefined
                      : {
                          boxShadow: [
                            "0 0 0 rgba(50,208,255,0)",
                            "0 0 0 12px rgba(50,208,255,0.08)",
                            "0 0 0 rgba(50,208,255,0)",
                          ],
                        }
                  }
                  transition={{ duration: 2.2, repeat: reduced ? 0 : Number.POSITIVE_INFINITY, ease: "easeOut" }}
                >
                  <LoaderCircle size={24} className="animate-spin text-primary" />
                </motion.div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    Processando
                  </span>
                  <strong className="font-display text-2xl text-white">
                    {operation.title}
                  </strong>
                  <p className="mx-auto max-w-md text-sm leading-relaxed text-text-secondary">
                    {operation.message}
                  </p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full border border-border/60 bg-white/[0.04]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-[#7de7ff] to-accent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: reduced ? 0.01 : 1.15,
                      repeat: reduced ? 0 : Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
