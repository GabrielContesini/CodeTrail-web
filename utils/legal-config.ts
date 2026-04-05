function readPublicEnv(name: string, fallback = "") {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

export const supportEmail = readPublicEnv(
  "NEXT_PUBLIC_SUPPORT_EMAIL",
  "suporte.codetrail@gmail.com",
);
export const privacyEmail = readPublicEnv(
  "NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL",
  supportEmail,
);
export const dpoEmail = readPublicEnv("NEXT_PUBLIC_LEGAL_DPO_EMAIL", privacyEmail);

export const legalConfig = {
  brandName: readPublicEnv("NEXT_PUBLIC_LEGAL_BRAND_NAME", "CodeTrail"),
  controllerName: readPublicEnv("NEXT_PUBLIC_LEGAL_CONTROLLER_NAME", "CodeTrail"),
  controllerDocument: readPublicEnv("NEXT_PUBLIC_LEGAL_CONTROLLER_DOCUMENT"),
  controllerAddress: readPublicEnv("NEXT_PUBLIC_LEGAL_CONTROLLER_ADDRESS"),
  privacyEmail,
  supportEmail,
  dpoName: readPublicEnv(
    "NEXT_PUBLIC_LEGAL_DPO_NAME",
    "Canal de privacidade do CodeTrail",
  ),
  dpoEmail,
};

export interface LegalOperatorEntry {
  name: string;
  purpose: string;
  dataCategories: string;
  internationalTransfer: string;
}

export const legalOperators: LegalOperatorEntry[] = [
  {
    name: "Supabase",
    purpose: "Autenticação, banco de dados, sessões e funções de backend.",
    dataCategories:
      "Conta, sessão, perfil, workspace e registros operacionais vinculados ao produto.",
    internationalTransfer: "Pode ocorrer, conforme a infraestrutura contratada.",
  },
  {
    name: "Stripe",
    purpose: "Checkout, assinatura, portal do cliente e comprovantes de pagamento.",
    dataCategories:
      "Dados de cobrança, identificadores de assinatura, faturas, recibos e eventos de pagamento.",
    internationalTransfer: "Pode ocorrer, conforme a infraestrutura contratada.",
  },
  {
    name: "Google",
    purpose: "Login social, quando o titular optar por autenticação federada.",
    dataCategories: "Identificadores de conta e dados retornados pelo provedor de login.",
    internationalTransfer: "Pode ocorrer, conforme a infraestrutura contratada.",
  },
  {
    name: "Resend",
    purpose: "Envio de e-mails transacionais e encaminhamento de mensagens de suporte.",
    dataCategories: "Nome, e-mail, assunto, mensagem e contexto operacional mínimo do suporte.",
    internationalTransfer: "Pode ocorrer, conforme a infraestrutura contratada.",
  },
  {
    name: "ClickUp",
    purpose: "Gestão de tickets e fluxo interno de atendimento, quando a integração estiver ativa.",
    dataCategories: "Nome, e-mail, assunto e descrição do chamado.",
    internationalTransfer: "Pode ocorrer, conforme a infraestrutura contratada.",
  },
  {
    name: "Vercel",
    purpose: "Hospedagem, telemetria de uso/performance e observabilidade da aplicação.",
    dataCategories: "Eventos de navegação, métricas técnicas e registros operacionais.",
    internationalTransfer: "Pode ocorrer, conforme a infraestrutura contratada.",
  },
];

export interface LegalRetentionEntry {
  category: string;
  retention: string;
}

export const legalRetentionMatrix: LegalRetentionEntry[] = [
  {
    category: "Conta, perfil e conteúdo do workspace",
    retention:
      "Mantidos enquanto a conta estiver ativa e durante o processamento de solicitações válidas de exclusão, ressalvadas hipóteses legais de guarda.",
  },
  {
    category: "Billing, assinatura e comprovantes",
    retention:
      "Mantidos pelo tempo necessário à execução do contrato, faturamento, prevenção a fraude e exercício regular de direitos, inclusive obrigações legais ou regulatórias aplicáveis.",
  },
  {
    category: "Chamados de suporte",
    retention:
      "Mantidos pelo período necessário ao atendimento, histórico de relacionamento e defesa em processos administrativos ou judiciais.",
  },
  {
    category: "Logs de segurança e prevenção a abuso",
    retention:
      "Mantidos pelo prazo estritamente necessário à segurança do ambiente, investigação de incidentes e cumprimento de obrigações aplicáveis.",
  },
  {
    category: "Preferências de cookies e consentimentos",
    retention:
      "Mantidos enquanto a preferência estiver vigente ou até nova manifestação do titular.",
  },
];

export function buildMailtoHref(subject: string, email = supportEmail) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
