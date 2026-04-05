"use client";

import { ModalForm } from "@/app/workspace/_components/pages/shared";
import {
  Field,
  Select,
  TextArea,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import { buildMailtoHref, legalConfig } from "@/utils/legal-config";
import {
  DATA_SUBJECT_REQUEST_LABELS,
  DATA_SUBJECT_STATUS_LABELS,
  sanitizeDataSubjectRequestInput,
  type DataSubjectRequestRow,
  type DataSubjectRequestStatus,
  type DataSubjectRequestType,
  validateDataSubjectRequestInput,
} from "@/utils/privacy/shared";
import { useEffect, useState } from "react";

interface RequestsApiResponse {
  requests: DataSubjectRequestRow[];
}

export function PrivacyControls() {
  const [requests, setRequests] = useState<DataSubjectRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const response = await fetch("/api/privacy/requests", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | RequestsApiResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "Não foi possível carregar suas solicitações.",
        );
      }

      const nextRequests =
        payload &&
        "requests" in payload &&
        Array.isArray(payload.requests)
          ? payload.requests
          : [];
      setRequests(nextRequests);
      setError(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Não foi possível carregar suas solicitações.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/privacy/export", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          payload?.error || "Não foi possível gerar o arquivo de exportação.",
        );
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const fileNameMatch = disposition.match(/filename=\"?([^"]+)\"?/i);
      const fileName = fileNameMatch?.[1] || "codetrail-dados.json";
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      setSuccess("Exportação gerada. O arquivo JSON foi baixado neste navegador.");
      await loadRequests();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Não foi possível gerar a exportação.",
      );
    } finally {
      setExporting(false);
    }
  }

  async function submitRequest(formData: FormData) {
    const payload = sanitizeDataSubjectRequestInput({
      request_type: formData.get("request_type")?.toString() as DataSubjectRequestType,
      subject: formData.get("subject")?.toString(),
      details: formData.get("details")?.toString(),
    });
    const validation = validateDataSubjectRequestInput(payload);

    if (!validation.valid) {
      setError(
        validation.fieldErrors.details ||
          validation.fieldErrors.subject ||
          "Revise os campos do pedido.",
      );
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/privacy/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { request?: DataSubjectRequestRow; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          result?.error || "Não foi possível registrar a solicitação.",
        );
      }

      setSuccess("Solicitação registrada com sucesso. O histórico foi atualizado.");
      setModalOpen(false);
      await loadRequests();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Não foi possível registrar a solicitação.",
      );
    }
  }

  return (
    <>
      <div className="workspace-stack">
        {error ? (
          <div className="rounded-[22px] border border-[rgba(255,107,122,0.28)] bg-[rgba(255,107,122,0.12)] px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-[22px] border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        ) : null}

        <div className="workspace-inline-banner">
          <div>
            <strong>{legalConfig.controllerName}</strong>
            <p>
              {legalConfig.dpoName}: {legalConfig.dpoEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="workspace-button workspace-button--secondary"
          >
            {exporting ? "Gerando..." : "Baixar JSON"}
          </button>
        </div>

        <div className="workspace-inline-actions">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="workspace-button workspace-button--secondary"
          >
            Nova solicitação
          </button>
          <a
            href={buildMailtoHref(
              "CodeTrail - Privacidade e direitos do titular",
              legalConfig.privacyEmail,
            )}
            className="workspace-button workspace-button--secondary"
          >
            Canal por e-mail
          </a>
        </div>

        <div className="workspace-stack">
          {loading ? (
            <p className="text-sm text-text-secondary">
              Carregando histórico de solicitações.
            </p>
          ) : requests.length ? (
            requests.map((request) => (
              <div
                key={request.id}
                className="rounded-[22px] border border-border/70 bg-white/[0.03] px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <strong className="block text-white">{request.subject}</strong>
                    <p className="m-0 mt-1 text-[11px] uppercase tracking-[0.14em] text-text-secondary">
                      {DATA_SUBJECT_REQUEST_LABELS[request.request_type]}
                    </p>
                  </div>
                  <span className={statusClassName(request.status)}>
                    {DATA_SUBJECT_STATUS_LABELS[request.status]}
                  </span>
                </div>
                <p className="m-0 mt-3 text-sm leading-relaxed text-text-secondary">
                  {request.details}
                </p>
                <p className="m-0 mt-3 text-[11px] uppercase tracking-[0.14em] text-text-secondary">
                  Criada em {formatDateTime(request.created_at)}
                </p>
                {request.resolution_notes ? (
                  <p className="m-0 mt-2 text-sm leading-relaxed text-text-secondary">
                    {request.resolution_notes}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-border/70 bg-white/[0.03] px-4 py-4 text-sm text-text-secondary">
              Nenhuma solicitação registrada ainda.
            </div>
          )}
        </div>
      </div>

      <WorkspaceModal
        title="Nova solicitação LGPD"
        subtitle="Explique o pedido para abrir uma trilha auditável de atendimento."
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <ModalForm onSubmit={submitRequest}>
          <Field label="Tipo de solicitação">
            <Select name="request_type" defaultValue="access">
              {Object.entries(DATA_SUBJECT_REQUEST_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Resumo do pedido">
            <TextArea
              name="subject"
              rows={2}
              defaultValue="Solicitação LGPD registrada pelo painel do titular"
            />
          </Field>
          <Field label="Detalhes">
            <TextArea
              name="details"
              rows={6}
              placeholder="Descreva os dados, período, contexto e o que você espera como resposta."
            />
          </Field>
        </ModalForm>
      </WorkspaceModal>
    </>
  );
}

function statusClassName(status: DataSubjectRequestStatus) {
  if (status === "completed") {
    return "rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-success";
  }

  if (status === "rejected") {
    return "rounded-full border border-[rgba(255,107,122,0.32)] bg-[rgba(255,107,122,0.16)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-300";
  }

  if (status === "awaiting_identity") {
    return "rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-warning";
  }

  return "rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "não disponível";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "não disponível";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
