import type { Metadata } from "next";
import { LegalDocument } from "@/app/legal/legal-document";
import { LEGAL_UPDATED_AT, termsSections } from "@/app/legal/legal-content";

export const metadata: Metadata = {
  title: "Termos de Uso | CodeTrail",
  description:
    "Termos de Uso aplicáveis à landing page, autenticação, checkout, suporte e workspace web do CodeTrail.",
};

export default function TermsOfUsePage() {
  return (
    <LegalDocument
      active="terms"
      title="Termos de Uso do CodeTrail"
      description="Documento contratual aplicável à experiência web do CodeTrail, cobrindo navegação pública, criação de conta, assinatura, suporte e uso do workspace."
      updatedAt={LEGAL_UPDATED_AT}
      sections={termsSections}
    />
  );
}
