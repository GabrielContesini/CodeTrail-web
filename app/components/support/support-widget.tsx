"use client";

import {
  useMotionPreferences,
  useStableReducedMotion,
} from "@/app/components/ui/motion-system";
import { SupportChatPanel } from "@/app/components/support/support-chat-panel";
import { SupportTicketModal } from "@/app/components/support/support-ticket-modal";
import { createClient, hasSupabaseClientEnv } from "@/utils/supabase/client";
import {
  sanitizeSupportMessageBody,
  validateSupportMessageBody,
  type SupportChatConversationSummary,
  type SupportChatConversationThread,
  type SupportChatMessage,
  type SupportChatViewerRole,
} from "@/utils/support/chat-shared";
import {
  sanitizeSupportInput,
  validateSupportInput,
  type SupportFieldErrorMap,
  type SupportOrigin,
} from "@/utils/support/shared";
import { motion } from "framer-motion";
import { LifeBuoy } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type KeyboardEvent,
  type MutableRefObject,
  type SetStateAction,
} from "react";

const CHAT_LIST_REFRESH_MS = 12000;
const CHAT_THREAD_REFRESH_MS = 5000;

type LocalChatMessage = SupportChatMessage & {
  optimistic?: boolean;
};

interface SupportWidgetFeedback {
  tone: "success" | "error";
  title: string;
  message: string;
}

interface SupportFormState {
  name: string;
  email: string;
  subject: string;
  description: string;
}

interface SupportChatConversationsResponse {
  viewerRole?: SupportChatViewerRole;
  isMaster?: boolean;
  conversations?: SupportChatConversationSummary[];
  storageReady?: boolean;
  error?: string;
}

interface SupportChatThreadResponse extends SupportChatConversationThread {
  storageReady?: boolean;
  error?: string;
}

interface SupportChatMessageResponse {
  message?: SupportChatMessage;
  error?: string;
  storageReady?: boolean;
}

