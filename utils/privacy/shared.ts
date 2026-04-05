export const DATA_SUBJECT_REQUEST_TYPES = [
  "access",
  "export",
  "correction",
  "deletion",
  "anonymization",
  "blocking",
  "portability",
  "opposition",
  "revocation",
  "other",
] as const;

export const DATA_SUBJECT_REQUEST_STATUSES = [
  "submitted",
  "in_review",
  "awaiting_identity",
  "processing",
  "completed",
  "rejected",
] as const;

export type DataSubjectRequestType = (typeof DATA_SUBJECT_REQUEST_TYPES)[number];
export type DataSubjectRequestStatus =
  (typeof DATA_SUBJECT_REQUEST_STATUSES)[number];

export interface DataSubjectRequestRow {
  id: string;
  request_type: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  subject: string;
  details: string;
  requester_email: string;
  preferred_channel: string;
  resolution_notes: string;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataSubjectRequestInput {
  request_type: DataSubjectRequestType;
  subject: string;
  details: string;
}

export const DATA_SUBJECT_LIMITS = {
  subject: 120,
  details: 2000,
} as const;

export const DATA_SUBJECT_REQUEST_LABELS: Record<DataSubjectRequestType, string> =
  {
    access: "Confirmação e acesso",
    export: "Exportação de dados",
    correction: "Correção de dados",
    deletion: "Exclusão de dados",
    anonymization: "Anonimização",
    blocking: "Bloqueio de tratamento",
    portability: "Portabilidade",
    opposition: "Oposição ao tratamento",
    revocation: "Revogação de consentimento",
    other: "Outro pedido",
  };

export const DATA_SUBJECT_STATUS_LABELS: Record<
  DataSubjectRequestStatus,
  string
> = {
  submitted: "Recebida",
  in_review: "Em triagem",
  awaiting_identity: "Aguardando identidade",
  processing: "Em atendimento",
  completed: "Concluída",
  rejected: "Indeferida",
};

export function sanitizeDataSubjectRequestInput(
  input: Partial<DataSubjectRequestInput> | null | undefined,
): DataSubjectRequestInput {
  const requestType = DATA_SUBJECT_REQUEST_TYPES.includes(
    input?.request_type as DataSubjectRequestType,
  )
    ? (input?.request_type as DataSubjectRequestType)
    : "access";

  return {
    request_type: requestType,
    subject: sanitizeText(input?.subject, DATA_SUBJECT_LIMITS.subject),
    details: sanitizeMultilineText(input?.details, DATA_SUBJECT_LIMITS.details),
  };
}

export function validateDataSubjectRequestInput(input: DataSubjectRequestInput) {
  const fieldErrors: Partial<Record<"subject" | "details", string>> = {};

  if (!input.subject) {
    fieldErrors.subject = "Informe um resumo do pedido.";
  }

  if (!input.details) {
    fieldErrors.details = "Descreva o pedido para análise do time.";
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeMultilineText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}
