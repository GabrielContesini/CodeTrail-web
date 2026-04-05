"use client";

export const SUPPORT_CHAT_LIMITS = {
  body: 2000,
} as const;

export type SupportChatConversationStatus =
  | "open"
  | "pending_customer"
  | "pending_master"
  | "resolved"
  | "archived";

export type SupportChatViewerRole = "customer" | "master";

export interface SupportChatConversationSummary {
  id: string;
  publicId: string;
  customerUserId: string | null;
  assignedOperatorId: string | null;
  status: SupportChatConversationStatus;
  origin: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  customerAvatarUrl: string | null;
  customerPlan: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unreadCountForViewer: number;
  customerUnreadCount: number;
  masterUnreadCount: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface SupportChatMessage {
  id: string;
  conversationId: string;
  senderRole: SupportChatViewerRole;
  senderUserId: string | null;
  senderOperatorId: string | null;
  senderName: string;
  body: string;
  contentType: "text";
  clientMessageId: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface SupportChatConversationThread {
  conversation: SupportChatConversationSummary;
  messages: SupportChatMessage[];
  viewerRole: SupportChatViewerRole;
  isMaster: boolean;
}

export function sanitizeSupportMessageBody(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, SUPPORT_CHAT_LIMITS.body);
}

export function validateSupportMessageBody(body: string) {
  if (!body) {
    return {
      valid: false,
      error: "Digite uma mensagem antes de enviar.",
    } as const;
  }

  if (body.length > SUPPORT_CHAT_LIMITS.body) {
    return {
      valid: false,
      error: `A mensagem excedeu ${SUPPORT_CHAT_LIMITS.body} caracteres.`,
    } as const;
  }

  return {
    valid: true,
    error: null,
  } as const;
}

export function deriveSupportOutgoingMessageStatus(
  message: Pick<SupportChatMessage, "senderRole" | "deliveredAt" | "readAt">,
  viewerRole: SupportChatViewerRole,
) {
  if (message.senderRole !== viewerRole) {
    return "incoming" as const;
  }

  if (message.readAt) {
    return "read" as const;
  }

  if (message.deliveredAt) {
    return "delivered" as const;
  }

  return "sent" as const;
}