export function SupportWidget({
  origin,
  prefillAuthenticatedUser = false,
}: {
  origin: SupportOrigin;
  prefillAuthenticatedUser?: boolean;
}) {
  const reducedMotion = useStableReducedMotion();
  const { hoverLift, press, transition } = useMotionPreferences();
  const prefillAttemptedRef = useRef(false);
  const threadRefreshLockRef = useRef(false);
  const lastIncomingMessageAtRef = useRef<Map<string, string>>(new Map());
  const lastConversationSeenAtRef = useRef<Map<string, string>>(new Map());
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authResolved, setAuthResolved] = useState(!prefillAuthenticatedUser);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SupportFieldErrorMap>({});
  const [feedback, setFeedback] = useState<SupportWidgetFeedback | null>(null);
  const [form, setForm] = useState<SupportFormState>({
    name: "",
    email: "",
    subject: "",
    description: "",
  });

  const [chatStorageReady, setChatStorageReady] = useState<boolean | null>(
    prefillAuthenticatedUser ? null : false,
  );
  const [viewerRole, setViewerRole] =
    useState<SupportChatViewerRole>("customer");
  const [isMaster, setIsMaster] = useState(false);
  const [chatListLoading, setChatListLoading] = useState(false);
  const [chatThreadLoading, setChatThreadLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("Voce");
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(
    null,
  );
  const [conversationList, setConversationList] = useState<
    SupportChatConversationSummary[]
  >([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [composer, setComposer] = useState("");
  const supabaseNotificationClient = useMemo(() => createClient(), []);

  const activeConversation = useMemo(
    () =>
      conversationList.find(
        (conversation) => conversation.id === selectedConversationId,
      ) ?? null,
    [conversationList, selectedConversationId],
  );

  const unreadCount = useMemo(
    () =>
      conversationList.reduce(
        (total, conversation) => total + conversation.unreadCountForViewer,
        0,
      ),
    [conversationList],
  );

  const showChatPanel = authenticated && chatStorageReady === true;
  const chatFallbackNotice = useMemo(() => {
    if (authenticated && chatStorageReady === false) {
      return "O banco do chat persistente ainda nao foi habilitado neste ambiente. O suporte continua disponivel pelo ticket abaixo ate o storage ser ativado.";
    }

    if (!authenticated) {
      return "Faca login para liberar o chat persistente com historico, status de entrega e leitura. Sem sessao, o suporte continua funcionando via ticket.";
    }

    return null;
  }, [authenticated, chatStorageReady]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (!submitting && !chatSending) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [chatSending, open, submitting]);

  useEffect(() => {
    if (
      !prefillAuthenticatedUser ||
      prefillAttemptedRef.current ||
      !hasSupabaseClientEnv()
    ) {
      setAuthResolved(true);
      return;
    }

    prefillAttemptedRef.current = true;

    async function loadPrefill() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setAuthResolved(true);
          return;
        }

        setCurrentUserId(user.id);
        let fullName =
          typeof user.user_metadata.full_name === "string"
            ? user.user_metadata.full_name
            : "";

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.full_name) {
            fullName = profile.full_name;
          }

          if (profile?.avatar_url) {
            setCurrentUserAvatarUrl(profile.avatar_url);
          }
        } catch {
          // Mantem o fallback da metadata.
        }

        setAuthenticated(true);
        setCurrentUserName(fullName || user.email || "Voce");
        setCurrentUserAvatarUrl((current) =>
          current ??
          (typeof user.user_metadata.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null),
        );
        setForm((current) => ({
          ...current,
          name: current.name || fullName || "",
          email: current.email || user.email || "",
        }));
      } finally {
        setAuthResolved(true);
      }
    }

    void loadPrefill();
  }, [prefillAuthenticatedUser]);

  useEffect(() => {
    if (!prefillAuthenticatedUser || !hasSupabaseClientEnv()) {
      return;
    }

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;

      if (!user) {
        setCurrentUserId(null);
        setCurrentUserName("Voce");
        setCurrentUserAvatarUrl(null);
        setAuthenticated(false);
        setChatStorageReady(false);
        setConversationList([]);
        setMessages([]);
        setSelectedConversationId(null);
        return;
      }

      setCurrentUserId(user.id);
      let fullName =
        typeof user.user_metadata.full_name === "string"
          ? user.user_metadata.full_name
          : "";

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.full_name) {
          fullName = profile.full_name;
        }

        if (profile?.avatar_url) {
          setCurrentUserAvatarUrl(profile.avatar_url);
        }
      } catch {
        // Mantem o fallback vindo da metadata.
      }

      setAuthenticated(true);
      setAuthResolved(true);
      setCurrentUserName(fullName || user.email || "Voce");
      setCurrentUserAvatarUrl((current) =>
        current ??
        (typeof user.user_metadata.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null),
      );
      setChatStorageReady((current) => (current === false ? null : current));
      setForm((current) => ({
        ...current,
        name: current.name || fullName || "",
        email: current.email || user.email || "",
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [prefillAuthenticatedUser]);

  useEffect(() => {
    if (!currentUserId) return;

    let active = true;

    async function loadNotificationPreference() {
      try {
        const { data: settings } = await supabaseNotificationClient
          .from("app_settings")
          .select("notifications_enabled")
          .eq("user_id", currentUserId)
          .maybeSingle();

        if (active && settings) {
          setNotificationsEnabled(settings.notifications_enabled);
        }
      } catch {
        // Mantém habilitado por padrão se não conseguir ler.
      }
    }

    void loadNotificationPreference();

    return () => {
      active = false;
    };
  }, [currentUserId, supabaseNotificationClient]);

  useEffect(() => {
    if (!authResolved || !authenticated || !hasSupabaseClientEnv()) {
      return;
    }

    let active = true;

    async function loadConversations(showLoader: boolean) {
      if (showLoader) {
        setChatListLoading(true);
      }

      try {
        const response = await fetch("/api/support/chat/conversations?limit=50", {
          cache: "no-store",
        });
        const result =
          (await readJson<SupportChatConversationsResponse>(response)) ?? null;

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (result?.storageReady === false) {
            setChatStorageReady(false);
            setChatError(null);
            setConversationList([]);
            setMessages([]);
            setSelectedConversationId(null);
            return;
          }

          if (response.status === 401) {
            setAuthenticated(false);
            setChatStorageReady(false);
          }

          setChatError(
            result?.error ??
              "Nao foi possivel sincronizar o canal de suporte agora.",
          );
          return;
        }

        const nextConversations = result?.conversations ?? [];
        setViewerRole(result?.viewerRole ?? "customer");
        setIsMaster(Boolean(result?.isMaster));
        setChatStorageReady(result?.storageReady !== false);
        setChatError(null);
        setConversationList(nextConversations);
        setSelectedConversationId((current) =>
          getNextSelectedConversationId(current, nextConversations),
        );

        if (currentUserId && notificationsEnabled) {
          void notifyFromConversationSummaries(
            nextConversations,
            currentUserId,
            lastConversationSeenAtRef,
            supabaseNotificationClient,
          );
        }
      } catch {
        if (!active) {
          return;
        }

        setChatError("Nao foi possivel sincronizar o canal de suporte agora.");
      } finally {
        if (active && showLoader) {
          setChatListLoading(false);
        }
      }
    }

    void loadConversations(true);

    const interval = window.setInterval(() => {
      void loadConversations(false);
    }, open ? CHAT_LIST_REFRESH_MS : CHAT_LIST_REFRESH_MS * 2);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authResolved, authenticated, open]);

  useEffect(() => {
    if (conversationList.length === 0) {
      if (selectedConversationId !== null) {
        setSelectedConversationId(null);
      }
      return;
    }

    if (!selectedConversationId) {
      setSelectedConversationId(conversationList[0]?.id ?? null);
      return;
    }

    if (!conversationList.some((item) => item.id === selectedConversationId)) {
      setSelectedConversationId(conversationList[0]?.id ?? null);
    }
  }, [conversationList, selectedConversationId]);

  useEffect(() => {
    if (
      !open ||
      !authenticated ||
      chatStorageReady !== true ||
      isMaster ||
      conversationList.length > 0
    ) {
      return;
    }

    let active = true;

    async function bootstrapConversation() {
      setChatThreadLoading(true);

      try {
        const response = await fetch("/api/support/chat/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin,
            pageUrl: window.location.href,
            subject: form.subject || undefined,
          }),
        });
        const result =
          (await readJson<SupportChatThreadResponse>(response)) ?? null;

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (result?.storageReady === false) {
            setChatStorageReady(false);
            setMessages([]);
            return;
          }

          setChatError(
            result?.error ?? "Nao foi possivel preparar o chat agora.",
          );
          return;
        }

        const conversation = result?.conversation ?? null;
        if (!conversation) {
          setChatError("Nao foi possivel preparar o chat agora.");
          return;
        }

        const nextViewerRole = result?.viewerRole ?? "customer";

        setViewerRole(nextViewerRole);
        setIsMaster(Boolean(result?.isMaster));
        setChatStorageReady(result?.storageReady !== false);
        setChatError(null);
        setConversationList([conversation]);
        setSelectedConversationId(conversation.id);
        setMessages(result?.messages ?? []);
      } catch {
        if (!active) {
          return;
        }

        setChatError("Nao foi possivel preparar o chat agora.");
      } finally {
        if (active) {
          setChatThreadLoading(false);
        }
      }
    }

    void bootstrapConversation();

    return () => {
      active = false;
    };
  }, [
    authenticated,
    chatStorageReady,
    conversationList.length,
    form.subject,
    isMaster,
    open,
    origin,
  ]);

  useEffect(() => {
    if (
      !open ||
      !authenticated ||
      chatStorageReady !== true ||
      !selectedConversationId
    ) {
      return;
    }

    let active = true;

    async function loadThread(showLoader: boolean) {
      const conversationId = selectedConversationId;

      if (!conversationId) {
        return;
      }

      if (threadRefreshLockRef.current) {
        return;
      }

      threadRefreshLockRef.current = true;

      if (showLoader) {
        setChatThreadLoading(true);
      }

      try {
        const response = await fetch(
          `/api/support/chat/conversations/${conversationId}`,
          {
            cache: "no-store",
          },
        );
        const result = (await readJson<SupportChatThreadResponse>(response)) ?? null;

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (result?.storageReady === false) {
            setChatStorageReady(false);
            setMessages([]);
            return;
          }

          setChatError(
            result?.error ?? "Nao foi possivel carregar a conversa agora.",
          );
          return;
        }

        if (!result?.conversation) {
          setChatError("Nao foi possivel carregar a conversa agora.");
          return;
        }

        const nextViewerRole = result?.viewerRole ?? "customer";

        setViewerRole(nextViewerRole);
        setIsMaster(Boolean(result?.isMaster));
        setChatError(null);
        setConversationList((current) =>
          upsertConversation(current, result.conversation),
        );
        setMessages(result.messages ?? []);

        if (result.conversation && result.messages) {
          void handleIncomingNotifications(
            result.messages,
            result.conversation,
            nextViewerRole,
            currentUserId,
            notificationsEnabled,
            lastIncomingMessageAtRef,
            supabaseNotificationClient,
          );
        }

        if (hasUnreadIncomingMessage(result.messages ?? [], nextViewerRole)) {
          await markConversationAsRead(
            conversationId,
            nextViewerRole,
            active,
            setConversationList,
            setMessages,
          );
        }
      } catch {
        if (active) {
          setChatError("Nao foi possivel carregar a conversa agora.");
        }
      } finally {
        threadRefreshLockRef.current = false;
        if (active && showLoader) {
          setChatThreadLoading(false);
        }
      }
    }

    void loadThread(true);

    const interval = window.setInterval(() => {
      void loadThread(false);
    }, CHAT_THREAD_REFRESH_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
      threadRefreshLockRef.current = false;
    };
  }, [authenticated, chatStorageReady, open, selectedConversationId]);

  function updateField(field: keyof SupportFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSupportTicketSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFeedback(null);

    const payload = sanitizeSupportInput({
      ...form,
      origin,
      authenticated,
      pageUrl:
        typeof window !== "undefined" ? window.location.href : "",
    });
    const validation = validateSupportInput(payload);

    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      setFeedback({
        tone: "error",
        title: "Revise os dados",
        message:
          "Preencha os campos obrigatorios para enviar sua mensagem.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await readJson<{
        error?: string;
        fieldErrors?: SupportFieldErrorMap;
        message?: string;
      }>(response);

      if (!response.ok) {
        setFieldErrors(result?.fieldErrors ?? {});
        setFeedback({
          tone: "error",
          title: "Nao foi possivel enviar",
          message:
            result?.error ??
            "O suporte nao pode receber sua mensagem agora. Tente novamente em instantes.",
        });
        return;
      }

      setFieldErrors({});
      setFeedback({
        tone: "success",
        title: "Mensagem enviada",
        message:
          result?.message ??
          "Sua mensagem foi enviada com sucesso. Nosso suporte retornara em breve.",
      });
      setForm((current) => ({
        ...current,
        subject: "",
        description: "",
      }));
    } catch {
      setFeedback({
        tone: "error",
        title: "Falha de conexao",
        message:
          "Nao foi possivel conectar ao suporte agora. Tente novamente em instantes.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendChatMessage() {
    const conversationId = activeConversation?.id;
    if (!conversationId || chatSending) {
      return;
    }

    const body = sanitizeSupportMessageBody(composer);
    const validation = validateSupportMessageBody(body);

    if (!validation.valid) {
      setChatError(validation.error);
      return;
    }

    const clientMessageId = createClientMessageId();
    const optimisticMessage = createOptimisticMessage({
      body,
      clientMessageId,
      conversationId,
      senderRole: viewerRole,
      senderName: currentUserName,
    });

    setChatSending(true);
    setChatError(null);
    setComposer("");
    setMessages((current) => [...current, optimisticMessage]);
    setConversationList((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessageAt: optimisticMessage.createdAt,
              lastMessagePreview: optimisticMessage.body,
              status:
                viewerRole === "customer"
                  ? "pending_master"
                  : "pending_customer",
            }
          : conversation,
      ),
    );

    try {
      const response = await fetch(
        `/api/support/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body,
            clientMessageId,
          }),
        },
      );
      const result = (await readJson<SupportChatMessageResponse>(response)) ?? null;

      if (!response.ok || !result?.message) {
        setMessages((current) =>
          current.filter((message) => message.clientMessageId !== clientMessageId),
        );
        setComposer(body);
        setChatError(
          result?.error ?? "Nao foi possivel enviar a mensagem agora.",
        );
        return;
      }

      setMessages((current) =>
        current.map((message) =>
          message.clientMessageId === clientMessageId ? result.message! : message,
        ),
      );
    } catch {
      setMessages((current) =>
        current.filter((message) => message.clientMessageId !== clientMessageId),
      );
      setComposer(body);
      setChatError("Nao foi possivel enviar a mensagem agora.");
    } finally {
      setChatSending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSendChatMessage();
  }

  function closeWidget() {
    if (submitting || chatSending) {
      return;
    }

    setOpen(false);
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial="hidden"
        animate="visible"
        whileHover={hoverLift}
        whileTap={press}
        variants={{
          hidden: { y: 20, opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: { delay: 0.5, ...transition },
          },
        }}
        className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1.5rem))] right-[max(1.5rem,calc(env(safe-area-inset-right)+1.5rem))] z-[80] !min-h-[48px] !gap-3 !rounded-full !px-2 !py-2 !pr-5 workspace-button workspace-button--secondary shadow-[0_0_25px_rgba(129,236,255,0.12)] hover:!border-primary/50 hover:shadow-[0_0_35px_rgba(129,236,255,0.25)]"
        aria-label="Abrir suporte"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <LifeBuoy size={16} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-[#04232b]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </span>
        <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] sm:block">
          {showChatPanel ? "Chat suporte" : "Suporte CT"}
        </span>
      </motion.button>

      {showChatPanel ? (
        <SupportChatPanel
          open={open}
          reducedMotion={reducedMotion}
          closeWidget={closeWidget}
          chatSending={chatSending}
          chatError={chatError}
          chatListLoading={chatListLoading}
          chatThreadLoading={chatThreadLoading}
          isMaster={isMaster}
          viewerRole={viewerRole}
          conversationList={conversationList}
          activeConversation={activeConversation}
          messages={messages}
          currentUserName={currentUserName}
          currentUserAvatarUrl={currentUserAvatarUrl}
          composer={composer}
          onComposerChange={setComposer}
          onComposerKeyDown={handleComposerKeyDown}
          onSendMessage={() => {
            void handleSendChatMessage();
          }}
        />
      ) : (
        <SupportTicketModal
          open={open}
          reducedMotion={reducedMotion}
          submitting={submitting}
          form={form}
          fieldErrors={fieldErrors}
          feedback={feedback}
          chatFallbackNotice={chatFallbackNotice}
          onClose={closeWidget}
          onSubmit={handleSupportTicketSubmit}
          onUpdateField={updateField}
        />
      )}
    </>
  );
}

function getNextSelectedConversationId(
  currentId: string | null,
  conversations: SupportChatConversationSummary[],
) {
  if (!currentId) {
    return conversations[0]?.id ?? null;
  }

  return conversations.some((conversation) => conversation.id === currentId)
    ? currentId
    : conversations[0]?.id ?? null;
}

function upsertConversation(
  conversations: SupportChatConversationSummary[],
  nextConversation: SupportChatConversationSummary,
) {
  const withoutCurrent = conversations.filter(
    (conversation) => conversation.id !== nextConversation.id,
  );

  return [nextConversation, ...withoutCurrent].sort((left, right) => {
    const leftValue = left.lastMessageAt || left.updatedAt;
    const rightValue = right.lastMessageAt || right.updatedAt;

    return rightValue.localeCompare(leftValue);
  });
}

function hasUnreadIncomingMessage(
  messages: SupportChatMessage[],
  viewerRole: SupportChatViewerRole,
) {
  return messages.some(
    (message) => message.senderRole !== viewerRole && !message.readAt,
  );
}

async function markConversationAsRead(
  conversationId: string,
  viewerRole: SupportChatViewerRole,
  active: boolean,
  setConversationList: Dispatch<SetStateAction<SupportChatConversationSummary[]>>,
  setMessages: Dispatch<SetStateAction<LocalChatMessage[]>>,
) {
  try {
    const response = await fetch(
      `/api/support/chat/conversations/${conversationId}/read`,
      {
        method: "POST",
      },
    );
    const result = await readJson<{
      conversation?: SupportChatConversationSummary;
    }>(response);

    if (!response.ok || !active) {
      return;
    }

    if (result?.conversation) {
      setConversationList((current) =>
        upsertConversation(current, result.conversation!),
      );
    }

    const readAt = new Date().toISOString();
    setMessages((current) =>
      current.map((message) =>
        message.senderRole === viewerRole
          ? message
          : {
              ...message,
              deliveredAt: message.deliveredAt ?? readAt,
              readAt: message.readAt ?? readAt,
            },
      ),
    );
  } catch {
    // Mantem a thread local e permite nova tentativa no proximo polling.
  }
}

function createOptimisticMessage(args: {
  body: string;
  clientMessageId: string;
  conversationId: string;
  senderRole: SupportChatViewerRole;
  senderName: string;
}) {
  const timestamp = new Date().toISOString();

  return {
    id: `optimistic-${args.clientMessageId}`,
    conversationId: args.conversationId,
    senderRole: args.senderRole,
    senderUserId: null,
    senderOperatorId: null,
    senderName: args.senderName,
    body: args.body,
    contentType: "text",
    clientMessageId: args.clientMessageId,
    deliveredAt: null,
    readAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {},
    optimistic: true,
  } satisfies LocalChatMessage;
}

function createClientMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function readJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function buildSupportNotificationPayload(preview: string, userId: string) {
  const normalized =
    sanitizeSupportMessageBody(preview).replace(/\s+/g, " ").slice(0, 140) ||
    "Nova mensagem de suporte.";

  return {
    type: "system" as const,
    title: "Nova mensagem do suporte",
    message: normalized,
    link: null,
    is_read: false,
    user_id: userId,
    created_at: new Date().toISOString(),
    read_at: null,
  };
}

async function insertSupportNotification(
  client: ReturnType<typeof createClient>,
  payload: ReturnType<typeof buildSupportNotificationPayload>,
) {
  try {
    await client.from("notifications").insert(payload);
  } catch {
    // Em caso de falha, segue sem bloquear o chat.
  }
}

function getLatestIncomingAt(
  messages: SupportChatMessage[],
  viewerRole: SupportChatViewerRole,
) {
  return messages
    .filter((message) => message.senderRole !== viewerRole)
    .reduce<string | null>((latest, message) => {
      return !latest || message.createdAt > latest ? message.createdAt : latest;
    }, null);
}

async function handleIncomingNotifications(
  messages: SupportChatMessage[],
  conversation: SupportChatConversationSummary,
  viewerRole: SupportChatViewerRole,
  currentUserId: string | null,
  notificationsEnabled: boolean,
  lastIncomingMessageAtRef: MutableRefObject<Map<string, string>>,
  client: ReturnType<typeof createClient>,
) {
  if (!currentUserId || !notificationsEnabled) {
    return;
  }

  const latestIncomingAt = getLatestIncomingAt(messages, viewerRole);

  if (!latestIncomingAt) {
    return;
  }

  const previous = lastIncomingMessageAtRef.current.get(conversation.id);
  lastIncomingMessageAtRef.current.set(conversation.id, latestIncomingAt);

  if (!previous) {
    return;
  }

  const newMessages = messages.filter(
    (message) =>
      message.senderRole !== viewerRole && message.createdAt > previous,
  );

  if (!newMessages.length) {
    return;
  }

  await Promise.all(
    newMessages.map((message) =>
      insertSupportNotification(
        client,
        buildSupportNotificationPayload(message.body, currentUserId),
      ),
    ),
  );
}

async function notifyFromConversationSummaries(
  conversations: SupportChatConversationSummary[],
  currentUserId: string,
  lastConversationSeenAtRef: MutableRefObject<Map<string, string>>,
  client: ReturnType<typeof createClient>,
) {
  for (const conversation of conversations) {
    const lastAt = conversation.lastMessageAt ?? conversation.updatedAt;
    if (!lastAt) continue;
    const previous = lastConversationSeenAtRef.current.get(conversation.id);
    lastConversationSeenAtRef.current.set(conversation.id, lastAt);

    if (!previous) continue;
    if (lastAt <= previous) continue;
    if (conversation.unreadCountForViewer <= 0) continue;

    await insertSupportNotification(
      client,
      buildSupportNotificationPayload(
        conversation.lastMessagePreview || "Nova mensagem de suporte.",
        currentUserId,
      ),
    );
  }
}
