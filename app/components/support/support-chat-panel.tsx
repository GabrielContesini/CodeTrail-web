"use client";

import {
  createTransition,
  fadeUpVariants,
} from "@/app/components/ui/motion-system";
import {
  deriveSupportOutgoingMessageStatus,
  labelForSupportConversationStatus,
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
  ShieldCheck,
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
  selectedConversationId,
  onSelectConversation,
  messages,
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
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  messages: LocalChatMessage[];
  composer: string;
  onComposerChange: (value: string) => void;
  onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-[88] bg-black/45 backdrop-blur-sm md:hidden"
            aria-label="Fechar chat"
            onClick={closeWidget}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={createTransition(reducedMotion, 0.18)}
          />

           <motion.section
             className="fixed inset-x-3 bottom-3 z-[90] flex max-h-[min(780px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(14,14,14,0.7),rgba(14,14,14,0.7))] shadow-[0_0_30px_rgba(129,236,255,0.2)] backdrop-blur-[20px] md:inset-x-auto md:right-8 md:bottom-8 md:w-96"
             initial="hidden"
             animate="visible"
             exit="exit"
             variants={fadeUpVariants(reducedMotion, 10)}
           >
            <div className="workspace-modal-topline" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(129,236,255,0.12),transparent_35%),radial-gradient(circle_at_top_left,rgba(0,227,253,0.08),transparent_26%)]" />

             <div className="relative flex items-start justify-between gap-4 border-b border-cyan-400/10 px-6 py-4 bg-surface-container-low/50">
               <div className="min-w-0">
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                     SYSTEM SUPPORT
                   </span>
                 </div>
                 <h2 className="text-lg font-black uppercase tracking-tight text-white">
                   {isMaster ? "Inbox do Master" : "SUPPORT AGENT"}
                 </h2>
                 <p className="mt-2 text-[11px] leading-relaxed text-slate-400 uppercase tracking-widest">
                   {isMaster
                     ? "MASTER_AUTHENTICATED"
                     : "AGENT_ONLINE"}
                 </p>
               </div>

               <button
                 type="button"
                 onClick={closeWidget}
                 disabled={chatSending}
                 aria-label="Fechar chat"
                 className="p-2 hover:bg-cyan-400/10 transition-colors rounded-full text-slate-400 hover:text-cyan-400 flex-shrink-0"
               >
                 <X size={16} />
               </button>
             </div>

             {chatError ? (
               <div className="relative px-6 pt-4">
                 <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                   <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Falha de sincronização</p>
                   <p className="text-[11px] text-red-300 leading-relaxed">{chatError}</p>
                 </div>
               </div>
             ) : null}

             {chatListLoading && conversationList.length === 0 ? (
               <div className="relative flex min-h-[280px] flex-1 items-center justify-center">
                 <div className="flex flex-col items-center gap-3 text-center">
                   <LoaderCircle size={24} className="animate-spin text-cyan-400" />
                   <p className="m-0 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                     Sincronizando canal...
                   </p>
                 </div>
               </div>
             ) : (
              <div className="relative flex min-h-0 flex-1 flex-col">
                 {isMaster ? (
                   <div className="border-b border-cyan-400/10 px-4 py-3 bg-surface-container-low/30">
                     <div className="mb-3 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                         Conversas Ativas
                       </span>
                       <span className="text-[10px] text-slate-500 font-bold">
                         {conversationList.length}
                       </span>
                     </div>
                     <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                       {conversationList.length === 0 ? (
                         <div className="rounded-xl border border-slate-700 bg-slate-900/30 px-3 py-3 text-[10px] text-slate-500 uppercase tracking-widest">
                           Nenhuma conversa ativa
                         </div>
                       ) : (
                         conversationList.map((conversation) => (
                           <button
                             key={conversation.id}
                             type="button"
                             onClick={() => onSelectConversation(conversation.id)}
                             className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                               conversation.id === selectedConversationId
                                 ? "border-cyan-400/40 bg-cyan-400/15 shadow-[0_0_15px_rgba(129,236,255,0.15)]"
                                 : "border-slate-700/50 bg-slate-900/20 hover:bg-slate-900/40"
                             }`}
                           >
                             <div className="flex items-center justify-between gap-2">
                               <div className="flex min-w-0 items-center gap-2">
                                 <SupportContactAvatar
                                   name={conversation.customerName}
                                   avatarUrl={conversation.customerAvatarUrl}
                                   size="sm"
                                 />
                                 <div className="min-w-0">
                                   <p className="m-0 truncate text-[10px] font-bold text-white">
                                     {conversation.customerName}
                                   </p>
                                   <p className="m-0 mt-0.5 truncate text-[9px] text-slate-500">
                                     {conversation.lastMessagePreview || "Sem mensagens"}
                                   </p>
                                 </div>
                               </div>
                               {conversation.unreadCountForViewer > 0 ? (
                                 <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-400/80 px-1.5 py-0.5 text-[9px] font-black text-slate-900">
                                   {conversation.unreadCountForViewer}
                                 </span>
                               ) : null}
                             </div>
                           </button>
                         ))
                       )}
                     </div>

                     {activeConversation ? (
                       <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/8 px-3 py-3">
                         <div className="flex items-center gap-3">
                           <SupportContactAvatar
                             name={activeConversation.customerName}
                             avatarUrl={activeConversation.customerAvatarUrl}
                             size="md"
                           />
                           <div className="min-w-0">
                             <p className="m-0 truncate text-[10px] font-black text-cyan-300 uppercase tracking-wide">
                               {activeConversation.customerName}
                             </p>
                             <p className="m-0 mt-1 truncate text-[9px] text-slate-400">
                               {activeConversation.customerEmail || "E-mail não informado"}
                             </p>
                           </div>
                         </div>
                         <div className="mt-3 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.16em] text-slate-500">
                           <span>
                             {labelForSupportConversationStatus(activeConversation.status)}
                           </span>
                           <span className="text-cyan-400">{activeConversation.customerPlan || "Auth"}</span>
                         </div>
                       </div>
                     ) : null}
                   </div>
                 ) : activeConversation ? (
                   <div className="border-b border-cyan-400/10 px-6 py-4 bg-surface-container-low/30">
                     <div className="flex items-center justify-between gap-3">
                       <div className="min-w-0">
                         <p className="m-0 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                           Ticket #{activeConversation.publicId}
                         </p>
                         <p className="m-0 mt-2 text-sm font-black text-white uppercase tracking-tight">
                           {labelForSupportConversationStatus(activeConversation.status)}
                         </p>
                       </div>
                       <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                         {activeConversation.customerPlan || "Auth"}
                       </div>
                     </div>
                   </div>
                 ) : null}

                 <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-6">
                   <SupportTimeline
                     activeConversation={activeConversation}
                     chatThreadLoading={chatThreadLoading}
                     messages={messages}
                     viewerRole={viewerRole}
                   />
                 </div>

                 {activeConversation ? (
                   <div className="border-t border-cyan-400/10 px-6 py-4 bg-surface-container-lowest/50">
                     <div className="mb-3 flex items-center justify-between gap-3">
                       <p className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                         {isMaster ? `Respondendo ${activeConversation.customerName}` : "Digite sua mensagem"}
                       </p>
                       <span className="text-[9px] text-slate-500 font-bold">
                         {composer.length}/2000
                       </span>
                     </div>
                     <div className="flex items-end gap-3">
                       <textarea
                         value={composer}
                         onChange={(event) => onComposerChange(event.target.value)}
                         onKeyDown={onComposerKeyDown}
                         maxLength={2000}
                         autoFocus
                         placeholder={isMaster ? "Responder conversa..." : "Type command..."}
                         className="min-h-[76px] flex-1 rounded-lg border border-cyan-400/20 bg-slate-900/50 px-4 py-3 text-[10px] text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(129,236,255,0.15)] uppercase tracking-widest"
                       />
                       <button
                         type="button"
                         onClick={onSendMessage}
                         disabled={chatSending || !composer.trim()}
                         className="bg-cyan-400 text-slate-900 h-12 px-4 rounded-lg font-black text-[10px] tracking-widest uppercase hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 flex-shrink-0"
                       >
                         {chatSending ? <LoaderCircle size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
                         SEND
                       </button>
                     </div>
                   </div>
                 ) : null}
              </div>
            )}

             <footer className="relative border-t border-cyan-400/10 px-6 py-3 bg-surface-container-lowest/50">
               <div className="flex items-center justify-between gap-3">
                 <span className="text-[9px] uppercase tracking-[0.18em] text-slate-600 font-bold">
                   RELAY_PERSISTENTE
                 </span>
                 <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                   {isMaster ? "MASTER_LINK" : "CLIENT_AUTH"}
                 </span>
               </div>
             </footer>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function SupportTimeline({
  activeConversation,
  chatThreadLoading,
  messages,
  viewerRole,
}: {
  activeConversation: SupportChatConversationSummary | null;
  chatThreadLoading: boolean;
  messages: LocalChatMessage[];
  viewerRole: SupportChatViewerRole;
}) {
  if (chatThreadLoading && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle size={20} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!chatThreadLoading && activeConversation && messages.length === 0) {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center shrink-0">
          <ShieldCheck size={16} className="text-cyan-400" />
        </div>
        <div className="max-w-[85%]">
          <div className="bg-slate-900/50 border border-cyan-400/20 p-3 rounded-xl text-sm leading-relaxed text-slate-300">
            Canal seguro criado. Envie sua mensagem para abrir o atendimento em tempo real com o suporte.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const showDaySeparator =
          !previous ||
          formatDayLabel(previous.createdAt) !== formatDayLabel(message.createdAt);

        return (
          <div key={message.id}>
            {showDaySeparator ? (
              <div className="mb-6 flex items-center justify-center">
                <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {formatDayLabel(message.createdAt)}
                </span>
              </div>
            ) : null}
            <SupportMessageBubble
              activeConversation={activeConversation}
              message={message}
              isOwn={message.senderRole === viewerRole}
              viewerRole={viewerRole}
            />
          </div>
        );
      })}
    </div>
  );
}

function SupportMessageBubble({
  activeConversation,
  message,
  isOwn,
  viewerRole,
}: {
  activeConversation: SupportChatConversationSummary | null;
  message: LocalChatMessage;
  isOwn: boolean;
  viewerRole: SupportChatViewerRole;
}) {
  const status = deriveSupportOutgoingMessageStatus(message, viewerRole);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
        {isOwn ? (
          <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center shrink-0 border border-cyan-400/30">
            <span className="text-cyan-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              👤
            </span>
          </div>
        ) : viewerRole === "master" ? (
          <SupportContactAvatar
            name={activeConversation?.customerName || message.senderName}
            avatarUrl={activeConversation?.customerAvatarUrl || null}
            size="xs"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center shrink-0 border border-cyan-400/30">
            <span className="text-cyan-400 text-lg">🤖</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className={`rounded-xl border p-3 ${
            isOwn 
              ? "rounded-br-md border-cyan-400/30 bg-cyan-400/15" 
              : "rounded-bl-md border-slate-700/50 bg-slate-900/40"
          }`}>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                {isOwn ? "OPERATOR" : message.senderName || "SUPPORT"}
              </span>
              {message.optimistic ? <span className="text-[9px] text-slate-600">enviando...</span> : null}
            </div>
            <p className="m-0 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-slate-200">
              {message.body}
            </p>
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className="text-[9px] text-slate-600 font-mono">
                {formatTimeLabel(message.createdAt)}
              </span>
              {isOwn ? <SupportMessageStatus status={status} /> : null}
            </div>
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
    return <CheckCheck size={12} className="text-cyan-400" />;
  }

  if (status === "delivered") {
    return <CheckCheck size={12} className="text-slate-500" />;
  }

  return <Check size={12} className="text-slate-500" />;
}

function SupportContactAvatar({
  name,
  avatarUrl,
  size,
}: {
  name: string;
  avatarUrl: string | null;
  size: "xs" | "sm" | "md";
}) {
  const sizeClassName =
    size === "md" ? "h-10 w-10" : size === "sm" ? "h-8 w-8" : "h-7 w-7";
  const initials = extractInitials(name);

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClassName} shrink-0 rounded-lg border border-cyan-400/20 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClassName} flex shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/15 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-300`}
    >
      {initials}
    </div>
  );
}

function extractInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
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
