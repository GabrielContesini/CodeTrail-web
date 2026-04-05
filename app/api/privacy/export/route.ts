import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { legalConfig } from "@/utils/legal-config";
import { loadWorkspaceData } from "@/utils/workspace/api";

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
      { error: "Sessão expirada. Faça login novamente para exportar seus dados." },
      { status: 401 },
    );
  }

  const exportedAt = new Date().toISOString();
  const snapshot = await loadWorkspaceData(supabase, user.id);

  try {
    await supabase.from("data_subject_requests").insert({
      user_id: user.id,
      request_type: "export",
      status: "completed",
      subject: "Exportação autoatendida de dados",
      details:
        "Arquivo JSON disponibilizado pelo endpoint autenticado de exportação de dados.",
      requester_email: user.email ?? "",
      preferred_channel: "download",
      resolution_notes: "Exportação entregue automaticamente ao titular.",
      handled_at: exportedAt,
    });
  } catch {
    // Best effort: the export should still work even if the audit table is not available yet.
  }

  const fileName = `codetrail-dados-${exportedAt.slice(0, 10)}.json`;
  const body = JSON.stringify(
    {
      exported_at: exportedAt,
      controller: {
        name: legalConfig.controllerName,
        document: legalConfig.controllerDocument || null,
        address: legalConfig.controllerAddress || null,
        privacy_email: legalConfig.privacyEmail,
      },
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      workspace: snapshot,
    },
    null,
    2,
  );

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": NO_STORE_CACHE_CONTROL,
    },
  });
}

function jsonResponse(body: unknown, options: { status?: number }) {
  const response = NextResponse.json(body, {
    status: options.status ?? 200,
  });
  response.headers.set("Cache-Control", NO_STORE_CACHE_CONTROL);
  return response;
}
