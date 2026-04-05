import type { Metadata } from "next";
import { LegalDocument } from "@/app/legal/legal-document";
import { LEGAL_UPDATED_AT, privacySections } from "@/app/legal/legal-content";

export const metadata: Metadata = {
  title: "Política de Privacidade | CodeTrail",
  description:
    "Política de Privacidade da experiência web do CodeTrail, com escopo sobre autenticação, suporte, billing, landing page e workspace.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      active="privacy"
      title="Política de Privacidade do CodeTrail"
      description="Aviso de privacidade da operação web do CodeTrail, com transparência sobre dados tratados, finalidades, bases legais, integrações, retenção e direitos do titular."
      updatedAt={LEGAL_UPDATED_AT}
      sections={privacySections}
    />
  );
}
