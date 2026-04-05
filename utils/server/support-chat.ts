import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { SUPPORT_ORIGINS, type SupportOrigin } from "@/utils/support/shared";
import type {
  SupportChatConversationSummary,
  SupportChatConversationThread,
  SupportChatMessage,
} from "@/utils/support/chat-shared";

const SUPPORT_LIMITS = {
  list: 50,
  thread: 250,
  subject: 120,
  preview: 160,
} as const;

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type SupportConversationRow = {
  id: string;
  public_id: string;
  customer_user_id: string | null;
  assigned_operator_id: string | null;
  status: string;
  origin: string;
  subject: string;
  customer_name: string;
  customer_email: string;
  customer_avatar_url: string | null;
  customer_plan: string;
  last_message_preview: string;
  last_message_at: string | null;
  customer_unread_count: number;
  master_unread_count: number;
  customer_last_read_at: string | null;
  master_last_read_at: string | null;
  customer_last_delivered_at: string | null;
  master_last_delivered_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type SupportMessageRow = {
  id: string;
  conversation_id: string;
  sender_role: "customer" | "master";
  sender_user_id: string | null;
  sender_operator_id: string | null;
  sender_name: string;
  body: string;
  content_type: "text";
  client_message_id: string | null;
  delivered_at: string | null;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type SupportViewer = {
  name: string;
  email: string;
  avatarUrl: string | null;
  plan: string;
};

export class SupportChatDataError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    readonly storageReady = true,
  ) {
    super(message);
    this.name = "SupportChatDataError";
  }
}

export async function listCustomerSupportConversations(limit?: number) {
  const { supabase, user } = await requireSupportSession();

  try {
    const { data, error } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("customer_user_id", user.id)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(normalizeListLimit(limit));

    if (error) {
      throw toSupportChatError(error);
    }

    return {
      viewerRole: "customer" as const,
      isMaster: false as const,
      conversations: ((data ?? []) as SupportConversationRow[]).map((row) =>
        mapConversationRow(row),
      ),
    };
  } catch (error) {
    throw ensureSupportChatError(error);
  }
}

export async function ensureCustomerSupportConversation(input: {
  origin?: string | null;
  pageUrl?: string | null;
  subject?: string | null;
}) {
  const { supabase, user, viewer } = await requireSupportSession();

  try {
    const { data: existing, error: existingError } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("customer_user_id", user.id)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw toSupportChatError(existingError);
    }

    if (existing) {
      return getCustomerSupportThreadById(supabase, user.id, existing.id);
    }

    const now = nowIso();
    const { data: created, error: createError } = await supabase
      .from("support_conversations")
      .insert({
        public_id: generatePublicConversationId(),
        customer_user_id: user.id,
        assigned_operator_id: null,
        status: "open",
        origin: normalizeOrigin(input.origin),
        subject: sanitizeConversationSubject(input.subject) || "Atendimento do suporte",
        customer_name: viewer.name,
        customer_email: viewer.email,
        customer_avatar_url: viewer.avatarUrl,
        customer_plan: viewer.plan,
        last_message_preview: "",
        last_message_at: null,
        customer_unread_count: 0,
        master_unread_count: 0,
        customer_last_read_at: now,
        master_last_read_at: null,
        customer_last_delivered_at: now,
        master_last_delivered_at: null,
        metadata: {
          pageUrl: sanitizePageUrl(input.pageUrl),
          source: "web_app",
        },
        updated_at: now,
      })
      .select("*")
      .single();

    if (createError || !created) {
      throw toSupportChatError(createError);
    }

    return {
      viewerRole: "customer" as const,
      isMaster: false as const,
      conversation: mapConversationRow(created as SupportConversationRow),
      messages: [] satisfies SupportChatMessage[],
    } satisfies SupportChatConversationThread;
  } catch (error) {
    throw ensureSupportChatError(error);
  }
}

export async function getCustomerSupportThread(conversationId: string) {
  const { supabase, user } = await requireSupportSession();
  return getCustomerSupportThreadById(supabase, user.id, conversationId);
}

