"use client";

import {
  deriveSupportOutgoingMessageStatus,
  type SupportChatConversationSummary,
  type SupportChatMessage,
  type SupportChatViewerRole,
} from "@/utils/support/chat-shared";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCheck,
  LoaderCircle,
  SendHorizonal,
  X,
} from "lucide-react";
import { type KeyboardEvent } from "react";

type LocalChatMessage = SupportChatMessage & {
  optimistic?: boolean;
};

export function SupportChatPanel({
  open,
  reducedMotion,
  closeWidget,
  chatSending,
  chatError,
  chatListLoading,
  chatThreadLoading,
  isMaster,
  viewerRole,
  conversationList,
  activeConversation,
  messages,
  currentUserName,
  currentUserAvatarUrl,
  composer,
  onComposerChange,
  onComposerKeyDown,
  onSendMessage,
}: {
  open: boolean;
  reducedMotion: boolean;
  closeWidget: () => void;
  chatSending: boolean;
  chatError: string | null;
  chatListLoading: boolean;
  chatThreadLoading: boolean;
  isMaster: boolean;
  viewerRole: SupportChatViewerRole;
  conversationList: SupportChatConversationSummary[];
  activeConversation: SupportChatConversationSummary | null;
  messages: LocalChatMessage[];
  currentUserName: string;
  currentUserAvatarUrl: string | null;
  composer: string;
  onComposerChange: (value: string) => void;
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[88] bg-black/45 backdrop-blur-sm md:hidden"
            onClick={closeWidget}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
          />

          {/* Chat Panel */}
          <motion.div
            key="chat-panel"
            className="fixed inset-x-4 bottom-4 z-[90] flex h-[min(500px,calc(100vh-2rem))] max-h-[calc(100vh-2rem)] w-auto flex-col overflow-hidden rounded-2xl shadow-2xl sm:inset-x-auto sm:bottom-8 sm:right-8 sm:h-[500px] sm:w-96"
            style={{
              backdropFilter: "blur(20px)",
              background: "rgba(14, 14, 14, 0.7)",
              border: "1px solid rgba(72, 72, 71, 0.2)",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b flex justify-between items-center"
              style={{
                borderColor: "rgba(72, 72, 71, 0.1)",
                background: "rgba(19, 19, 19, 0.5)",
              }}
            >
              <div>
                <h2 className="text-xs font-black tracking-[0.2em] text-white uppercase">
                  SYSTEM SUPPORT
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: "#10b981" }}
                  />
                  <span
                    className="text-[9px] font-bold tracking-widest uppercase"
                    style={{ color: "#34d399" }}
                  >
                    AGENT_ONLINE
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeWidget}
                disabled={chatSending}
                aria-label="Fechar chat"
                className="p-1 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Message */}
            {chatError ? (
              <div
                className="px-6 pt-4"
                style={{
                  background: "rgba(14, 14, 14, 0.5)",
                }}
              >
                <div
                  className="rounded-lg border px-4 py-3"
                  style={{
                    borderColor: "rgba(255, 113, 108, 0.3)",
                    background: "rgba(255, 113, 108, 0.1)",
                  }}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">
                    Falha de sincronização
                  </p>
                  <p className="text-[11px] leading-relaxed text-red-300">
                    {chatError}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Loading State */}
            {chatListLoading && conversationList.length === 0 ? (
              <div className="relative flex min-h-[280px] flex-1 items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center">
                  <LoaderCircle
                    size={24}
                    className="animate-spin"
                    style={{ color: "#81ecff" }}
                  />
                  <p className="m-0 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    Sincronizando canal...
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative flex min-h-0 flex-1 flex-col">
                {/* Messages Container */}
                <div
                  className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-6"
                  style={{
                    background: "rgba(14, 14, 14, 0.5)",
                  }}
                >
                  {chatThreadLoading && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <LoaderCircle
                        size={20}
                        className="animate-spin"
                        style={{ color: "#81ecff" }}
                      />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(0, 227, 253, 0.2)" }}
                      >
                        <span
                          className="text-lg"
                          style={{ color: "#00e3fd" }}
                        >
                          🛡️
                        </span>
                      </div>
                      <div className="max-w-[85%]">
                        <div
                          className="p-3 rounded-xl text-sm leading-relaxed"
                          style={{
                            background: "rgba(32, 32, 31, 0.5)",
                            border: "1px solid rgba(0, 227, 253, 0.2)",
                            color: "#d1d5db",
                          }}
                        >
                          Canal seguro criado. Envie sua mensagem para abrir o atendimento em tempo real com o suporte.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {messages.map((message) => {
                        const index = messages.indexOf(message);
                        const previous = messages[index - 1];
                        const showDaySeparator =
                          !previous ||
                          formatDayLabel(previous.createdAt) !==
                            formatDayLabel(message.createdAt);

                        return (
                          <div key={`msg-${message.id}`}>
                            {showDaySeparator ? (
                              <div className="mb-6 flex items-center justify-center">
                                <span
                                  className="rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em]"
                                  style={{
                                    border: "1px solid rgba(0, 227, 253, 0.15)",
                                    background: "rgba(0, 227, 253, 0.05)",
                                    color: "#9ca3af",
                                  }}
                                >
                                  {formatDayLabel(message.createdAt)}
                                </span>
                              </div>
                            ) : null}
                            <SupportMessageBubble
                              message={message}
                              isOwn={message.senderRole === viewerRole}
                              viewerRole={viewerRole}
                              currentUserName={currentUserName}
                              currentUserAvatarUrl={currentUserAvatarUrl}
                              activeConversation={activeConversation}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Input Area */}
                {activeConversation ? (
                  <div
                    className="border-t px-4 py-4"
                    style={{
                      borderColor: "rgba(72, 72, 71, 0.1)",
                      background: "rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="m-0 text-[10px] font-black uppercase tracking-[0.2em]">
                        <span style={{ color: "#81ecff" }}>
                          {isMaster
                            ? `Respondendo ${activeConversation.customerName}`
                            : "Digite sua mensagem"}
                        </span>
                      </p>
                      <span className="text-[9px] text-gray-500 font-bold">
                        {composer.length}/2000
                      </span>
                    </div>
                    <div className="flex items-end gap-3">
                      <div
                        className="flex-1 rounded-lg border px-4 py-3"
                        style={{
                          background: "#1a1a1a",
                          borderColor: "rgba(72, 72, 71, 0.3)",
                        }}
                      >
                        <textarea
                          value={composer}
                          onChange={(event) =>
                            onComposerChange(event.target.value)
                          }
                          onKeyDown={onComposerKeyDown}
                          maxLength={2000}
                          autoFocus
                          placeholder="Type command..."
                          style={{
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            color: "white",
                            fontSize: "10px",
                            fontWeight: "700",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            resize: "none",
                            minHeight: "44px",
                            fontFamily: "inherit",
                          }}
                          className="w-full placeholder:text-gray-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onSendMessage}
                        disabled={chatSending || !composer.trim()}
                        className="h-10 px-4 rounded-lg font-black text-[10px] tracking-widest uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 flex-shrink-0"
                        style={{
                          background: "#00e3fd",
                          color: "#003840",
                        }}
                      >
                        {chatSending ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <SendHorizonal size={14} />
                        )}
                        SEND
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SupportMessageBubble({
  message,
  isOwn,
  viewerRole,
  currentUserName,
  currentUserAvatarUrl,
  activeConversation,
}: {
  message: LocalChatMessage;
  isOwn: boolean;
  viewerRole: SupportChatViewerRole;
  currentUserName: string;
  currentUserAvatarUrl: string | null;
  activeConversation: SupportChatConversationSummary | null;
}) {
  const status = deriveSupportOutgoingMessageStatus(message, viewerRole);
  const resolvedCurrentUserName =
    currentUserName.trim() && currentUserName !== "Voce"
      ? currentUserName
      : activeConversation?.customerName || message.senderName;
  const senderName = isOwn ? resolvedCurrentUserName : message.senderName;
  const senderAvatarUrl = isOwn
    ? currentUserAvatarUrl ?? activeConversation?.customerAvatarUrl ?? null
    : message.senderRole === "customer"
      ? activeConversation?.customerAvatarUrl ?? null
      : null;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
        <ChatAvatar
          avatarUrl={senderAvatarUrl}
          label={senderName}
          isOwn={isOwn}
        />

        {/* Message Content */}
        <div className="min-w-0 flex-1">
          <div
            className="rounded-r-xl rounded-bl-xl px-3 py-3 text-sm leading-relaxed"
            style={
              isOwn
                ? {
                    background: "rgba(0, 227, 253, 0.1)",
                    border: "1px solid rgba(0, 227, 253, 0.2)",
                    color: "#81ecff",
                  }
                : {
                    background: "#20201f",
                    color: "#adaaaa",
                  }
            }
          >
            <p className="m-0 whitespace-pre-wrap break-words">
              {message.body}
            </p>

            {/* Time & Status */}
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className="text-[9px] text-gray-600 font-mono">
                {formatTimeLabel(message.createdAt)}
              </span>
              {isOwn ? <SupportMessageStatus status={status} /> : null}
            </div>
          </div>

          {/* Sender Info */}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.18em]">
              <span style={{ color: "#81ecff" }}>
                {senderName}
              </span>
            </span>
            {message.optimistic ? (
              <span className="text-[9px] text-gray-600">enviando...</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportMessageStatus({
  status,
}: {
  status: "incoming" | "sent" | "delivered" | "read";
}) {
  if (status === "read") {
    return <CheckCheck size={12} style={{ color: "#81ecff" }} />;
  }

  if (status === "delivered") {
    return <CheckCheck size={12} className="text-gray-500" />;
  }

  return <Check size={12} className="text-gray-500" />;
}

function ChatAvatar({
  avatarUrl,
  label,
  isOwn,
}: {
  avatarUrl: string | null;
  label: string;
  isOwn: boolean;
}) {
  const borderColor = isOwn ? "rgba(0, 227, 253, 0.24)" : "rgba(72, 72, 71, 0.3)";
  const background = isOwn ? "rgba(0, 227, 253, 0.12)" : "rgba(32, 32, 31, 0.5)";

  if (avatarUrl) {
    return (
      <div
        className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border"
        style={{ borderColor, background }}
      >
        <img src={avatarUrl} alt={label} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black uppercase tracking-[0.12em]"
      style={{
        borderColor,
        background,
        color: isOwn ? "#81ecff" : "#f5f5f5",
      }}
    >
      {getInitials(label)}
    </div>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) {
    return "CT";
  }

  return parts.map((part) => part[0]).join("").toUpperCase();
}

function formatTimeLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}
