"use client";

import {
    createTransition,
    fadeUpVariants,
    listItemVariants,
    modalVariants,
    motionTokens,
    staggerContainerVariants,
    useMotionPreferences,
} from "@/app/components/ui/motion-system";
import { SkillThreeProgressToast } from "@/app/workspace/_components/skillthree-progress-toast";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { buildSkillThreeExperience } from "@/utils/skillthree/build-skillthree";
import {
  createSkillThreeProgressSnapshot,
  resolveSkillThreeProgressToast,
} from "@/utils/skillthree/progression";
import { PRIVACY_PREFERENCES_OPEN_EVENT } from "@/utils/privacy/preferences";
import {
    getInitials,
    navigationItems,
    planCode,
    resolveSection,
    routeMetaBySection,
} from "@/utils/workspace/helpers";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
    Activity,
    Bell,
    ChartSpline,
    CheckSquare,
    FolderKanban,
    Layers3,
    LayoutDashboard,
    LoaderCircle,
    LogOut,
    Map,
    Menu,
    NotepadText,
    PanelLeft,
    RefreshCcw,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

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
  const { data, loading, user, refreshing, operation, reload, signOut, markNotificationAsRead, markAllNotificationsAsRead } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const commandRef = React.useRef<HTMLDivElement>(null);
  const [showContent, setShowContent] = useState(false);
  const [skillThreeToast, setSkillThreeToast] = useState<ReturnType<typeof resolveSkillThreeProgressToast>>(null);
  const previousSkillThreeProgressRef = React.useRef<ReturnType<typeof createSkillThreeProgressSnapshot> | null>(null);
  const skillThreeProgressReadyRef = React.useRef(false);
  const skillThree = React.useMemo(() => buildSkillThreeExperience(data), [data]);
  const skillThreeActiveTrackId = skillThree.activeTrack?.id ?? null;
  const skillThreeProgressSnapshot = createSkillThreeProgressSnapshot(skillThree);
  
  useEffect(() => {
    if (loading || showContent) {
      return;
    }

    const timer = setTimeout(() => setShowContent(true), 50);
    return () => clearTimeout(timer);
  }, [loading, showContent]);
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        commandRef.current &&
        !commandRef.current.contains(e.target as Node)
      ) {
        setCommandOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (loading || !skillThreeActiveTrackId) {
      previousSkillThreeProgressRef.current = null;
      skillThreeProgressReadyRef.current = false;
      return;
    }

    const currentSnapshot = skillThreeProgressSnapshot;
    const previousSnapshot = previousSkillThreeProgressRef.current;
    previousSkillThreeProgressRef.current = currentSnapshot;

    if (!skillThreeProgressReadyRef.current) {
      skillThreeProgressReadyRef.current = true;
      return;
    }

    if (!previousSnapshot) {
      return;
    }

    const nextToast = resolveSkillThreeProgressToast(previousSnapshot, currentSnapshot);
    if (!nextToast) {
      return;
    }

    setSkillThreeToast(nextToast);
  }, [
    loading,
    skillThreeActiveTrackId,
    skillThreeProgressSnapshot,
  ]);

  useEffect(() => {
    if (!skillThreeToast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSkillThreeToast(null);
    }, 3600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [skillThreeToast]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState("Sincronizando horario");
  const { reduced, hoverLift, press, transition } = useMotionPreferences();
  const section = resolveSection(pathname.split("/").filter(Boolean).slice(1));
  const meta = routeMetaBySection[section];
  const sidebarShellTransition = reduced
    ? "transition-all duration-200"
    : "transition-all duration-400 ease-out";
  const sidebarVariants = {
    collapsed: { width: "96px" },
    expanded: { width: "280px" },
  };

  const initials = getInitials(
    data?.profile?.full_name || user.fullName || user.email,
  );
  const displayName =
    data?.profile?.full_name || user.fullName || "Seu workspace";
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

  return (
    <LayoutGroup id="workspace-shell">
      <motion.div
        className={cx(
          "h-[100dvh] w-full overflow-hidden bg-background font-ui text-on-surface",
          "flex flex-col p-0 md:flex-row",
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
          initial={reduced ? false : { x: -22, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          variants={reduced ? undefined : sidebarVariants}
          transition={createTransition(reduced, reduced ? 0.2 : 0.4)}
          data-testid="workspace-sidebar"
          data-state={collapsed ? "collapsed" : "expanded"}
          className={cx(
            "z-50 shrink-0",
            "fixed inset-y-0 left-0 flex flex-col overflow-hidden border-r border-[#484847]/15 md:relative",
            "w-[280px] md:translate-x-0 h-screen",
            sidebarShellTransition,
            mobileNavOpen
              ? "visible translate-x-0 pointer-events-auto"
              : "invisible -translate-x-full pointer-events-none md:visible md:pointer-events-auto",
            "bg-[#0e0e0e]",
            collapsed ? "md:w-[96px]" : "md:w-[280px]",
          )}
        >
          <div
            className={cx(
              "px-8 py-10",
              collapsed && "px-4 flex flex-col items-center",
            )}
          >
            <div
              className={cx(
                "flex items-center gap-3",
                collapsed && "justify-center",
              )}
            >
              <motion.div
                whileHover={hoverLift}
                transition={transition}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10 shadow-[0_0_18px_rgba(50,208,255,0.14)] shrink-0"
              >
                <Image
                  src={brandMark}
                  alt="CodeTrail Logo"
                  width={34}
                  height={34}
                  className="h-full w-full object-cover"
                  priority
                />
              </motion.div>
              <AnimatePresence initial={false}>
                {!collapsed ? (
                  <motion.div
                    className="flex flex-col"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={createTransition(
                      reduced,
                      reduced ? 0.15 : 0.35,
                    )}
                  >
                    <strong className="text-xl font-bold text-primary tracking-tight uppercase">
                      CodeTrail
                    </strong>
                    <span className="text-[10px] text-on-surface-variant tracking-[0.2em] font-bold mt-1 uppercase">
                      Terminal de Operação
                    </span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <motion.nav
            className="scrollbar-hide flex flex-1 flex-col overflow-y-auto mt-4"
            aria-label="Navegação principal do workspace"
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants(reduced, 0.045)}
          >
            {navigationItems.map((item) => {
              const Icon = icons[item.icon as keyof typeof icons];
              const active =
                section === item.section ||
                (item.section === "settings" && section === "settings-billing");

              return (
                <motion.div
                  key={item.href}
                  layout
                  variants={listItemVariants(reduced)}
                  whileHover={reduced ? undefined : { x: collapsed ? 0 : 4 }}
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
                      "flex items-center gap-3 py-3 transition-all duration-200",
                      collapsed
                        ? "justify-center rounded-2xl mx-4 px-0"
                        : "px-8",
                      active
                        ? "text-primary bg-gradient-to-r from-primary/10 to-transparent border-r-2 border-primary translate-x-1"
                        : "text-on-surface-variant hover:text-white hover:bg-[#1a1a1a]",
                    )}
                  >
                    <motion.span
                      className={cx("relative shrink-0")}
                      animate={
                        active && !reduced ? { scale: [1, 1.06, 1] } : undefined
                      }
                      transition={createTransition(
                        reduced,
                        motionTokens.duration.fast,
                      )}
                    >
                      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                    </motion.span>
                    <AnimatePresence initial={false}>
                      {!collapsed ? (
                        <motion.span
                          className="font-body font-medium text-sm tracking-wide whitespace-nowrap"
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={createTransition(
                            reduced,
                            reduced ? 0.15 : 0.3,
                          )}
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

          <div className={cx("p-6 mt-auto", collapsed && "px-2")}>
            <motion.div
              whileHover={hoverLift}
              whileTap={press}
              transition={transition}
            >
              <Link
                href="/workspace/sessions"
                onClick={() => setMobileNavOpen(false)}
                className={cx(
                  "flex items-center justify-center gap-2 cursor-pointer",
                  "bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed",
                  "font-bold uppercase tracking-widest transition-all",
                  "shadow-[0_0_15px_rgba(129,236,255,0.4)] hover:scale-[1.02] active:scale-95",
                  collapsed
                    ? "w-12 h-12 rounded-full mx-auto"
                    : "w-full py-4 text-xs rounded-full",
                )}
              >
                {collapsed ? <Sparkles size={16} /> : "NOVA SESSÃO"}
              </Link>
            </motion.div>
          </div>
        </motion.aside>

        <motion.main
          layout
          className="flex h-[100dvh] min-w-0 flex-1 flex-col relative overflow-hidden"
        >
          {/* TopNavBar Anchor */}
          <motion.header
            layout
            className="w-full sticky top-0 z-50 bg-surface-container-low/30 backdrop-blur-lg flex flex-col md:flex-row md:justify-between md:items-center px-4 py-4 md:px-8 shadow-[0_4px_12px_rgba(0,0,0,0.1)] gap-4 border-b border-outline-variant/5"
          >
            <div className="flex items-center gap-4 md:gap-8">
              <button
                className="shrink-0 text-on-surface-variant hover:text-white transition-colors"
                onClick={() => {
                  if (window.innerWidth < 768) setMobileNavOpen(true);
                  else setCollapsed(!collapsed);
                }}
                aria-label="Alternar sidebar"
                title="Alternar sidebar"
              >
                <span className="md:hidden">
                  <Menu size={18} />
                </span>
                <span className="hidden md:inline-block">
                  <PanelLeft size={18} />
                </span>
              </button>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6">
                <div className="hidden lg:block relative">
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {meta.title}
                  </h2>
                  <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
                    {dateLabel}
                  </span>
                </div>

                {/* COMMAND SEARCH */}
                <div className="relative group w-full md:w-80" ref={commandRef}>
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary z-10"
                  />
                  <input
                    type="text"
                    placeholder="Buscar comando... (Pressione /)"
                    onFocus={() => setCommandOpen(true)}
                    className="bg-surface-container-low border border-outline-variant/10 rounded-full pl-10 pr-10 py-2 text-sm text-on-surface w-full outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner relative z-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[10px] font-bold bg-surface-container py-0.5 px-1.5 rounded border border-outline-variant/20 z-10">
                    /
                  </div>

                  <AnimatePresence>
                    {commandOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-surface-container-high/90 backdrop-blur-xl border border-outline-variant/20 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] overflow-hidden z-50 flex flex-col"
                      >
                        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary border-b border-outline-variant/10 bg-surface-container-low">
                          Acesso Rápido
                        </div>
                        <div className="flex flex-col py-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                          {navigationItems.map((item) => {
                            const Icon = icons[item.icon as keyof typeof icons];
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setCommandOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                              >
                                <Icon size={16} />
                                <span className="font-medium tracking-wide">
                                  {item.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 md:gap-6 shrink-0">
              {/* Quick Stats / Streak */}
              <div className="hidden lg:flex items-center bg-surface-container-highest px-3 py-1.5 rounded-lg border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mr-2">
                  Ofensiva
                </span>
                <Activity
                  size={14}
                  className="text-primary mr-1 drop-shadow-[0_0_8px_rgba(129,236,255,0.6)]"
                />
                <strong className="text-xs font-black text-white italic">
                  {summary?.streakDays ?? 0}
                </strong>
              </div>

              {/* Actions */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => void reload()}
                disabled={refreshing}
                className="text-on-surface-variant hover:text-primary transition-all p-1 hidden sm:block"
                title="Sincronizar"
              >
                <motion.span
                  animate={refreshing ? { rotate: 360 } : {}}
                  transition={
                    refreshing
                      ? { duration: 1, ease: "linear", repeat: Infinity }
                      : {}
                  }
                >
                  <RefreshCcw size={18} />
                </motion.span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotificationsOpen(true)}
                className="relative text-on-surface-variant hover:text-primary transition-all p-1"
                title="Notificações"
              >
                <Bell size={18} />
                {data?.notifications && data.notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                    {data.notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent(PRIVACY_PREFERENCES_OPEN_EVENT),
                  )
                }
                className="text-on-surface-variant hover:text-primary transition-all p-1"
                title="Privacidade"
              >
                <ShieldCheck size={18} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => void signOut()}
                className="text-on-surface-variant hover:text-error transition-all p-1 hidden sm:block"
                title="Sair"
              >
                <LogOut size={18} />
              </motion.button>

              <div className="w-px h-6 bg-outline-variant/20 mx-1"></div>

              {/* User Avatar distinct */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <strong className="text-[11px] font-bold text-white uppercase tracking-wider">
                    {displayName}
                  </strong>
                  <span className="text-[9px] text-primary tracking-widest uppercase">
                    {currentPlan === "free" ? "ACESSO_BÁSICO" : "MEMBRO_PRO"}
                  </span>
                </div>
                {data?.profile?.avatar_url ? (
                  <img 
                    src={data.profile.avatar_url} 
                    alt="Avatar" 
                    className="h-10 w-10 rounded-full object-cover border border-outline-variant/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-surface-container-highest border border-outline-variant/20 overflow-hidden flex items-center justify-center text-on-surface font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </motion.header>

          <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
            {showContent ? (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative p-4 sm:p-5 md:p-8 max-w-[1600px] mx-auto"
              >
                {children}
              </motion.div>
            ) : (
              <div className="relative p-4 sm:p-5 md:p-8 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <span className="text-sm text-on-surface-variant animate-pulse">Carregando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.main>

        <AnimatePresence>
          {skillThreeToast ? (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: reduced ? 0 : 0.18 }}
            >
              <SkillThreeProgressToast
                xpDelta={skillThreeToast.xpDelta}
                levelUpTo={skillThreeToast.levelUpTo}
                unlockedDelta={skillThreeToast.unlockedDelta}
                currentXp={skillThreeToast.currentXp}
                nextLevelXp={skillThreeToast.nextLevelXp}
              />
            </motion.div>
          ) : null}
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
                transition={createTransition(
                  reduced,
                  motionTokens.duration.fast,
                )}
              />
              <motion.div
                className="relative z-10 flex w-full max-w-lg flex-col gap-5 border border-primary/20 bg-surface-container/90 px-6 py-8 text-center shadow-[0_32px_80px_rgba(0,0,0,0.6)] rounded-2xl backdrop-blur-xl"
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
                            "0 0 0 rgba(129,236,255,0)",
                            "0 0 0 15px rgba(129,236,255,0.15)",
                            "0 0 0 rgba(129,236,255,0)",
                          ],
                        }
                  }
                  transition={{
                    duration: 2.2,
                    repeat: reduced ? 0 : Number.POSITIVE_INFINITY,
                    ease: "easeOut",
                  }}
                >
                  <LoaderCircle
                    size={24}
                    className="animate-spin text-primary"
                  />
                </motion.div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                    PROCESSANDO
                  </span>
                  <strong className="text-2xl font-black text-white uppercase tracking-wide">
                    {operation.title}
                  </strong>
                  <p className="mx-auto max-w-md text-sm leading-relaxed text-on-surface-variant font-medium">
                    {operation.message}
                  </p>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full border border-outline-variant/10 bg-white/[0.04] mt-2">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-fixed neon-glow"
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

        {/* Notifications Modal */}
        <AnimatePresence>
          {notificationsOpen && (
            <motion.div
              className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-background/82 backdrop-blur-md"
                onClick={() => setNotificationsOpen(false)}
              />
              <motion.div
                className="relative z-10 flex w-full max-w-md flex-col gap-4 border border-primary/20 bg-surface-container/90 px-6 py-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)] rounded-2xl backdrop-blur-xl max-h-[80vh] overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/10">
                  <h2 className="text-lg font-bold text-white">Notificações</h2>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-on-surface-variant hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {data?.notifications && data.notifications.length > 0 ? (
                    <>
                      <div className="flex justify-end pb-2">
                        <button
                          onClick={() => void markAllNotificationsAsRead()}
                          className="text-xs text-primary hover:underline"
                        >
                          Marcar todas como lidas
                        </button>
                      </div>
                      {data.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            if (!notification.is_read) {
                              void markNotificationAsRead(notification.id);
                            }
                          }}
                          className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                            notification.is_read
                              ? "bg-transparent border-transparent opacity-60"
                              : "bg-surface-container-highest border-primary/20 hover:bg-surface-container-high"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold ${notification.is_read ? "text-on-surface-variant" : "text-white"}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-on-surface-variant/60 mt-2">
                                {new Date(notification.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Bell size={40} className="mx-auto text-on-surface-variant/30 mb-3" />
                      <p className="text-sm text-on-surface-variant">Nenhuma notificação</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