export async function sendCustomerSupportMessage(
  conversationId: string,
  body: string,
  clientMessageId?: string | null,
) {
  const { supabase, user, viewer } = await requireSupportSession();

  try {
    const conversation = await getConversationRowForCustomer(
      supabase,
      user.id,
      conversationId,
    );

    const now = nowIso();
    const { data, error } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversationId,
        sender_role: "customer",
        sender_user_id: user.id,
        sender_operator_id: null,
        sender_name: viewer.name,
        body,
        content_type: "text",
        client_message_id: clientMessageId ?? null,
        metadata: {},
        updated_at: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      if (
        clientMessageId &&
        error?.message?.includes("client_message_id") &&
        error.message.includes("duplicate")
      ) {
        const { data: existing, error: existingError } = await supabase
          .from("support_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .eq("client_message_id", clientMessageId)
          .maybeSingle();

        if (existingError || !existing) {
          throw toSupportChatError(existingError ?? error);
        }

        return mapMessageRow(existing as SupportMessageRow);
      }

      throw toSupportChatError(error);
    }

    await updateConversationRow(supabase, conversationId, {
      status: "pending_master",
      last_message_preview: body.slice(0, SUPPORT_LIMITS.preview),
      last_message_at: (data as SupportMessageRow).created_at,
      customer_unread_count: 0,
      master_unread_count: (conversation.master_unread_count ?? 0) + 1,
      customer_last_read_at: now,
      updated_at: now,
    });

    return mapMessageRow(data as SupportMessageRow);
  } catch (error) {
    throw ensureSupportChatError(error);
  }
}

export async function markCustomerSupportThreadRead(conversationId: string) {
  const { supabase, user } = await requireSupportSession();

  try {
    await getConversationRowForCustomer(supabase, user.id, conversationId);
    const now = nowIso();

    const { error: messageError } = await supabase
      .from("support_messages")
      .update({
        delivered_at: now,
        read_at: now,
        updated_at: now,
      })
      .eq("conversation_id", conversationId)
      .eq("sender_role", "master")
      .is("read_at", null);

    if (messageError) {
      throw toSupportChatError(messageError);
    }

    const conversation = await updateConversationRow(supabase, conversationId, {
      customer_unread_count: 0,
      customer_last_read_at: now,
      customer_last_delivered_at: now,
      updated_at: now,
    });

    return mapConversationRow(conversation);
  } catch (error) {
    throw ensureSupportChatError(error);
  }
}

async function getCustomerSupportThreadById(
  supabase: ServerSupabaseClient,
  userId: string,
  conversationId: string,
) {
  try {
    const conversation = await getConversationRowForCustomer(
      supabase,
      userId,
      conversationId,
    );

    await markConversationDelivered(supabase, conversationId);

    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(SUPPORT_LIMITS.thread);

    if (error) {
      throw toSupportChatError(error);
    }

    const refreshedConversation = await getConversationRowForCustomer(
      supabase,
      userId,
      conversationId,
    );

    return {
      viewerRole: "customer" as const,
      isMaster: false as const,
      conversation: mapConversationRow(refreshedConversation),
      messages: ((data ?? []) as SupportMessageRow[]).map((row) => mapMessageRow(row)),
    } satisfies SupportChatConversationThread;
  } catch (error) {
    throw ensureSupportChatError(error);
  }
}

async function requireSupportSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new SupportChatDataError(
      "Faça login para acessar o chat persistente do suporte.",
      401,
    );
  }

  return {
    supabase,
    user,
    viewer: await resolveViewer(supabase, user),
  };
}

async function resolveViewer(
  supabase: ServerSupabaseClient,
  user: User,
): Promise<SupportViewer> {
  let fullName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : "";
  let avatarUrl =
    typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, email")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.full_name) {
      fullName = profile.full_name;
    }

    if (profile?.avatar_url) {
      avatarUrl = profile.avatar_url;
    }
  } catch {
    // Fallback para metadata da sessão.
  }

  let plan = "Conta autenticada";

  try {
    const { data: snapshot, error } = await supabase.rpc("get_my_billing_snapshot");

    if (!error && snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
      const currentPlan = (
        snapshot as {
          current_plan?: { name?: string | null } | null;
        }
      ).current_plan?.name;

      if (currentPlan?.trim()) {
        plan = currentPlan.trim();
      }
    }
  } catch {
    // Sem billing, segue com o plano genérico.
  }

  return {
    name: fullName.trim() || user.email || "Cliente CodeTrail",
    email: user.email || "",
    avatarUrl,
    plan,
  };
}

