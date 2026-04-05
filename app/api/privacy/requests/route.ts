import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  sanitizeDataSubjectRequestInput,
  validateDataSubjectRequestInput,
} from "@/utils/privacy/shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_CACHE_CONTROL = "private, no-store, max-age=0, must-revalidate";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonResponse(
      { error: "Sessão expirada. Faça login novamente para consultar as solicitações." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("data_subject_requests")
    .select(
      "id, request_type, status, subject, details, requester_email, preferred_channel, resolution_notes, handled_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    if (isPrivacyStorageUnavailable(error.message)) {
      return jsonResponse(
        {
          error:
            "A trilha auditável de privacidade ainda não foi habilitada neste ambiente.",
        },
        { status: 503 },
      );
    }

    return jsonResponse(
      { error: "Não foi possível carregar as solicitações de privacidade." },
      { status: 500 },
    );
  }

  return jsonResponse({ requests: data ?? [] }, {});
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonResponse(
      { error: "Sessão expirada. Faça login novamente para registrar a solicitação." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      { error: "Não foi possível ler os dados enviados." },
      { status: 400 },
    );
  }

  const input = sanitizeDataSubjectRequestInput(
    payload as Record<string, unknown>,
  );
  const validation = validateDataSubjectRequestInput(input);

  if (!validation.valid) {
    return jsonResponse(
      {
        error: "Revise o pedido antes de enviar.",
        fieldErrors: validation.fieldErrors,
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("data_subject_requests")
    .insert({
      user_id: user.id,
      request_type: input.request_type,
      status: "submitted",
      subject: input.subject,
      details: input.details,
      requester_email: user.email ?? "",
      preferred_channel: "email",
    })
    .select(
      "id, request_type, status, subject, details, requester_email, preferred_channel, resolution_notes, handled_at, created_at, updated_at",
    )
    .single();

  if (error) {
    if (isPrivacyStorageUnavailable(error.message)) {
      return jsonResponse(
        {
          error:
            "A trilha auditável de privacidade ainda não foi habilitada neste ambiente.",
        },
        { status: 503 },
      );
    }

    return jsonResponse(
      { error: "Não foi possível registrar a solicitação de privacidade." },
      { status: 500 },
    );
  }

  return jsonResponse({ request: data }, { status: 201 });
}

function jsonResponse(body: unknown, options: { status?: number }) {
  const response = NextResponse.json(body, {
    status: options.status ?? 200,
  });
  response.headers.set("Cache-Control", NO_STORE_CACHE_CONTROL);
  return response;
}

function isPrivacyStorageUnavailable(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("data_subject_requests") ||
    normalized.includes("could not find the table") ||
    (normalized.includes("relation") && normalized.includes("does not exist"))
  );
}
