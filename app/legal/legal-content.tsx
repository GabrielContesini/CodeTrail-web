import Link from "next/link";
import type { LegalSection } from "@/app/legal/legal-document";
import {
  buildMailtoHref,
  legalConfig,
  legalOperators,
  legalRetentionMatrix,
  privacyEmail,
  supportEmail,
} from "@/utils/legal-config";

export const LEGAL_UPDATED_AT = "02 de abril de 2026";

const textLinkClass =
  "font-semibold text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-white";

export const termsSections: LegalSection[] = [
  {
    id: "identificacao",
    title: "1. Identificação do controlador e documentos aplicáveis",
    content: (
      <>
        <p>
          Estes Termos de Uso regulam a utilização da landing page, das rotas
          públicas de autenticação, do checkout, do suporte e do workspace web
          do CodeTrail. Ao navegar, criar conta, contratar um plano ou usar o
          produto, você concorda com este documento e com a{" "}
          <Link href="/politica-de-privacidade" className={textLinkClass}>
            Política de Privacidade
          </Link>
          .
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Marca/operação digital: {legalConfig.brandName}.</li>
          <li>Controlador responsável: {legalConfig.controllerName}.</li>
          {legalConfig.controllerDocument ? (
            <li>Documento identificador: {legalConfig.controllerDocument}.</li>
          ) : null}
          {legalConfig.controllerAddress ? (
            <li>Endereço informado para fins de transparência: {legalConfig.controllerAddress}.</li>
          ) : null}
          <li>
            Canal de privacidade e direitos do titular:{" "}
            <a
              href={buildMailtoHref(
                "CodeTrail - Privacidade e direitos do titular",
                privacyEmail,
              )}
              className={textLinkClass}
            >
              {privacyEmail}
            </a>
            .
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "abrangencia",
    title: "2. Abrangência do serviço",
    content: (
      <>
        <p>
          O CodeTrail é um sistema digital para organização de estudos em
          tecnologia, com trilhas, sessões, tarefas, revisões, projetos, notas,
          flashcards, mind maps, suporte e recursos de assinatura.
        </p>
        <p>
          Estes termos cobrem o fluxo público e autenticado do ecossistema web:
          landing page, autenticação, onboarding, workspace, portal de billing,
          checkout e canais de atendimento vinculados ao produto.
        </p>
      </>
    ),
  },
  {
    id: "cadastro",
    title: "3. Cadastro, acesso e responsabilidade da conta",
    content: (
      <>
        <p>
          Você declara possuir capacidade legal para utilizar o serviço e se
          compromete a fornecer informações verdadeiras, atualizadas e
          compatíveis com a sua utilização real da plataforma.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>O acesso pode ocorrer por e-mail e senha ou por autenticação federada com Google.</li>
          <li>As credenciais e sessões são gerenciadas com suporte do Supabase Auth e cookies de sessão seguros.</li>
          <li>Você é responsável pela confidencialidade das credenciais e pelo uso realizado em sua conta.</li>
          <li>O CodeTrail poderá restringir ou suspender acessos em caso de fraude, abuso, risco de segurança ou violação destes termos.</li>
        </ul>
      </>
    ),
  },
  {
    id: "planos",
    title: "4. Planos, cobrança e cancelamento",
    content: (
      <>
        <p>
          O produto oferece plano gratuito e planos pagos. O fluxo de cobrança
          premium utiliza Stripe para checkout e portal do cliente, integrados
          ao mesmo ecossistema de autenticação do CodeTrail.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Os preços, periodicidades e benefícios vigentes são exibidos na interface no momento da contratação.</li>
          <li>Dados completos de cartão são inseridos no ambiente da Stripe e não são digitados diretamente na interface do CodeTrail.</li>
          <li>O CodeTrail mantém registros operacionais mínimos de assinatura, status, comprovantes, links de fatura e identificadores de pagamento.</li>
          <li>Cancelamentos e trocas de plano podem depender do portal de billing e das regras do provedor de pagamento.</li>
          <li>Alterações futuras de preço ou catálogo poderão ser comunicadas antes do próximo ciclo aplicável.</li>
        </ul>
      </>
    ),
  },
  {
    id: "uso",
    title: "5. Uso permitido e conteúdo inserido pelo usuário",
    content: (
      <>
        <p>
          O CodeTrail foi projetado para organização pessoal e profissional de
          estudos. Você não deve utilizar a plataforma para fins ilícitos,
          ofensivos, fraudulentos ou que prejudiquem a segurança do serviço ou
          de terceiros.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Você é responsável pelos textos, links, imagens e demais conteúdos que inserir em perfil, notas, projetos, flashcards, tarefas e mapas mentais.</li>
          <li>Não envie conteúdo que infrinja direitos autorais, sigilo, privacidade ou normas aplicáveis.</li>
          <li>Não insira dados pessoais ou sensíveis de terceiros sem base legal adequada e sem autorização quando exigida.</li>
          <li>O uso automatizado, a tentativa de burlar limites ou a exploração de vulnerabilidades é proibido.</li>
        </ul>
      </>
    ),
  },
  {
    id: "propriedade",
    title: "6. Propriedade intelectual",
    content: (
      <>
        <p>
          O software, a marca, o layout, os elementos visuais, os textos
          institucionais e a arquitetura do CodeTrail pertencem ao CodeTrail e
          aos respectivos licenciantes. Estes termos não transferem a você a
          titularidade da plataforma.
        </p>
        <p>
          Você mantém a titularidade do conteúdo que produzir dentro da sua
          conta, concedendo ao CodeTrail as permissões técnicas necessárias para
          armazenar, processar, sincronizar, exibir e proteger esse conteúdo na
          execução normal do serviço.
        </p>
      </>
    ),
  },
  {
    id: "suporte",
    title: "7. Disponibilidade, suporte e integrações externas",
    content: (
      <>
        <p>
          O CodeTrail busca manter a plataforma disponível com medidas razoáveis
          de segurança e continuidade, mas pode realizar manutenções, ajustes de
          layout, alterações de fluxo, melhorias de performance e correções de
          segurança sem aviso prévio quando necessário.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>O canal de suporte coleta nome, e-mail, assunto e descrição do chamado.</li>
          <li>Diagnóstico técnico adicional, como página atual, navegador e sistema operacional, só é compartilhado quando você optar por isso no formulário.</li>
          <li>Quando configurado, o atendimento pode ser encaminhado por e-mail via Resend e por ticket via ClickUp.</li>
          <li>O serviço também depende de provedores como Supabase, Stripe, Google OAuth e Vercel para operar corretamente.</li>
        </ul>
      </>
    ),
  },
  {
    id: "dados",
    title: "8. Privacidade e proteção de dados",
    content: (
      <>
        <p>
          O tratamento de dados pessoais do CodeTrail segue a{" "}
          <Link href="/politica-de-privacidade" className={textLinkClass}>
            Política de Privacidade
          </Link>
          , que descreve categorias de dados, finalidades, bases legais,
          compartilhamentos, retenção, preferências de cookies e direitos do
          titular.
        </p>
        <p>
          O produto disponibiliza um fluxo auditável para solicitações LGPD no
          próprio painel autenticado, além do canal de e-mail{" "}
          <a
            href={buildMailtoHref(
              "CodeTrail - Privacidade e direitos do titular",
              privacyEmail,
            )}
            className={textLinkClass}
          >
            {privacyEmail}
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "9. Alterações, lei aplicável e contato",
    content: (
      <>
        <p>
          Estes termos podem ser atualizados para refletir alterações do
          produto, dos fluxos de cobrança, de integrações, de requisitos legais
          ou de segurança. A versão mais recente ficará disponível nesta rota,
          com a respectiva data de atualização.
        </p>
        <p>
          Este documento é regido pela legislação brasileira. Questões
          relacionadas ao uso do serviço, à privacidade ou a direitos do titular
          podem ser encaminhadas para{" "}
          <a
            href={buildMailtoHref("CodeTrail - Termos de Uso", supportEmail)}
            className={textLinkClass}
          >
            {supportEmail}
          </a>
          .
        </p>
      </>
    ),
  },
];

export const privacySections: LegalSection[] = [
  {
    id: "controlador",
    title: "1. Controlador, escopo e canais de contato",
    content: (
      <>
        <p>
          Esta Política de Privacidade descreve como o CodeTrail trata dados
          pessoais na landing page, nas rotas públicas de autenticação, no
          checkout, no suporte e no workspace web. O documento foi escrito com
          base no comportamento atual do código e deve ser atualizado sempre que
          houver mudança relevante nas operações de tratamento.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Marca/operação digital: {legalConfig.brandName}.</li>
          <li>Controlador responsável: {legalConfig.controllerName}.</li>
          {legalConfig.controllerDocument ? (
            <li>Documento identificador: {legalConfig.controllerDocument}.</li>
          ) : null}
          {legalConfig.controllerAddress ? (
            <li>Endereço informado: {legalConfig.controllerAddress}.</li>
          ) : null}
          <li>
            Encarregado ou canal de privacidade: {legalConfig.dpoName}{" "}
            (<a
              href={buildMailtoHref(
                "CodeTrail - Privacidade e direitos do titular",
                legalConfig.dpoEmail,
              )}
              className={textLinkClass}
            >
              {legalConfig.dpoEmail}
            </a>
            ).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "dados-tratados",
    title: "2. Dados pessoais tratados",
    content: (
      <>
        <p>As categorias de dados identificadas no projeto incluem:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Conta e autenticação: e-mail, identificador de usuário, credenciais gerenciadas pelo Supabase Auth e dados retornados pelo login com Google.</li>
          <li>Perfil e onboarding: nome, avatar/foto, área desejada, nível atual, trilha ativa e status de onboarding.</li>
          <li>Workspace: metas, sessões de estudo, tarefas, revisões, projetos, etapas de projeto, notas, flashcards, mind maps, notificações e preferências.</li>
          <li>Billing: intenção de plano, billing e-mail, nome de cobrança, identificadores de assinatura/pagamento, status, faturas e recibos necessários ao ciclo de cobrança.</li>
          <li>Suporte: nome, e-mail, assunto e descrição do chamado; diagnóstico técnico adicional só é enviado quando você optar por compartilhá-lo.</li>
          <li>Telemetria e segurança: cookies de sessão do Supabase, logs operacionais, métricas de uso/performance com Vercel Analytics e Speed Insights quando autorizadas, e IP para limitação de taxa em rotas sensíveis.</li>
        </ul>
      </>
    ),
  },
  {
    id: "finalidades-bases",
    title: "3. Finalidades e bases legais",
    content: (
      <>
        <p>Os tratamentos identificados no projeto se apoiam principalmente nas seguintes finalidades e bases:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Execução de contrato e procedimentos preliminares: criação de conta, login, manutenção do workspace, sincronização de progresso, suporte ao uso do produto e gerenciamento de assinatura.</li>
          <li>Cumprimento de obrigação legal ou regulatória: retenção de registros de cobrança, faturamento, prevenção a fraudes e atendimento de exigências legais aplicáveis.</li>
          <li>Legítimo interesse: segurança da aplicação, prevenção de abuso, observabilidade técnica e melhoria contínua da experiência, respeitados os direitos e expectativas do titular.</li>
          <li>Consentimento: telemetria de uso e performance não essencial, ou qualquer tecnologia equivalente, quando depender de escolha afirmativa do titular.</li>
        </ul>
      </>
    ),
  },
  {
    id: "operadores",
    title: "4. Operadores, terceiros e transferência internacional",
    content: (
      <>
        <p>
          O projeto atualmente integra ou prevê compartilhamento operacional com
          os seguintes provedores:
        </p>
        <div className="space-y-3">
          {legalOperators.map((operator) => (
            <div
              key={operator.name}
              className="rounded-2xl border border-border/70 bg-white/[0.03] px-4 py-4"
            >
              <strong className="block text-white">{operator.name}</strong>
              <p className="m-0 mt-2">{operator.purpose}</p>
              <p className="m-0 mt-2">
                <span className="font-semibold text-white">Dados envolvidos:</span>{" "}
                {operator.dataCategories}
              </p>
              <p className="m-0 mt-2">
                <span className="font-semibold text-white">Transferência internacional:</span>{" "}
                {operator.internationalTransfer}
              </p>
            </div>
          ))}
        </div>
        <p>
          O CodeTrail não compartilha dados para publicidade comportamental
          própria no código revisado nesta análise.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "5. Cookies, preferências e tecnologias semelhantes",
    content: (
      <>
        <p>
          A aplicação utiliza cookies de sessão e mecanismos equivalentes para
          manter autenticação, continuidade da navegação e segurança
          operacional.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Cookies estritamente necessários permanecem ativos para login, proteção de sessão e rotas autenticadas.</li>
          <li>Vercel Analytics e Speed Insights só são ativados após a sua escolha afirmativa no banner de preferências.</li>
          <li>Você pode revisar essa decisão a qualquer momento pelo botão de privacidade exibido na aplicação ou por esta política.</li>
        </ul>
      </>
    ),
  },
  {
    id: "retencao",
    title: "6. Retenção, exclusão e segurança",
    content: (
      <>
        <p>
          Os dados são mantidos pelo tempo necessário para execução do produto,
          continuidade da conta, suporte, prevenção a fraude, cobrança,
          exercício regular de direitos e cumprimento de obrigações legais ou
          regulatórias.
        </p>
        <div className="space-y-3">
          {legalRetentionMatrix.map((entry) => (
            <div
              key={entry.category}
              className="rounded-2xl border border-border/70 bg-white/[0.03] px-4 py-4"
            >
              <strong className="block text-white">{entry.category}</strong>
              <p className="m-0 mt-2">{entry.retention}</p>
            </div>
          ))}
        </div>
        <p>
          O projeto adota medidas como Row Level Security no Supabase,
          isolamento por usuário autenticado, cookies seguros de sessão e
          checkout em provedor compatível com PCI.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "7. Direitos do titular e fluxo de atendimento",
    content: (
      <>
        <p>
          Nos termos da LGPD, você pode solicitar confirmação de tratamento,
          acesso, correção, anonimização, bloqueio, eliminação, portabilidade,
          informação sobre compartilhamentos, oposição e revisão das hipóteses
          cabíveis, além de revogar consentimentos quando essa for a base legal
          aplicável.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>O painel autenticado disponibiliza exportação self-service em JSON para acesso e portabilidade dos dados atualmente presentes no workspace.</li>
          <li>Solicitações formais ficam registradas com trilha auditável no centro de privacidade do produto.</li>
          <li>O atendimento poderá exigir comprovação razoável de identidade para proteger sua conta e terceiros.</li>
        </ul>
        <p>
          Para contingência, o canal oficial também segue disponível em{" "}
          <a
            href={buildMailtoHref(
              "CodeTrail - Privacidade e direitos do titular",
              privacyEmail,
            )}
            className={textLinkClass}
          >
            {privacyEmail}
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "internacional",
    title: "8. Atualizações deste aviso",
    content: (
      <>
        <p>
          Esta política pode ser atualizada para refletir mudanças de produto,
          integrações, práticas de segurança, retenção, operadores ou
          requisitos legais. A versão vigente será publicada nesta página com a
          data de atualização correspondente.
        </p>
        <p>
          Sempre que houver mudança material no tratamento de dados ou no
          regime de cookies não essenciais, o texto público e os fluxos de
          preferência do produto deverão ser atualizados de forma coerente.
        </p>
      </>
    ),
  },
];