async function getConversationRowForCustomer(
  supabase: ServerSupabaseClient,
  userId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("support_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("customer_user_id", userId)
    .maybeSingle();

  if (error) {
    throw toSupportChatError(error);
  }

  if (!data) {
    throw new SupportChatDataError("Conversa não encontrada.", 404);
  }

  return data as SupportConversationRow;
}

async function updateConversationRow(
  supabase: ServerSupabaseClient,
  conversationId: string,
  patch: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("support_conversations")
    .update(patch)
    .eq("id", conversationId)
    .select("*")
    .single();

  if (error || !data) {
    throw toSupportChatError(error);
  }

  return data as SupportConversationRow;
}

async function markConversationDelivered(
  supabase: ServerSupabaseClient,
  conversationId: string,
) {
  const now = nowIso();

  const { error: messageError } = await supabase
    .from("support_messages")
    .update({
      delivered_at: now,
      updated_at: now,
    })
    .eq("conversation_id", conversationId)
    .eq("sender_role", "master")
    .is("delivered_at", null);

  if (messageError) {
    throw toSupportChatError(messageError);
  }

  await updateConversationRow(supabase, conversationId, {
    customer_last_delivered_at: now,
    updated_at: now,
  });
}

function mapConversationRow(
  row: SupportConversationRow,
): SupportChatConversationSummary {
  return {
    id: row.id,
    publicId: row.public_id,
    customerUserId: row.customer_user_id,
    assignedOperatorId: row.assigned_operator_id,
    status: normalizeStatus(row.status),
    origin: row.origin,
    subject: row.subject,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerAvatarUrl: row.customer_avatar_url,
    customerPlan: row.customer_plan,
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: row.last_message_at,
    unreadCountForViewer: row.customer_unread_count,
    customerUnreadCount: row.customer_unread_count,
    masterUnreadCount: row.master_unread_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata:
      row.metadata && typeof row.metadata === "object" ? row.metadata : {},
  };
}

function mapMessageRow(row: SupportMessageRow): SupportChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderRole: row.sender_role,
    senderUserId: row.sender_user_id,
    senderOperatorId: row.sender_operator_id,
    senderName: row.sender_name,
    body: row.body,
    contentType: "text",
    clientMessageId: row.client_message_id,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata:
      row.metadata && typeof row.metadata === "object" ? row.metadata : {},
  };
}

function normalizeStatus(value: string): SupportChatConversationSummary["status"] {
  if (
    value === "open" ||
    value === "pending_customer" ||
    value === "pending_master" ||
    value === "resolved" ||
    value === "archived"
  ) {
    return value;
  }

  return "open";
}

function sanitizeConversationSubject(value: string | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SUPPORT_LIMITS.subject);
}

function sanitizePageUrl(value: string | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 600);
}

function normalizeOrigin(value: string | null | undefined): SupportOrigin {
  if (value && SUPPORT_ORIGINS.includes(value as SupportOrigin)) {
    return value as SupportOrigin;
  }

  return "Web App";
}

function normalizeListLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return SUPPORT_LIMITS.list;
  }

  return Math.min(Math.max(Math.floor(limit), 1), SUPPORT_LIMITS.list);
}

function generatePublicConversationId() {
  return `CT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function toSupportChatError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "Falha no chat de suporte.";

  if (isChatStorageUnavailable(message)) {
    return new SupportChatDataError(
      "O storage do chat ainda não está disponível neste ambiente.",
      503,
      false,
    );
  }

  return new SupportChatDataError(message, 500);
}

function ensureSupportChatError(error: unknown) {
  if (error instanceof SupportChatDataError) {
    return error;
  }

  return new SupportChatDataError(
    error instanceof Error ? error.message : "Falha no chat de suporte.",
    500,
  );
}

function isChatStorageUnavailable(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("support_conversations") ||
    normalized.includes("support_messages") ||
    normalized.includes("could not find the table") ||
    normalized.includes("relation") && normalized.includes("does not exist")
  );
}
